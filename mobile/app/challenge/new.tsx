/**
 * New Challenge Screen
 *
 * Form for creating a new challenge.
 * Uses iOS-style form layout with native inputs.
 */

import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useRouter, Stack } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { useTheme } from "../../contexts/ThemeContext"
import { useChallenges } from "../../hooks/useChallenges"
import { typography, spacing, radius, shadows } from "../../lib/theme"
import { getToday, addDays } from "../../lib/utils"

// Available colors for challenges
const COLORS = [
  "#6366f1", // Indigo
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#14b8a6", // Teal
  "#06b6d4", // Cyan
  "#3b82f6", // Blue
]

// Available icons
const ICONS = [
  { key: "trophy", emoji: "🏆" },
  { key: "fire", emoji: "🔥" },
  { key: "star", emoji: "⭐️" },
  { key: "heart", emoji: "❤️" },
  { key: "book", emoji: "📚" },
  { key: "muscle", emoji: "💪" },
  { key: "running", emoji: "🏃" },
  { key: "meditation", emoji: "🧘" },
  { key: "water", emoji: "💧" },
  { key: "code", emoji: "💻" },
]

export default function NewChallengeScreen() {
  const router = useRouter()
  const { colors } = useTheme()
  const { createChallenge } = useChallenges()

  const [name, setName] = useState("")
  const [duration, setDuration] = useState("30")
  const [selectedColor, setSelectedColor] = useState(COLORS[0])
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0].key)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter a challenge name")
      return
    }

    const durationDays = parseInt(duration, 10) || 30

    setSaving(true)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    const startDate = getToday()
    const endDate = addDays(startDate, durationDays - 1)

    const result = await createChallenge({
      name: name.trim(),
      start_date: startDate,
      end_date: endDate,
      color: selectedColor,
      icon: selectedIcon,
    })

    setSaving(false)

    if (result) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.back()
    } else {
      Alert.alert("Error", "Failed to create challenge")
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "New Challenge",
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerLeft: () => (
            <TouchableOpacity onPress={handleCancel}>
              <Text style={[typography.body, { color: colors.accent }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text
                style={[
                  typography.bodyBold,
                  { color: saving ? colors.textTertiary : colors.accent },
                ]}
              >
                {saving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name Input */}
          <View style={styles.section}>
            <Text
              style={[
                typography.caption1,
                styles.sectionLabel,
                { color: colors.textTertiary },
              ]}
            >
              CHALLENGE NAME
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="e.g., 30-Day Fitness"
              placeholderTextColor={colors.textTertiary}
              autoFocus
              returnKeyType="done"
            />
          </View>

          {/* Duration Input */}
          <View style={styles.section}>
            <Text
              style={[
                typography.caption1,
                styles.sectionLabel,
                { color: colors.textTertiary },
              ]}
            >
              DURATION (DAYS)
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              value={duration}
              onChangeText={setDuration}
              placeholder="30"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
              returnKeyType="done"
            />
          </View>

          {/* Color Picker */}
          <View style={styles.section}>
            <Text
              style={[
                typography.caption1,
                styles.sectionLabel,
                { color: colors.textTertiary },
              ]}
            >
              COLOR
            </Text>
            <View style={styles.colorGrid}>
              {COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorItem,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorItemSelected,
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync()
                    setSelectedColor(color)
                  }}
                >
                  {selectedColor === color && (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Icon Picker */}
          <View style={styles.section}>
            <Text
              style={[
                typography.caption1,
                styles.sectionLabel,
                { color: colors.textTertiary },
              ]}
            >
              ICON
            </Text>
            <View style={styles.iconGrid}>
              {ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon.key}
                  style={[
                    styles.iconItem,
                    {
                      backgroundColor:
                        selectedIcon === icon.key
                          ? colors.accentSoft
                          : colors.surface,
                      borderColor:
                        selectedIcon === icon.key
                          ? colors.accent
                          : colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync()
                    setSelectedIcon(icon.key)
                  }}
                >
                  <Text style={styles.iconEmoji}>{icon.emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  input: {
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    fontSize: 17,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  colorItem: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  colorItemSelected: {
    borderWidth: 3,
    borderColor: "#fff",
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  iconItem: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  iconEmoji: {
    fontSize: 24,
  },
})
