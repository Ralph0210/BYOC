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
    <div className="relative">
      <div className="overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex gap-1 mb-2 ml-8">
            {weeks.map((_, weekIndex) => {
              const monthLabel = months.find((m) => m.weekIndex === weekIndex)
              return (
                <div
                  key={weekIndex}
                  className="w-8 text-center flex-shrink-0 snap-start"
                >
                  {monthLabel && (
                    <span className="text-xs font-medium text-secondary sticky left-0">
                      {monthLabel.label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Grid with day labels */}
          <div className="flex">
            {/* Day labels (sticky) */}
            <div className="flex flex-col gap-1 mr-2 sticky left-0 z-10 bg-surface dark:bg-gray-800 pr-2">
              {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                <div
                  key={i}
                  className="w-4 h-8 flex items-center justify-center text-[10px] font-medium text-tertiary"
                >
                  {i % 2 === 0 ? day : ""}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="flex gap-1">
              {weeks.map((week, weekIndex) => (
                <div
                  key={weekIndex}
                  className="flex flex-col gap-1 flex-shrink-0 snap-start"
                >
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
                          day.inRange &&
                          !day.isFuture &&
                          onDateClick?.(day.date)
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

      {/* Scroll hint gradient (optional, but helps on mobile) */}
      <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-surface via-surface/50 to-transparent pointer-events-none md:hidden dark:from-gray-800 dark:via-gray-800/50" />
    </div>
  )
}
