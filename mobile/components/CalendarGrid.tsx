import React, { useMemo } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native"
import {
  getToday,
  addDays,
  getDayOfWeek,
  formatDate,
  parseDate,
  getStartOfWeek,
} from "../lib/utils"
import { spacing } from "../lib/theme"

interface CalendarGridProps {
  tasks: any[]
  completions: any[]
  snoozes?: any[]
  startDate?: string
  endDate?: string
  selectedDate: string
  onDateClick: (date: string) => void
  weeksToShow?: number
}

// Simple Calendar Grid / Heatmap for Mobile
export function CalendarGrid({
  tasks,
  completions,
  snoozes = [],
  startDate,
  endDate,
  selectedDate,
  onDateClick,
  weeksToShow = 12,
}: CalendarGridProps) {
  const today = getToday()

  const weeks = useMemo(() => {
    // Basic logic to generate 2D array of days [Week][Day]
    // Adapted from web version but simplified
    const weeksArr = []
    const actualWeeksToShow = weeksToShow

    // Start date logic: show current week and previous N weeks
    // Or if startDate provided, align to that.

    let endTrackingDate = today
    if (endDate && endDate < today) endTrackingDate = endDate

    // Start of the week containing endTrackingDate is the END of our grid
    // End of week is (Start of Week) + 6 days
    const endOfWeekDate = addDays(
      formatDate(getStartOfWeek(parseDate(endTrackingDate))),
      6
    )

    // Start of grid is N weeks back from endOfWeek
    // gridStart = endOfWeek - (N weeks * 7 days) + 1 day?
    // Simplified: Calculate start date based on weeksToShow
    // (WeeksToShow - 1) * 7 days before the start of the current week

    const currentWeekStart = getStartOfWeek(parseDate(endTrackingDate))
    const gridStartDate = new Date(currentWeekStart)
    gridStartDate.setDate(gridStartDate.getDate() - (actualWeeksToShow - 1) * 7)

    let currentDayStr = formatDate(gridStartDate)

    for (let w = 0; w < actualWeeksToShow; w++) {
      const week = []
      for (let d = 0; d < 7; d++) {
        // currentDayStr is already YYYY-MM-DD
        const dateStr = currentDayStr
        const isToday = dateStr === today
        const isFuture = dateStr > today

        // Check if date is within challenge bounds
        const inRange =
          (!startDate || dateStr >= startDate) &&
          (!endDate || dateStr <= endDate)

        week.push({
          date: dateStr,
          dayOfWeek: getDayOfWeek(dateStr),
          isToday,
          isFuture,
          inRange,
        })
        currentDayStr = addDays(currentDayStr, 1)
      }
      weeksArr.push(week)
    }
    return weeksArr
  }, [startDate, endDate, weeksToShow, today])

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.grid}>
          {/* Days Header (M T W...) */}
          <View style={styles.daysHeaderColumn}>
            {["M", "", "W", "", "F", "", "S"].map((d, i) => (
              <Text key={i} style={styles.dayLabel}>
                {d}
              </Text>
            ))}
          </View>

          {/* Weeks Columns */}
          {weeks.map((week, wIndex) => (
            <View key={wIndex} style={styles.weekColumn}>
              {week.map((day, dIndex) => {
                // Determine color based on completions
                const completionsForDay = completions.filter(
                  (c: { date: string }) => c.date === day.date
                ).length
                // Simple heatmap: 0 = gray, 1+ = green (varying opacity)

                let backgroundColor = "#f3f4f6" // default gray-100
                if (day.inRange && !day.isFuture) {
                  if (completionsForDay > 0) {
                    // Simple intensity
                    const intensity = Math.min(completionsForDay * 0.3, 1) // Cap at 1
                    backgroundColor = `rgba(34, 197, 94, ${0.2 + intensity * 0.8})` // green-500 base
                  } else if (day.date === selectedDate) {
                    backgroundColor = "#e5e7eb" // gray-200 mainly for selection
                  }
                }

                const isSelected = day.date === selectedDate

                return (
                  <TouchableOpacity
                    key={day.date}
                    style={[
                      styles.cell,
                      { backgroundColor },
                      isSelected && styles.selectedCell,
                      !day.inRange && styles.outOfRangeCell,
                    ]}
                    onPress={() =>
                      day.inRange && !day.isFuture && onDateClick(day.date)
                    }
                    activeOpacity={0.7}
                  />
                )
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 140, // Fixed height for 7 rows
  },
  scrollContent: {
    paddingHorizontal: spacing.sm,
  },
  grid: {
    flexDirection: "row",
  },
  daysHeaderColumn: {
    flexDirection: "column",
    justifyContent: "space-between",
    marginRight: spacing.xs,
    paddingVertical: 2,
    height: 100, // alignment
  },
  dayLabel: {
    fontSize: 10,
    color: "#9ca3af",
    height: 12, // match cell height approx
    textAlign: "center",
  },
  weekColumn: {
    flexDirection: "column",
    gap: 3, // Gap between days
    marginRight: 3, // Gap between weeks
  },
  cell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  selectedCell: {
    borderWidth: 1,
    borderColor: "#000",
  },
  outOfRangeCell: {
    opacity: 0.3,
  },
})
