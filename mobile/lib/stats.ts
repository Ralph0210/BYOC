import {
  getDateRange,
  isTaskActiveOnDate,
  calculateCompletionPercentage,
  daysDiff,
  Challenge,
  Task,
} from "./utils"

export interface ChallengeStats {
  overall: number
  daysElapsed: number
  daysRemaining: number
  totalDays: number
  byTask: Record<string, { total: number; completed: number }>
}

export function calculateChallengeStats(
  challenge: Challenge,
  challengeTasks: Task[],
  completions: { task_id: string; date: string }[],
  snoozes: { task_id: string; date: string }[] = []
): ChallengeStats {
  if (!challenge || !challengeTasks || challengeTasks.length === 0) {
    return {
      overall: 0,
      daysElapsed: 0,
      daysRemaining: 0,
      totalDays: 0,
      byTask: {},
    }
  }

  const endDate = challenge.end_date
  const dateRange = getDateRange(challenge.start_date, endDate)
  const byTask: Record<string, { total: number; completed: number }> = {}
  let totalPossible = 0
  let totalCompleted = 0

  // Create a Set of snoozed task+date combinations for fast lookup
  const snoozedSet = new Set(snoozes.map((s) => `${s.task_id}:${s.date}`))

  challengeTasks.forEach((task) => {
    let taskTotal = 0
    let taskCompleted = 0

    dateRange.forEach((date) => {
      if (isTaskActiveOnDate(task, date)) {
        // Check if this task is snoozed for this date
        const isSnoozed = snoozedSet.has(`${task.id}:${date}`)

        if (!isSnoozed) {
          const target = 1 // Simplified: Mobile assumes 1 task per day usually, unless frequency_count ported
          taskTotal += target
          const completedCount = completions.filter(
            (c) => c.task_id === task.id && c.date === date
          ).length
          taskCompleted += Math.min(completedCount, target)
        }
      }
    })
    byTask[task.id] = { total: taskTotal, completed: taskCompleted }
    totalPossible += taskTotal
    totalCompleted += taskCompleted
  })

  const today = new Date().toISOString().split("T")[0]
  const elapsed = daysDiff(challenge.start_date, today) + 1
  const remaining =
    today <= challenge.end_date ? daysDiff(today, challenge.end_date) + 1 : 0
  const total = daysDiff(challenge.start_date, challenge.end_date) + 1

  return {
    overall:
      totalPossible > 0
        ? Math.round((totalCompleted / totalPossible) * 100)
        : 0,
    daysElapsed: elapsed,
    daysRemaining: remaining,
    totalDays: total,
    byTask,
  }
}
