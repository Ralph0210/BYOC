import { useState, useCallback } from "react"
import { supabase } from "../lib/supabase"

export function useChallenges() {
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchChallenges = useCallback(async (includeArchived = false) => {
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
      setChallenges(data || [])
      return data
    } catch (err) {
      setError(err.message)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createChallenge = useCallback(async (challengeData) => {
    setError(null)

    try {
      const { data, error: createError } = await supabase
        .from("challenges")
        .insert([challengeData])
        .select()
        .single()

      if (createError) throw createError

      setChallenges((prev) => [data, ...prev])
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [])

  const updateChallenge = useCallback(async (id, updates) => {
    setError(null)

    try {
      const { data, error: updateError } = await supabase
        .from("challenges")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (updateError) throw updateError

      setChallenges((prev) => prev.map((c) => (c.id === id ? data : c)))
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [])

  const deleteChallenge = useCallback(async (id) => {
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
      setError(err.message)
      return false
    }
  }, [])

  const archiveChallenge = useCallback(
    async (id) => {
      return updateChallenge(id, { is_archived: true })
    },
    [updateChallenge]
  )

  const extendChallenge = useCallback(
    async (id, additionalDays) => {
      const challenge = challenges.find((c) => c.id === id)
      if (!challenge) return null

      const currentEndDate = new Date(challenge.end_date)
      currentEndDate.setDate(currentEndDate.getDate() + additionalDays)

      return updateChallenge(id, {
        end_date: currentEndDate.toISOString().split("T")[0],
        duration_days: (challenge.duration_days || 0) + additionalDays,
      })
    },
    [challenges, updateChallenge]
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
    extendChallenge,
  }
}
