import { useState, useEffect, useCallback } from "react"
import { callAI } from "../lib/ai/client"
import { useAuth } from "../components/auth/AuthProvider"
import { buildSystemPrompt } from "../lib/ai/prompts"
import { useAIConfig, AIConfig } from "./useAIConfig"
import { supabase } from "../lib/supabase"

// In-memory cache for ambient notes
export const noteCache = new Map<string, { note: string; timestamp: number }>()

// Refresh trigger - listeners get notified when cache is cleared
let refreshListeners = new Set<(counter: number) => void>()
let refreshCounter = 0

function notifyRefresh() {
  refreshCounter++
  refreshListeners.forEach((listener) => listener(refreshCounter))
}

export function clearAmbientCache() {
  noteCache.clear()
  notifyRefresh()
}

/**
 * Pre-fetch an ambient note and store in cache
 */
export async function prefetchAmbientNote(
  contextType: string,
  contextData: any,
  config: AIConfig | null,
  userName: string | null = null
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
    const wrapPrompt = (basePrompt: string) => {
      const userContext = `\nAddress the user as "${userName || "Friend"}".${config?.user_details ? `\nUser Context: ${config.user_details}` : ""}`

      return `ACT STRICTLY AS YOUR PERSONALITY: "${config?.personality_preset || "neutral"}".
Roleplay this persona completely. Speak TO the user.${userContext}
Custom Instructions: "${config?.custom_instructions || "none"}".

TASK: ${basePrompt}

Remember: You are the character. Do not break character.`
    }

    const contextPrompts: Record<string, string> = {
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
 */
export function useAmbientNotes(contextType: string, contextData: any) {
  const { config } = useAIConfig()
  const { user } = useAuth()
  const [note, setNote] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Subscribe to refresh events (triggered by clearAmbientCache)
  useEffect(() => {
    const listener = (counter: number) => setRefreshTrigger(counter)
    refreshListeners.add(listener)
    return () => {
      refreshListeners.delete(listener)
    }
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
      ? `${contextData.challengeId || ""}:${contextData.completionsCount || 0}:${contextData.progress || 0}:${contextData.trend || ""}:${contextData.daysElapsed || ""}:${contextData.taskName || ""}:${contextData.daysSinceLastDone || ""}`
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
        noteCache.set(cacheKey, {
          note: persistentNote.note,
          timestamp: Date.now(),
        })
        setLoading(false)
        return
      }

      // 2. Generate new note
      const userName =
        user?.user_metadata?.full_name?.split(" ")[0] ||
        user?.email?.split("@")[0] ||
        "Friend"

      const newNote = await prefetchAmbientNote(
        contextType,
        contextData,
        config,
        userName
      )

      if (newNote) {
        setNote(newNote)
      }
    } catch (err) {
      console.warn("Ambient note generation failed:", err)
    } finally {
      setLoading(false)
    }
  }, [config, contextType, contextData, user])

  // Generate on mount or when context/config changes
  useEffect(() => {
    if (config?.api_key && contextData && user) {
      generateNote()
    }
  }, [config, contextData, generateNote, user, refreshTrigger])

  return { note, loading }
}
