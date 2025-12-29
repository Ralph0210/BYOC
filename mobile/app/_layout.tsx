import FontAwesome from "@expo/vector-icons/FontAwesome"
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native"
import { useFonts } from "expo-font"
import { Stack, useRouter, useSegments } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import { useEffect } from "react"
import "react-native-reanimated"
import "../global.css"

import { useColorScheme } from "@/components/useColorScheme"
import { AuthProvider, useAuth } from "../hooks/useAuth"
import { AIConfigProvider } from "../hooks/useAIConfig"

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router"

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
}

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  })

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error
  }, [error])

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return (
    <AuthProvider>
      <AIConfigProvider>
        <RootLayoutNav />
      </AIConfigProvider>
    </AuthProvider>
  )
}

function RootLayoutNav() {
  const colorScheme = useColorScheme()
  const { isAuthenticated, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    const inAuthGroup = segments[0] === "(auth)"

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace("/(auth)/login")
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to tabs if authenticated
      router.replace("/(tabs)")
    }
  }, [isAuthenticated, loading, segments])

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="ai-config"
          options={{
            presentation: "formSheet",
            headerShown: false,
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
    </ThemeProvider>
  )
}
