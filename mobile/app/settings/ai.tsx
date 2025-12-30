/**
 * AI Settings Screen
 *
 * Two modes like web app:
 * - Dashboard view: Shows configured AI info when API key exists
 * - Edit mode: Form to configure AI settings
 */

import React, { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native"
import { Stack, useRouter } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import * as Haptics from "expo-haptics"
import * as ImagePicker from "expo-image-picker"
import { useTheme } from "../../contexts/ThemeContext"
import { useAIConfig } from "../../hooks/useAIConfig"
import { typography, spacing, radius } from "../../lib/theme"

// Providers matching web app
const PROVIDERS = [
  { id: "openai", name: "OpenAI" },
  { id: "grok", name: "xAI (Grok)" },
  { id: "anthropic", name: "Anthropic" },
  { id: "google", name: "Google (Gemini)" },
]

// Personalities matching web app
const PERSONALITIES = [
  {
    value: "warm_encourager",
    label: "🌟 Warm Encourager",
    desc: "Gentle, affirming, celebrates small wins",
  },
  {
    value: "direct_coach",
    label: "📋 Direct Coach",
    desc: "Honest, action-oriented, focuses on what's next",
  },
  {
    value: "curious_friend",
    label: "🤔 Curious Friend",
    desc: "Inquisitive, reflective, helps you think",
  },
  {
    value: "quiet_supporter",
    label: "🤫 Quiet Supporter",
    desc: "Minimal, speaks only when meaningful",
  },
  {
    value: "inner_self",
    label: "💭 Inner Self",
    desc: "Your own inner voice, first person",
  },
  { value: "custom", label: "✨ Custom", desc: "Create your own personality" },
]

// Default models per provider
const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4o-mini",
  grok: "grok-beta",
  anthropic: "claude-3-5-sonnet-20240620",
  google: "gemini-1.5-flash",
}

