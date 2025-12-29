import { View, Text, ScrollView } from "react-native"
import { useState } from "react"
import { useRouter } from "expo-router"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { CompanionCard } from "../../components/feature/CompanionCard"
import { HabitList } from "../../components/feature/HabitList"
import { Heatmap } from "../../components/feature/Heatmap"
import { useAIConfig } from "../../hooks/useAIConfig"
import { PERSONALITY_PRESETS } from "../../lib/ai/personalities"
import { getProviderById } from "../../lib/ai/providers"

// Mock data for demonstration (will be replaced with Supabase data)
const MOCK_TASKS = [
  { id: "1", title: "Morning meditation", completed: true, color: "#AF52DE" },
  { id: "2", title: "Read for 30 minutes", completed: false, color: "#007AFF" },
  { id: "3", title: "Exercise", completed: false, color: "#34C759" },
]

const MOCK_HEATMAP = [
  1, 1, 0.8, 1, 0.6, 0, 0.9, 1, 1, 0.7, 1, 0.5, 1, 1, 0.8, 1, 1, 0.9, 0, 0.4, 1,
  1, 1, 0.7, 1, 0.8, 1, 1, 0.6, 1, 0, 0, 0, 0, 0,
]

export default function DashboardScreen() {
  const router = useRouter()
  const { config, hasKey, loading } = useAIConfig()
  const [tasks, setTasks] = useState(MOCK_TASKS)

  const handleToggle = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    )
  }

  const handleDelete = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  const handleConfigure = () => {
    router.push("/ai-config")
  }

  // Get display values from config
  const isConfigured = hasKey
  const companionName = config?.companion_name || "Your Companion"
  const personalityKey = config?.personality_preset || "warm_encourager"
  const personality =
    PERSONALITY_PRESETS[personalityKey]?.name || "Warm Encourager"
  const provider = config?.provider
    ? getProviderById(config.provider)?.name
    : undefined
  const model = config?.model

  // Calculate today's progress
  const completedCount = tasks.filter((t) => t.completed).length
  const totalCount = tasks.length
  const progressPercent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ScrollView className="flex-1 bg-surface-light dark:bg-surface-dark">
        <View className="p-6">
          {/* Companion Card */}
          <View className="mb-6">
            <CompanionCard
              isConfigured={isConfigured}
              onConfigure={handleConfigure}
              name={companionName}
              personality={personality}
              provider={provider}
              model={model}
            />
          </View>

          {/* Today's Progress */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                Today's Tasks
              </Text>
              <View className="flex-row items-center">
                <Text className="text-sm text-gray-500 dark:text-gray-400 mr-1">
                  {completedCount}/{totalCount}
                </Text>
                <Text className="text-sm font-semibold text-primary">
                  {progressPercent}%
                </Text>
              </View>
            </View>

            <HabitList
              tasks={tasks}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          </View>

          {/* Streak Heatmap */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Your Streak
            </Text>
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
              <Heatmap data={MOCK_HEATMAP} showLabels />
            </View>
          </View>
        </View>
      </ScrollView>
    </GestureHandlerRootView>
  )
}
