import React from "react"
import { View, Text, StyleSheet, TouchableOpacity } from "react-native"
import { useTheme } from "../../contexts/ThemeContext"
import { typography, spacing, radius } from "../../lib/theme"
import { FREQUENCY_TYPES, DAYS_OF_WEEK } from "../../lib/constants"
import { Ionicons } from "@expo/vector-icons"

interface FrequencySelectorProps {
  type: string
  count: number
  days: number[]
  onChange: (field: string, value: any) => void
}

export function FrequencySelector({
  type,
  count,
  days,
  onChange,
}: FrequencySelectorProps) {
  const { colors } = useTheme()

  const handleTypeChange = (newType: string) => {
    onChange("frequency_type", newType)
    // Reset count to 1 when switching to weekly
    if (newType === FREQUENCY_TYPES.WEEKLY) {
      onChange("frequency_count", 1)
    }
  }

  const handleDayToggle = (dayValue: number) => {
    const newDays = days.includes(dayValue)
      ? days.filter((d) => d !== dayValue)
      : [...days, dayValue]
    onChange("frequency_days", newDays)
  }

  const handleIncrement = () => {
    onChange("frequency_count", Math.min(10, count + 1))
  }

  const handleDecrement = () => {
    onChange("frequency_count", Math.max(1, count - 1))
  }

  return (
    <View style={styles.container}>
      {/* Type Tabs */}
      <View style={[styles.tabs, { backgroundColor: colors.surface }]}>
        {[
          { value: FREQUENCY_TYPES.DAILY, label: "Daily" },
          { value: FREQUENCY_TYPES.WEEKLY, label: "Weekly" },
          { value: FREQUENCY_TYPES.SPECIFIC_DAYS, label: "Specific" },
        ].map((option) => {
          const isSelected = type === option.value
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.tab,
                isSelected && {
                  backgroundColor: colors.background,
                  shadowColor: "#000",
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  shadowOffset: { width: 0, height: 1 },
                },
              ]}
              onPress={() => handleTypeChange(option.value)}
            >
              <Text
                style={[
                  typography.caption1,
                  {
                    fontWeight: "600",
                    color: isSelected ? colors.accent : colors.textSecondary,
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Count Selector */}
      {type !== FREQUENCY_TYPES.SPECIFIC_DAYS && (
        <View style={styles.section}>
          <Text
            style={[typography.subheadline, { color: colors.textSecondary }]}
          >
            {type === FREQUENCY_TYPES.DAILY
              ? "Times per day:"
              : "Times per week:"}
          </Text>
          <View style={styles.counter}>
            <TouchableOpacity
              onPress={handleDecrement}
              style={[styles.countBtn, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="remove" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text
              style={[
                typography.bodyBold,
                { color: colors.textPrimary, width: 30, textAlign: "center" },
              ]}
            >
              {count}
            </Text>
            <TouchableOpacity
              onPress={handleIncrement}
              style={[styles.countBtn, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="add" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Day Pills */}
      {(type === FREQUENCY_TYPES.SPECIFIC_DAYS ||
        type === FREQUENCY_TYPES.WEEKLY) && (
        <View style={styles.daysContainer}>
          {DAYS_OF_WEEK.map((day) => {
            const isSelected = days.includes(day.value)
            return (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayPill,
                  {
                    backgroundColor: isSelected
                      ? colors.accent
                      : colors.surface,
                    borderColor: isSelected ? colors.accent : colors.border,
                  },
                ]}
                onPress={() => handleDayToggle(day.value)}
              >
                <Text
                  style={[
                    typography.caption2,
                    {
                      color: isSelected ? "#FFF" : colors.textSecondary,
                      fontWeight: "600",
                    },
                  ]}
                >
                  {day.short}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      )}

      {/* Helper Text */}
      <Text
        style={[
          typography.caption1,
          { color: colors.textTertiary, marginTop: spacing.sm },
        ]}
      >
        {type === FREQUENCY_TYPES.DAILY &&
          count === 1 &&
          "Complete once every day"}
        {type === FREQUENCY_TYPES.DAILY &&
          count > 1 &&
          `Complete ${count} times every day`}
        {type === FREQUENCY_TYPES.WEEKLY &&
          "Complete on selected days each week"}
        {type === FREQUENCY_TYPES.SPECIFIC_DAYS &&
          "Only appears on selected days"}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  tabs: {
    flexDirection: "row",
    padding: 4,
    borderRadius: radius.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  section: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  countBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dayPill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
})
