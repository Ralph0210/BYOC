/**
 * useAIConfig Hook
 *
 * Manages AI configuration (API key, model, personality settings).
 * Automatically encrypts/decrypts sensitive data for cross-platform sync.
 */

import { useState, useEffect, useCallback } from "react"
import { supabase } from "../lib/supabase"
import { decryptData, encryptData, isEncrypted } from "../lib/crypto"

export interface AIConfig {
  id?: string
  user_id?: string
  provider: string
  api_key: string | null
  model: string
  personality_preset: string
  custom_instructions: string | null
  custom_personality_prompt: string | null
  companion_name: string | null
  companion_photo_url: string | null
  user_details: string | null
  updated_at?: string
}

const DEFAULT_CONFIG: Partial<AIConfig> = {
  provider: "openai",
  model: "gpt-4o-mini",
  personality_preset: "warm_encourager",
  custom_instructions: "",
}

interface UseAIConfigReturn {
  config: AIConfig | null
  loading: boolean
  error: string | null
  hasKey: boolean
  needsReEntry: boolean
  updateConfig: (newConfig: Partial<AIConfig>) => Promise<AIConfig | null>
  refetch: () => Promise<void>
}

export function useAIConfig(): UseAIConfigReturn {
  const [config, setConfig] = useState<AIConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [needsReEntry, setNeedsReEntry] = useState(false)

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setConfig(null)
        return
      }

      const { data, error: fetchError } = await supabase
        .from("ai_config")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError
      }

      if (!data) {
        setConfig({ ...DEFAULT_CONFIG, user_id: user.id } as AIConfig)
        return
      }

      // Decrypt sensitive fields if they're encrypted
      let decryptedConfig: AIConfig = { ...data }
      let decryptionFailed = false

      // Decrypt each encrypted field
      if (isEncrypted(data.api_key)) {
        const decrypted = await decryptData(data.api_key, user.id)
        if (decrypted !== null) {
          decryptedConfig.api_key = decrypted
        } else {
          decryptionFailed = true
          decryptedConfig.api_key = null
        }
      }

      if (isEncrypted(data.companion_name)) {
        const decrypted = await decryptData(data.companion_name, user.id)
        if (decrypted !== null) {
          decryptedConfig.companion_name = decrypted
        } else {
          decryptionFailed = true
          decryptedConfig.companion_name = null
        }
      }

      if (isEncrypted(data.user_details)) {
        const decrypted = await decryptData(data.user_details, user.id)
        if (decrypted !== null) {
          decryptedConfig.user_details = decrypted
        } else {
          decryptionFailed = true
          decryptedConfig.user_details = null
        }
      }

      if (isEncrypted(data.custom_personality_prompt)) {
        const decrypted = await decryptData(
          data.custom_personality_prompt,
          user.id
        )
        if (decrypted !== null) {
          decryptedConfig.custom_personality_prompt = decrypted
        } else {
          decryptionFailed = true
          decryptedConfig.custom_personality_prompt = null
        }
      }

      setNeedsReEntry(decryptionFailed)
      setConfig(decryptedConfig)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch AI config"
      setError(message)
      console.error("Error fetching AI config:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateConfig = useCallback(
    async (newConfig: Partial<AIConfig>): Promise<AIConfig | null> => {
      try {
        setError(null)

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) throw new Error("User not authenticated")

        // Encrypt sensitive fields for cross-platform compatibility
        const encryptedApiKey = newConfig.api_key
          ? await encryptData(newConfig.api_key, user.id)
          : null
        const encryptedCompanionName = newConfig.companion_name
          ? await encryptData(newConfig.companion_name, user.id)
          : null
        const encryptedUserDetails = newConfig.user_details
          ? await encryptData(newConfig.user_details, user.id)
          : null
        const encryptedCustomPrompt = newConfig.custom_personality_prompt
          ? await encryptData(newConfig.custom_personality_prompt, user.id)
          : null

        const payload = {
          user_id: user.id,
          provider: newConfig.provider || config?.provider || "openai",
          api_key: encryptedApiKey,
          model: newConfig.model || config?.model || "gpt-4o-mini",
          personality_preset:
            newConfig.personality_preset ||
            config?.personality_preset ||
            "warm_encourager",
          custom_instructions: newConfig.custom_instructions || null,
          custom_personality_prompt: encryptedCustomPrompt,
          companion_name: encryptedCompanionName,
          companion_photo_url: newConfig.companion_photo_url || null,
          user_details: encryptedUserDetails,
          updated_at: new Date().toISOString(),
        }

        const { data, error: updateError } = await supabase
          .from("ai_config")
          .upsert(payload, {
            onConflict: "user_id",
            ignoreDuplicates: false,
          })
          .select()
          .single()

        if (updateError) throw updateError

        // Store the decrypted version locally
        const localConfig: AIConfig = {
          ...data,
          api_key: newConfig.api_key || null,
          companion_name: newConfig.companion_name || null,
          user_details: newConfig.user_details || null,
          custom_personality_prompt:
            newConfig.custom_personality_prompt || null,
        }

        setNeedsReEntry(false)
        setConfig(localConfig)
        return localConfig
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to update AI config"
        setError(message)
        console.error("Error updating AI config:", err)
        return null
      }
    },
    [config]
  )

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  return {
    config,
    loading,
    error,
    hasKey: Boolean(config?.api_key),
    needsReEntry,
    updateConfig,
    refetch: fetchConfig,
  }
}
