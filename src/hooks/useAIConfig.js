import { useState, useEffect, useCallback } from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "./useAuth"
import { encryptData, decryptData, isEncrypted } from "../lib/crypto"

// Singleton state for sharing across all hook instances
let sharedConfig = null
let sharedLoading = true
let sharedError = null
let sharedNeedsReEntry = false
const listeners = new Set()

function notifyListeners() {
  listeners.forEach((listener) => listener())
}

export function useAIConfig() {
  const { user } = useAuth()
  const [, forceUpdate] = useState({})

  // Subscribe to shared state changes
  useEffect(() => {
    const listener = () => forceUpdate({})
    listeners.add(listener)
    return () => listeners.delete(listener)
  }, [])

  const fetchConfig = useCallback(async () => {
    if (!user) return

    try {
      sharedLoading = true
      notifyListeners()

      const { data, error } = await supabase
        .from("ai_config")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (error && error.code !== "PGRST116") {
        // PGRST116 is "Row not found", which is fine for new users
        throw error
      }

      // Decrypt sensitive fields if they exist
      let decryptedConfig = { ...data }
      let decryptionFailed = false

      if (data?.api_key && isEncrypted(data.api_key)) {
        const decrypted = await decryptData(data.api_key, user.id)
        if (decrypted !== null) {
          decryptedConfig.api_key = decrypted
        } else {
          decryptionFailed = true
          decryptedConfig.api_key = null
        }
      }

      if (data?.companion_name && isEncrypted(data.companion_name)) {
        const decrypted = await decryptData(data.companion_name, user.id)
        if (decrypted !== null) {
          decryptedConfig.companion_name = decrypted
        } else {
          decryptionFailed = true
          decryptedConfig.companion_name = null
        }
      }

      if (data?.user_details && isEncrypted(data.user_details)) {
        const decrypted = await decryptData(data.user_details, user.id)
        if (decrypted !== null) {
          decryptedConfig.user_details = decrypted
        } else {
          decryptionFailed = true
          decryptedConfig.user_details = null
        }
      }

      if (
        data?.custom_personality_prompt &&
        isEncrypted(data.custom_personality_prompt)
      ) {
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

      sharedNeedsReEntry = decryptionFailed
      sharedConfig = decryptedConfig || {
        provider: "openai",
        model: "gpt-4o-mini",
        personality_preset: "warm_encourager",
        personality_customizations: {},
        custom_instructions: "",
      }
      sharedError = null
    } catch (err) {
      console.error("Error fetching AI config:", err)
      sharedError = err
    } finally {
      sharedLoading = false
      notifyListeners()
    }
  }, [user])

  const updateConfig = async (newConfig) => {
    if (!user) {
      throw new Error("User not authenticated")
    }

    try {
      sharedError = null

      // Encrypt sensitive fields
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

      // Build the upsert payload
      const payload = {
        user_id: user.id,
        provider: newConfig.provider,
        api_key: encryptedApiKey,
        model: newConfig.model,
        personality_preset: newConfig.personality_preset,
        custom_instructions: newConfig.custom_instructions || null,
        custom_personality_prompt: encryptedCustomPrompt,
        user_details: encryptedUserDetails,
        companion_name: encryptedCompanionName,
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

      // Store decrypted version in shared state for immediate use by ALL components
      const decryptedData = {
        ...data,
        api_key: newConfig.api_key,
        companion_name: newConfig.companion_name,
        user_details: newConfig.user_details,
        custom_personality_prompt: newConfig.custom_personality_prompt,
      }
      sharedNeedsReEntry = false
      sharedConfig = decryptedData
      notifyListeners() // Notify all components to re-render with new config
      return decryptedData
    } catch (err) {
      console.error("Error updating AI config:", err)
      sharedError = err
      notifyListeners()
      throw err
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const hasKey = Boolean(sharedConfig?.api_key)

  return {
    config: sharedConfig,
    loading: sharedLoading,
    error: sharedError,
    updateConfig,
    refetch: fetchConfig,
    hasKey,
    needsReEntry: sharedNeedsReEntry,
  }
}
