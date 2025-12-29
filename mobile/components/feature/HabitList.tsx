import { View, Text, Pressable, Dimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from "react-native-reanimated"
import { Gesture, GestureDetector } from "react-native-gesture-handler"

const SCREEN_WIDTH = Dimensions.get("window").width
const SWIPE_THRESHOLD = 80

interface Task {
  id: string
  title: string
  completed: boolean
  color?: string
}

interface HabitItemProps {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

function HabitItem({ task, onToggle, onDelete }: HabitItemProps) {
  const translateX = useSharedValue(0)

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }

  const handleDelete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    onDelete(task.id)
  }

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onToggle(task.id)
  }

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Only allow left swipe (negative values)
      translateX.value = Math.min(
        0,
        Math.max(-SWIPE_THRESHOLD * 1.5, event.translationX)
      )
    })
    .onEnd((event) => {
      if (event.translationX < -SWIPE_THRESHOLD) {
        runOnJS(handleDelete)()
        translateX.value = withSpring(-SCREEN_WIDTH)
      } else {
        translateX.value = withSpring(0)
      }
    })

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  const deleteBackgroundStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.abs(translateX.value) / SWIPE_THRESHOLD),
  }))

  return (
    <View className="relative mb-2">
      {/* Delete Background */}
      <Animated.View
        style={deleteBackgroundStyle}
        className="absolute inset-0 bg-red-500 rounded-2xl items-end justify-center pr-6"
      >
        <Ionicons name="trash" size={24} color="white" />
      </Animated.View>

      {/* Main Item */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>
          <Pressable
            onPress={handleToggle}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center border border-gray-100 dark:border-gray-700 active:opacity-95"
          >
            {/* Checkbox */}
            <Pressable
              onPress={handleToggle}
              className={`w-7 h-7 rounded-full border-2 items-center justify-center mr-4 ${
                task.completed
                  ? "bg-task-green border-task-green"
                  : "border-gray-300 dark:border-gray-600"
              }`}
            >
              {task.completed && (
                <Ionicons name="checkmark" size={16} color="white" />
              )}
            </Pressable>

            {/* Task Title */}
            <Text
              className={`flex-1 text-base ${
                task.completed
                  ? "text-gray-400 dark:text-gray-500 line-through"
                  : "text-gray-900 dark:text-white"
              }`}
            >
              {task.title}
            </Text>

            {/* Color Indicator */}
            {task.color && (
              <View
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: task.color }}
              />
            )}
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  )
}

interface HabitListProps {
  tasks: Task[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function HabitList({ tasks, onToggle, onDelete }: HabitListProps) {
  if (tasks.length === 0) {
    return (
      <View className="bg-white dark:bg-gray-800 rounded-2xl p-8 items-center border border-gray-100 dark:border-gray-700">
        <Ionicons name="checkmark-circle-outline" size={48} color="#8E8E93" />
        <Text className="text-gray-500 dark:text-gray-400 mt-3 text-center">
          No tasks for today.{"\n"}Start a challenge to add habits!
        </Text>
      </View>
    )
  }

  return (
    <View>
      {tasks.map((task) => (
        <HabitItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </View>
  )
}
