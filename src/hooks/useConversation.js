import { useState, useCallback, useEffect, useRef } from "react"
import { useAIConfig } from "./useAIConfig"
import { useAIContext } from "./useAIContext"
import { useAIMemory } from "./useAIMemory"
import { callAI } from "../lib/ai/client"
import {
  buildSystemPrompt,
  buildMemoryExtractionPrompt,
} from "../lib/ai/prompts"

export function useConversation(challenge, tasks, completions) {
  const { config, hasKey } = useAIConfig()
  const context = useAIContext(challenge, tasks, completions)
  const { memories, addMemories, getMemoriesForContext } = useAIMemory()
  const challengeId = challenge?.id

  const [messages, setMessages] = useState([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  // Track if we need to extract memories (every 5 messages)
  const messageCountRef = useRef(0)

  // Load conversation history from local storage
  useEffect(() => {
    if (!challengeId) {
      setMessages([])
      return
    }

    const stored = localStorage.getItem(`path_chat_${challengeId}`)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setMessages(parsed)
        messageCountRef.current = parsed.length
      } catch (e) {
        console.error("Failed to load chat history", e)
      }
    } else {
      setMessages([])
      messageCountRef.current = 0
    }
  }, [challengeId])

  // Save conversation history
  useEffect(() => {
    if (challengeId && messages.length > 0) {
      localStorage.setItem(`path_chat_${challengeId}`, JSON.stringify(messages))
    }
  }, [challengeId, messages])

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
          { ...config, model: config.model || "gpt-4o-mini" }
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
                context: `From chat about ${challenge?.name || "challenge"}`,
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
    [config, memories, addMemories, challenge?.name]
  )

  const sendMessage = useCallback(
    async (content) => {
      if (!config?.api_key || !content.trim()) return

      const newMessage = { role: "user", content }
      setMessages((prev) => [...prev, newMessage])
      setGenerating(true)
      setError(null)

      try {
        // Include long-term memories in system prompt
        const memoriesContext = getMemoriesForContext()
        const systemPrompt = buildSystemPrompt(config, context, memoriesContext)

        // Construct message history for API
        const apiMessages = [
          { role: "system", content: systemPrompt },
          ...messages,
          newMessage,
        ]

        const response = await callAI(apiMessages, config)

        if (response) {
          const assistantMessage = { role: "assistant", content: response }
          setMessages((prev) => [...prev, assistantMessage])

          // Extract memories every 5 messages (in background)
          messageCountRef.current += 2 // user + assistant
          if (
            messageCountRef.current >= 6 &&
            messageCountRef.current % 6 === 0
          ) {
            // Run extraction in background (don't await)
            extractMemories([...messages, newMessage, assistantMessage])
          }
        }
      } catch (err) {
        console.error("Chat Error:", err)
        setError("I'm having trouble connecting right now.")
      } finally {
        setGenerating(false)
      }
    },
    [config, context, messages, getMemoriesForContext, extractMemories]
  )

  // Clear conversation for this challenge
  const clearConversation = useCallback(() => {
    setMessages([])
    messageCountRef.current = 0
    if (challengeId) {
      localStorage.removeItem(`path_chat_${challengeId}`)
    }
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
