import { useState, useCallback, useEffect } from "react"
import { useAIConfig } from "./useAIConfig"
import { useAIContext } from "./useAIContext"
import { callAI } from "../lib/ai/client"
import { buildSystemPrompt } from "../lib/ai/prompts"
import { supabase } from "../lib/supabase"

export function useConversation(challenge, tasks, completions) {
  const { config, hasKey } = useAIConfig()
  const context = useAIContext(challenge, tasks, completions)
  const challengeId = challenge?.id

  const [messages, setMessages] = useState([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  // Load conversation history from local storage
  useEffect(() => {
    if (!challengeId) {
      setMessages([])
      return
    }

    const stored = localStorage.getItem(`path_chat_${challengeId}`)
    if (stored) {
      try {
        setMessages(JSON.parse(stored))
      } catch (e) {
        console.error("Failed to load chat history", e)
      }
    } else {
      setMessages([])
    }
  }, [challengeId])

  // Save conversation history
  useEffect(() => {
    if (challengeId && messages.length > 0) {
      localStorage.setItem(`path_chat_${challengeId}`, JSON.stringify(messages))
    }
  }, [challengeId, messages])

  const sendMessage = useCallback(
    async (content) => {
      if (!config?.api_key || !content.trim()) return

      const newMessage = { role: "user", content }
      setMessages((prev) => [...prev, newMessage])
      setGenerating(true)
      setError(null)

      try {
        const systemPrompt = buildSystemPrompt(config, context)

        // Construct message history for API
        // We send full history for context window (could optimized later)
        const apiMessages = [
          { role: "system", content: systemPrompt },
          ...messages,
          newMessage,
        ]

        const response = await callAI(apiMessages, config)

        if (response) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: response },
          ])
        }
      } catch (err) {
        console.error("Chat Error:", err)
        setError("I'm having trouble connecting right now.")
      } finally {
        setGenerating(false)
      }
    },
    [config, context, messages]
  )

  return {
    messages,
    sendMessage,
    generating,
    hasKey,
    error,
  }
}
