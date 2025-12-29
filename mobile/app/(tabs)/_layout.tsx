import React from "react"
import { Ionicons } from "@expo/vector-icons"
import { Tabs } from "expo-router"
import * as Haptics from "expo-haptics"

import Colors from "@/constants/Colors"
import { useColorScheme } from "@/components/useColorScheme"

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>["name"]
  color: string
}) {
  return <Ionicons size={24} style={{ marginBottom: -3 }} {...props} />
}

export default function TabLayout() {
  const colorScheme = useColorScheme()

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: true,
        headerLargeTitle: true,
        headerTransparent: false,
        tabBarStyle: {
          borderTopWidth: 0,
          elevation: 0,
        },
      }}
      screenListeners={{
        tabPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="challenges"
        options={{
          title: "Challenges",
          tabBarIcon: ({ color }) => <TabBarIcon name="trophy" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="settings" color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
