import { useState, useEffect, useCallback } from "react"
import { callAI } from "../lib/ai/client"
import { buildSystemPrompt } from "../lib/ai/prompts"
import { useAIConfig } from "./useAIConfig"

// In-memory cache for ambient notes
const noteCache = new Map()

/**
 * Generate ambient notes for various contexts
 * @param {string} contextType - 'header' | 'task' | 'summary' | 'empty' | 'return' | 'calendar'
 * @param {object} contextData - Data specific to the context type
 */
export function useAmbientNotes(contextType, contextData) {
  const { config } = useAIConfig()
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(false)

  const generateNote = useCallback(async () => {
    if (!config?.api_key || !contextData) return

    // Create cache key
    const cacheKey = `${contextType}:${JSON.stringify(contextData).slice(0, 100)}`

    // Check cache first
    const cached = noteCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      // 5 min cache
      setNote(cached.note)
      return
    }

    setLoading(true)

    try {
      // Build context-specific prompt
      const contextPrompts = {
        header: `Generate a brief 1-sentence ambient note for the user's challenge header. Challenge: "${contextData.challengeName}", Day ${contextData.daysElapsed} of ${contextData.totalDays}, ${contextData.progress}% complete. Recent trend: ${contextData.trend || "stable"}.`,

        task: `Generate a brief nudge (max 10 words) for a task that hasn't been done in ${contextData.daysSinceLastDone} days. Task: "${contextData.taskName}". Be curious, not pushy.`,

        summary: `Generate a brief end-of-day summary (1-2 sentences). Today: ${contextData.completedToday}/${contextData.targetToday} tasks done. ${contextData.missedTasks?.length > 0 ? `Missed: ${contextData.missedTasks.join(", ")}` : "All done!"}`,

        empty: `Generate a brief encouraging message (max 15 words) for a user who has no tasks scheduled today. Keep it light.`,

        return: `Generate a warm welcome-back message (1-2 sentences) for a user returning after ${contextData.daysAway} days. Be supportive, no guilt. Offer to continue or start fresh.`,

        calendar: `Generate a very brief celebration (max 8 words) for a perfect day where all tasks were completed.`,
      }

      const userPrompt = contextPrompts[contextType] || contextPrompts.header

      const systemPrompt = buildSystemPrompt(config, contextData)

      const response = await callAI(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        config
      )

      if (response) {
        // Clean up response (remove quotes if present)
        const cleanNote = response.replace(/^["']|["']$/g, "").trim()
        setNote(cleanNote)

        // Cache the result
        noteCache.set(cacheKey, { note: cleanNote, timestamp: Date.now() })
      }
    } catch (err) {
      console.warn("Failed to generate ambient note:", err)
      setNote(null)
    } finally {
      setLoading(false)
    }
  }, [config, contextType, contextData])

  useEffect(() => {
    generateNote()
  }, [generateNote])

  return { note, loading, regenerate: generateNote }
}

/**
 * Hook to detect if user is returning after an absence
 */
export function useReturnDetection() {
  const [daysAway, setDaysAway] = useState(0)
  const [isReturning, setIsReturning] = useState(false)

  useEffect(() => {
    const lastVisit = localStorage.getItem("path_last_visit")
    const today = new Date().toISOString().split("T")[0]

    if (lastVisit && lastVisit !== today) {
      const lastDate = new Date(lastVisit)
      const todayDate = new Date(today)
      const diffDays = Math.floor(
        (todayDate - lastDate) / (1000 * 60 * 60 * 24)
      )

      if (diffDays >= 3) {
        setDaysAway(diffDays)
        setIsReturning(true)
      }
    }

    // Update last visit
    localStorage.setItem("path_last_visit", today)
  }, [])

  const dismissReturn = () => setIsReturning(false)

  return { daysAway, isReturning, dismissReturn }
}

// Clear cache on demand
export function clearAmbientCache() {
  noteCache.clear()
}
