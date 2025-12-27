import { useMemo } from "react"
import { calculateChallengeStats } from "../lib/stats"

/**
 * Transforms raw app data into a context object for the AI.
 * Now a pure hook that accepts data instead of fetching it.
 */
export function useAIContext(challenge, tasks, completions) {
  const context = useMemo(() => {
    if (!challenge) return null

    // Calculate stats if not provided?
    // Usually App.jsx calculates them for UI.
    // We'll recalculate here to be safe and ensure format.
    const stats = calculateChallengeStats(
      challenge,
      tasks || [],
      completions || []
    )

    return {
      challenge: {
        id: challenge.id,
        name: challenge.name,
        description: challenge.description,
        daysElapsed: stats.daysElapsed,
        daysRemaining: stats.daysRemaining,
        overallProgress: stats.overall,
        currentStreak: stats.streak || 0,
      },
      tasks: (tasks || []).map((t) => ({
        name: t.name,
        frequency: t.frequency_type,
        count: t.frequency_count,
      })),
      // Future: Recent completions, etc.
    }
  }, [challenge, tasks, completions])

  return context
}
