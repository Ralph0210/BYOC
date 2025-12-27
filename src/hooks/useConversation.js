import { useState, useCallback, useEffect, useRef } from "react"
import { useAuth } from "./useAuth.jsx"
import { useAIConfig } from "./useAIConfig"
import { useAIMemory } from "./useAIMemory"
import { callAI } from "../lib/ai/client"
import { supabase } from "../lib/supabase"
import {
  buildSystemPrompt,
  buildMemoryExtractionPrompt,
} from "../lib/ai/prompts"

// In-memory cache for session persistence (survives component unmounts)
const sessionCache = new Map()

const GLOBAL_CHAT_ID = "00000000-0000-0000-0000-000000000000"

export function useConversation(activeContexts = []) {
  const { config, hasKey } = useAIConfig()
  const { user } = useAuth()
  const { memories, addMemories, getMemoriesForContext } = useAIMemory()
  const challengeId = GLOBAL_CHAT_ID

  const [messages, setMessages] = useState([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  // Track if we need to extract memories (every 5 messages)
  const messageCountRef = useRef(0)

  // Load conversation history
  useEffect(() => {
    // 1. Check session cache first
    if (sessionCache.has(challengeId)) {
      const cached = sessionCache.get(challengeId)
      setMessages(cached)
      messageCountRef.current = cached.length
      return
    }

    // 2. Load from Supabase
    async function loadHistory() {
      const { data, error } = await supabase
        .from("ai_conversations")
        .select("messages")
        .eq("challenge_id", challengeId)
        .single()

      if (error && error.code !== "PGRST116") {
        console.error("Failed to load chat history", error)
        return
      }

      const history = data?.messages || []
      setMessages(history)
      messageCountRef.current = history.length

      // Update cache
      sessionCache.set(challengeId, history)
    }

    loadHistory()
  }, [])

  // Save conversation history to Supabase
  const saveHistory = useCallback(async (newMessages) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("ai_conversations").upsert(
      {
        user_id: user.id,
        challenge_id: challengeId,
        messages: newMessages,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,challenge_id" }
    )

    if (error) {
      console.error("Failed to save chat history", error)
    }
  }, [])

  // Extract memories from conversation (runs in background)
  const extractMemories = useCallback(
    async (conversationMessages) => {
      if (!config?.api_key || conversationMessages.length < 4) return

      try {
        const extractionPrompt = buildMemoryExtractionPrompt(memories)

        // Use the last 10 messages for extraction
        const recentMessages = conversationMessages.slice(-10)

        const response = await callAI(
          [
            { role: "system", content: extractionPrompt },
            {
              role: "user",
              content: `Here's the conversation:\n${recentMessages.map((m) => `${m.role}: ${m.content}`).join("\n")}\n\nExtract any memorable information.`,
            },
          ],
          { ...config, model: config.model || "gpt-4o-mini" },
          { contextType: "memory" }
        ) // Use cheaper model

        if (response) {
          // Try to parse the JSON response
          const jsonMatch = response.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            if (parsed.memories?.length > 0) {
              const newMemories = parsed.memories.map((m) => ({
                type: m.type || "conversation",
                content: m.content,
                confidence: m.confidence || 0.7,
                source: "conversation",
                context: `From global chat session`,
              }))
              await addMemories(newMemories)
              console.log("Extracted memories:", newMemories.length)
            }
          }
        }
      } catch (err) {
        // Silent fail - memory extraction is optional
        console.warn("Memory extraction failed:", err)
      }
    },
    [config, memories, addMemories]
  )

  const sendMessage = useCallback(
    async (content) => {
      if (!config?.api_key || !content.trim()) return

      const newMessage = { role: "user", content }
      const updatedWithUser = [...messages, newMessage]

      setMessages(updatedWithUser)
      sessionCache.set(challengeId, updatedWithUser) // Update cache immediately for UI responsiveness

      setGenerating(true)
      setError(null)

      try {
        // Include long-term memories in system prompt
        const memoriesContext = getMemoriesForContext()
        const userName =
          user?.user_metadata?.full_name?.split(" ")[0] ||
          user?.email?.split("@")[0]

        // Pass the ACTIVE CONTEXTS array directly to buildSystemPrompt
        const systemPrompt = buildSystemPrompt(
          config,
          activeContexts,
          memoriesContext,
          userName
        )

        // Construct message history for API
        const apiMessages = [
          { role: "system", content: systemPrompt },
          ...messages,
          newMessage,
        ]

        const response = await callAI(apiMessages, config, {
          contextType: "chat",
        })

        if (response) {
          const assistantMessage = { role: "assistant", content: response }
          const updatedMessages = [...messages, newMessage, assistantMessage]
          setMessages(updatedMessages)
          sessionCache.set(challengeId, updatedMessages) // Update cache
          saveHistory(updatedMessages)

          // Extract memories every 5 messages (in background)
          messageCountRef.current += 2 // user + assistant
          if (
            messageCountRef.current >= 6 &&
            messageCountRef.current % 6 === 0
          ) {
            // Run extraction in background (don't await)
            extractMemories(updatedMessages)
          }
        }
      } catch (err) {
        console.error("Chat Error:", err)
        setError("I'm having trouble connecting right now.")
      } finally {
        setGenerating(false)
      }
    },
    [
      config,
      activeContexts, // Re-create sendMessage when active contexts change so prompt is improved
      messages,
      getMemoriesForContext,
      extractMemories,
      saveHistory,
    ]
  )

  const clearConversation = useCallback(async () => {
    setMessages([])
    messageCountRef.current = 0
    await supabase
      .from("ai_conversations")
      .delete()
      .eq("challenge_id", challengeId)
  }, [])

  return {
    messages,
    sendMessage,
    generating,
    hasKey,
    error,
    clearConversation,
    memoriesAvailable: memories.length > 0,
  }
}
