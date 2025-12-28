import {
  getDateRange,
  isTaskActiveOnDate,
  calculateCompletionPercentage,
  daysDiff,
} from "./utils"

export function calculateChallengeStats(
  challenge,
  challengeTasks,
  completions
) {
  if (!challenge || !challengeTasks || challengeTasks.length === 0) {
    return { overall: 0, byTask: {} }
  }

  const endDate = challenge.end_date
  const dateRange = getDateRange(challenge.start_date, endDate)
  const byTask = {}
  let totalPossible = 0
  let totalCompleted = 0

  challengeTasks.forEach((task) => {
    let taskTotal = 0
    let taskCompleted = 0

    dateRange.forEach((date) => {
      if (isTaskActiveOnDate(task, date)) {
        const target = task.frequency_count || 1
        taskTotal += target
        const completedCount = completions.filter(
          (c) => c.task_id === task.id && c.date === date
        ).length
        taskCompleted += Math.min(completedCount, target)
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
    overall: calculateCompletionPercentage(totalCompleted, totalPossible),
    daysElapsed: elapsed,
    daysRemaining: remaining,
    totalDays: total,
    byTask,
  }
}
