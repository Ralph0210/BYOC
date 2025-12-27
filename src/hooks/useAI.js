import { callAI } from "../lib/ai/client"

/**
 * Core hook for direct AI operations.
 * For conversation state, use useConversation.
 * For ambient notes, use useAmbientNotes.
 */
export function useAI() {
  return {
    callAI,
  }
}
