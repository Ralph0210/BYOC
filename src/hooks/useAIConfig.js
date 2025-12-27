import { useState, useEffect, useCallback } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "./useAuth"
import { encryptApiKey, decryptApiKey } from "../lib/crypto"

export function useAIConfig() {
  const { user } = useAuth()
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchConfig = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("ai_config")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "Row not found", which is fine for new users
        throw error
      }

      // Decrypt API key if it exists
      let decryptedConfig = data
      if (data?.api_key) {
        const decryptedKey = await decryptApiKey(data.api_key, user.id)
        decryptedConfig = { ...data, api_key: decryptedKey }
      }

      setConfig(
        decryptedConfig || {
          provider: "openai",
          model: "gpt-4o-mini",
          personality_preset: "warm_encourager",
          personality_customizations: {},
          custom_instructions: "",
        }
      )
    } catch (err) {
      console.error("Error fetching AI config:", err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [user])

  const updateConfig = async (newConfig) => {
    if (!user) {
      throw new Error("User not authenticated")
    }

    try {
      setError(null)

      // Encrypt API key before storing
      const encryptedApiKey = newConfig.api_key
        ? await encryptApiKey(newConfig.api_key, user.id)
        : null

      // Build the upsert payload
      const payload = {
        user_id: user.id,
        provider: newConfig.provider,
        api_key: encryptedApiKey,
        model: newConfig.model,
        personality_preset: newConfig.personality_preset,
        custom_instructions: newConfig.custom_instructions || null,
        custom_personality_prompt: newConfig.custom_personality_prompt || null,
        user_details: newConfig.user_details || null,
        companion_name: newConfig.companion_name || null,
        companion_photo_url: newConfig.companion_photo_url || null,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from("ai_config")
        .upsert(payload, {
          onConflict: "user_id",
          ignoreDuplicates: false,
        })
        .select()
        .single()

      if (error) throw error

      // Store decrypted version in state for immediate use
      const decryptedData = { ...data, api_key: newConfig.api_key }
      setConfig(decryptedData)
      return decryptedData
    } catch (err) {
      console.error("Error updating AI config:", err)
      setError(err)
      throw err
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const hasKey = Boolean(config?.api_key)

  return { config, loading, error, updateConfig, refetch: fetchConfig, hasKey }
}
