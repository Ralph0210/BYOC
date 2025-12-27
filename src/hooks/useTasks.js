import { useState, useCallback, useRef } from "react"
import { supabase } from "../lib/supabase"

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

      // If fetching for a specific challenge, merge with existing tasks
      if (challengeId) {
        setTasks((prev) => {
          // Remove old tasks for this challenge, add new ones
          const otherTasks = prev.filter((t) => t.challenge_id !== challengeId)
          return [...otherTasks, ...(data || [])]
        })
        lastChallengeIdRef.current = challengeId
      } else {
        // If fetching all, replace entirely
        setTasks(data || [])
      }

      return data
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
      setTasks(data || [])
      return data
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

      const { data, error: createError } = await supabase
        .from("tasks")
        .insert([{ ...taskData, sort_order: maxSortOrder + 1 }])
        .select()
        .single()

      if (createError) throw createError

      setTasks((prev) => [...prev, data])
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [])

  const updateTask = useCallback(async (id, updates) => {
    setError(null)

    try {
      const { data, error: updateError } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (updateError) throw updateError

      setTasks((prev) => prev.map((t) => (t.id === id ? data : t)))
      return data
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
