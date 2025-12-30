/**
 * Auth Screen (Login)
 *
 * This is the entry point. It redirects to (tabs) if authenticated.
 * Uses Google OAuth with deep linking.
 */

import React from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native"
import { Redirect } from "expo-router"
import { makeRedirectUri } from "expo-auth-session"
import * as QueryParams from "expo-auth-session/build/QueryParams"
import * as WebBrowser from "expo-web-browser"
import * as Linking from "expo-linking"
import { Ionicons } from "@expo/vector-icons"
import { SafeAreaView } from "react-native-safe-area-context"
import { supabase } from "../lib/supabase"
import { useAuth } from "../components/auth/AuthProvider"
import { useTheme } from "../contexts/ThemeContext"
import { typography, spacing, radius, shadows } from "../lib/theme"

WebBrowser.maybeCompleteAuthSession()

const redirectTo = makeRedirectUri()

const createSessionFromUrl = async (url: string) => {
  const { params, errorCode } = QueryParams.getQueryParams(url)

  if (errorCode) throw new Error(errorCode)
  const { access_token, refresh_token } = params

  if (!access_token) return

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  })
  if (error) throw error
  return data.session
}

export default function AuthScreen() {
  const { session, loading } = useAuth()
  const { colors, isDark } = useTheme()
  const [isSigningIn, setIsSigningIn] = React.useState(false)

  // Handle deep link into app
  const url = Linking.useURL()
  React.useEffect(() => {
    if (url) {
      createSessionFromUrl(url).catch(console.error)
    }
  }, [url])

  // Redirect to tabs if authenticated
  if (session && !loading) {
    return <Redirect href="/(tabs)" />
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    )
  }

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      })

      if (error) throw error

      if (data?.url) {
        const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

        if (res.type === "success") {
          await createSessionFromUrl(res.url)
        }
      }
    } catch (error) {
      console.error("Error signing in:", error)
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.content}>
        {/* Logo / Branding */}
        <View style={styles.header}>
          <View
            style={[
              styles.logoContainer,
              { backgroundColor: colors.accentSoft },
            ]}
          >
            <Ionicons name="trophy" size={48} color={colors.accent} />
          </View>
          <Text
            style={[
              typography.largeTitle,
              { color: colors.textPrimary, marginTop: spacing.lg },
            ]}
          >
            BYOC
          </Text>
          <Text
            style={[
              typography.body,
              {
                color: colors.textSecondary,
                textAlign: "center",
                marginTop: spacing.sm,
              },
            ]}
          >
            Build Your Own Challenge
          </Text>
        </View>

        {/* Sign In Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.googleButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
              shadows.card,
            ]}
            onPress={handleGoogleSignIn}
            disabled={isSigningIn}
            activeOpacity={0.8}
          >
            {isSigningIn ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#DB4437" />
                <Text
                  style={[
                    typography.bodyBold,
                    { color: colors.textPrimary, marginLeft: spacing.md },
                  ]}
                >
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text
            style={[
              typography.caption1,
              {
                color: colors.textTertiary,
                textAlign: "center",
                marginTop: spacing.lg,
              },
            ]}
          >
            By continuing, you agree to our Privacy Policy
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xxl,
    justifyContent: "space-between",
  },
  header: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  footer: {
    paddingBottom: spacing.xxl,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
})
