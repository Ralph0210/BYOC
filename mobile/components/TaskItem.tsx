import React from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Animated,
} from "react-native"
import Swipeable from "react-native-gesture-handler/Swipeable"
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { useTheme } from "../contexts/ThemeContext"
import { typography, spacing } from "../lib/theme"
import { TaskDB } from "../hooks/useTasks"
import { TaskAmbientNote } from "./ai/TaskAmbientNote"
import { ICON_MAP } from "../lib/constants"

interface TaskItemProps {
  task: TaskDB
  /** Whether the task is completed for the current date */
  isCompleted: boolean
  /** Called when checkbox is toggled */
  onToggle: () => void
  /** Called when task is pressed (for editing) */
  onPress?: () => void
  /** Called when task is swiped to delete */
  onDelete?: () => void
  /** Last date completion was recorded (for AI logic) */
  lastCompletedDate?: string | null
}

export function TaskItem({
  task,
  isCompleted,
  onToggle,
  onPress,
  onDelete,
  lastCompletedDate,
}: TaskItemProps) {
  const { colors } = useTheme()

  const handleToggle = async () => {
    // Trigger haptic feedback
    await Haptics.impactAsync(
      isCompleted
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium
    )
    onToggle()
  }

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0],
      extrapolate: "clamp",
    })

    return (
      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash-outline" size={24} color="#FFF" />
        </Animated.View>
      </TouchableOpacity>
    )
  }

  // Helper to get icon name
  const iconName = (ICON_MAP[task.icon] || "ellipse-outline") as any

  const content = (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? colors.surfaceHover : colors.surface,
          borderBottomColor: colors.border,
        },
      ]}
      onPress={onPress}
    >
      {/* Left: Icon Box (Premium Look) */}
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: task.color + "20", // 12% opacity roughly matches web's 15%
          },
        ]}
      >
        <Ionicons name={iconName} size={24} color={task.color} />
      </View>

      {/* Middle: Task Info */}
      <View style={styles.contentContainer}>
        <Text
          style={[
            typography.body,
            styles.taskName,
            {
              color: isCompleted ? colors.textTertiary : colors.textPrimary,
              textDecorationLine: isCompleted ? "line-through" : "none",
            },
          ]}
          numberOfLines={1}
        >
          {task.name}
        </Text>
        {task.description ? (
          <Text
            style={[
              typography.caption1,
              { color: colors.textTertiary, marginTop: 2 },
            ]}
            numberOfLines={1}
          >
            {task.description}
          </Text>
        ) : null}

        {/* AI Ambient Note */}
        {!isCompleted && (
          <View style={{ marginTop: 4 }}>
            <TaskAmbientNote
              task={task}
              lastCompletedDate={lastCompletedDate || null}
            />
          </View>
        )}
      </View>

      {/* Right: Checkbox (Circle) */}
      <TouchableOpacity
        style={[
          styles.checkbox,
          {
            borderColor: isCompleted ? "transparent" : colors.border,
            backgroundColor: isCompleted ? colors.success : "transparent",
            borderWidth: isCompleted ? 0 : 2,
          },
        ]}
        onPress={handleToggle}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        {isCompleted && <Ionicons name="checkmark" size={16} color="#fff" />}
      </TouchableOpacity>
    </Pressable>
  )

  if (!onDelete) return content

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
    >
      {content}
    </Swipeable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md, // Match web p-4
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md, // Match web gap-4
  },
  iconBox: {
    width: 48, // Web w-12
    height: 48,
    borderRadius: 16, // Web rounded-2xl
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  taskName: {
    marginBottom: 0,
  },
  checkbox: {
    width: 32, // Web w-8
    height: 32,
    borderRadius: 16, // Rounded full
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
  chevron: {
    marginLeft: spacing.sm,
  },
})
