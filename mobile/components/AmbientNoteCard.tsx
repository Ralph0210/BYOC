/**
 * AmbientNoteCard Component
 *
 * Displays AI-generated insights for challenges.
 * Shows a subtle card with sparkle icon and AI message.
 */

import React from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../contexts/ThemeContext"
import { typography, spacing, radius } from "../lib/theme"

interface AmbientNoteCardProps {
  /** The AI-generated note text */
  note: string | null
  /** Loading state */
  loading?: boolean
  /** Called when card is tapped */
  onPress?: () => void
  /** Companion name for personalization */
  companionName?: string
  /** Variant style */
  variant?: "inline" | "card"
}

export function AmbientNoteCard({
  note,
  loading = false,
  onPress,
  companionName = "AI Companion",
  variant = "card",
}: AmbientNoteCardProps) {
  const { colors } = useTheme()

  // Don't render if no note and not loading
  if (!note && !loading) return null

  if (variant === "inline") {
    return (
      <TouchableOpacity
        style={styles.inlineContainer}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
      >
        <Ionicons
          name="sparkles"
          size={12}
          color={colors.aiPrimary}
          style={loading && styles.pulsing}
        />
        {loading && !note ? (
          <Text
            style={[
              typography.caption1,
              { color: colors.textTertiary, fontStyle: "italic" },
            ]}
          >
            Thinking...
          </Text>
        ) : (
          <Text
            style={[
              typography.caption1,
              { color: colors.textSecondary, fontStyle: "italic", flex: 1 },
              loading && { opacity: 0.6 },
            ]}
            numberOfLines={2}
          >
            {note}
          </Text>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      style={[
        styles.cardContainer,
        {
          backgroundColor: colors.aiSurface,
          borderColor: colors.aiPrimary,
        },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      disabled={!onPress}
    >
      <View style={styles.cardHeader}>
        <View
          style={[styles.iconContainer, { backgroundColor: colors.aiGlow }]}
        >
          <Ionicons name="sparkles" size={16} color={colors.aiPrimary} />
        </View>
        <Text style={[typography.subheadlineBold, { color: colors.aiPrimary }]}>
          {companionName}
        </Text>
        {loading && (
          <ActivityIndicator
            size="small"
            color={colors.aiPrimary}
            style={styles.loader}
          />
        )}
      </View>

      {loading && !note ? (
        <Text
          style={[
            typography.body,
            { color: colors.textTertiary, fontStyle: "italic" },
          ]}
        >
          Thinking...
        </Text>
      ) : (
        <Text
          style={[
            typography.body,
            { color: colors.textSecondary, lineHeight: 22 },
            loading && { opacity: 0.6 },
          ]}
        >
          {note}
        </Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  inlineContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  pulsing: {
    opacity: 0.7,
  },
  cardContainer: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderLeftWidth: 3,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  loader: {
    marginLeft: "auto",
  },
})
