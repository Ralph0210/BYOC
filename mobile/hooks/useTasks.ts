/**
 * useTasks Hook
 *
 * Manages task data fetching and CRUD operations.
 * Ported from web app with TypeScript types.
 */

import { useState, useCallback } from "react"
import { supabase } from "../lib/supabase"
import { Task, FrequencyType } from "../lib/utils"

// Extended Task type with optional fields from database
export interface TaskDB extends Task {
  sort_order?: number
  note?: string
}

interface UseTasksReturn {
  tasks: TaskDB[]
  loading: boolean
  error: string | null
  fetchTasks: (challengeId?: string | null) => Promise<TaskDB[]>
  fetchTasksForChallenges: (challengeIds: string[]) => Promise<TaskDB[]>
  createTask: (data: Partial<TaskDB>) => Promise<TaskDB | null>
  updateTask: (id: string, updates: Partial<TaskDB>) => Promise<TaskDB | null>
  deleteTask: (id: string) => Promise<boolean>
  setTasks: React.Dispatch<React.SetStateAction<TaskDB[]>>
}

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<TaskDB[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = useCallback(
    async (challengeId: string | null = null): Promise<TaskDB[]> => {
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

        const taskData = (data || []) as TaskDB[]

        if (challengeId) {
          // Merge with existing tasks from other challenges
          setTasks((prev) => {
            const otherTasks = prev.filter(
              (t) => t.challenge_id !== challengeId
            )
            return [...otherTasks, ...taskData]
          })
        } else {
          setTasks(taskData)
        }

        return taskData
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch tasks"
        setError(message)
        return []
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const fetchTasksForChallenges = useCallback(
    async (challengeIds: string[]): Promise<TaskDB[]> => {
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

        const taskData = (data || []) as TaskDB[]
        setTasks(taskData)
        return taskData
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch tasks"
        setError(message)
        return []
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const createTask = useCallback(
    async (taskData: Partial<TaskDB>): Promise<TaskDB | null> => {
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

        const newTask = data as TaskDB
        setTasks((prev) => [...prev, newTask])
        return newTask
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create task"
        setError(message)
        return null
      }
    },
    []
  )

  const updateTask = useCallback(
    async (id: string, updates: Partial<TaskDB>): Promise<TaskDB | null> => {
      setError(null)

      try {
        const { data, error: updateError } = await supabase
          .from("tasks")
          .update(updates)
          .eq("id", id)
          .select()
          .single()

        if (updateError) throw updateError

        const updatedTask = data as TaskDB
        setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)))
        return updatedTask
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update task"
        setError(message)
        return null
      }
    },
    []
  )

  const deleteTask = useCallback(async (id: string): Promise<boolean> => {
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
      const message =
        err instanceof Error ? err.message : "Failed to delete task"
      setError(message)
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
    setTasks,
  }
}
