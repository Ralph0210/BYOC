import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react"
import { supabase } from "../lib/supabase"
import { useAuth } from "./useAuth"
import { encryptData, decryptData } from "../lib/crypto"

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

      // Decrypt sensitive fields if they exist
      let decryptedConfig = { ...data }

      if (data?.api_key) {
        decryptedConfig.api_key = await decryptData(data.api_key, user.id)
      }
      if (data?.companion_name) {
        decryptedConfig.companion_name = await decryptData(
          data.companion_name,
          user.id
        )
      }
      if (data?.user_details) {
        decryptedConfig.user_details = await decryptData(
          data.user_details,
          user.id
        )
      }
      if (data?.custom_personality_prompt) {
        decryptedConfig.custom_personality_prompt = await decryptData(
          data.custom_personality_prompt,
          user.id
        )
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

      // Build the upsert payload
      const payload = {
        user_id: user.id,
        provider: newConfig.provider,
        api_key: encryptedApiKey,
        model: newConfig.model,
        personality_preset: newConfig.personality_preset,
        custom_instructions: newConfig.custom_instructions || null, // Keeping customization open? User said "AI personality configuration".
        // Wait, "AI personality configuration" -> personality_preset, custom_instructions, custom_personality_prompt.
        // Prompt might be sensitive.
        // Presets are enums, not sensitive.
        custom_personality_prompt: newConfig.custom_personality_prompt
          ? await encryptData(newConfig.custom_personality_prompt, user.id)
          : null,
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