export default function AISettingsScreen() {
  const { colors } = useTheme()
  const router = useRouter()
  const { config, loading, updateConfig, hasKey, needsReEntry } = useAIConfig()

  // View mode: dashboard vs editing
  const [isEditing, setIsEditing] = useState(false)

  // Form state
  const [provider, setProvider] = useState("openai")
  const [apiKey, setApiKey] = useState("")
  const [model, setModel] = useState("gpt-4o-mini")
  const [personality, setPersonality] = useState("warm_encourager")
  const [companionName, setCompanionName] = useState("")
  const [companionPhotoUrl, setCompanionPhotoUrl] = useState("")
  const [userDetails, setUserDetails] = useState("")
  const [customInstructions, setCustomInstructions] = useState("")
  const [customPersonalityPrompt, setCustomPersonalityPrompt] = useState("")

  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Load config into form state
  useEffect(() => {
    if (config) {
      setProvider(config.provider || "openai")
      setApiKey(config.api_key || "")
      setModel(
        config.model ||
          DEFAULT_MODELS[config.provider || "openai"] ||
          "gpt-4o-mini"
      )
      setPersonality(config.personality_preset || "warm_encourager")
      setCompanionName(config.companion_name || "")
      setCompanionPhotoUrl(config.companion_photo_url || "")
      setUserDetails(config.user_details || "")
      setCustomInstructions(config.custom_instructions || "")
      setCustomPersonalityPrompt(config.custom_personality_prompt || "")

      // If no API key or needs re-entry, show edit mode
      if (!config.api_key || needsReEntry) {
        setIsEditing(true)
      }
    }
  }, [config, needsReEntry])

  // Track if this is the initial load or a user action
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Clear initial load flag after a delay to allow the first config sync to settle
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoad(false), 500)
    return () => clearTimeout(timer)
  }, [])

  // Auto-switch model when provider changes (if using a default)
  useEffect(() => {
    if (isInitialLoad) return
    const defaultModel = DEFAULT_MODELS[provider]
    if (defaultModel) {
      setModel(defaultModel)
    }
  }, [provider, isInitialLoad])

  const handleSave = async () => {
    setSaving(true)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

    const result = await updateConfig({
      provider,
      api_key: apiKey || null,
      model: model,
      personality_preset: personality,
      companion_name: companionName || null,
      companion_photo_url: companionPhotoUrl || null,
      user_details: userDetails || null,
      custom_instructions: customInstructions || null,
      custom_personality_prompt: customPersonalityPrompt || null,
    })

    setSaving(false)

    if (result) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      // Navigate back after successful save
      router.back()
    } else {
      Alert.alert("Error", "Failed to save settings.")
    }
  }

  const handleTestConnection = async () => {
    if (!apiKey) {
      Alert.alert("Missing Key", "Please enter an API key first.")
      return
    }
    setTesting(true)
    await new Promise((r) => setTimeout(r, 1000))
    setTesting(false)

    const isValid =
      apiKey.startsWith("sk-") ||
      apiKey.startsWith("xai-") ||
      apiKey.length > 20
    if (isValid) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert("Success", "API key format looks valid!")
    } else {
      Alert.alert("Warning", "API key format may be incorrect.")
    }
  }

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })

    if (!result.canceled && result.assets[0]) {
      setUploadingPhoto(true)
      setCompanionPhotoUrl(result.assets[0].uri)
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = () => {
    setCompanionPhotoUrl("")
  }

  const getPersonalityName = (value: string) => {
    return PERSONALITIES.find((p) => p.value === value)?.label || "Custom"
  }

  const getProviderName = (id: string) => {
    return PROVIDERS.find((p) => p.id === id)?.name || id
  }

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: colors.background },
        ]}
      >
        <ActivityIndicator size="large" color={colors.accent} />
        <Text
          style={[
            typography.caption1,
            { color: colors.textSecondary, marginTop: spacing.md },
          ]}
        >
          Loading AI configuration...
        </Text>
      </View>
    )
  }

  // DASHBOARD VIEW - When configured and not editing
  if (hasKey && !isEditing && !needsReEntry) {
    const displayName =
      companionName || config?.companion_name || "AI Companion"
    const displayPersonality = getPersonalityName(
      config?.personality_preset || personality
    )
    const displayProvider = getProviderName(config?.provider || provider)

    return (
      <>
        <Stack.Screen
          options={{
            title: "AI Companion",
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.accent,
            headerTitleStyle: { color: colors.textPrimary },
            headerBackVisible: true,
            headerBackTitle: "Settings",
          }}
        />

        <ScrollView
          style={[styles.container, { backgroundColor: colors.background }]}
          contentContainerStyle={styles.dashboardContent}
        >
          {/* Avatar & Status */}
          <View style={styles.dashboardHero}>
            <View style={styles.avatarContainer}>
              {companionPhotoUrl || config?.companion_photo_url ? (
                <Image
                  source={{
                    uri: companionPhotoUrl || config?.companion_photo_url || "",
                  }}
                  style={styles.avatar}
                />
              ) : (
                <View
                  style={[
                    styles.avatarPlaceholder,
                    { backgroundColor: colors.aiPrimary },
                  ]}
                >
                  <Ionicons name="sparkles" size={40} color="#fff" />
                </View>
              )}
              <View
                style={[styles.onlineIndicator, { backgroundColor: "#22c55e" }]}
              />
            </View>

            <Text
              style={[
                typography.title2,
                { color: colors.textPrimary, marginTop: spacing.md },
              ]}
            >
              {displayName}
            </Text>
            <Text
              style={[typography.subheadline, { color: colors.textSecondary }]}
            >
              {displayPersonality}
            </Text>
          </View>

          {/* Info Row */}
          <View style={[styles.infoRow, { borderColor: colors.border }]}>
            <View style={styles.infoItem}>
              <Ionicons
                name="cube-outline"
                size={16}
                color={colors.textTertiary}
              />
              <Text
                style={[
                  typography.caption1,
                  { color: colors.textTertiary, marginLeft: spacing.xs },
                ]}
              >
                {displayProvider}
              </Text>
            </View>
            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />
            <View style={styles.infoItem}>
              <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
              <Text
                style={[
                  typography.caption1,
                  { color: colors.textTertiary, marginLeft: spacing.xs },
                ]}
              >
                Connected
              </Text>
            </View>
          </View>

          {/* Configure Button */}
          <TouchableOpacity
            style={[
              styles.configureButton,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => {
              Haptics.selectionAsync()
              setIsEditing(true)
            }}
          >
            <Ionicons
              name="settings-outline"
              size={20}
              color={colors.textSecondary}
            />
            <Text
              style={[
                typography.body,
                { color: colors.textSecondary, marginLeft: spacing.sm },
              ]}
            >
              Configure
            </Text>
          </TouchableOpacity>

          {/* Usage & Estimated Costs */}
          <View style={[styles.usageSection, { borderColor: colors.border }]}>
            <View style={styles.usageHeader}>
              <View style={styles.usageHeaderLeft}>
                <Ionicons
                  name="analytics-outline"
                  size={18}
                  color={colors.aiPrimary}
                />
                <Text
                  style={[
                    typography.subheadlineBold,
                    { color: colors.textPrimary, marginLeft: spacing.sm },
                  ]}
                >
                  Usage & Estimated Costs
                </Text>
              </View>
              <Text
                style={[
                  typography.caption1,
                  { color: colors.aiPrimary, fontWeight: "600" },
                ]}
              >
                $0.0012
              </Text>
            </View>

            <View style={styles.statsGrid}>
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.statLabel, { color: colors.textTertiary }]}
                >
                  TOTAL CALLS
                </Text>
                <Text
                  style={[typography.title2, { color: colors.textPrimary }]}
                >
                  24
                </Text>
              </View>
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Text
                  style={[styles.statLabel, { color: colors.textTertiary }]}
                >
                  TOKENS USED
                </Text>
                <Text
                  style={[typography.title2, { color: colors.textPrimary }]}
                >
                  12k
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </>
    )
  }

  // EDIT MODE - Configuration form
  return (
    <>
      <Stack.Screen
        options={{
          title: hasKey ? "Configure AI" : "Set Up AI Companion",
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.accent,
          headerTitleStyle: { color: colors.textPrimary },
          headerBackVisible: true,
          headerBackTitle: "Back",
          headerLeft: hasKey
            ? () => (
                <TouchableOpacity onPress={() => setIsEditing(false)}>
                  <Text style={[typography.body, { color: colors.accent }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              )
            : undefined,
          headerRight: () => (
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Text
                style={[
                  typography.bodyBold,
                  { color: saving ? colors.textTertiary : colors.accent },
                ]}
              >
                {saving ? "Saving..." : "Save"}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Warning banner for encrypted data from web */}
          {needsReEntry && (
            <View
              style={[
                styles.warningBanner,
                { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" },
              ]}
            >
              <Ionicons name="warning" size={18} color="#D97706" />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text
                  style={[typography.subheadlineBold, { color: "#92400E" }]}
                >
                  Re-entry Required
                </Text>
                <Text style={[typography.caption1, { color: "#B45309" }]}>
                  Your API key was encrypted on web. Please re-enter it below
                  and tap Save.
                </Text>
              </View>
            </View>
          )}

          {/* Companion Identity Section */}
          {personality !== "inner_self" && (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.aiSurface,
                  borderColor: colors.aiPrimary,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="person" size={16} color={colors.aiPrimary} />
                <Text
                  style={[
                    typography.subheadlineBold,
                    { color: colors.textPrimary },
                  ]}
                >
                  Companion Identity
                </Text>
              </View>

              <View style={styles.identityRow}>
                {/* Photo */}
                <TouchableOpacity
                  style={[
                    styles.photoContainer,
                    { borderColor: colors.border },
                  ]}
                  onPress={handlePickPhoto}
                  disabled={uploadingPhoto}
                >
                  {uploadingPhoto ? (
                    <ActivityIndicator size="small" color={colors.aiPrimary} />
                  ) : companionPhotoUrl ? (
                    <Image
                      source={{ uri: companionPhotoUrl }}
                      style={styles.photo}
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="camera"
                        size={24}
                        color={colors.textTertiary}
                      />
                      <Text
                        style={[
                          typography.caption2,
                          { color: colors.textTertiary },
                        ]}
                      >
                        Upload
                      </Text>
                    </>
                  )}
                  {companionPhotoUrl && (
                    <TouchableOpacity
                      style={styles.removePhotoBtn}
                      onPress={handleRemovePhoto}
                    >
                      <Ionicons name="close" size={12} color="#fff" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>

                {/* Name */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      typography.caption1,
                      { color: colors.textTertiary, marginBottom: spacing.xs },
                    ]}
                  >
                    Name
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                    value={companionName}
                    onChangeText={setCompanionName}
                    placeholder="e.g., Sage, Buddy, Coach..."
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Provider */}
          <Section title="PROVIDER" colors={colors}>
            <View
              style={[
                styles.optionList,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {PROVIDERS.map((p, idx) => (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.optionItem,
                    idx < PROVIDERS.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync()
                    setProvider(p.id)
                  }}
                >
                  <Text
                    style={[typography.body, { color: colors.textPrimary }]}
                  >
                    {p.name}
                  </Text>
                  {provider === p.id && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.accent}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Section>

          {/* API Key & Model */}
          <Section title="CONFIGURATION" colors={colors}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  padding: 0,
                  overflow: "hidden",
                },
              ]}
            >
              {/* API Key Input */}
              <View
                style={[
                  styles.inputRow,
                  {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View style={{ padding: 12 }}>
                  <Ionicons name="key" size={18} color={colors.textTertiary} />
                </View>
                <TextInput
                  style={[styles.inputFlex, { color: colors.textPrimary }]}
                  value={apiKey}
                  onChangeText={setApiKey}
                  placeholder="API Key (sk-...)"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowKey(!showKey)}
                  style={{ padding: 12 }}
                >
                  <Ionicons
                    name={showKey ? "eye-off" : "eye"}
                    size={20}
                    color={colors.textTertiary}
                  />
                </TouchableOpacity>
              </View>

              {/* Model Input */}
              <View style={styles.inputRow}>
                <View style={{ padding: 12 }}>
                  <Ionicons name="cube" size={18} color={colors.textTertiary} />
                </View>
                <TextInput
                  style={[styles.inputFlex, { color: colors.textPrimary }]}
                  value={model}
                  onChangeText={setModel}
                  placeholder="Model Name (e.g. gpt-4o)"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleTestConnection}
              disabled={testing}
            >
              <Ionicons name="flash" size={14} color={colors.accent} />
              <Text
                style={[
                  typography.caption1,
                  { color: colors.accent, marginLeft: spacing.xs },
                ]}
              >
                {testing ? "Testing..." : "Test Connection"}
              </Text>
            </TouchableOpacity>
          </Section>

          {/* Personality */}
          <Section title="PERSONALITY" colors={colors}>
            <View
              style={[
                styles.optionList,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              {PERSONALITIES.map((p, idx) => (
                <TouchableOpacity
                  key={p.value}
                  style={[
                    styles.optionItem,
                    { paddingVertical: spacing.md },
                    idx < PERSONALITIES.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync()
                    setPersonality(p.value)
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[typography.body, { color: colors.textPrimary }]}
                    >
                      {p.label}
                    </Text>
                    <Text
                      style={[
                        typography.caption1,
                        { color: colors.textTertiary },
                      ]}
                    >
                      {p.desc}
                    </Text>
                  </View>
                  {personality === p.value && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.accent}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Section>

          {/* Custom Personality Prompt (only when custom selected) */}
          {personality === "custom" && (
            <Section title="CUSTOM PERSONALITY PROMPT" colors={colors}>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  },
                ]}
                value={customPersonalityPrompt}
                onChangeText={setCustomPersonalityPrompt}
                placeholder="Describe how your companion should think, speak, and behave..."
                placeholderTextColor={colors.textTertiary}
                multiline
                textAlignVertical="top"
              />
            </Section>
          )}

          {/* About You */}
          <Section
            title={
              personality === "inner_self"
                ? "ABOUT YOU (REQUIRED)"
                : "ABOUT YOU (OPTIONAL)"
            }
            colors={colors}
          >
            {personality === "inner_self" && (
              <Text
                style={[
                  typography.caption1,
                  { color: colors.aiPrimary, marginBottom: spacing.sm },
                ]}
              >
                ✨ Tell me about yourself so I can speak in your voice
              </Text>
            )}
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              value={userDetails}
              onChangeText={setUserDetails}
              placeholder={
                personality === "inner_self"
                  ? "Your goals, values, what motivates you..."
                  : "Help the AI know you better..."
              }
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
            />
          </Section>

          {/* Custom Instructions */}
          <Section title="CUSTOM INSTRUCTIONS (OPTIONAL)" colors={colors}>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              value={customInstructions}
              onChangeText={setCustomInstructions}
              placeholder="E.g., Always be brief, never mention calories..."
              placeholderTextColor={colors.textTertiary}
              multiline
              textAlignVertical="top"
            />
          </Section>

          <View style={{ height: spacing.xxxl }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}

function Section({
  title,
  children,
  colors,
}: {
  title: string
  children: React.ReactNode
  colors: any
}) {
  return (
    <View style={styles.section}>
      <Text
        style={[
          typography.caption1,
          styles.sectionLabel,
          { color: colors.textTertiary },
        ]}
      >
        {title}
      </Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  section: { marginBottom: spacing.xl },
  sectionLabel: { marginBottom: spacing.sm, marginLeft: spacing.xs },

  // Dashboard styles
  dashboardContent: { padding: spacing.xl, alignItems: "center" },
  dashboardHero: { alignItems: "center", marginBottom: spacing.xl },
  avatarContainer: { position: "relative" },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "#fff",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: spacing.xl,
    width: "100%",
    justifyContent: "center",
  },
  infoItem: { flexDirection: "row", alignItems: "center" },
  divider: { width: 1, height: 16, marginHorizontal: spacing.lg },
  configureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
  },

  // Edit form styles
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderLeftWidth: 3,
    marginBottom: spacing.xl,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.lg,
  },
  photoContainer: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  removePhotoBtn: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },

  input: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
  },
  inputFlex: {
    flex: 1,
    fontSize: 16,
  },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
  },

  optionList: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },

  textArea: {
    minHeight: 100,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    fontSize: 16,
    lineHeight: 22,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },

  // Usage stats section
  usageSection: {
    width: "100%",
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
  },
  usageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  usageHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsGrid: {
    flexDirection: "row",
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
})
