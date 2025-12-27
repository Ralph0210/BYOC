import { useState, useCallback } from "react"
import { supabase } from "../lib/supabase"
import { formatDate } from "../lib/utils"

export function useCompletions() {
  const [completions, setCompletions] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchCompletions = useCallback(
    async (taskIds = [], startDate = null, endDate = null) => {
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
        setCompletions(data || [])
        return data
      } catch (err) {
        setError(err.message)
        return []
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const addCompletion = useCallback(async (taskId, date = null) => {
    setError(null)
    const completionDate = date || formatDate(new Date())

    try {
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

      setCompletions((prev) => [data, ...prev])
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [])

  const removeCompletion = useCallback(async (taskId, date) => {
    setError(null)

    try {
      // Remove the most recent completion for this task on this date
      const { data: existing } = await supabase
        .from("task_completions")
        .select("id")
        .eq("task_id", taskId)
        .eq("date", date)
        .order("completed_at", { ascending: false })
        .limit(1)

      if (!existing || existing.length === 0) return true

      const { error: deleteError } = await supabase
        .from("task_completions")
        .delete()
        .eq("id", existing[0].id)

      if (deleteError) throw deleteError

      setCompletions((prev) => prev.filter((c) => c.id !== existing[0].id))
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [])

  const getCompletionsForDate = useCallback(
    (date) => {
      return completions.filter((c) => c.date === date)
    },
    [completions]
  )

  const getCompletionCountForTask = useCallback(
    (taskId, date) => {
      return completions.filter((c) => c.task_id === taskId && c.date === date)
        .length
    },
    [completions]
  )

  const clearCompletionsForTask = useCallback(async (taskId, date) => {
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from("task_completions")
        .delete()
        .eq("task_id", taskId)
        .eq("date", date)

      if (deleteError) throw deleteError

      setCompletions((prev) =>
        prev.filter((c) => !(c.task_id === taskId && c.date === date))
      )
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [])

  return {
    completions,
    loading,
    error,
    fetchCompletions,
    addCompletion,
    removeCompletion,
    getCompletionsForDate,
    getCompletionCountForTask,
    clearCompletionsForTask,
    setCompletions,
  }
}
