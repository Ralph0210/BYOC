import {
  getDateRange,
  isTaskActiveOnDate,
  calculateCompletionPercentage,
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

  return {
    overall: calculateCompletionPercentage(totalCompleted, totalPossible),
    byTask,
  }
}
