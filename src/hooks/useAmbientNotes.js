import { useState, useEffect, useCallback } from "react"
import { callAI } from "../lib/ai/client"
import { useAuth } from "./useAuth.jsx"
import { buildSystemPrompt } from "../lib/ai/prompts"
import { useAIConfig } from "./useAIConfig"
import { supabase } from "../lib/supabase"

// In-memory cache for ambient notes
export const noteCache = new Map()

// Refresh trigger - listeners get notified when cache is cleared
let refreshListeners = new Set()
let refreshCounter = 0

function notifyRefresh() {
  refreshCounter++
  refreshListeners.forEach((listener) => listener(refreshCounter))
}

/**
 * Pre-fetch an ambient note and store in cache
 */
export async function prefetchAmbientNote(
  contextType,
  contextData,
  config,
  userName = null
) {
  if (!config?.api_key || !contextData) return null

  // Create cache key - Put settings FIRST so they don't get truncated (matches useAmbientNotes)
  // Include custom_personality_prompt so changes invalidate cache
  const customPromptHash = (config?.custom_personality_prompt || "").slice(
    0,
    30
  )
  const settingsHash = `${config?.personality_preset || "default"}:${customPromptHash}:${(config?.custom_instructions || "").slice(0, 20)}:${config?.user_details?.slice(0, 15) || ""}`
  const cacheKey = `${contextType}:${settingsHash}:${JSON.stringify(contextData).slice(0, 120)}`

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

    // Helper to enforce personality
    const wrapPrompt = (basePrompt) => {
      const userContext = `\nAddress the user as "${userName || "Friend"}".${config?.user_details ? `\nUser Context: ${config.user_details}` : ""}`

      return `ACT STRICTLY AS YOUR PERSONALITY: "${config?.personality_preset || "neutral"}".
Roleplay this persona completely. Speak TO the user.${userContext}
Custom Instructions: "${config?.custom_instructions || "none"}".

TASK: ${basePrompt}

Remember: You are the character. Do not break character.`
    }

    const contextPrompts = {
      header: wrapPrompt(
        `Write a brief 1-sentence ambient note for: "${contextData.challengeName}", Day ${contextData.daysElapsed}/${contextData.totalDays}, ${contextData.progress}% complete. Be observational, not cheerleader-y. Example: "Day 12. You've found your groove this week."`
      ),
      insight:
        wrapPrompt(`Your goal is to react to the '${contextData.challengeName}' challenge status: Day ${contextData.daysElapsed}/${contextData.totalDays}, ${contextData.progress}% complete.
Do not just analyze—speak TO the user with your specific voice.
Keep it to 2-4 sentences. Be the character.`),
      task: wrapPrompt(`A task called "${contextData.taskName}" hasn't been done in ${contextData.daysSinceLastDone} days.
Write a SHORT, warm encouragement (4-10 words). Follow your personality guidelines. Just the encouragement, no quotes.`),
      summary: wrapPrompt(
        `Write 1-2 sentences summarizing today: ${contextData.completedToday}/${contextData.targetToday} tasks done.`
      ),
      empty: wrapPrompt(
        `Write a brief message (max 12 words) for someone with no tasks today.`
      ),
      return: wrapPrompt(
        `Write 1-2 sentences welcoming someone back after ${contextData.daysAway} days away.`
      ),
      calendar: wrapPrompt(`Write 3-5 words celebrating a perfect day.`),
    }

    const userPrompt = contextPrompts[contextType] || contextPrompts.header
    const systemPrompt = buildSystemPrompt(config, contextData, null, userName)

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
  const { user } = useAuth()
  const userName =
    user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0]
  const [note, setNote] = useState(null)
  const [loading, setLoading] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Subscribe to refresh events (triggered by clearAmbientCache)
  useEffect(() => {
    const listener = (counter) => setRefreshTrigger(counter)
    refreshListeners.add(listener)
    return () => refreshListeners.delete(listener)
  }, [])

  const generateNote = useCallback(async () => {
    if (!config?.api_key || !contextData) return

    // Create cache key - Include key context fields explicitly to avoid truncation issues
    // This ensures the cache invalidates when completions change
    const customPromptHash = (config?.custom_personality_prompt || "").slice(
      0,
      30
    )
    const settingsHash = `${config?.personality_preset || "default"}:${customPromptHash}:${(config?.custom_instructions || "").slice(0, 20)}:${config?.user_details?.slice(0, 15) || ""}`

    // Build explicit context hash to ensure completionsCount and progress are included
    const contextHash = contextData
      ? `${contextData.challengeId || ""}:${contextData.completionsCount || 0}:${contextData.progress || 0}:${contextData.trend || ""}:${contextData.daysElapsed || ""}`
      : "no-context"

    const cacheKey = `${contextType}:${settingsHash}:${contextHash}`

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
      // Helper to enforce personality
      const wrapPrompt = (basePrompt) => {
        const isCustom = config?.personality_preset === "custom"
        const personalityInstruction = isCustom
          ? config?.custom_personality_prompt || "Friendly companion"
          : config?.personality_preset || "neutral"

        const userContext = `\nAddress the user as "${userName || "Friend"}".${config?.user_details ? `\nUser Context: ${config.user_details}` : ""}`

        return `ACT STRICTLY AS YOUR PERSONALITY: "${personalityInstruction}".
Roleplay this persona completely. Speak TO the user.${userContext}
Custom Instructions: "${config?.custom_instructions || "none"}".

TASK: ${basePrompt}

Remember: You are the character. Do not break character.`
      }

      // Build context-specific prompt
      const contextPrompts = {
        header: wrapPrompt(
          `Write a brief 1-sentence ambient note for: "${contextData.challengeName}", Day ${contextData.daysElapsed}/${contextData.totalDays}, ${contextData.progress}% complete. Be observational, not cheerleader-y. Example: "Day 12. You've found your groove this week."`
        ),
        insight:
          wrapPrompt(`Your goal is to react to the '${contextData.challengeName}' challenge status: Day ${contextData.daysElapsed}/${contextData.totalDays}, ${contextData.progress}% complete.
Do not just analyze—speak TO the user with your specific voice.
Keep it to 2-4 sentences. Be the character.`),

        task: wrapPrompt(`A task called "${contextData.taskName}" hasn't been done in ${contextData.daysSinceLastDone} days.
Write a SHORT, warm encouragement (4-10 words). Follow your personality guidelines. Just the encouragement, no quotes.`),

        summary: wrapPrompt(
          `Write 1-2 sentences summarizing today: ${contextData.completedToday}/${contextData.targetToday} tasks done. ${contextData.missedTasks?.length > 0 ? `Skipped: ${contextData.missedTasks.join(", ")}` : "All completed."}. Be matter-of-fact, acknowledge what was done.`
        ),

        empty: wrapPrompt(
          `Write a brief message (max 12 words) for someone with no tasks today. Keep it light.`
        ),

        return: wrapPrompt(
          `Write 1-2 sentences welcoming someone back after ${contextData.daysAway} days away. Be warm, zero guilt.`
        ),

        calendar: wrapPrompt(
          `Write 3-5 words celebrating a perfect day (all tasks done). Keep it understated. Examples: "Solid day.", "Clean sweep.", "That's all of them."`
        ),
      }

      const userPrompt = contextPrompts[contextType] || contextPrompts.header
      const systemPrompt = buildSystemPrompt(
        config,
        contextData,
        null,
        userName
      )

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
  }, [
    config,
    contextType,
    JSON.stringify({
      ...contextData,
      p: config?.personality_preset,
      u: config?.user_details,
    }), // Add personality/user to dependency to trigger re-run
    refreshTrigger, // Re-run when cache is cleared
  ])

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
    const lastVisit = localStorage.getItem("byoc_last_visit")
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
    localStorage.setItem("byoc_last_visit", today)
  }, [])

  const dismissReturn = () => setIsReturning(false)

  return { daysAway, isReturning, dismissReturn }
}

// Clear cache on demand and trigger refresh in all components
export function clearAmbientCache() {
  noteCache.clear()
  notifyRefresh() // Notify all useAmbientNotes hooks to re-generate
}
