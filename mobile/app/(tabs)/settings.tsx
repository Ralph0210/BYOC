/**
 * Settings Screen
 *
 * User settings and account management.
 * Uses native iOS list style.
 */

import React from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native"
import { useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../../contexts/ThemeContext"
import { useAuth } from "../../components/auth/AuthProvider"
import { supabase } from "../../lib/supabase"
import { typography, spacing, radius } from "../../lib/theme"

interface SettingItemProps {
  icon: React.ComponentProps<typeof Ionicons>["name"]
  label: string
  value?: string
  onPress?: () => void
  destructive?: boolean
}

function SettingItem({
  icon,
  label,
  value,
  onPress,
  destructive,
}: SettingItemProps) {
  const { colors } = useTheme()

  return (
    <TouchableOpacity
      style={[
        styles.settingItem,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View
        style={[
          styles.settingIcon,
          {
            backgroundColor: destructive
              ? colors.successSoft
              : colors.accentSoft,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={destructive ? "#ef4444" : colors.accent}
        />
      </View>
      <Text
        style={[
          typography.body,
          { color: destructive ? "#ef4444" : colors.textPrimary, flex: 1 },
        ]}
      >
        {label}
      </Text>
      {value && (
        <Text
          style={[
            typography.body,
            { color: colors.textTertiary, marginRight: spacing.sm },
          ]}
        >
          {value}
        </Text>
      )}
      {onPress && (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={colors.textTertiary}
        />
      )}
    </TouchableOpacity>
  )
}

function SettingSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  const { colors } = useTheme()

  return (
    <View style={styles.section}>
      <Text
        style={[
          typography.caption1,
          {
            color: colors.textTertiary,
            marginLeft: spacing.lg,
            marginBottom: spacing.sm,
          },
        ]}
      >
        {title.toUpperCase()}
      </Text>
      <View
        style={[
          styles.sectionContent,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {children}
      </View>
    </View>
  )
}

export default function SettingsScreen() {
  const router = useRouter()
  const { colors, themeMode, setThemeMode } = useTheme()
  const { user } = useAuth()

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => supabase.auth.signOut(),
      },
    ])
  }

  const handleThemePress = () => {
    Alert.alert("Theme", "Choose your preferred theme", [
      { text: "System", onPress: () => setThemeMode("system") },
      { text: "Light", onPress: () => setThemeMode("light") },
      { text: "Dark", onPress: () => setThemeMode("dark") },
      { text: "Cancel", style: "cancel" },
    ])
  }

  const getThemeLabel = () => {
    switch (themeMode) {
      case "light":
        return "Light"
      case "dark":
        return "Dark"
      default:
        return "System"
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <SettingSection title="Account">
        <SettingItem
          icon="mail-outline"
          label="Email"
          value={user?.email ?? "Not signed in"}
        />
      </SettingSection>

      <SettingSection title="Appearance">
        <SettingItem
          icon="moon-outline"
          label="Theme"
          value={getThemeLabel()}
          onPress={handleThemePress}
        />
      </SettingSection>

      <SettingSection title="AI Companion">
        <SettingItem
          icon="sparkles-outline"
          label="AI Settings"
          onPress={() => router.push("/settings/ai")}
        />
      </SettingSection>

      <SettingSection title="Challenges">
        <SettingItem
          icon="add-circle-outline"
          label="New Challenge"
          onPress={() => router.push("/challenge/new")}
        />
      </SettingSection>

      <SettingSection title="About">
        <SettingItem
          icon="shield-checkmark-outline"
          label="Privacy Policy"
          onPress={() => {
            /* TODO: Open privacy policy */
          }}
        />
        <SettingItem
          icon="information-circle-outline"
          label="Version"
          value="1.0.0"
        />
      </SettingSection>

      <SettingSection title="">
        <SettingItem
          icon="log-out-outline"
          label="Sign Out"
          onPress={handleSignOut}
          destructive
        />
      </SettingSection>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.massive,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  sectionContent: {
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 0.5,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
})
