import { useState, useEffect, useCallback } from "react"
import { callAI } from "../lib/ai/client"
import { buildSystemPrompt } from "../lib/ai/prompts"
import { useAIConfig } from "./useAIConfig"
import { supabase } from "../lib/supabase"

// In-memory cache for ambient notes
export const noteCache = new Map()

/**
 * Pre-fetch an ambient note and store in cache
 */
export async function prefetchAmbientNote(contextType, contextData, config) {
  if (!config?.api_key || !contextData) return null

  const cacheKey = `${contextType}:${JSON.stringify(contextData).slice(0, 150)}`

  // 1. Check in-memory cache first
  const cached = noteCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
    return cached.note
  }

  try {
    // 2. Check Supabase persistent cache
    const { data: persistentNote } = await supabase
      .from("ai_ambient_notes")
      .select("note")
      .eq("cache_key", cacheKey)
      .maybeSingle()

    if (persistentNote) {
      noteCache.set(cacheKey, {
        note: persistentNote.note,
        timestamp: Date.now(),
      })
      return persistentNote.note
    }

    // 3. Fallback to AI
    const contextPrompts = {
      header: `Write a brief 1-sentence ambient note for: "${contextData.challengeName}", Day ${contextData.daysElapsed}/${contextData.totalDays}, ${contextData.progress}% complete. Be observational, not cheerleader-y. Example: "Day 12. You've found your groove this week."`,
      task: `A task called "${contextData.taskName}" hasn't been done in ${contextData.daysSinceLastDone} days.
Write a SHORT, warm encouragement (4-10 words). Follow your personality guidelines. Just the encouragement, no quotes.`,
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

      // Save to in-memory cache
      noteCache.set(cacheKey, { note: cleanNote, timestamp: Date.now() })

      // Save to Supabase (ignore errors to prevent blocking UI)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        supabase
          .from("ai_ambient_notes")
          .upsert({
            user_id: user.id,
            cache_key: cacheKey,
            context_type: contextType,
            note: cleanNote,
            context_data: contextData,
          })
          .then(({ error }) => {
            if (error) console.warn("Failed to persist ambient note:", error)
          })
      }

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

    // Create cache key - Standardized to 150 chars for accuracy
    const cacheKey = `${contextType}:${JSON.stringify(contextData).slice(0, 150)}`

    // Check in-memory cache first
    const cached = noteCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < 10 * 60 * 1000) {
      setNote(cached.note)
      return
    }

    // STALE-WHILE-REVALIDATE logic
    // We only set loading if we don't have a cached version already
    if (!cached || Date.now() - cached.timestamp > 10 * 60 * 1000) {
      setLoading(true)
    }

    try {
      // 1. Check Supabase persistent cache
      const { data: persistentNote } = await supabase
        .from("ai_ambient_notes")
        .select("note")
        .eq("cache_key", cacheKey)
        .maybeSingle()

      if (persistentNote) {
        setNote(persistentNote.note)
        setLoading(false)
        noteCache.set(cacheKey, {
          note: persistentNote.note,
          timestamp: Date.now(),
        })
        return // Found in persistent cache, no need to call AI
      }

      // Build context-specific prompt
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
        const cleanNote = response.replace(/^["']|["']$/g, "").trim()
        setNote(cleanNote)
        noteCache.set(cacheKey, { note: cleanNote, timestamp: Date.now() })

        // Save to Supabase
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          supabase
            .from("ai_ambient_notes")
            .upsert({
              user_id: user.id,
              cache_key: cacheKey,
              context_type: contextType,
              note: cleanNote,
              context_data: contextData,
            })
            .then(({ error }) => {
              if (error) console.warn("Failed to persist ambient note:", error)
            })
        }
      }
    } catch (err) {
      console.warn("Failed to generate ambient note:", err)
      // Only clear note if we have absolutely nothing
      if (!note) setNote(null)
    } finally {
      setLoading(false)
    }
  }, [config, contextType, JSON.stringify(contextData)]) // Stringify contextData to ensure stable dependency

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
