import { useState, useEffect } from "react"
import {
  Clock,
  CalendarClock,
  Sparkles,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { cn } from "../../lib/utils"
import { useGoogleCalendar } from "../../hooks/useGoogleCalendar"
import { getSchedulingSuggestions } from "../../lib/ai/calendarContext"

/**
 * SmartScheduling - AI-powered task scheduling based on calendar
 * Shows suggested times for habits based on free time slots
 */
export function SmartScheduling({ tasks = [], onClose }) {
  const { isConnected, todayEvents, freeBusy } = useGoogleCalendar()
  const [suggestions, setSuggestions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isConnected) {
      setLoading(false)
      return
    }

    async function loadSuggestions() {
      setLoading(true)
      setError(null)
      try {
        const result = await getSchedulingSuggestions(tasks)
        setSuggestions(result)
      } catch (err) {
        setError("Failed to generate suggestions")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadSuggestions()
  }, [isConnected, tasks])

  const handleRefresh = async () => {
    setLoading(true)
    try {
      const result = await getSchedulingSuggestions(tasks)
      setSuggestions(result)
    } catch (err) {
      setError("Failed to refresh")
    } finally {
      setLoading(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="text-center py-8">
        <CalendarClock className="w-12 h-12 mx-auto mb-3 text-tertiary opacity-50" />
        <p className="text-secondary mb-2">Connect Google Calendar</p>
        <p className="text-xs text-tertiary">
          to get smart scheduling suggestions
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-accent" />
        <span className="ml-2 text-secondary">Analyzing your schedule...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-10 h-10 mx-auto mb-2 text-red-400" />
        <p className="text-secondary">{error}</p>
      </div>
    )
  }

  if (!suggestions || tasks.length === 0) {
    return (
      <div className="text-center py-8">
        <Sparkles className="w-10 h-10 mx-auto mb-2 text-purple-400 opacity-50" />
        <p className="text-secondary">No pending tasks to schedule</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-semibold text-primary">
            Smart Scheduling
          </h3>
        </div>
        <button
          onClick={handleRefresh}
          className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
          title="Refresh suggestions"
        >
          <RefreshCw className="w-4 h-4 text-tertiary" />
        </button>
      </div>

      {/* Summary */}
      {suggestions.summary && (
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/20">
          <p className="text-sm text-primary">{suggestions.summary}</p>
        </div>
      )}

      {/* Suggestions List */}
      {suggestions.suggestions?.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-tertiary uppercase tracking-wider">
            Suggested Times
          </p>
          {suggestions.suggestions.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface hover:bg-surface-hover transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary truncate">
                  {s.habit}
                </p>
                <p className="text-xs text-tertiary">{s.reason}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-accent">
                  {s.suggestedTime}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-tertiary text-sm">
          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-50" />
          <p>Your schedule is flexible today!</p>
          <p className="text-xs mt-1">Do your habits whenever works best</p>
        </div>
      )}

      {/* Free Windows */}
      {suggestions.freeWindows?.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-xs font-medium text-tertiary uppercase tracking-wider">
            Available Time Slots
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.freeWindows.map((w, i) => (
              <div
                key={i}
                className="px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-xs"
              >
                <span className="text-green-600 dark:text-green-400 font-medium">
                  {w.start} - {w.end}
                </span>
                <span className="text-tertiary ml-1">({w.duration})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Events */}
      {todayEvents?.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-border">
          <p className="text-xs font-medium text-tertiary uppercase tracking-wider">
            Today's Commitments
          </p>
          <div className="space-y-1">
            {todayEvents.slice(0, 4).map((event, i) => {
              const time = event.start?.dateTime
                ? new Date(event.start.dateTime).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })
                : "All day"
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-secondary">{time}</span>
                  <span className="text-tertiary truncate">
                    {event.summary}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * TaskPrioritizer - Helps users prioritize their tasks
 * Can be triggered via AI chat or button
 */
export function prioritizeTasks(tasks, options = {}) {
  const { calendarBusyness = "moderate", userPreference = "balanced" } = options

  // Sort tasks by priority score
  const scoredTasks = tasks.map((task) => {
    let score = 50 // Base score

    // Factor 1: Frequency urgency (daily tasks are more urgent)
    if (task.frequency_type === "daily") score += 20
    else if (task.frequency_type === "weekly") score += 10

    // Factor 2: Completion status (incomplete = higher priority)
    if (!task.isCompleted) score += 30

    // Factor 3: Days since last done (overdue = higher priority)
    if (task.daysSinceLastDone > 0) {
      score += Math.min(task.daysSinceLastDone * 5, 25)
    }

    // Factor 4: Task has a time estimate (helps with scheduling)
    if (task.duration_minutes) {
      // Shorter tasks get slight boost on busy days
      if (calendarBusyness === "busy" && task.duration_minutes <= 15) {
        score += 10
      }
    }

    return {
      ...task,
      priorityScore: score,
      priorityReason: getPriorityReason(task, score),
    }
  })

  // Sort by score (highest first)
  return scoredTasks.sort((a, b) => b.priorityScore - a.priorityScore)
}

function getPriorityReason(task, score) {
  if (task.daysSinceLastDone > 2) {
    return `Overdue by ${task.daysSinceLastDone} days`
  }
  if (!task.isCompleted && task.frequency_type === "daily") {
    return "Daily habit - maintain streak"
  }
  if (score >= 80) {
    return "High priority"
  }
  if (score >= 60) {
    return "Moderate priority"
  }
  return "When you have time"
}
