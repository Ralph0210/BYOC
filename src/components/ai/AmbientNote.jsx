import { useAmbientNotes } from "../../hooks/useAmbientNotes"
import { useAIConfig } from "../../hooks/useAIConfig"
import { Sparkles } from "lucide-react"
import { daysDiff, getToday } from "../../lib/utils"

/**
 * Header Ambient Note - shown on challenge cards
 * Click to expand to conversation panel
 */
export function AmbientNote({ challenge, tasks, completions, onClick }) {
  const { config } = useAIConfig()
  const today = getToday()

  // Build context data for header note
  const contextData = challenge
    ? {
        challengeId: challenge.id,
        challengeName: challenge.name,
        daysElapsed: daysDiff(challenge.start_date, today) + 1,
        totalDays: daysDiff(challenge.start_date, challenge.end_date) + 1,
        // REMOVED bucketing: the user wants to see refreshes on task completion
        progress: calculateProgress(challenge, tasks, completions),
        completionsCount: completions?.length || 0, // Add this to force refresh on completion
        trend: calculateTrend(tasks, completions),
      }
    : null

  const { note, loading } = useAmbientNotes("header", contextData)

  if (!config?.api_key) return null

  // If we have a note but are loading a new one, show the note with a subtle pulse/indicator
  // rather than wiping it out and showing "Thinking..."
  return (
    <div
      onClick={onClick}
      className={`relative group mt-2 text-xs transition-all ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-start gap-1.5">
        <Sparkles
          className={`w-3 h-3 shrink-0 mt-0.5 transition-colors ${loading ? "text-primary animate-pulse" : "text-primary"}`}
        />
        <div className="flex flex-col">
          {note ? (
            <span
              className={`italic leading-relaxed transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}
            >
              {note}
            </span>
          ) : loading ? (
            <span className="italic text-tertiary animate-pulse">
              Thinking...
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/**
 * Task Ambient Note - shown for neglected tasks
 */
export function TaskAmbientNote({ task, lastCompletedDate }) {
  const { config } = useAIConfig()

  const daysSinceLastDone = lastCompletedDate
    ? Math.floor(
        (new Date() - new Date(lastCompletedDate)) / (1000 * 60 * 60 * 24)
      )
    : 999

  // Only show for tasks not done in 3+ days
  if (daysSinceLastDone < 3) return null

  const contextData = {
    taskName: task.name,
    daysSinceLastDone,
  }

  const { note, loading } = useAmbientNotes("task", contextData)

  if (!config?.api_key || !note) {
    if (loading) {
      return (
        <p className="text-[10px] text-tertiary italic mt-1 flex items-center gap-1 animate-pulse">
          <Sparkles className="w-2 h-2" />
          Thinking...
        </p>
      )
    }
    return null
  }

  return (
    <p className="text-xs text-tertiary italic mt-1 flex items-center gap-1">
      <Sparkles className="w-2.5 h-2.5" />
      {note}
    </p>
  )
}

/**
 * Daily Summary Note - shown at end of day or on app open
 */
export function DailySummaryNote({ completedToday, targetToday, missedTasks }) {
  const { config } = useAIConfig()

  const contextData = {
    completedToday,
    targetToday,
    missedTasks,
  }

  const { note, loading } = useAmbientNotes("summary", contextData)

  if (!config?.api_key || loading || !note) return null

  return (
    <div className="p-3 rounded-xl bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/10">
      <div className="flex items-start gap-2">
        <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-secondary leading-relaxed">{note}</p>
      </div>
    </div>
  )
}

/**
 * Empty State Note - shown when no tasks for today
 */
export function EmptyStateNote() {
  const { config } = useAIConfig()
  const { note, loading } = useAmbientNotes("empty", {
    today: new Date().toISOString(),
  })

  if (!config?.api_key || loading || !note) return null

  return (
    <p className="text-sm text-tertiary italic flex items-center justify-center gap-2">
      <Sparkles className="w-4 h-4 text-primary" />
      {note}
    </p>
  )
}

/**
 * Return After Absence Note - welcoming back after 3+ days
 */
export function ReturnNote({ daysAway, onDismiss }) {
  const { config } = useAIConfig()
  const companionName = config?.companion_name || "Your companion"

  const { note, loading } = useAmbientNotes("return", { daysAway })

  if (!config?.api_key || loading || !note) return null

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 mb-4">
      <div className="flex items-start gap-3">
        {config?.companion_photo_url ? (
          <img
            src={config.companion_photo_url}
            alt={companionName}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">{companionName}</p>
          <p className="text-sm text-secondary leading-relaxed">{note}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-xs text-tertiary hover:text-primary"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

/**
 * Calendar Perfect Day Note - celebration for 100% completion
 */
export function PerfectDayNote() {
  const { config } = useAIConfig()
  const { note, loading } = useAmbientNotes("calendar", { perfectDay: true })

  if (!config?.api_key || loading || !note) return null

  return (
    <span className="text-xs text-primary font-medium flex items-center gap-1">
      <Sparkles className="w-3 h-3" />
      {note}
    </span>
  )
}

// Helper functions
function calculateProgress(challenge, tasks, completions) {
  if (!tasks?.length || !challenge?.start_date || !challenge?.end_date) return 0

  // Total expected completions for the entire challenge duration (inclusive)
  const durationDays = Math.max(
    1,
    daysDiff(challenge.start_date, challenge.end_date) + 1
  )

  const totalExpected = tasks.length * durationDays
  const actualDone = completions?.length || 0

  return Math.min(100, Math.round((actualDone / totalExpected) * 100))
}

function calculateTrend(tasks, completions) {
  if (!completions?.length) return "neutral"

  const today = new Date().toISOString().split("T")[0]
  const last3Days = [0, 1, 2].map((i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split("T")[0]
  })
  const prev3Days = [3, 4, 5].map((i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split("T")[0]
  })

  const last3Count = completions.filter((c) =>
    last3Days.includes(c.date)
  ).length
  const prev3Count = completions.filter((c) =>
    prev3Days.includes(c.date)
  ).length

  if (last3Count > prev3Count) return "improving"
  if (last3Count < prev3Count) return "declining"
  return "stable"
}
