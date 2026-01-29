import { useRef, useEffect, useState } from "react"
import { cn } from "../../lib/utils"
import { Clock, Calendar as CalendarIcon, AlertCircle } from "lucide-react"

// Constants
const START_HOUR = 6
const END_HOUR = 23
const HOUR_HEIGHT = 60
const EVENT_MIN_HEIGHT = 30
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR + 1 },
  (_, i) => START_HOUR + i,
)

export function DayPlanner({
  date, // Date string YYYY-MM-DD
  tasks = [], // Array of task objects
  events = [], // Array of Google Calendar event objects
  onEditTask,
}) {
  const containerRef = useRef(null)
  const [currentTimeTop, setCurrentTimeTop] = useState(null)

  // Calculate current time line position
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      // Only show if today matches displayed date
      const displayedDate = new Date(date)
      const isToday =
        now.getDate() === displayedDate.getDate() &&
        now.getMonth() === displayedDate.getMonth() &&
        now.getFullYear() === displayedDate.getFullYear()

      if (isToday) {
        const hours = now.getHours()
        const minutes = now.getMinutes()
        if (hours >= START_HOUR && hours <= END_HOUR) {
          const top = (hours - START_HOUR) * HOUR_HEIGHT + minutes
          setCurrentTimeTop(top)
        } else {
          setCurrentTimeTop(null)
        }
      } else {
        setCurrentTimeTop(null)
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [date])

  // Scroll current time into view on mount
  useEffect(() => {
    if (currentTimeTop && containerRef.current) {
      containerRef.current.scrollTop = currentTimeTop - 200
    }
  }, [currentTimeTop])

  // Create a Map to deduplicate items by ID (handling overlapping event sources)
  const uniqueItemsMap = new Map()
  ;[...events, ...tasks].forEach((item) => {
    uniqueItemsMap.set(item.id, item)
  })

  // Filter items for the timeline
  const timelineItems = Array.from(uniqueItemsMap.values())
    .filter((item) => {
      // Check if item belongs to this date
      if (item.start?.dateTime || item.start?.date) {
        // It's a Google Event
        let eventDateStr
        if (item.start.date) {
          // All-day event: "2023-10-27"
          eventDateStr = item.start.date
        } else {
          // Timed event: "2023-10-27T10:00:00-07:00"
          // We want the date part relative to the event's timezone (or just local date part)
          // Simple split is usually sufficient if we assume user views in consistent timezone
          eventDateStr = item.start.dateTime.split("T")[0]
        }

        // Compare YYYY-MM-DD
        if (eventDateStr !== date) return false
      }
      // Note: Tasks passed in are already filtered by date in App.jsx via isTaskActiveOnDate

      // Must have a time
      const timeStr =
        item.scheduled_time ||
        (item.start?.dateTime
          ? new Date(item.start.dateTime).toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
            })
          : null)
      if (!timeStr) return false

      // Parse hours
      const [hours] = timeStr.split(":").map(Number)
      return hours >= START_HOUR && hours <= END_HOUR
    })
    .map((item) => {
      const isTask = !!item.challenge_id // Simple check for task vs event
      let start, end, title, color, id

      if (isTask) {
        // It's a task
        id = item.id
        title = item.name
        color = item.color || "#6366f1" // Default Indigo

        const [h, m] = (item.scheduled_time || "00:00").split(":").map(Number)
        start = h * 60 + m
        end = start + (item.duration_minutes || 30) // Default 30 min
      } else {
        // It's an event
        id = item.id
        title = item.summary || "(No title)"
        color = item.backgroundColor || "#ef4444" // Default Red (Google Calendar default mostly)

        const startDate = new Date(item.start.dateTime || item.start.date)
        const endDate = new Date(item.end.dateTime || item.end.date)

        start = startDate.getHours() * 60 + startDate.getMinutes()
        end = endDate.getHours() * 60 + endDate.getMinutes()
      }

      // Calculate timeline position
      const top = start - START_HOUR * 60 // vertical offset
      const height = Math.max(end - start, EVENT_MIN_HEIGHT)

      return {
        id,
        isTask,
        title,
        color,
        top,
        height,
        original: item,
        timeString: formatTime(start),
      }
    })
    .sort((a, b) => a.top - b.top)

  // Handle overlapping events layout
  const positionedItems = layoutEvents(timelineItems)

  const unScheduledTasks = tasks.filter((t) => !t.scheduled_time)

  return (
    <div className="flex flex-col h-[600px] bg-surface rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-surface-hover/50 backdrop-blur-sm">
        <h3 className="font-semibold text-primary flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-tertiary" />
          Day Plan
        </h3>
        <span className="text-sm text-secondary font-medium">
          {new Date(date + "T00:00:00").toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Timeline Area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto relative scroll-smooth bg-surface"
        >
          <div className="absolute inset-x-0 top-0 h-full min-h-[1020px]">
            {/* Hour Grid Lines */}
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute inset-x-0 border-t border-border/40 flex"
                style={{ top: (hour - START_HOUR) * HOUR_HEIGHT }}
              >
                <div className="w-12 -mt-2.5 text-xs text-tertiary text-right pr-2 select-none">
                  {formatHour(hour)}
                </div>
                <div className="flex-1" />
              </div>
            ))}

            {/* Current Time Indicator */}
            {currentTimeTop !== null && (
              <div
                className="absolute left-12 right-0 border-t-2 border-red-500 z-20 pointer-events-none"
                style={{ top: currentTimeTop }}
              >
                <div className="absolute -left-1.5 -top-1.5 w-3 h-3 rounded-full bg-red-500" />
              </div>
            )}

            {/* Events & Tasks */}
            {positionedItems.map((item) => (
              <div
                key={`${item.isTask ? "task" : "event"}-${item.id}`}
                className={cn(
                  "absolute left-14 right-2 text-xs rounded-lg border shadow-sm transition-all hover:brightness-95 hover:z-10 cursor-pointer overflow-hidden",
                  item.isTask ? "border-l-4" : "border-l-4 opacity-90",
                )}
                style={{
                  top: item.top,
                  height: item.height,
                  left: `calc(3.5rem + ${item.style?.left || "0%"})`,
                  width: item.style?.width || "calc(100% - 4rem)",
                  backgroundColor: item.isTask
                    ? item.color + "20"
                    : item.color + "20", // Light bg
                  borderColor: item.color,
                  borderLeftColor: item.color,
                }}
                onClick={() =>
                  item.isTask && onEditTask && onEditTask(item.original)
                }
              >
                <div className="px-2 py-1 h-full">
                  <div className="font-semibold text-primary truncate flex items-center gap-1.5">
                    {item.isTask && (
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          item.original.isCompleted
                            ? "bg-green-500"
                            : "bg-gray-400",
                        )}
                      />
                    )}
                    {item.title}
                  </div>
                  <div className="text-[10px] opacity-75">
                    {item.timeString}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unscheduled Sidebar (Optional, keeps tasks visible) */}
        {unScheduledTasks.length > 0 && (
          <div className="w-48 bg-surface-alt border-l border-border overflow-y-auto p-3 hidden sm:block">
            <h4 className="text-xs font-semibold text-tertiary uppercase tracking-wider mb-2">
              To Schedule
            </h4>
            <div className="space-y-2">
              {unScheduledTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onEditTask && onEditTask(task)}
                  className="p-2 bg-surface rounded-lg border border-border shadow-sm text-xs cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <p className="font-medium text-primary truncate">
                    {task.name}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-tertiary">
                    <Clock className="w-3 h-3" />
                    <span>{task.duration_minutes || "?"}min</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Helpers

function formatHour(hour) {
  const h = hour % 12 || 12
  const ampm = hour < 12 ? "AM" : "PM"
  return `${h} ${ampm}`
}

function formatTime(minutesTotal) {
  const h = Math.floor(minutesTotal / 60)
  const m = minutesTotal % 60
  const ampm = h < 12 ? "am" : "pm"
  const hour = h % 12 || 12
  const min = m.toString().padStart(2, "0")
  return `${hour}:${min}${ampm}`
}

/**
 * Simple algorithm to layout overlapping events
 * Assigns width and left style properties
 */
function layoutEvents(events) {
  if (events.length === 0) return []

  // Initialize columns
  const columns = []

  // Sort by start time, then duration (longer first)
  const sorted = [...events].sort((a, b) => {
    if (a.top !== b.top) return a.top - b.top
    return b.height - a.height
  })

  // Place events in columns
  sorted.forEach((event) => {
    let placed = false

    // Find first column where event fits
    for (const column of columns) {
      // Check collision with last event in column
      const lastEvent = column[column.length - 1]
      if (lastEvent.top + lastEvent.height <= event.top) {
        column.push(event)
        placed = true
        break
      }
    }

    // If no fit, create new column
    if (!placed) {
      columns.push([event])
    }
  })

  // Flatten and calculate styles
  const width = 100 / columns.length

  return columns.flatMap((column, colIndex) =>
    column.map((event) => ({
      ...event,
      style: {
        width: `${width}%`,
        left: `${colIndex * width}%`,
      },
    })),
  )
}
