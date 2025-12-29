import { View, Text, Image, Pressable } from "react-native"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { useColorScheme } from "@/components/useColorScheme"

interface CompanionCardProps {
  name?: string
  photoUrl?: string
  personality?: string
  provider?: string
  model?: string
  isConfigured: boolean
  onConfigure?: () => void
}

export function CompanionCard({
  name = "Your Companion",
  photoUrl,
  personality = "Not configured",
  provider,
  model,
  isConfigured,
  onConfigure,
}: CompanionCardProps) {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onConfigure?.()
  }

  if (!isConfigured) {
    return (
      <Pressable onPress={handlePress} className="active:opacity-90">
        <View className="rounded-3xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <BlurView
            intensity={isDark ? 40 : 80}
            tint={isDark ? "dark" : "light"}
            className="p-6"
          >
            <View className="items-center">
              <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-4">
                <Ionicons name="sparkles" size={36} color="#007AFF" />
              </View>
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Set Up Your Companion
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
                Bring your own API key to get started
              </Text>
              <View className="bg-primary/10 rounded-full px-4 py-2 flex-row items-center">
                <Ionicons name="add" size={16} color="#007AFF" />
                <Text className="text-primary font-medium ml-1">Configure</Text>
              </View>
            </View>
          </BlurView>
        </View>
      </Pressable>
    )
  }

  return (
    <View className="rounded-3xl overflow-hidden border border-primary/10">
      <BlurView
        intensity={isDark ? 30 : 60}
        tint={isDark ? "dark" : "light"}
        className="p-6"
      >
        {/* Hero Section */}
        <View className="items-center mb-4">
          {/* Avatar */}
          <View className="relative mb-3">
            {photoUrl ? (
              <Image
                source={{ uri: photoUrl }}
                className="w-24 h-24 rounded-full"
                style={{ borderWidth: 3, borderColor: "white" }}
              />
            ) : (
              <View
                className="w-24 h-24 rounded-full items-center justify-center"
                style={{
                  backgroundColor: "#007AFF",
                  borderWidth: 3,
                  borderColor: "white",
                }}
              >
                <Ionicons name="sparkles" size={40} color="white" />
              </View>
            )}
            {/* Online Indicator */}
            <View
              className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500"
              style={{ borderWidth: 2, borderColor: "white" }}
            />
          </View>

          {/* Name & Personality */}
          <Text className="text-xl font-bold text-primary">{name}</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {personality}
          </Text>
        </View>

        {/* Provider Info */}
        {provider && model && (
          <View className="flex-row items-center justify-center py-3 border-t border-primary/10">
            <View className="flex-row items-center">
              <Ionicons name="cube-outline" size={14} color="#8E8E93" />
              <Text className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                {provider}
              </Text>
            </View>
            <View className="w-px h-3 bg-gray-300 dark:bg-gray-600 mx-3" />
            <Text className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {model}
            </Text>
          </View>
        )}

        {/* Configure Button */}
        <Pressable
          onPress={handlePress}
          className="mt-3 py-3 rounded-xl bg-white/50 dark:bg-white/10 border border-primary/10 active:bg-white dark:active:bg-white/20"
        >
          <View className="flex-row items-center justify-center">
            <Ionicons name="settings-outline" size={16} color="#8E8E93" />
            <Text className="text-sm font-medium text-gray-600 dark:text-gray-300 ml-2">
              Configure
            </Text>
          </View>
        </Pressable>
      </BlurView>
    </View>
  )
}
