import { useMemo } from "react"
import { CalendarCell } from "./CalendarCell"
import {
  getStartOfWeek,
  addDays,
  formatDate,
  getToday,
  getDayOfWeek,
  parseDate,
} from "../../lib/utils"

export function CalendarGrid({
  tasks,
  completions,
  startDate,
  endDate,
  selectedDate,
  onDateClick,
  weeksToShow = 12,
}) {
  const today = getToday()

  // Generate weeks data
  const weeks = useMemo(() => {
    const weeks = []

    // Start from the beginning of the week containing startDate
    let weekStart = startDate
      ? getStartOfWeek(parseDate(startDate))
      : getStartOfWeek(addDays(getToday(), -7 * (weeksToShow - 1)))

    for (let w = 0; w < weeksToShow; w++) {
      const week = []
      for (let d = 0; d < 7; d++) {
        const date = addDays(weekStart, d)
        const dateStr = formatDate(date)

        // Only include dates within the challenge period
        const inRange =
          (!startDate || dateStr >= startDate) &&
          (!endDate || dateStr <= endDate)

        week.push({
          date: dateStr,
          dayOfWeek: getDayOfWeek(date),
          isToday: dateStr === today,
          isFuture: dateStr > today,
          inRange,
        })
      }
      weeks.push(week)
      weekStart = addDays(weekStart, 7)
    }

    return weeks
  }, [startDate, endDate, weeksToShow, today])

  // Calculate completions per date
  const completionsByDate = useMemo(() => {
    const map = {}
    completions.forEach((c) => {
      if (!map[c.date]) map[c.date] = []
      map[c.date].push(c)
    })
    return map
  }, [completions])

  // Get unique colors from tasks
  const taskColors = useMemo(() => {
    const colorMap = {}
    tasks.forEach((t) => {
      colorMap[t.id] = t.color
    })
    return colorMap
  }, [tasks])

  // Get month labels
  const months = useMemo(() => {
    const monthLabels = []
    let lastMonth = null

    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = week[0]
      const date = new Date(firstDayOfWeek.date)
      const month = date.getMonth()

      if (month !== lastMonth) {
        monthLabels.push({
          weekIndex,
          label: date.toLocaleDateString("en-US", { month: "short" }),
        })
        lastMonth = month
      }
    })

    return monthLabels
  }, [weeks])

  return (
    <div className="overflow-x-auto pb-2">
      <div className="inline-block min-w-full">
        {/* Month labels */}
        <div className="flex gap-1 mb-1 ml-8">
          {weeks.map((_, weekIndex) => {
            const monthLabel = months.find((m) => m.weekIndex === weekIndex)
            return (
              <div key={weekIndex} className="w-8 text-center">
                {monthLabel && (
                  <span className="text-xs text-tertiary">
                    {monthLabel.label}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Grid with day labels */}
        <div className="flex">
          {/* Day labels */}
          <div className="flex flex-col gap-1 mr-2">
            {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
              <div
                key={i}
                className="w-6 h-8 flex items-center justify-center text-xs text-tertiary"
              >
                {i % 2 === 0 ? day : ""}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="flex gap-1">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => {
                  // Get completions for this day
                  const dayCompletions = completionsByDate[day.date] || []
                  const completedTaskIds = [
                    ...new Set(dayCompletions.map((c) => c.task_id)),
                  ]
                  const colors = completedTaskIds
                    .map((id) => taskColors[id])
                    .filter(Boolean)

                  return (
                    <CalendarCell
                      key={day.date}
                      date={day.date}
                      colors={colors}
                      totalTasks={tasks.length}
                      isToday={day.isToday}
                      isSelected={day.date === selectedDate}
                      isFuture={day.isFuture}
                      inRange={day.inRange}
                      onClick={() =>
                        day.inRange && !day.isFuture && onDateClick?.(day.date)
                      }
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
