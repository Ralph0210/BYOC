/**
 * Challenge routes layout
 */

import { Stack } from "expo-router"
import { useTheme } from "../../contexts/ThemeContext"

export default function ChallengeLayout() {
  const { colors } = useTheme()

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.accent,
        headerTitleStyle: { color: colors.textPrimary },
        headerShadowVisible: false,
        headerBackVisible: true,
        headerBackTitle: "Home",
        contentStyle: { backgroundColor: colors.background },
        presentation: "card",
      }}
    />
  )
}
