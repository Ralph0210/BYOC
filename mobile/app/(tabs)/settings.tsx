import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  ActionSheetIOS,
  Alert,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import { useRouter } from "expo-router"
import { useAuth } from "../../hooks/useAuth"
import { supabase } from "../../lib/supabase"
import { useColorScheme } from "@/components/useColorScheme"

export default function SettingsScreen() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const colorScheme = useColorScheme()

  const handleSignOut = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await signOut()
  }

  const handleDeleteAccount = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: "Delete Account",
          message:
            "This will permanently delete your account and all data. This action cannot be undone.",
          options: ["Cancel", "Delete Account"],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
        },
        async (buttonIndex) => {
          if (buttonIndex === 1) {
            try {
              const { error } = await supabase.rpc("delete_user_account")
              if (error) throw error
              await signOut()
            } catch (err) {
              Alert.alert(
                "Error",
                "Failed to delete account. Please try again."
              )
            }
          }
        }
      )
    } else {
      Alert.alert(
        "Delete Account",
        "This will permanently delete your account and all data. This action cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                const { error } = await supabase.rpc("delete_user_account")
                if (error) throw error
                await signOut()
              } catch (err) {
                Alert.alert(
                  "Error",
                  "Failed to delete account. Please try again."
                )
              }
            },
          },
        ]
      )
    }
  }

  const SettingsRow = ({
    icon,
    iconColor = "#8E8E93",
    title,
    subtitle,
    onPress,
    rightElement,
    danger = false,
  }: {
    icon: keyof typeof Ionicons.glyphMap
    iconColor?: string
    title: string
    subtitle?: string
    onPress?: () => void
    rightElement?: React.ReactNode
    danger?: boolean
  }) => (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-3 px-4 bg-white dark:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700"
    >
      <View
        className={`w-8 h-8 rounded-lg items-center justify-center mr-3`}
        style={{ backgroundColor: `${iconColor}20` }}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text
          className={`text-base ${danger ? "text-red-500" : "text-gray-900 dark:text-white"}`}
        >
          {title}
        </Text>
        {subtitle && (
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement}
      {onPress && !rightElement && (
        <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
      )}
    </Pressable>
  )

  return (
    <ScrollView className="flex-1 bg-surface-light dark:bg-surface-dark">
      {/* User Profile */}
      {user && (
        <View className="p-4 mb-2">
          <View className="bg-white dark:bg-gray-800 rounded-2xl p-4 flex-row items-center">
            <View className="w-14 h-14 rounded-full bg-primary items-center justify-center mr-4">
              <Text className="text-white text-xl font-bold">
                {(user.email?.[0] || "U").toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                {user.user_metadata?.full_name || user.email?.split("@")[0]}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* AI Companion Section */}
      <View className="mb-4">
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2">
          AI Companion
        </Text>
        <View className="bg-white dark:bg-gray-800 rounded-2xl mx-4 overflow-hidden">
          <SettingsRow
            icon="sparkles"
            iconColor="#AF52DE"
            title="AI Settings"
            subtitle="Configure your companion"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              router.push("/ai-config")
            }}
          />
        </View>
      </View>

      {/* Account Section */}
      <View className="mb-4">
        <Text className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2">
          Account
        </Text>
        <View className="bg-white dark:bg-gray-800 rounded-2xl mx-4 overflow-hidden">
          <SettingsRow
            icon="log-out-outline"
            iconColor="#FF3B30"
            title="Sign Out"
            onPress={handleSignOut}
          />
          <View className="h-px bg-gray-200 dark:bg-gray-700 ml-14" />
          <SettingsRow
            icon="trash-outline"
            iconColor="#FF3B30"
            title="Delete Account"
            subtitle="Permanently remove all data"
            onPress={handleDeleteAccount}
            danger
          />
        </View>
      </View>

      {/* App Version */}
      <Text className="text-center text-xs text-gray-400 dark:text-gray-500 py-8">
        BYOC v1.0.0
      </Text>
    </ScrollView>
  )
}
