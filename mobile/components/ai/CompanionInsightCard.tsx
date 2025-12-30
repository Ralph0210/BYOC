import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAIConfig } from "../../hooks/useAIConfig"
import { useAmbientNotes } from "../../hooks/useAmbientNotes"
import { useAuth } from "../../components/auth/AuthProvider"
import { typography, spacing, radius, shadows } from "../../lib/theme"
import { getToday, daysDiff } from "../../lib/utils"
// import { calculateChallengeStats } from "../../lib/stats" // Ensure this is exported and correct

// Temporary duplicate of calculateChallengeStats if import fails or differs
// Ideally, import it from "../../lib/stats"
import { calculateChallengeStats } from "../../lib/stats"

interface CompanionInsightCardProps {
  challenge: any
  tasks: any[]
  completions: any[]
  onChat?: () => void
  embedded?: boolean
}

export function CompanionInsightCard({
  challenge,
  tasks,
  completions,
  onChat,
  embedded = false,
}: CompanionInsightCardProps) {
  const { config } = useAIConfig()
  const { user } = useAuth()
  const today = getToday()

  const isInnerSelf = config?.personality_preset === "inner_self"

  // Calculate Progress
  const calculateProgress = () => {
    if (!challenge || !tasks) return 0
    const stats = calculateChallengeStats(challenge, tasks, completions || [])
    return stats.overall
  }

  // Calculate Trend
  const calculateTrend = () => {
    if (!completions?.length) return "neutral"

    const todayDate = new Date()
    const formatDate = (d: Date) => d.toISOString().split("T")[0]

    const last3Days = [0, 1, 2].map((i) => {
      const d = new Date()
      d.setDate(todayDate.getDate() - i)
      return formatDate(d)
    })

    const prev3Days = [3, 4, 5].map((i) => {
      const d = new Date()
      d.setDate(todayDate.getDate() - i)
      return formatDate(d)
    })

    const last3Count = completions.filter((c) =>
      last3Days.includes(c.date)
    ).length

    const prev3Count = completions.filter((c) =>
      prev3Days.includes(c.date)
    ).length

    if (last3Count > prev3Count) return "improving"
    if (last3Count < prev3Count) return "declining"
    return "stable"
  }

  const contextData = challenge
    ? {
        challengeId: challenge.id,
        challengeName: challenge.name,
        daysElapsed: daysDiff(challenge.start_date, today) + 1,
        totalDays: daysDiff(challenge.start_date, challenge.end_date) + 1,
        progress: calculateProgress(),
        completionsCount: completions?.length || 0,
        trend: calculateTrend(),
      }
    : null

  const { note, loading } = useAmbientNotes("insight", contextData)

  const userName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Me"
  const userPhoto =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  const displayName = isInnerSelf
    ? userName
    : config?.companion_name || "Companion"
  const displayPhoto = isInnerSelf ? userPhoto : config?.companion_photo_url

  if (!config?.api_key || !challenge) return null

  // Embedded View (Dashboard Header)
  if (embedded) {
    if (!note && !loading) return null

    return (
      <View style={styles.embeddedContainer}>
        <View style={styles.avatarRow}>
          {displayPhoto ? (
            <Image source={{ uri: displayPhoto }} style={styles.avatarSmall} />
          ) : (
            <View style={[styles.avatarPlaceholder, styles.avatarSmall]}>
              <Ionicons
                name={isInnerSelf ? "person" : "sparkles"}
                size={12}
                color="white"
              />
            </View>
          )}
          <Text style={styles.embeddedName}>
            {isInnerSelf ? `${displayName}'s Inner Voice` : displayName}
          </Text>
        </View>

        {loading ? (
          <Text
            style={[styles.embeddedText, { fontStyle: "italic", opacity: 0.7 }]}
          >
            Thinking...
          </Text>
        ) : (
          <Text style={styles.embeddedText}>{note}</Text>
        )}
      </View>
    )
  }

  // Full Card View (Home Screen)
  if (!note && !loading) return null

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {displayPhoto ? (
            <Image source={{ uri: displayPhoto }} style={styles.avatarMedium} />
          ) : (
            <View style={[styles.avatarPlaceholder, styles.avatarMedium]}>
              <Ionicons
                name={isInnerSelf ? "person" : "sparkles"}
                size={20}
                color="white"
              />
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <Text style={styles.name}>
            {isInnerSelf ? `${displayName}'s Inner Voice` : displayName}
          </Text>

          {loading ? (
            <Text style={styles.loadingText}>Thinking...</Text>
          ) : (
            <Text style={styles.noteText}>{note}</Text>
          )}

          {/* Chat Action */}
          {!loading && note && onChat && (
            <TouchableOpacity onPress={onChat} style={styles.chatButton}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={14}
                color="#6b7280"
              />
              <Text style={styles.chatButtonText}>Chat</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(139, 92, 246, 0.03)", // very subtle violet tint
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.1)",
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatarContainer: {
    marginRight: spacing.sm,
  },
  avatarMedium: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  avatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.2)",
  },
  avatarPlaceholder: {
    backgroundColor: "#8b5cf6",
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8b5cf6", // primary color
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4b5563", // gray-600
  },
  loadingText: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#9ca3af",
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.sm,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  chatButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
  },

  // Embedded styles (for dashboard header)
  embeddedContainer: {
    marginBottom: 12,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  embeddedName: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  embeddedText: {
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.8)",
  },
})
