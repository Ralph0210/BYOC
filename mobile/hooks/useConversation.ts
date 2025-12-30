import { useState, useCallback, useEffect, useRef } from "react"
import { useAuth } from "../components/auth/AuthProvider"
import { useAIConfig } from "./useAIConfig"
import { useAIMemory } from "./useAIMemory"
import { callAI } from "../lib/ai/client"
import { supabase } from "../lib/supabase"
import {
  buildSystemPrompt,
  buildMemoryExtractionPrompt,
} from "../lib/ai/prompts"

// In-memory cache for session persistence (survives component unmounts)
// Store both messages and the conversation ID
const sessionCache = new Map<string, { id: string | null; messages: any[] }>()

const GLOBAL_CHAT_ID = "00000000-0000-0000-0000-000000000000"

export function useConversation(activeContexts: any[] = []) {
  const { config, hasKey } = useAIConfig()
  const { user } = useAuth()
  const { memories, addMemories, getMemoriesForContext } = useAIMemory()
  const challengeId = GLOBAL_CHAT_ID

  const [messages, setMessages] = useState<any[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Store the conversation UUID from DB
  const conversationIdRef = useRef<string | null>(null)

  // Track if we need to extract memories (every 5 messages)
  const messageCountRef = useRef(0)

  // Load conversation history
  useEffect(() => {
    // 1. Check session cache first
    if (sessionCache.has(challengeId)) {
      const cached = sessionCache.get(challengeId)
      setMessages(cached?.messages || [])
      conversationIdRef.current = cached?.id || null
      messageCountRef.current = cached?.messages?.length || 0
      return
    }

    // 2. Load from Supabase
    async function loadHistory() {
      let query = supabase
        .from("ai_conversations")
        .select("id, messages")
        .maybeSingle()

      if (challengeId === GLOBAL_CHAT_ID) {
        query = query.is("challenge_id", null)
      } else {
        query = query.eq("challenge_id", challengeId)
      }

      const { data, error } = await query

      if (error) {
        console.error("Failed to load chat history", error)
        return
      }

      const history = (data?.messages as any[]) || []
      const id = data?.id || null

      setMessages(history)
      conversationIdRef.current = id
      messageCountRef.current = history.length

      // Update cache
      sessionCache.set(challengeId, { id, messages: history })
    }

    loadHistory()
  }, [])

  // Save conversation history to Supabase
  const saveHistory = useCallback(
    async (newMessages: any[]) => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Use NULL for global chat ID in database
      const dbChallengeId = challengeId === GLOBAL_CHAT_ID ? null : challengeId

      try {
        if (conversationIdRef.current) {
          // Update existing conversation
          const { error } = await supabase
            .from("ai_conversations")
            .update({
              messages: newMessages,
              updated_at: new Date().toISOString(),
            })
            .eq("id", conversationIdRef.current)

          if (error) throw error
        } else {
          // Insert new conversation
          // Note: Without UNIQUE constraint on (user_id, challenge_id), this could duplicate if race condition, but acceptable risk here.
          const { data, error } = await supabase
            .from("ai_conversations")
            .insert({
              user_id: user.id,
              challenge_id: dbChallengeId,
              messages: newMessages,
              updated_at: new Date().toISOString(),
            })
            .select("id")
            .single()

          if (error) throw error

          if (data) {
            conversationIdRef.current = data.id
            // Update cache with new ID
            sessionCache.set(challengeId, {
              id: data.id,
              messages: newMessages,
            })
          }
        }
      } catch (err) {
        console.error("Failed to save chat history", err)
      }
    },
    [challengeId]
  ) // Added challengeId dependency for dbChallengeId

  // Extract memories from conversation (runs in background)
  const extractMemories = useCallback(
    async (conversationMessages: any[]) => {
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
              content: `Here's the conversation:\n${recentMessages.map((m: any) => `${m.role}: ${m.content}`).join("\n")}\n\nExtract any memorable information.`,
            },
          ],
          config,
          { contextType: "memory" }
        )

        if (response) {
          // Try to parse the JSON response
          const jsonMatch = response.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0])
            if (parsed.memories?.length > 0) {
              const newMemories = parsed.memories.map((m: any) => ({
                memory_type: m.type || "conversation",
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
    async (content: string) => {
      if (!config?.api_key || !content.trim()) return

      const newMessage = { role: "user", content }
      const updatedWithUser = [...messages, newMessage]

      setMessages(updatedWithUser)
      // Update cache immediately (keep ID if we have it)
      const currentId = conversationIdRef.current
      sessionCache.set(challengeId, {
        id: currentId,
        messages: updatedWithUser,
      })

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

          // Update cache with refetched ID if needed (though unlikely to change)
          sessionCache.set(challengeId, {
            id: conversationIdRef.current,
            messages: updatedMessages,
          })

          saveHistory(updatedMessages)

          // Extract memories every 6 messages (in background)
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
      activeContexts,
      messages,
      getMemoriesForContext,
      extractMemories,
      saveHistory,
      user,
      challengeId, // Added dependency
    ]
  )

  const clearConversation = useCallback(async () => {
    setMessages([])
    messageCountRef.current = 0
    conversationIdRef.current = null
    sessionCache.delete(challengeId)

    let query = supabase.from("ai_conversations").delete()

    if (challengeId === GLOBAL_CHAT_ID) {
      query = query.is("challenge_id", null)
    } else {
      query = query.eq("challenge_id", challengeId)
    }

    await query
  }, [challengeId])

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
