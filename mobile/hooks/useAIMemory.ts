import { useState, useEffect, useCallback } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "../components/auth/AuthProvider"

export type Memory = {
  id: string
  user_id: string
  memory_type: "fact" | "preference" | "pattern" | "style" | "conversation"
  content: string
  context?: any
  confidence: number
  source: string
  times_referenced: number
  last_referenced: string
  created_at: string
}

/**
 * Hook for managing long-term AI memories
 * Memories persist across challenges and conversations
 */
export function useAIMemory() {
  const { user } = useAuth()
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch all memories for the user
  const fetchMemories = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("ai_memories")
        .select("*")
        .eq("user_id", user.id)
        .order("times_referenced", { ascending: false })
        .limit(50) // Limit to most-referenced memories

      if (error && error.code !== "PGRST116") {
        throw error
      }

      setMemories((data as Memory[]) || [])
    } catch (err) {
      console.error("Error fetching memories:", err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchMemories()
  }, [fetchMemories])

  // Add a new memory
  const addMemory = async (memory: Partial<Memory>) => {
    if (!user) return null

    try {
      const { data, error } = await supabase
        .from("ai_memories")
        .upsert(
          {
            user_id: user.id,
            memory_type: memory.memory_type,
            content: memory.content,
            context: memory.context || null,
            confidence: memory.confidence || 0.8,
            source: memory.source || "inferred",
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,content",
            ignoreDuplicates: false,
          }
        )
        .select()
        .single()

      if (error) throw error

      // Update local state
      setMemories((prev) => {
        const exists = prev.find((m) => m.id === data.id)
        if (exists) {
          return prev.map((m) => (m.id === data.id ? data : m))
        }
        return [data, ...prev]
      })

      return data
    } catch (err) {
      console.error("Error adding memory:", err)
      return null
    }
  }

  // Add multiple memories at once (from conversation extraction)
  const addMemories = async (newMemories: Partial<Memory>[]) => {
    if (!user || !newMemories?.length) return []

    const results = await Promise.all(newMemories.map((m) => addMemory(m)))
    return results.filter(Boolean)
  }

  // Delete a memory
  const deleteMemory = async (memoryId: string) => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from("ai_memories")
        .delete()
        .eq("id", memoryId)
        .eq("user_id", user.id)

      if (error) throw error

      setMemories((prev) => prev.filter((m) => m.id !== memoryId))
      return true
    } catch (err) {
      console.error("Error deleting memory:", err)
      return false
    }
  }

  // Clear all memories
  const clearAllMemories = async () => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from("ai_memories")
        .delete()
        .eq("user_id", user.id)

      if (error) throw error

      setMemories([])
      return true
    } catch (err) {
      console.error("Error clearing memories:", err)
      return false
    }
  }

  // Mark a memory as referenced (boosts its importance)
  const referenceMemory = async (memoryId: string) => {
    if (!user) return

    try {
      const memory = memories.find((m) => m.id === memoryId)
      if (!memory) return

      await supabase
        .from("ai_memories")
        .update({
          times_referenced: (memory.times_referenced || 0) + 1,
          last_referenced: new Date().toISOString(),
        })
        .eq("id", memoryId)
    } catch (err) {
      console.error("Error referencing memory:", err)
    }
  }

  // Get memories formatted for AI context
  const getMemoriesForContext = useCallback(() => {
    if (!memories.length) return null

    const grouped = {
      facts: memories.filter((m) => m.memory_type === "fact"),
      preferences: memories.filter((m) => m.memory_type === "preference"),
      patterns: memories.filter((m) => m.memory_type === "pattern"),
      style: memories.filter((m) => m.memory_type === "style"),
      conversation: memories.filter((m) => m.memory_type === "conversation"),
    }

    const sections = []

    if (grouped.facts.length) {
      sections.push(
        `Facts about you:\n${grouped.facts.map((m) => `- ${m.content}`).join("\n")}`
      )
    }
    if (grouped.preferences.length) {
      sections.push(
        `Your preferences:\n${grouped.preferences.map((m) => `- ${m.content}`).join("\n")}`
      )
    }
    if (grouped.patterns.length) {
      sections.push(
        `Patterns I've noticed:\n${grouped.patterns.map((m) => `- ${m.content}`).join("\n")}`
      )
    }
    if (grouped.style.length) {
      sections.push(
        `Communication style:\n${grouped.style.map((m) => `- ${m.content}`).join("\n")}`
      )
    }
    if (grouped.conversation.length) {
      sections.push(
        `From our conversations:\n${grouped.conversation
          .slice(0, 5)
          .map((m) => `- ${m.content}`)
          .join("\n")}`
      )
    }

    return sections.length ? sections.join("\n\n") : null
  }, [memories])

  return {
    memories,
    loading,
    addMemory,
    addMemories,
    deleteMemory,
    clearAllMemories,
    referenceMemory,
    getMemoriesForContext,
    refetch: fetchMemories,
  }
}
