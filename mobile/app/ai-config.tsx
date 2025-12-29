import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { useState } from "react"
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { BlurView } from "expo-blur"
import { useRouter } from "expo-router"
import { useColorScheme } from "@/components/useColorScheme"
import { useAIConfig } from "../hooks/useAIConfig"
import { PROVIDERS, Provider } from "../lib/ai/providers"
import { PERSONALITY_PRESETS, PersonalityPreset } from "../lib/ai/personalities"

export default function AIConfigModal() {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const isDark = colorScheme === "dark"
  const { config, updateConfig, loading: configLoading } = useAIConfig()

  const [formData, setFormData] = useState({
    provider: config?.provider || "openai",
    api_key: config?.api_key || "",
    model: config?.model || "gpt-4o-mini",
    personality_preset: config?.personality_preset || "warm_encourager",
    companion_name: config?.companion_name || "",
  })
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSaving(true)
    try {
      await updateConfig(formData)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      router.back()
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      console.error("Failed to save config:", error)
    } finally {
      setSaving(false)
    }
  }

  const selectedProvider = PROVIDERS.find((p) => p.id === formData.provider)
  const selectedPersonality = PERSONALITY_PRESETS[formData.personality_preset]

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScrollView className="flex-1 bg-surface-light dark:bg-surface-dark">
        <View className="p-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                AI Configuration
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Bring Your Own Key (BYOK)
              </Text>
            </View>
            <Pressable
              onPress={() => router.back()}
              className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 items-center justify-center"
            >
              <Ionicons
                name="close"
                size={20}
                color={isDark ? "#fff" : "#000"}
              />
            </Pressable>
          </View>

          {/* Provider Selection */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Provider
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {PROVIDERS.map((provider) => (
                <Pressable
                  key={provider.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setFormData({
                      ...formData,
                      provider: provider.id,
                      model: provider.models[0],
                    })
                  }}
                  className={`px-4 py-2 rounded-xl border ${
                    formData.provider === provider.id
                      ? "bg-primary border-primary"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      formData.provider === provider.id
                        ? "text-white"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {provider.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* API Key */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key
            </Text>
            <View className="relative">
              <TextInput
                value={formData.api_key}
                onChangeText={(text) =>
                  setFormData({ ...formData, api_key: text })
                }
                secureTextEntry={!showKey}
                placeholder="sk-..."
                placeholderTextColor="#8E8E93"
                className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 pr-16"
              />
              <Pressable
                onPress={() => setShowKey(!showKey)}
                className="absolute right-3 top-3"
              >
                <Text className="text-primary text-sm font-medium">
                  {showKey ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Model Selection */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Model
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {selectedProvider?.models.map((model) => (
                <Pressable
                  key={model}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setFormData({ ...formData, model })
                  }}
                  className={`px-3 py-2 rounded-lg border ${
                    formData.model === model
                      ? "bg-primary/10 border-primary"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <Text
                    className={`text-xs font-mono ${
                      formData.model === model
                        ? "text-primary"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {model}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Personality Selection */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Personality
            </Text>
            <View className="gap-2">
              {Object.entries(PERSONALITY_PRESETS).map(([key, preset]) => (
                <Pressable
                  key={key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setFormData({ ...formData, personality_preset: key })
                  }}
                  className={`px-4 py-3 rounded-xl border ${
                    formData.personality_preset === key
                      ? "bg-primary/10 border-primary"
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      formData.personality_preset === key
                        ? "text-primary"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {preset.name}
                  </Text>
                  <Text className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {preset.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Companion Name */}
          <View className="mb-8">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Companion Name (Optional)
            </Text>
            <TextInput
              value={formData.companion_name}
              onChangeText={(text) =>
                setFormData({ ...formData, companion_name: text })
              }
              placeholder="e.g., Sage, Buddy, Coach..."
              placeholderTextColor="#8E8E93"
              className="bg-white dark:bg-gray-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
            />
          </View>

          {/* Save Button */}
          <Pressable
            onPress={handleSave}
            disabled={saving || !formData.api_key}
            className={`py-4 rounded-xl items-center ${
              saving || !formData.api_key
                ? "bg-gray-300 dark:bg-gray-700"
                : "bg-primary active:opacity-80"
            }`}
          >
            <Text className="text-white font-semibold text-base">
              {saving ? "Saving..." : "Save Configuration"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
