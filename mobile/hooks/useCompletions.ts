/**
 * useCompletions Hook
 *
 * Manages task completion tracking.
 * Ported from web app with TypeScript types.
 */

import { useState, useCallback, useMemo } from "react"
import { supabase } from "../lib/supabase"
import { getToday } from "../lib/utils"

export interface TaskCompletion {
  id: string
  task_id: string
  date: string
  completed_at: string
}

interface UseCompletionsReturn {
  completions: TaskCompletion[]
  loading: boolean
  error: string | null
  /** Set of "taskId:date" keys for quick lookup */
  completionSet: Set<string>
  fetchCompletions: (
    taskIds: string[],
    startDate?: string | null,
    endDate?: string | null
  ) => Promise<TaskCompletion[]>
  toggleCompletion: (taskId: string, date?: string) => Promise<boolean>
  isCompleted: (taskId: string, date: string) => boolean
  setCompletions: React.Dispatch<React.SetStateAction<TaskCompletion[]>>
}

export function useCompletions(): UseCompletionsReturn {
  const [completions, setCompletions] = useState<TaskCompletion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create a Set for O(1) lookup of completions
  const completionSet = useMemo(() => {
    return new Set(completions.map((c) => `${c.task_id}:${c.date}`))
  }, [completions])

  const fetchCompletions = useCallback(
    async (
      taskIds: string[],
      startDate: string | null = null,
      endDate: string | null = null
    ): Promise<TaskCompletion[]> => {
      if (taskIds.length === 0) {
        setCompletions([])
        return []
      }

      setLoading(true)
      setError(null)

      try {
        let query = supabase
          .from("task_completions")
          .select("*")
          .in("task_id", taskIds)
          .order("completed_at", { ascending: false })

        if (startDate) {
          query = query.gte("date", startDate)
        }
        if (endDate) {
          query = query.lte("date", endDate)
        }

        const { data, error: fetchError } = await query

        if (fetchError) throw fetchError

        const completionData = (data || []) as TaskCompletion[]
        setCompletions(completionData)
        return completionData
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch completions"
        setError(message)
        return []
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const isCompleted = useCallback(
    (taskId: string, date: string): boolean => {
      return completionSet.has(`${taskId}:${date}`)
    },
    [completionSet]
  )

  const toggleCompletion = useCallback(
    async (taskId: string, date?: string): Promise<boolean> => {
      setError(null)
      const completionDate = date || getToday()
      const key = `${taskId}:${completionDate}`
      const wasCompleted = completionSet.has(key)

      try {
        if (wasCompleted) {
          // Remove completion
          const existing = completions.find(
            (c) => c.task_id === taskId && c.date === completionDate
          )

          if (existing) {
            const { error: deleteError } = await supabase
              .from("task_completions")
              .delete()
              .eq("id", existing.id)

            if (deleteError) throw deleteError

            setCompletions((prev) => prev.filter((c) => c.id !== existing.id))
          }
        } else {
          // Add completion
          const { data, error: createError } = await supabase
            .from("task_completions")
            .insert([
              {
                task_id: taskId,
                date: completionDate,
                completed_at: new Date().toISOString(),
              },
            ])
            .select()
            .single()

          if (createError) throw createError

          setCompletions((prev) => [data as TaskCompletion, ...prev])
        }

        return true
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to toggle completion"
        setError(message)
        return false
      }
    },
    [completions, completionSet]
  )

  return {
    completions,
    loading,
    error,
    completionSet,
    fetchCompletions,
    toggleCompletion,
    isCompleted,
    setCompletions,
  }
}
