import React, { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native"
import { Stack, useRouter, useLocalSearchParams } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../../contexts/ThemeContext"
import { typography, spacing, radius } from "../../lib/theme"
import {
  TASK_COLORS,
  TASK_ICONS,
  ICON_MAP,
  FREQUENCY_TYPES,
} from "../../lib/constants"
import { useTasks } from "../../hooks/useTasks"
import { FrequencySelector } from "../../components/task/FrequencySelector"

export default function NewTaskScreen() {
  const router = useRouter()
  const { challengeId } = useLocalSearchParams<{ challengeId: string }>()
  const { colors } = useTheme()
  const { createTask } = useTasks()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [selectedIcon, setSelectedIcon] = useState("circle")
  const [selectedColor, setSelectedColor] = useState(TASK_COLORS[0].value)
  const [frequency, setFrequency] = useState({
    type: FREQUENCY_TYPES.DAILY,
    count: 1,
    days: [] as number[],
  })
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter a task name")
      return
    }
    if (!challengeId) {
      Alert.alert("Error", "No challenge selected")
      return
    }

    setLoading(true)
    try {
      const taskData = {
        challenge_id: challengeId,
        name: name.trim(),
        description: description.trim(),
        icon: selectedIcon,
        color: selectedColor,
        frequency_type: frequency.type,
        frequency_count: frequency.count,
        frequency_days: frequency.days,
        is_completed: false, // Default
      }

      const result = await createTask(taskData)
      if (result) {
        router.back()
      } else {
        Alert.alert("Error", "Failed to create task")
      }
    } catch (error) {
      console.error(error)
      Alert.alert("Error", "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleFrequencyChange = (field: string, value: any) => {
    setFrequency((prev) => {
      // Direct mapping field names to state keys locally if needed,
      // but here we just map: frequency_type -> type, etc.
      if (field === "frequency_type") return { ...prev, type: value }
      if (field === "frequency_count") return { ...prev, count: value }
      if (field === "frequency_days") return { ...prev, days: value }
      return prev
    })
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "New Task",
          headerBackTitle: "Cancel",
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={loading}>
              <Text
                style={[
                  typography.bodyBold,
                  { color: loading ? colors.textTertiary : colors.accent },
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={[styles.container, { backgroundColor: colors.background }]}
        keyboardVerticalOffset={100}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Name & Description */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <TextInput
              style={[
                typography.title3,
                styles.input,
                { color: colors.textPrimary, borderBottomColor: colors.border },
              ]}
              placeholder="Task Name"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={[
                typography.body,
                styles.input,
                {
                  color: colors.textSecondary,
                  marginTop: spacing.sm,
                  minHeight: 60,
                },
              ]}
              placeholder="Description (optional)"
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          {/* Color Picker */}
          <View style={styles.sectionHeader}>
            <Text
              style={[typography.subheadline, { color: colors.textSecondary }]}
            >
              Color
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {TASK_COLORS.map((color) => (
              <TouchableOpacity
                key={color.value}
                onPress={() => setSelectedColor(color.value)}
                style={[
                  styles.colorCircle,
                  { backgroundColor: color.value },
                  selectedColor === color.value && styles.selectedRing,
                ]}
              />
            ))}
          </ScrollView>

          {/* Icon Picker */}
          <View style={styles.sectionHeader}>
            <Text
              style={[typography.subheadline, { color: colors.textSecondary }]}
            >
              Icon
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {TASK_ICONS.map((iconName) => {
              const ionicName = ICON_MAP[iconName] as any
              const isSelected = selectedIcon === iconName
              return (
                <TouchableOpacity
                  key={iconName}
                  onPress={() => setSelectedIcon(iconName)}
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isSelected
                        ? colors.accent
                        : colors.surface,
                    },
                  ]}
                >
                  <Ionicons
                    name={ionicName}
                    size={24}
                    color={isSelected ? "#FFF" : colors.textSecondary}
                  />
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          {/* Frequency */}
          <View style={styles.sectionHeader}>
            <Text
              style={[typography.subheadline, { color: colors.textSecondary }]}
            >
              Frequency
            </Text>
          </View>
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <FrequencySelector
              type={frequency.type}
              count={frequency.count}
              days={frequency.days}
              onChange={handleFrequencyChange}
            />
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.massive,
  },
  section: {
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
  },
  input: {
    paddingVertical: spacing.sm,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  horizontalScroll: {
    paddingHorizontal: spacing.xs,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedRing: {
    borderWidth: 3,
    borderColor: "rgba(0,0,0,0.2)", // Subtle outer ring or simpler indicator
    transform: [{ scale: 1.1 }],
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
})
