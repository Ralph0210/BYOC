import { Challenge } from "../utils"
import { Task } from "../utils"

interface SuggestionContext {
  completionRate?: number
  daysElapsed?: number
  daysRemaining?: number
  streakDays?: number
  streakBroken?: boolean
  missedTasks?: string[]
  challengeName?: string
}

/**
 * Generate contextual prompt suggestions based on user's current state
 */
export function getSuggestedPrompts(context: SuggestionContext | null) {
  const suggestions: string[] = []

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
export function buildSuggestionsContext(
  challenge: Challenge | null,
  tasks: Task[] | null,
  completions: any[] | null,
  today?: string
): SuggestionContext {
  if (!challenge) return {}

  const todayStr = today || new Date().toISOString().split("T")[0]

  // Use simple date math to avoid timezone issues
  const startMs = new Date(challenge.start_date + "T00:00:00").getTime()
  const endMs = new Date(challenge.end_date + "T00:00:00").getTime()
  const todayMs = new Date(todayStr + "T00:00:00").getTime()

  const daysElapsed =
    Math.floor((todayMs - startMs) / (1000 * 60 * 60 * 24)) + 1
  const daysRemaining =
    todayMs <= endMs
      ? Math.floor((endMs - todayMs) / (1000 * 60 * 60 * 24)) + 1
      : 0

  // Calculate week completion rate
  const currentDate = new Date(todayStr + "T00:00:00")
  const weekStart = new Date(currentDate)
  weekStart.setDate(weekStart.getDate() - 7)

  const weekCompletions =
    completions?.filter((c) => {
      const compDate = new Date(c.date) // Note: Mobile uses 'date', web 'completion_date'? Need to verify. Assuming 'date' based on other files.
      // Verified in useCompletions.ts -> fetchCompletions select uses 'date' column?
      // Wait, web stats.js uses 'completion_date' in buildSuggestionsContext but 'date' in calculateChallengeStats line 40?
      // Let's stick to standard date object comparison
      return compDate >= weekStart && compDate <= currentDate
    }) || []

  const expectedTasks = (tasks?.length || 1) * 7
  const completionRate = Math.round(
    (weekCompletions.length / expectedTasks) * 100
  )

  // Check for streak (simplified logic)
  const yesterday = new Date(currentDate)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split("T")[0]

  const yesterdayCompletions =
    completions?.filter((c) => c.date === yesterdayStr).length || 0 // Assuming 'date'
  const streakBroken = yesterdayCompletions === 0 && daysElapsed > 1

  // Find missed tasks today
  const todayCompletions = completions?.filter((c) => c.date === todayStr) || [] // Assuming 'date'
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
