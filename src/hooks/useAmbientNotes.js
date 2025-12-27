import { useState, useEffect, useCallback } from "react"
import { callAI } from "../lib/ai/client"
import { buildSystemPrompt } from "../lib/ai/prompts"
import { useAIConfig } from "./useAIConfig"

// In-memory cache for ambient notes
export const noteCache = new Map()

/**
 * Pre-fetch an ambient note and store in cache
 */
export async function prefetchAmbientNote(contextType, contextData, config) {
  if (!config?.api_key || !contextData) return null

  const cacheKey = `${contextType}:${JSON.stringify(contextData).slice(0, 100)}`

  // Check cache first
  const cached = noteCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached.note
  }

  try {
    const contextPrompts = {
      header: `Write a brief 1-sentence ambient note for: "${contextData.challengeName}", Day ${contextData.daysElapsed}/${contextData.totalDays}, ${contextData.progress}% complete. Be observational, not cheerleader-y. Example: "Day 12. You've found your groove this week."`,
      task: `A task called "${contextData.taskName}" hasn't been done in ${contextData.daysSinceLastDone} days. Write a SHORT, warm encouragement (4-10 words). Follow personality guidelines.`,
      summary: `Write 1-2 sentences summarizing today: ${contextData.completedToday}/${contextData.targetToday} tasks done.`,
      empty: `Write a brief message (max 12 words) for someone with no tasks today.`,
      return: `Write 1-2 sentences welcoming someone back after ${contextData.daysAway} days away.`,
      calendar: `Write 3-5 words celebrating a perfect day.`,
    }

    const userPrompt = contextPrompts[contextType] || contextPrompts.header
    const systemPrompt = buildSystemPrompt(config, contextData)

    const response = await callAI(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      config,
      { contextType: "ambient" }
    )

    if (response) {
      const cleanNote = response.replace(/^["']|["']$/g, "").trim()
      noteCache.set(cacheKey, { note: cleanNote, timestamp: Date.now() })
      return cleanNote
    }
  } catch (err) {
    console.warn("Prefetch failed:", err)
  }
  return null
}

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
      // Build context-specific prompt - more specific and actionable
      const contextPrompts = {
        header: `Write a brief 1-sentence ambient note for: "${contextData.challengeName}", Day ${contextData.daysElapsed}/${contextData.totalDays}, ${contextData.progress}% complete. Be observational, not cheerleader-y. Example: "Day 12. You've found your groove this week."`,

        task: `A task called "${contextData.taskName}" hasn't been done in ${contextData.daysSinceLastDone} days.

Write a SHORT, warm encouragement (4-10 words). Follow your personality:
- Warm Encourager: gentle, supportive, believes in them
- Direct Coach: simple nudge, no fluff
- Curious Friend: light, friendly 
- Quiet Supporter: minimal but present

Good examples: "You've got this one", "Small step today?", "Ready when you are", "This one's waiting for you"

NEVER guilt-trip or use "should", "need to", "don't forget".
Just the encouragement, no quotes.`,

        summary: `Write 1-2 sentences summarizing today: ${contextData.completedToday}/${contextData.targetToday} tasks done. ${contextData.missedTasks?.length > 0 ? `Skipped: ${contextData.missedTasks.join(", ")}` : "All completed."}. Be matter-of-fact, acknowledge what was done. Follow your personality.`,

        empty: `Write a brief message (max 12 words) for someone with no tasks today. Keep it light—could be about rest, or asking if they want to add something. No exclamation points.`,

        return: `Write 1-2 sentences welcoming someone back after ${contextData.daysAway} days away. Be warm, zero guilt. Maybe ask if they want to continue or start fresh.`,

        calendar: `Write 3-5 words celebrating a perfect day (all tasks done). Keep it understated. Examples: "Solid day.", "Clean sweep.", "That's all of them."`,
      }

      const userPrompt = contextPrompts[contextType] || contextPrompts.header

      const systemPrompt = buildSystemPrompt(config, contextData)

      const response = await callAI(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        config,
        { contextType: "ambient" }
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
