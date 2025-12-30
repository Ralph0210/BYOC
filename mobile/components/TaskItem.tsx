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
import { typography, spacing, radius } from "../lib/theme"
import { TaskDB } from "../hooks/useTasks"
import { TaskAmbientNote } from "./ai/TaskAmbientNote"

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
      {/* Checkbox */}
      <TouchableOpacity
        style={[
          styles.checkbox,
          {
            borderColor: isCompleted ? colors.success : colors.border,
            backgroundColor: isCompleted ? colors.success : "transparent",
          },
        ]}
        onPress={handleToggle}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        {isCompleted && <Ionicons name="checkmark" size={14} color="#fff" />}
      </TouchableOpacity>

      {/* Task Info */}
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
          numberOfLines={2}
        >
          {task.name}
        </Text>

        {/* AI Ambient Note */}
        {!isCompleted && (
          <TaskAmbientNote
            task={task}
            lastCompletedDate={lastCompletedDate || null}
          />
        )}
      </View>

      {/* Chevron */}
      {onPress && (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textTertiary}
          style={styles.chevron}
        />
      )}
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
    alignItems: "center", // Align items to center vertically
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    backgroundColor: "#fff", // Ensure background is set for swipeable
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
  },
  taskName: {
    marginBottom: 0,
  },
  chevron: {
    marginLeft: spacing.sm,
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: "100%",
  },
})
