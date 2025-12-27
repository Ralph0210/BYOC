/**
 * Generate contextual prompt suggestions based on user's current state
 */
export function getSuggestedPrompts(context) {
  const suggestions = []

  const {
    completionRate = 0,
    daysElapsed = 0,
    daysRemaining = 0,
    streakDays = 0,
    streakBroken = false,
    missedTasks = [],
    challengeName = "",
  } = context || {}

  // Low completion this week
  if (completionRate < 50 && daysElapsed > 3) {
    suggestions.push(
      "Why is this week harder?",
      "What would make tomorrow easier?"
    )
  }

  // Streak broken
  if (streakBroken && streakDays > 0) {
    suggestions.push("What happened yesterday?", "Should we adjust the goal?")
  }

  // Challenge ending soon
  if (daysRemaining <= 5 && daysRemaining > 0) {
    suggestions.push(
      "How do I feel about this challenge?",
      "What's next after this?"
    )
  }

  // Missed specific tasks
  if (missedTasks.length > 0 && missedTasks.length <= 2) {
    suggestions.push(`What's making ${missedTasks[0]} hard?`)
  }

  // High completion
  if (completionRate >= 80) {
    suggestions.push("What's working well?", "Am I ready for more?")
  }

  // Default fallback prompts
  if (suggestions.length === 0) {
    suggestions.push(
      "How am I doing overall?",
      "Any patterns you notice?",
      "What should I focus on?"
    )
  }

  // Return max 3 suggestions
  return suggestions.slice(0, 3)
}

/**
 * Calculate context for suggestions from challenge data
 */
export function buildSuggestionsContext(challenge, tasks, completions, today) {
  if (!challenge) return {}

  const todayStr = today || new Date().toISOString().split("T")[0]
  const startDate = new Date(challenge.start_date)
  const endDate = new Date(challenge.end_date)
  const currentDate = new Date(todayStr)

  const daysElapsed = Math.floor(
    (currentDate - startDate) / (1000 * 60 * 60 * 24)
  )
  const daysRemaining = Math.floor(
    (endDate - currentDate) / (1000 * 60 * 60 * 24)
  )

  // Calculate week completion rate
  const weekStart = new Date(currentDate)
  weekStart.setDate(weekStart.getDate() - 7)

  const weekCompletions =
    completions?.filter((c) => {
      const compDate = new Date(c.completion_date)
      return compDate >= weekStart && compDate <= currentDate
    }) || []

  const expectedTasks = (tasks?.length || 1) * 7
  const completionRate = Math.round(
    (weekCompletions.length / expectedTasks) * 100
  )

  // Check for streak
  const yesterday = new Date(currentDate)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split("T")[0]

  const yesterdayCompletions =
    completions?.filter((c) => c.completion_date === yesterdayStr).length || 0
  const streakBroken = yesterdayCompletions === 0 && daysElapsed > 1

  // Find missed tasks today
  const todayCompletions =
    completions?.filter((c) => c.completion_date === todayStr) || []
  const completedTaskIds = new Set(todayCompletions.map((c) => c.task_id))
  const missedTasks =
    tasks?.filter((t) => !completedTaskIds.has(t.id)).map((t) => t.name) || []

  return {
    completionRate,
    daysElapsed,
    daysRemaining,
    streakBroken,
    missedTasks,
    challengeName: challenge.name,
  }
}
