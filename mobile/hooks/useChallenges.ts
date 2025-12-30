/**
 * useChallenges Hook
 *
 * Manages challenge data fetching and CRUD operations.
 * Ported from web app with TypeScript types.
 */

import { useState, useCallback } from "react"
import { supabase } from "../lib/supabase"
import { Challenge } from "../lib/utils"

// Extended Challenge type with optional fields from database
export interface ChallengeDB extends Challenge {
  is_archived?: boolean
  duration_days?: number
  reward_text?: string
}

interface UseChallengesReturn {
  challenges: ChallengeDB[]
  loading: boolean
  error: string | null
  fetchChallenges: (includeArchived?: boolean) => Promise<ChallengeDB[]>
  createChallenge: (data: Partial<ChallengeDB>) => Promise<ChallengeDB | null>
  updateChallenge: (
    id: string,
    updates: Partial<ChallengeDB>
  ) => Promise<ChallengeDB | null>
  deleteChallenge: (id: string) => Promise<boolean>
  archiveChallenge: (id: string) => Promise<ChallengeDB | null>
}

export function useChallenges(): UseChallengesReturn {
  const [challenges, setChallenges] = useState<ChallengeDB[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchChallenges = useCallback(
    async (includeArchived = false): Promise<ChallengeDB[]> => {
      setLoading(true)
      setError(null)

      try {
        let query = supabase
          .from("challenges")
          .select("*")
          .order("created_at", { ascending: false })

        if (!includeArchived) {
          query = query.eq("is_archived", false)
        }

        const { data, error: fetchError } = await query

        if (fetchError) throw fetchError

        const challengeData = (data || []) as ChallengeDB[]
        setChallenges(challengeData)
        return challengeData
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch challenges"
        setError(message)
        return []
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const createChallenge = useCallback(
    async (
      challengeData: Partial<ChallengeDB>
    ): Promise<ChallengeDB | null> => {
      setError(null)

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          throw new Error("You must be logged in to create a challenge")
        }

        const { data, error: createError } = await supabase
          .from("challenges")
          .insert([{ ...challengeData, user_id: user.id }])
          .select()
          .single()

        if (createError) throw createError

        const newChallenge = data as ChallengeDB
        setChallenges((prev) => [newChallenge, ...prev])
        return newChallenge
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to create challenge"
        setError(message)
        return null
      }
    },
    []
  )

  const updateChallenge = useCallback(
    async (
      id: string,
      updates: Partial<ChallengeDB>
    ): Promise<ChallengeDB | null> => {
      setError(null)

      try {
        const { data, error: updateError } = await supabase
          .from("challenges")
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq("id", id)
          .select()
          .single()

        if (updateError) throw updateError

        const updatedChallenge = data as ChallengeDB
        setChallenges((prev) =>
          prev.map((c) => (c.id === id ? updatedChallenge : c))
        )
        return updatedChallenge
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update challenge"
        setError(message)
        return null
      }
    },
    []
  )

  const deleteChallenge = useCallback(async (id: string): Promise<boolean> => {
    setError(null)

    try {
      const { error: deleteError } = await supabase
        .from("challenges")
        .delete()
        .eq("id", id)

      if (deleteError) throw deleteError

      setChallenges((prev) => prev.filter((c) => c.id !== id))
      return true
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete challenge"
      setError(message)
      return false
    }
  }, [])

  const archiveChallenge = useCallback(
    async (id: string): Promise<ChallengeDB | null> => {
      return updateChallenge(id, { is_archived: true })
    },
    [updateChallenge]
  )

  return {
    challenges,
    loading,
    error,
    fetchChallenges,
    createChallenge,
    updateChallenge,
    deleteChallenge,
    archiveChallenge,
  }
}
