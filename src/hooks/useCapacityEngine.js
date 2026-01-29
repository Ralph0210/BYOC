import { useCallback } from "react"
import { isSameDay, parseISO } from "date-fns"

/**
 * Task Sizes based on duration
 */
export const TASK_SIZES = {
  BIG: "big", // > 60 mins
  MEDIUM: "medium", // 30-60 mins
  SMALL: "small", // < 30 mins
}

/**
 * Hook to calculate daily capacity/load
 * Implements the 1-3-5 Rule:
 * - 1 Big Task
 * - 3 Medium Tasks
 * - 5 Small Tasks
 */
export function useCapacityEngine() {
  const getTaskSize = useCallback((task) => {
    if (!task.duration_minutes) return TASK_SIZES.MEDIUM // Default
    if (task.duration_minutes > 60) return TASK_SIZES.BIG
    if (task.duration_minutes >= 30) return TASK_SIZES.MEDIUM
    return TASK_SIZES.SMALL
  }, [])

  const calculateDailyLoad = useCallback(
    (tasks, date) => {
      // Filter tasks for this date
      const daysTasks = tasks.filter((t) => {
        // Handle various date formats (scheduled_time often YYYY-MM-DD or ISO)
        if (!t.scheduled_date && !t.date) return false // Need a date
        const taskDate = t.scheduled_date || t.date
        return isSameDay(
          parseISO(taskDate),
          typeof date === "string" ? parseISO(date) : date,
        )
      })

      const counts = {
        [TASK_SIZES.BIG]: 0,
        [TASK_SIZES.MEDIUM]: 0,
        [TASK_SIZES.SMALL]: 0,
      }

      daysTasks.forEach((t) => {
        const size = getTaskSize(t)
        counts[size]++
      })

      // 1-3-5 Rule Limits
      const LIMITS = {
        [TASK_SIZES.BIG]: 1,
        [TASK_SIZES.MEDIUM]: 3,
        [TASK_SIZES.SMALL]: 5,
      }

      // Calculate "Load Score" (0-100%)
      // Weighted: Big=50%, Medium=30%, Small=20% contribution to a "Full Day"
      // This is a heuristic. Simpler check: is any bucket full?

      const isFull =
        counts[TASK_SIZES.BIG] >= LIMITS[TASK_SIZES.BIG] ||
        counts[TASK_SIZES.MEDIUM] >= LIMITS[TASK_SIZES.MEDIUM] ||
        counts[TASK_SIZES.SMALL] >= LIMITS[TASK_SIZES.SMALL]

      // Human readable status
      let status = "Open"
      if (counts[TASK_SIZES.BIG] >= 1) status = "Heavy"
      if (isFull) status = "Full"

      return {
        count: daysTasks.length,
        breakdown: counts,
        isFull,
        status,
        tasks: daysTasks.map((t) => ({ name: t.name, size: getTaskSize(t) })),
      }
    },
    [getTaskSize],
  )

  return {
    calculateDailyLoad,
    getTaskSize,
  }
}
