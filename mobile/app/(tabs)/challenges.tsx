import { View, Text, ScrollView, Pressable } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"

export default function ChallengesScreen() {
  const handleNewChallenge = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    // TODO: Navigate to new challenge modal
  }

  return (
    <ScrollView className="flex-1 bg-surface-light dark:bg-surface-dark">
      <View className="p-6">
        {/* Empty State */}
        <View className="items-center py-12">
          <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center mb-6">
            <Ionicons name="trophy-outline" size={48} color="#007AFF" />
          </View>
          <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            No Challenges Yet
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 text-center mb-8 px-8">
            Start a new challenge to build habits with your AI companion
          </Text>

          <Pressable
            onPress={handleNewChallenge}
            className="bg-primary rounded-2xl py-4 px-8 flex-row items-center active:opacity-80"
          >
            <Ionicons name="add" size={24} color="white" />
            <Text className="text-white font-semibold text-base ml-2">
              New Challenge
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  )
}
