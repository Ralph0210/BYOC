import { useState, useCallback } from "react"
import { supabase } from "../lib/supabase"
import { encryptData, decryptData } from "../lib/crypto"

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

      // Decrypt sensitive fields
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const decryptedChallenges = await Promise.all(
        (data || []).map(async (challenge) => {
          if (!user) return challenge
          return {
            ...challenge,
            name:
              (await decryptData(challenge.name, user.id)) || challenge.name,
            description:
              (await decryptData(challenge.description, user.id)) ||
              challenge.description,
            reward_text:
              (await decryptData(challenge.reward_text, user.id)) ||
              challenge.reward_text,
          }
        }),
      )

      setChallenges(decryptedChallenges)
      return decryptedChallenges
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
      // Get the current authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("You must be logged in to create a challenge")
      }

      // Encrypt sensitive fields
      const encryptedData = {
        ...challengeData,
        user_id: user.id,
        name: await encryptData(challengeData.name, user.id),
        description: challengeData.description
          ? await encryptData(challengeData.description, user.id)
          : null,
        reward_text: challengeData.reward_text
          ? await encryptData(challengeData.reward_text, user.id)
          : null,
      }

      const { data, error: createError } = await supabase
        .from("challenges")
        .insert([encryptedData])
        .select()
        .single()

      if (createError) throw createError

      // Return local decrypted object so UI can use it immediately without flash
      const decryptedNewChallenge = {
        ...data,
        name: challengeData.name,
        description: challengeData.description,
        reward_text: challengeData.reward_text,
      }

      setChallenges((prev) => [decryptedNewChallenge, ...prev])
      return decryptedNewChallenge
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [])

  const updateChallenge = useCallback(async (id, updates) => {
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error("User not authenticated")

      const encryptedUpdates = {
        ...updates,
        updated_at: new Date().toISOString(),
      }

      if (updates.name) {
        encryptedUpdates.name = await encryptData(updates.name, user.id)
      }
      if (updates.description) {
        encryptedUpdates.description = await encryptData(
          updates.description,
          user.id,
        )
      }
      if (updates.reward_text) {
        encryptedUpdates.reward_text = await encryptData(
          updates.reward_text,
          user.id,
        )
      }

      const { data, error: updateError } = await supabase
        .from("challenges")
        .update(encryptedUpdates)
        .eq("id", id)
        .select()
        .single()

      if (updateError) throw updateError

      // Decrypt the returned data to update local state
      const decryptedData = {
        ...data,
        name: (await decryptData(data.name, user.id)) || data.name,
        description:
          (await decryptData(data.description, user.id)) || data.description,
        reward_text:
          (await decryptData(data.reward_text, user.id)) || data.reward_text,
      }

      setChallenges((prev) =>
        prev.map((c) => (c.id === id ? decryptedData : c)),
      )
      return decryptedData
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
    [updateChallenge],
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
    [challenges, updateChallenge],
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
