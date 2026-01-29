/**
 * Calendar Context Builder for AI
 * Formats calendar data into a concise context string for AI prompts
 */

import { isConnected, getTodayEvents, getFreeBusy } from "../calendarService"

/**
 * Build a calendar context string for AI consumption
 * Optionally includes pending tasks for prioritization
 * Returns null if calendar is not connected
 */
export async function buildCalendarContext(pendingTasks = []) {
  if (!isConnected()) {
    return null
  }

  try {
    // Fetch today's events
    const events = await getTodayEvents()

    // Fetch free/busy for today
    const now = new Date()
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    const freeBusy = await getFreeBusy(["primary"], {
      timeMin: now.toISOString(),
      timeMax: endOfDay.toISOString(),
    })

    // Format the context
    let context = formatCalendarContext(events, freeBusy, now)

    // Add task list for prioritization if provided
    if (pendingTasks.length > 0) {
      const tasksList = pendingTasks
        .slice(0, 8)
        .map((t) => {
          const time = t.scheduled_time ? ` @${t.scheduled_time}` : ""
          const duration = t.duration_minutes
            ? ` (${t.duration_minutes}min)`
            : ""
          const recurring = t.is_recurring
            ? ` [${t.frequency_type}]`
            : " [one-time]"
          return `- "${t.name}"${time}${duration}${recurring}`
        })
        .join("\n")

      context += `\n\nPENDING TASKS TO PRIORITIZE:\n${tasksList}`
    }

    return context
  } catch (error) {
    console.error("Failed to build calendar context:", error)
    return null
  }
}

/**
 * Format calendar data into a concise AI-friendly string
 */
function formatCalendarContext(events, freeBusy, now) {
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" })
  const dateStr = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })

  // Calculate busy time
  const busySlots = freeBusy?.primary?.busy || []
  const totalBusyMinutes = busySlots.reduce((acc, slot) => {
    const start = new Date(slot.start)
    const end = new Date(slot.end)
    return acc + (end - start) / 60000
  }, 0)

  // Remaining hours in day (assume 6am-11pm active day = 17 hours)
  const currentHour = now.getHours()
  const remainingActiveHours = Math.max(0, 23 - currentHour)
  const busyHours = Math.round(totalBusyMinutes / 60)
  const freeHours = Math.max(0, remainingActiveHours - busyHours)

  // Format events list
  const eventsList =
    events.length > 0
      ? events
          .slice(0, 5)
          .map((e) => {
            const time = e.start?.dateTime
              ? new Date(e.start.dateTime).toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })
              : "All day"
            return `"${e.summary || "Untitled"}" at ${time}`
          })
          .join(", ")
      : "No events scheduled"

  // Identify free windows
  const freeWindows = findFreeWindows(
    busySlots,
    now,
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 0),
  )
  const freeWindowsStr =
    freeWindows.length > 0
      ? freeWindows
          .slice(0, 3)
          .map((w) => `${w.start}-${w.end} (${w.duration})`)
          .join(", ")
      : "None identified"

  // Determine day pattern
  const busyPercent =
    remainingActiveHours > 0
      ? Math.round((busyHours / remainingActiveHours) * 100)
      : 0
  let dayPattern
  if (events.length === 0) {
    dayPattern = "Completely free day"
  } else if (busyPercent <= 20) {
    dayPattern = "Light day with plenty of free time"
  } else if (busyPercent <= 50) {
    dayPattern = "Moderate day with some commitments"
  } else if (busyPercent <= 80) {
    dayPattern = "Busy day with limited flexibility"
  } else {
    dayPattern = "Very packed schedule today"
  }

  return `CALENDAR CONTEXT (${dayName}, ${dateStr}):
- Events today: ${events.length} (${eventsList})
- Remaining free time: ~${freeHours} hours
- Free windows: ${freeWindowsStr}
- Day pattern: ${dayPattern}
- Current time: ${now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
}

/**
 * Find free windows between busy slots
 */
function findFreeWindows(busySlots, dayStart, dayEnd) {
  const windows = []

  // Sort busy slots by start time
  const sorted = [...busySlots].sort(
    (a, b) => new Date(a.start) - new Date(b.start),
  )

  let currentTime = new Date(dayStart)

  for (const slot of sorted) {
    const slotStart = new Date(slot.start)
    const slotEnd = new Date(slot.end)

    // If there's a gap before this slot, it's a free window
    if (slotStart > currentTime) {
      const durationMinutes = (slotStart - currentTime) / 60000
      if (durationMinutes >= 30) {
        // Only count windows of 30+ minutes
        windows.push({
          start: currentTime.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          end: slotStart.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
          duration: formatDuration(durationMinutes),
          durationMinutes,
        })
      }
    }

    // Move current time to end of this busy slot
    if (slotEnd > currentTime) {
      currentTime = slotEnd
    }
  }

  // Check for free time after last slot
  if (currentTime < dayEnd) {
    const durationMinutes = (dayEnd - currentTime) / 60000
    if (durationMinutes >= 30) {
      windows.push({
        start: currentTime.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        end: dayEnd.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
        duration: formatDuration(durationMinutes),
        durationMinutes,
      })
    }
  }

  return windows
}

/**
 * Format duration in minutes to human-readable string
 */
function formatDuration(minutes) {
  if (minutes < 60) {
    return `${Math.round(minutes)}min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
}

/**
 * Get scheduling suggestions for habits based on free time
 */
export async function getSchedulingSuggestions(habits = []) {
  if (!isConnected() || habits.length === 0) {
    return null
  }

  try {
    const now = new Date()
    const endOfDay = new Date(now)
    endOfDay.setHours(23, 59, 59, 999)

    const freeBusy = await getFreeBusy(["primary"], {
      timeMin: now.toISOString(),
      timeMax: endOfDay.toISOString(),
    })

    const busySlots = freeBusy?.primary?.busy || []
    const freeWindows = findFreeWindows(busySlots, now, endOfDay)

    if (freeWindows.length === 0) {
      return {
        summary:
          "Your schedule looks packed today. Consider doing quick habits during breaks.",
        suggestions: [],
      }
    }

    // Match habits to free windows
    const suggestions = []
    const usedWindows = new Set()

    for (const habit of habits) {
      // Estimate habit duration (default 15 min if not specified)
      const habitDuration = habit.duration_minutes || 15

      // Find a suitable window
      for (let i = 0; i < freeWindows.length; i++) {
        if (usedWindows.has(i)) continue

        const window = freeWindows[i]
        if (window.durationMinutes >= habitDuration) {
          suggestions.push({
            habit: habit.name,
            suggestedTime: window.start,
            window: `${window.start} - ${window.end}`,
            reason: `You have ${window.duration} free`,
          })
          usedWindows.add(i)
          break
        }
      }
    }

    // Summary
    const longestWindow = freeWindows.reduce(
      (max, w) => (w.durationMinutes > max.durationMinutes ? w : max),
      freeWindows[0],
    )

    return {
      summary: `Best time for focused work: ${longestWindow.start} (${longestWindow.duration} available)`,
      suggestions,
      freeWindows,
    }
  } catch (error) {
    console.error("Failed to get scheduling suggestions:", error)
    return null
  }
}
