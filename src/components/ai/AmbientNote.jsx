import { useAmbientNotes } from "../../hooks/useAmbientNotes"
import { useAIConfig } from "../../hooks/useAIConfig"
import { Sparkles } from "lucide-react"

/**
 * Header Ambient Note - shown on challenge cards
 */
export function AmbientNote({ challenge, tasks, completions }) {
  const { config } = useAIConfig()

  // Build context data for header note
  const contextData = challenge
    ? {
        challengeName: challenge.name,
        daysElapsed: Math.floor(
          (new Date() - new Date(challenge.start_date)) / (1000 * 60 * 60 * 24)
        ),
        totalDays: Math.floor(
          (new Date(challenge.end_date) - new Date(challenge.start_date)) /
            (1000 * 60 * 60 * 24)
        ),
        progress: calculateProgress(challenge, tasks, completions),
        trend: calculateTrend(tasks, completions),
      }
    : null

  const { note, loading } = useAmbientNotes("header", contextData)

  if (!config?.api_key) return null

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 mt-2 text-xs text-tertiary animate-pulse">
        <Sparkles className="w-3 h-3" />
        <span className="italic">Thinking...</span>
      </div>
    )
  }

  if (!note) return null

  return (
    <div className="flex items-start gap-1.5 mt-2 text-xs text-secondary">
      <Sparkles className="w-3 h-3 text-primary shrink-0 mt-0.5" />
      <span className="italic leading-relaxed">{note}</span>
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

  if (!config?.api_key || loading || !note) return null

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
  if (!tasks?.length) return 0
  const total = tasks.length * 100
  const done = completions?.length || 0
  return Math.round((done / total) * 100)
}

function calculateTrend(tasks, completions) {
  // Simple trend calculation - compare last 3 days vs previous 3
  return "stable" // Simplified for MVP
}
