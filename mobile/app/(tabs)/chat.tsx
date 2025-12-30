import React, { useRef, useEffect, useState, useCallback, useMemo } from "react"
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useTheme } from "../../contexts/ThemeContext"
import { useConversation } from "../../hooks/useConversation"
import { useAIConfig } from "../../hooks/useAIConfig"
import { useChallenges } from "../../hooks/useChallenges"
import { useTasks } from "../../hooks/useTasks"
import { useCompletions } from "../../hooks/useCompletions"
import {
  getSuggestedPrompts,
  buildSuggestionsContext,
} from "../../lib/ai/suggestions"
import { calculateChallengeStats } from "../../lib/stats"
import { cn } from "../../lib/utils"
import { typography } from "../../lib/theme"
import { Image } from "expo-image"

export default function ChatScreen() {
  const { colors, isDark } = useTheme()
  const { config } = useAIConfig()
  const { challenges } = useChallenges()
  const { tasks } = useTasks()
  const { completions } = useCompletions()

  const [activeContexts, setActiveContexts] = useState<any[]>([])
  const [showContextPicker, setShowContextPicker] = useState(false)
  const [inputText, setInputText] = useState("")

  const scrollViewRef = useRef<ScrollView>(null)

  // Helper to safely add context without duplicates and with enrichment
  const addContext = useCallback(
    (item: any, type = "challenge") => {
      setActiveContexts((prev) => {
        if (prev.some((c) => c.id === item.id)) return prev

        let enrichedItem = { ...item, type }

        if (type === "challenge") {
          const challengeTasks = tasks.filter((t) => t.challenge_id === item.id)
          const stats = calculateChallengeStats(
            item,
            challengeTasks,
            completions
          )
          enrichedItem.stats = stats
          enrichedItem.tasks = challengeTasks.map((t) => ({
            name: t.name,
            frequency_type: t.frequency,
            custom_days: t.custom_days,
          }))
        } else if (type === "task") {
          const today = new Date().toISOString().split("T")[0]
          const isCompleted = completions.some(
            (c) => c.task_id === item.id && c.date === today
          )
          enrichedItem.isCompleted = isCompleted
          const parent = challenges.find((c) => c.id === item.challenge_id)
          if (parent) enrichedItem.challengeName = parent.name
        }

        return [...prev, enrichedItem]
      })
    },
    [tasks, completions, challenges]
  )

  const { messages, sendMessage, generating, hasKey, error } =
    useConversation(activeContexts)

  const companionName = config?.companion_name || "Companion"
  const companionPhoto = config?.companion_photo_url

  // Auto-scroll
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [messages, generating])

  const handleSend = () => {
    if (!inputText.trim()) return
    sendMessage(inputText.trim())
    setInputText("")
    Keyboard.dismiss()
  }

  const handleSuggestionClick = (prompt: string) => {
    sendMessage(prompt)
  }

  // Generate suggestions
  const suggestedPrompts = useMemo(() => {
    const primaryContext =
      activeContexts.find((c) => c.type === "challenge") ||
      (challenges.length > 0 ? challenges[0] : null)
    // Need to cast primaryContext to Challenge | null properly for buildSuggestionsContext
    if (!primaryContext)
      return ["How am I doing?", "What should I focus on?", "Any tips?"]

    // Find tasks for this challenge
    const relevantTasks = tasks.filter(
      (t) => t.challenge_id === primaryContext.id
    )

    const context = buildSuggestionsContext(
      primaryContext,
      relevantTasks,
      completions
    )
    return getSuggestedPrompts(context)
  }, [activeContexts, challenges, tasks, completions])

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      {/* Header handled by Layout usually, but we can add a mini header for companion info */}
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.border, backgroundColor: colors.surface },
        ]}
      >
        <View style={styles.companionInfo}>
          {companionPhoto ? (
            <Image source={{ uri: companionPhoto }} style={styles.avatar} />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: colors.accent + "20" },
              ]}
            >
              <Ionicons name="sparkles" size={16} color={colors.accent} />
            </View>
          )}
          <View>
            <Text
              style={[
                typography.subheadlineBold,
                { color: colors.textPrimary },
              ]}
            >
              {companionName}
            </Text>
            <Text style={[typography.caption2, { color: colors.textTertiary }]}>
              Always here to help
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setShowContextPicker(!showContextPicker)}
          style={styles.contextButton}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Context Picker Overlay */}
      {showContextPicker && (
        <View
          style={[
            styles.contextPicker,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              typography.caption2,
              { color: colors.textSecondary, marginBottom: 8 },
            ]}
          >
            Add Context:
          </Text>
          <ScrollView style={{ maxHeight: 150 }}>
            {challenges.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={styles.contextItem}
                onPress={() => {
                  addContext(c, "challenge")
                  setShowContextPicker(false)
                }}
              >
                <Text style={{ color: colors.textPrimary }}>{c.name}</Text>
                {activeContexts.some((ctx) => ctx.id === c.id) && (
                  <Ionicons name="checkmark" size={16} color={colors.accent} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
      >
        {!hasKey ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="key-outline"
              size={48}
              color={colors.textTertiary}
            />
            <Text
              style={[
                typography.body,
                {
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginTop: 16,
                },
              ]}
            >
              Configure your AI settings to start chatting.
            </Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={48}
              color={colors.textTertiary}
            />
            <Text
              style={[
                typography.body,
                {
                  color: colors.textSecondary,
                  textAlign: "center",
                  marginTop: 16,
                },
              ]}
            >
              Hi! I'm here to chat. What's on your mind?
            </Text>
            {/* Suggestions */}
            <View style={styles.suggestionsContainer}>
              {suggestedPrompts.map((prompt, i) => (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.suggestionChip,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleSuggestionClick(prompt)}
                >
                  <Text
                    style={[typography.caption1, { color: colors.textPrimary }]}
                  >
                    {prompt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          messages.map((msg, i) => (
            <View
              key={i}
              style={[
                styles.messageRow,
                msg.role === "user" ? styles.userRow : styles.assistantRow,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  msg.role === "user"
                    ? {
                        backgroundColor: colors.accent,
                        borderTopRightRadius: 4,
                      }
                    : {
                        backgroundColor: colors.surface,
                        borderTopLeftRadius: 4,
                        borderColor: colors.border,
                        borderWidth: 1,
                      },
                ]}
              >
                <Text
                  style={[
                    typography.body,
                    {
                      color: msg.role === "user" ? "#fff" : colors.textPrimary,
                    },
                  ]}
                >
                  {msg.content}
                </Text>
              </View>
            </View>
          ))
        )}

        {generating && (
          <View style={[styles.messageRow, styles.assistantRow]}>
            <View
              style={[
                styles.messageBubble,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 1,
                },
              ]}
            >
              <ActivityIndicator size="small" color={colors.textTertiary} />
            </View>
          </View>
        )}

        {error && (
          <Text
            style={{ color: "red", textAlign: "center", marginVertical: 10 }}
          >
            {error}
          </Text>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Active Contexts Pills */}
      {activeContexts.length > 0 && (
        <ScrollView
          horizontal
          style={styles.contextPillsContainer}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {activeContexts.map((ctx) => (
            <View
              key={ctx.id}
              style={[
                styles.contextPill,
                {
                  backgroundColor: colors.accent + "20",
                  borderColor: colors.accent,
                },
              ]}
            >
              <Text style={[typography.caption2, { color: colors.accent }]}>
                {ctx.name}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  setActiveContexts((prev) =>
                    prev.filter((p) => p.id !== ctx.id)
                  )
                }
              >
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={colors.accent}
                  style={{ marginLeft: 4 }}
                />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Input Area */}
      <View
        style={[
          styles.inputContainer,
          { backgroundColor: colors.surface, borderTopColor: colors.border },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.background, color: colors.textPrimary },
          ]}
          placeholder="Type a message..."
          placeholderTextColor={colors.textTertiary}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor:
                !inputText.trim() || generating
                  ? colors.textTertiary
                  : colors.accent,
            },
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || generating}
        >
          <Ionicons name="send" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderBottomWidth: 1,
  },
  companionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  contextButton: {
    padding: 4,
  },
  contextPicker: {
    position: "absolute",
    top: 60,
    right: 12,
    width: 200,
    zIndex: 100,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  contextItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 32,
  },
  messageRow: {
    marginBottom: 16,
    flexDirection: "row",
    width: "100%",
  },
  userRow: {
    justifyContent: "flex-end",
  },
  assistantRow: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: "85%",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 32,
  },
  suggestionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
  },
  suggestionChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  contextPillsContainer: {
    maxHeight: 50,
    paddingVertical: 8,
  },
  contextPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
})
