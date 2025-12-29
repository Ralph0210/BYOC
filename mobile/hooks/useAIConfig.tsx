import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from "react"
import * as SecureStore from "expo-secure-store"
import { supabase } from "../lib/supabase"
import { useAuth } from "./useAuth"

export interface AIConfig {
  provider: string
  api_key: string
  model: string
  personality_preset: string
  custom_instructions?: string
  custom_personality_prompt?: string
  user_details?: string
  companion_name?: string
  companion_photo_url?: string
}

interface AIConfigContextType {
  config: AIConfig | null
  loading: boolean
  error: Error | null
  updateConfig: (newConfig: Partial<AIConfig>) => Promise<AIConfig>
  refetch: () => Promise<void>
  hasKey: boolean
}

const AIConfigContext = createContext<AIConfigContextType | null>(null)

const SECURE_STORE_KEY = "byoc_api_key"

const DEFAULT_CONFIG: AIConfig = {
  provider: "openai",
  api_key: "",
  model: "gpt-4o-mini",
  personality_preset: "warm_encourager",
  custom_instructions: "",
}

interface AIConfigProviderProps {
  children: ReactNode
}

export function AIConfigProvider({ children }: AIConfigProviderProps) {
  const { user } = useAuth()
  const [config, setConfig] = useState<AIConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchConfig = useCallback(async () => {
    if (!user) {
      setConfig(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      // Fetch config from Supabase
      const { data, error: fetchError } = await supabase
        .from("ai_config")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError
      }

      // Get API key from secure storage
      const storedApiKey = await SecureStore.getItemAsync(SECURE_STORE_KEY)

      if (data) {
        setConfig({
          ...data,
          api_key: storedApiKey || "",
        })
      } else {
        setConfig({
          ...DEFAULT_CONFIG,
          api_key: storedApiKey || "",
        })
      }

      setError(null)
    } catch (err) {
      console.error("Error fetching AI config:", err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const updateConfig = async (
    newConfig: Partial<AIConfig>
  ): Promise<AIConfig> => {
    if (!user) {
      throw new Error("User not authenticated")
    }

    try {
      // Store API key in secure storage (not in Supabase)
      if (newConfig.api_key !== undefined) {
        if (newConfig.api_key) {
          await SecureStore.setItemAsync(SECURE_STORE_KEY, newConfig.api_key)
        } else {
          await SecureStore.deleteItemAsync(SECURE_STORE_KEY)
        }
      }

      // Build payload without API key (we store it locally)
      const payload = {
        user_id: user.id,
        provider: newConfig.provider || config?.provider || "openai",
        model: newConfig.model || config?.model || "gpt-4o-mini",
        personality_preset:
          newConfig.personality_preset ||
          config?.personality_preset ||
          "warm_encourager",
        custom_instructions: newConfig.custom_instructions || null,
        custom_personality_prompt: newConfig.custom_personality_prompt || null,
        user_details: newConfig.user_details || null,
        companion_name: newConfig.companion_name || null,
        companion_photo_url: newConfig.companion_photo_url || null,
        updated_at: new Date().toISOString(),
      }

      const { data, error: upsertError } = await supabase
        .from("ai_config")
        .upsert(payload, {
          onConflict: "user_id",
          ignoreDuplicates: false,
        })
        .select()
        .single()

      if (upsertError) throw upsertError

      const updatedConfig: AIConfig = {
        ...data,
        api_key: newConfig.api_key || config?.api_key || "",
      }

      setConfig(updatedConfig)
      return updatedConfig
    } catch (err) {
      console.error("Error updating AI config:", err)
      setError(err as Error)
      throw err
    }
  }

  useEffect(() => {
    fetchConfig()
  }, [fetchConfig])

  const hasKey = Boolean(config?.api_key)

  return (
    <AIConfigContext.Provider
      value={{
        config,
        loading,
        error,
        updateConfig,
        refetch: fetchConfig,
        hasKey,
      }}
    >
      {children}
    </AIConfigContext.Provider>
  )
}

export function useAIConfig(): AIConfigContextType {
  const context = useContext(AIConfigContext)
  if (context === null) {
    throw new Error("useAIConfig must be used within an AIConfigProvider")
  }
  return context
}
