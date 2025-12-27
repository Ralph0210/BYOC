import { useAIConfig } from "./useAIConfig"

/**
 * Hook to determine if AI companion mode should be enabled
 * Companion mode is active when user has configured API key and personality
 */
export function useCompanionMode() {
  const { config } = useAIConfig()
  return Boolean(config?.api_key && config?.personality_preset)
}

