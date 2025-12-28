import { useState, useCallback } from "react"
import { supabase } from "../lib/supabase"

export function useSnoozes() {
  const [snoozes, setSnoozes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchSnoozes = useCallback(
    async (taskIds = [], startDate = null, endDate = null) => {
      if (taskIds.length === 0) {
        setSnoozes([])
        return []
      }

      setLoading(true)
      setError(null)

      try {
        let query = supabase
          .from("task_snoozes")
          .select("*")
          .in("task_id", taskIds)

        if (startDate) {
          query = query.gte("date", startDate)
        }
        if (endDate) {
          query = query.lte("date", endDate)
        }

        const { data, error: fetchError } = await query

        if (fetchError) throw fetchError
        setSnoozes(data || [])
        return data
      } catch (err) {
        // Table might not exist yet - fail silently
        console.warn("Failed to fetch snoozes:", err.message)
        setSnoozes([])
        return []
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const addSnooze = useCallback(async (taskId, date) => {
    setError(null)

    try {
      const { data, error: createError } = await supabase
        .from("task_snoozes")
        .insert([{ task_id: taskId, date }])
        .select()
        .single()

      if (createError) throw createError

      setSnoozes((prev) => [data, ...prev])
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [])

  const removeSnooze = useCallback(async (taskId, date) => {
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from("task_snoozes")
        .delete()
        .eq("task_id", taskId)
        .eq("date", date)

      if (deleteError) throw deleteError

      setSnoozes((prev) =>
        prev.filter((s) => !(s.task_id === taskId && s.date === date))
      )
      return true
    } catch (err) {
      setError(err.message)
      return false
    }
  }, [])

  const isTaskSnoozed = useCallback(
    (taskId, date) => {
      return snoozes.some((s) => s.task_id === taskId && s.date === date)
    },
    [snoozes]
  )

  const getSnoozesForDate = useCallback(
    (date) => {
      return snoozes.filter((s) => s.date === date)
    },
    [snoozes]
  )

  return {
    snoozes,
    loading,
    error,
    fetchSnoozes,
    addSnooze,
    removeSnooze,
    isTaskSnoozed,
    getSnoozesForDate,
    setSnoozes,
  }
}
