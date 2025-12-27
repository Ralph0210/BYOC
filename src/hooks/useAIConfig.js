import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "./useAuth"
import { encryptApiKey, decryptApiKey } from "../lib/crypto"

// Create a context for sharing AI config state across components
const AIConfigContext = createContext(null)

// Singleton state for sharing across all hook instances
let sharedConfig = null
let sharedLoading = true
let sharedError = null
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

      // Decrypt API key if it exists
      let decryptedConfig = data
      if (data?.api_key) {
        const decryptedKey = await decryptApiKey(data.api_key, user.id)
        decryptedConfig = { ...data, api_key: decryptedKey }
      }

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

      // Store decrypted version in shared state for immediate use by ALL components
      const decryptedData = { ...data, api_key: newConfig.api_key }
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
  }
}
