/**
 * Tab Layout
 *
 * Main navigation structure with 3 tabs:
 * - Home (Challenges)
 * - Calendar
 * - Settings
 */

import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../../contexts/ThemeContext"
import { Platform } from "react-native"

type IconName = React.ComponentProps<typeof Ionicons>["name"]

interface TabIconProps {
  name: IconName
  focusedName: IconName
  focused: boolean
  color: string
}

function TabIcon({ name, focusedName, focused, color }: TabIconProps) {
  return (
    <Ionicons
      name={focused ? focusedName : name}
      size={24}
      color={color}
      style={{ marginBottom: -3 }}
    />
  )
}

export default function TabLayout() {
  const { colors, isDark } = useTheme()

  return (
    <Tabs
      screenOptions={{
        // Tab bar styling
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          paddingTop: 8,
          height: Platform.OS === "ios" ? 88 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 4,
        },
        // Header styling
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 17,
        },
        headerShadowVisible: false,
        // Large title for iOS
        headerLargeTitle: true,
        headerLargeTitleStyle: {
          fontWeight: "700",
          fontSize: 34,
        },
        headerLargeTitleShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          headerTitle: "Challenges",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="home-outline"
              focusedName="home"
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="chatbubbles-outline"
              focusedName="chatbubbles"
              focused={focused}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="settings-outline"
              focusedName="settings"
              focused={focused}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  )
}
