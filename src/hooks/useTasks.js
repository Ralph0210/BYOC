import { useState, useCallback, useRef } from "react"
import { supabase } from "../lib/supabase"
import { encryptData, decryptData } from "../lib/crypto"

export function useTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const lastChallengeIdRef = useRef(null)

  // Fetch tasks - merges with existing if different challenge
  const fetchTasks = useCallback(async (challengeId = null) => {
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from("tasks")
        .select("*")
        .order("sort_order", { ascending: true })

      if (challengeId) {
        query = query.eq("challenge_id", challengeId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      // Decrypt sensitive fields
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const decryptedTasks = await Promise.all(
        (data || []).map(async (task) => {
          if (!user) return task
          return {
            ...task,
            name: (await decryptData(task.name, user.id)) || task.name,
            note: (await decryptData(task.note, user.id)) || task.note,
          }
        })
      )

      // If fetching for a specific challenge, merge with existing tasks
      if (challengeId) {
        setTasks((prev) => {
          // Remove old tasks for this challenge, add new ones
          const otherTasks = prev.filter((t) => t.challenge_id !== challengeId)
          return [...otherTasks, ...decryptedTasks]
        })
        lastChallengeIdRef.current = challengeId
      } else {
        // If fetching all, replace entirely
        setTasks(decryptedTasks)
      }

      return decryptedTasks
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch tasks for multiple challenges at once
  const fetchTasksForChallenges = useCallback(async (challengeIds = []) => {
    if (challengeIds.length === 0) {
      setTasks([])
      return []
    }

    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await supabase
        .from("tasks")
        .select("*")
        .in("challenge_id", challengeIds)
        .order("sort_order", { ascending: true })

      if (fetchError) throw fetchError

      // Decrypt sensitive fields
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const decryptedTasks = await Promise.all(
        (data || []).map(async (task) => {
          if (!user) return task
          return {
            ...task,
            name: (await decryptData(task.name, user.id)) || task.name,
            note: (await decryptData(task.note, user.id)) || task.note,
          }
        })
      )

      setTasks(decryptedTasks)
      return decryptedTasks
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createTask = useCallback(async (taskData) => {
    setError(null)

    try {
      // Get the max sort order for this challenge
      const { data: existingTasks } = await supabase
        .from("tasks")
        .select("sort_order")
        .eq("challenge_id", taskData.challenge_id)
        .order("sort_order", { ascending: false })
        .limit(1)

      const maxSortOrder = existingTasks?.[0]?.sort_order ?? -1

      // Encrypt sensitive fields
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("You must be logged in to create a task")

      const encryptedData = {
        ...taskData,
        name: await encryptData(taskData.name, user.id),
        note: taskData.note ? await encryptData(taskData.note, user.id) : null,
      }

      const { data, error: createError } = await supabase
        .from("tasks")
        .insert([{ ...encryptedData, sort_order: maxSortOrder + 1 }])
        .select()
        .single()

      if (createError) throw createError

      // Return decrypted local object so UI updates immediately without re-fetch
      // Note: we can just use the memory data we have, but we need the ID/Created_at from DB.
      // So we decrypt the returned row or merge.
      const decryptedNewTask = {
        ...data,
        name: taskData.name, // optimization: use input plaintext
        note: taskData.note,
      }

      setTasks((prev) => [...prev, decryptedNewTask])
      return decryptedNewTask
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [])

  const updateTask = useCallback(async (id, updates) => {
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("User not authenticated")

      const encryptedUpdates = { ...updates }
      if (updates.name) {
        encryptedUpdates.name = await encryptData(updates.name, user.id)
      }
      if (updates.note !== undefined) {
        // Handle explicit null or string
        encryptedUpdates.note = updates.note
          ? await encryptData(updates.note, user.id)
          : null
      }

      const { data, error: updateError } = await supabase
        .from("tasks")
        .update(encryptedUpdates)
        .eq("id", id)
        .select()
        .single()

      if (updateError) throw updateError

      const decryptedData = {
        ...data,
        name: (await decryptData(data.name, user.id)) || data.name,
        note: (await decryptData(data.note, user.id)) || data.note,
      }

      setTasks((prev) => prev.map((t) => (t.id === id ? decryptedData : t)))
      return decryptedData
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [])

  const deleteTask = useCallback(async (id) => {
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id)

      if (deleteError) throw deleteError

      setTasks((prev) => prev.filter((t) => t.id !== id))
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [])

  const reorderTasks = useCallback(async (orderedIds) => {
    setError(null)

    try {
      const updates = orderedIds.map((id, index) => ({
        id,
        sort_order: index,
      }))

      for (const update of updates) {
        await supabase
          .from("tasks")
          .update({ sort_order: update.sort_order })
          .eq("id", update.id)
      }

      setTasks((prev) => {
        const taskMap = new Map(prev.map((t) => [t.id, t]))
        return orderedIds.map((id, index) => ({
          ...taskMap.get(id),
          sort_order: index,
        }))
      })

      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [])

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    fetchTasksForChallenges,
    createTask,
    updateTask,
    deleteTask,
    reorderTasks,
    setTasks,
  }
}
