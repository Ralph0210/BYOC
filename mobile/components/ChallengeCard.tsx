/**
 * ChallengeCard Component
 *
 * Displays a challenge with progress ring, title, and task count.
 * Used in the Home screen challenge list.
 */

import React from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from "react-native"
import { useTheme } from "../contexts/ThemeContext"
import { ProgressRing } from "./ProgressRing"
import { typography, spacing, radius, shadows } from "../lib/theme"
import { ChallengeDB } from "../hooks/useChallenges"
import { getChallengeDay, getChallengeTotalDays, getToday } from "../lib/utils"

// Emoji mapping for challenge icons
const ICON_MAP: Record<string, string> = {
  trophy: "🏆",
  fire: "🔥",
  star: "⭐️",
  heart: "❤️",
  book: "📚",
  muscle: "💪",
  running: "🏃",
  meditation: "🧘",
  water: "💧",
  sleep: "😴",
  code: "💻",
  money: "💰",
  plant: "🌱",
  music: "🎵",
  art: "🎨",
}

interface ChallengeCardProps {
  challenge: ChallengeDB
  /** Number of tasks active today */
  taskCount: number
  /** Completion percentage 0-100 */
  completionPercent: number
  /** Called when card is pressed */
  onPress?: () => void
  /** Additional styles */
  style?: ViewStyle
}

export function ChallengeCard({
  challenge,
  taskCount,
  completionPercent,
  onPress,
  style,
}: ChallengeCardProps) {
  const { colors } = useTheme()

  const today = getToday()
  const currentDay = getChallengeDay(challenge, today)
  const totalDays = getChallengeTotalDays(challenge)

  // Get emoji icon
  const icon = ICON_MAP[challenge.icon] || ICON_MAP["trophy"]

  // Determine if challenge is complete for today
  const isCompleteToday = completionPercent === 100

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        shadows.card,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        {/* Icon */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: challenge.color
                ? `${challenge.color}20`
                : colors.accentSoft,
            },
          ]}
        >
          <Text style={styles.icon}>{icon}</Text>
        </View>

        {/* Text Content */}
        <View style={styles.textContent}>
          <Text
            style={[typography.headline, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {challenge.name}
          </Text>
          <Text
            style={[typography.subheadline, { color: colors.textSecondary }]}
          >
            Day {currentDay} of {totalDays} • {taskCount} task
            {taskCount !== 1 ? "s" : ""} today
          </Text>
        </View>

        {/* Progress Ring */}
        <ProgressRing
          progress={completionPercent}
          size={48}
          strokeWidth={4}
          showPercent
          color={isCompleteToday ? colors.success : undefined}
        />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 24,
  },
  textContent: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.md,
  },
})
