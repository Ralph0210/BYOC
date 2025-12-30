/**
 * Root Layout
 *
 * Wraps the entire app with providers:
 * - SafeAreaProvider: Safe area insets
 * - ThemeProvider: App theming
 * - AuthProvider: Authentication state
 */

// Polyfill Buffer for compatibility
import { Buffer } from "buffer"
global.Buffer = Buffer

import { GestureHandlerRootView } from "react-native-gesture-handler"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { AuthProvider } from "../components/auth/AuthProvider"
import { ThemeProvider, useTheme } from "../contexts/ThemeContext"
import { SafeAreaProvider } from "react-native-safe-area-context"

function RootLayoutNav() {
  const { isDark, colors } = useTheme()

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
