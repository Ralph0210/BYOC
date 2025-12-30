/**
 * DateStrip Component
 *
 * Horizontal scrollable date selector for challenge detail view.
 * Shows week of dates with current day highlighted.
 */

import React, { useRef, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native"
import * as Haptics from "expo-haptics"
import { useTheme } from "../contexts/ThemeContext"
import { typography, spacing, radius } from "../lib/theme"
import { getToday, addDays, formatDate, parseDate, isToday } from "../lib/utils"

const SCREEN_WIDTH = Dimensions.get("window").width
const DATE_ITEM_WIDTH = 48
const DATE_ITEM_MARGIN = 4

interface DateStripProps {
  /** Currently selected date (YYYY-MM-DD) */
  selectedDate: string
  /** Challenge start date */
  startDate: string
  /** Challenge end date */
  endDate: string
  /** Called when a date is selected */
  onSelectDate: (date: string) => void
}

export function DateStrip({
  selectedDate,
  startDate,
  endDate,
  onSelectDate,
}: DateStripProps) {
  const { colors } = useTheme()
  const scrollViewRef = useRef<ScrollView>(null)

  // Generate array of dates from start to end
  const dates: string[] = []
  let current = startDate
  while (current <= endDate) {
    dates.push(current)
    current = addDays(current, 1)
  }

  // Scroll to selected date on mount and when it changes
  useEffect(() => {
    const index = dates.indexOf(selectedDate)
    if (index >= 0 && scrollViewRef.current) {
      const scrollX = Math.max(
        0,
        index * (DATE_ITEM_WIDTH + DATE_ITEM_MARGIN * 2) -
          SCREEN_WIDTH / 2 +
          DATE_ITEM_WIDTH / 2
      )
      scrollViewRef.current.scrollTo({ x: scrollX, animated: true })
    }
  }, [selectedDate, dates])

  const handleDatePress = async (date: string) => {
    await Haptics.selectionAsync()
    onSelectDate(date)
  }

  const renderDateItem = (dateStr: string) => {
    const date = parseDate(dateStr)
    const dayName = date
      .toLocaleDateString("en-US", { weekday: "short" })
      .charAt(0)
    const dayNumber = date.getDate()
    const isSelected = dateStr === selectedDate
    const isTodayDate = isToday(dateStr)

    return (
      <TouchableOpacity
        key={dateStr}
        style={[
          styles.dateItem,
          {
            backgroundColor: isSelected ? colors.accent : "transparent",
            borderColor:
              isTodayDate && !isSelected ? colors.accent : "transparent",
          },
        ]}
        onPress={() => handleDatePress(dateStr)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            typography.caption2,
            {
              color: isSelected
                ? "#fff"
                : isTodayDate
                  ? colors.accent
                  : colors.textTertiary,
            },
          ]}
        >
          {dayName}
        </Text>
        <Text
          style={[
            typography.headline,
            {
              color: isSelected
                ? "#fff"
                : isTodayDate
                  ? colors.accent
                  : colors.textPrimary,
            },
          ]}
        >
          {dayNumber}
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {dates.map(renderDateItem)}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 72,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    alignItems: "center",
  },
  dateItem: {
    width: DATE_ITEM_WIDTH,
    height: 56,
    marginHorizontal: DATE_ITEM_MARGIN,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
})
