import { useState, useRef, useEffect } from "react"
import {
  Sparkles,
  Loader2,
  X,
  Clock,
  Briefcase,
  Home,
  Star,
  Zap,
} from "lucide-react"
import { cn } from "../../lib/utils"
import { callAI } from "../../lib/ai/client"
import { buildCalendarContext } from "../../lib/ai/calendarContext"
import { useAIConfig } from "../../hooks/useAIConfig"

const FOCUS_MODES = [
  {
    id: "smart",
    label: "Smart Priority",
    icon: Sparkles,
    description: "AI decides based on calendar & urgency",
  },
  {
    id: "quick",
    label: "Quick Wins",
    icon: Zap,
    description: "Short tasks first (under 15 min)",
  },
  {
    id: "work",
    label: "Work Focus",
    icon: Briefcase,
    description: "Prioritize work-related tasks",
  },
  {
    id: "personal",
    label: "Personal",
    icon: Home,
    description: "Personal habits first",
  },
  {
    id: "important",
    label: "Most Important",
    icon: Star,
    description: "High-impact tasks first",
  },
  {
    id: "time",
    label: "By Time",
    icon: Clock,
    description: "Tasks with scheduled times first",
  },
]

/**
 * AI Sort Button - Lets users reorder their task list with AI assistance
 */
export function AISortButton({ tasks = [], onSort, onUpdateTask, className }) {
  const { config, hasKey } = useAIConfig()
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedMode, setSelectedMode] = useState(null)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSort = async (mode) => {
    setSelectedMode(mode.id)
    setLoading(true)

    try {
      let sortedTasks

      if (mode.id === "smart" && hasKey) {
        // Use AI to sort tasks AND assign times
        sortedTasks = await aiSort(tasks, config, onUpdateTask)
      } else {
        // Use local sorting logic
        sortedTasks = localSort(tasks, mode.id)
      }

      onSort(sortedTasks)
      setIsOpen(false)
    } catch (error) {
      console.error("Sort failed:", error)
      // Fall back to local sort
      const sortedTasks = localSort(tasks, mode.id)
      onSort(sortedTasks)
      setIsOpen(false)
    } finally {
      setLoading(false)
      setSelectedMode(null)
    }
  }

  // ... rest of component ...
  if (tasks.length < 1) {
    return null
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
          "bg-gradient-to-r from-purple-500/10 to-indigo-500/10",
          "hover:from-purple-500/20 hover:to-indigo-500/20",
          "border border-purple-500/20 hover:border-purple-500/30",
          "text-purple-600 dark:text-purple-400",
          loading && "opacity-70 cursor-wait",
        )}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
        <span>Prioritize {loading && "..."}</span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-border z-50 overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-primary">
                Sort tasks by...
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-hover"
              >
                <X className="w-4 h-4 text-tertiary" />
              </button>
            </div>
          </div>

          <div className="p-2 space-y-1 max-h-72 overflow-y-auto">
            {FOCUS_MODES.map((mode) => {
              const Icon = mode.icon
              const isLoading = loading && selectedMode === mode.id

              return (
                <button
                  key={mode.id}
                  onClick={() => handleSort(mode)}
                  disabled={loading}
                  className={cn(
                    "w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors",
                    "hover:bg-surface-hover",
                    isLoading && "bg-purple-500/10",
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                      mode.id === "smart"
                        ? "bg-gradient-to-br from-purple-500/20 to-indigo-500/20"
                        : "bg-surface",
                    )}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                    ) : (
                      <Icon
                        className={cn(
                          "w-4 h-4",
                          mode.id === "smart"
                            ? "text-purple-500"
                            : "text-tertiary",
                        )}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-primary">
                      {mode.label}
                    </p>
                    <p className="text-xs text-tertiary">{mode.description}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {!hasKey && (
            <div className="p-3 border-t border-border bg-surface">
              <p className="text-xs text-tertiary text-center">
                Connect AI for smarter prioritization
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Local sorting logic (no AI required)
 */
function localSort(tasks, mode) {
  const sorted = [...tasks]

  switch (mode) {
    case "quick":
      // Short tasks first (by duration_minutes, default 15)
      return sorted.sort(
        (a, b) => (a.duration_minutes || 15) - (b.duration_minutes || 15),
      )

    case "work":
      // Tasks with "work" related keywords first
      const workKeywords = [
        "work",
        "meeting",
        "email",
        "report",
        "project",
        "client",
        "deadline",
      ]
      return sorted.sort((a, b) => {
        const aIsWork = workKeywords.some((k) =>
          a.name.toLowerCase().includes(k),
        )
        const bIsWork = workKeywords.some((k) =>
          b.name.toLowerCase().includes(k),
        )
        if (aIsWork && !bIsWork) return -1
        if (!aIsWork && bIsWork) return 1
        return 0
      })

    case "personal":
      // Personal tasks first (opposite of work)
      const personalKeywords = [
        "exercise",
        "meditat",
        "read",
        "journal",
        "sleep",
        "water",
        "health",
        "family",
      ]
      return sorted.sort((a, b) => {
        const aIsPersonal = personalKeywords.some((k) =>
          a.name.toLowerCase().includes(k),
        )
        const bIsPersonal = personalKeywords.some((k) =>
          b.name.toLowerCase().includes(k),
        )
        if (aIsPersonal && !bIsPersonal) return -1
        if (!aIsPersonal && bIsPersonal) return 1
        return 0
      })

    case "important":
      // Daily tasks first (higher frequency = more important)
      return sorted.sort((a, b) => {
        if (a.frequency_type === "daily" && b.frequency_type !== "daily")
          return -1
        if (a.frequency_type !== "daily" && b.frequency_type === "daily")
          return 1
        return (b.frequency_count || 1) - (a.frequency_count || 1)
      })

    case "time":
      // Tasks with scheduled times first, then by time
      return sorted.sort((a, b) => {
        if (a.scheduled_time && !b.scheduled_time) return -1
        if (!a.scheduled_time && b.scheduled_time) return 1
        if (a.scheduled_time && b.scheduled_time) {
          return a.scheduled_time.localeCompare(b.scheduled_time)
        }
        return 0
      })

    case "smart":
    default:
      // Default: daily first, then by name
      return sorted.sort((a, b) => {
        if (a.frequency_type === "daily" && b.frequency_type !== "daily")
          return -1
        if (a.frequency_type !== "daily" && b.frequency_type === "daily")
          return 1
        return a.name.localeCompare(b.name)
      })
  }
}

/**
 * AI-powered smart sorting & scheduling
 */
async function aiSort(tasks, config, onUpdateTask) {
  if (!config?.api_key || tasks.length < 1) {
    return tasks
  }

  try {
    // Get calendar context
    const calendarContext = await buildCalendarContext(tasks)

    const taskList = tasks
      .map(
        (t, i) =>
          `${i + 1}. "${t.name}" (${t.frequency_type}${t.scheduled_time ? `, @${t.scheduled_time}` : ""}${t.duration_minutes ? `, ${t.duration_minutes}min` : ""})`,
      )
      .join("\n")

    const prompt = `You are a productivity assistant. I have these tasks and a calendar schedule.

${calendarContext || "No calendar connected."}

TASKS:
${taskList}

YOUR GOAL:
1. Prioritize these tasks based on urgency and available time windows.
2. ASSIGN SPECIFIC START TIMES (HH:MM 24h format) for today where appropriate, filling free windows. Use 5-10 min buffers.

RESPONSE FORMAT (JSON ONLY):
{
  "order": [3, 1, 2], // Task numbers (1-indexed) in order
  "assignments": {
    "1": "09:00", // Task 1 start time
    "3": "14:30" // Task 3 start time
  }
}
If a task doesn't need a specific time (flexible), omit it from "assignments".
`

    const response = await callAI(
      [
        {
          role: "system",
          content:
            "You are a productivity assistant. Respond strictly with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      config,
      { contextType: "sort" },
    )

    if (response) {
      // Clean response (remove markdown code blocks if any)
      const cleanResponse = response
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim()

      try {
        const result = JSON.parse(cleanResponse)

        // 1. Apply Time Assignments
        if (result.assignments && onUpdateTask) {
          for (const [taskIndexStr, time] of Object.entries(
            result.assignments,
          )) {
            const taskIndex = parseInt(taskIndexStr) - 1
            if (taskIndex >= 0 && taskIndex < tasks.length) {
              const task = tasks[taskIndex]
              // Only update if time changed
              if (task.scheduled_time !== time) {
                // We don't await this to keep UI snappy, assuming optimistic updates or eventual consistency
                // But wait, if we duplicate filtering logic in App.jsx, we might need these to be done
                await onUpdateTask(task.id, { scheduled_time: time })
                // Note: we're mutating the task object in memory for the sort return below,
                // but typically we should rely on the fresh data.
                // For the immediate sort return, let's clone.
                // Actually the sort function returns the tasks.
              }
            }
          }
        }

        // 2. Return Sorted Tasks
        if (result.order && Array.isArray(result.order)) {
          const order = result.order
            .map((n) => parseInt(n) - 1)
            .filter((n) => !isNaN(n) && n >= 0 && n < tasks.length)

          if (order.length > 0) {
            // Create a map of updated times for the local sort return
            const assignments = result.assignments || {}

            return order.map((i) => {
              const task = tasks[i]
              const newTime = assignments[i + 1]
              if (newTime) {
                return { ...task, scheduled_time: newTime }
              }
              return task
            })
          }
        }
      } catch (jsonErr) {
        console.error("Failed to parse AI response:", jsonErr)
      }
    }
  } catch (error) {
    console.error("AI sort failed:", error)
  }

  // Fall back to local smart sort
  return localSort(tasks, "smart")
}
