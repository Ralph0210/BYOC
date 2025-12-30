import { supabase } from "../supabase"

/**
 * Estimated token count for a string (rough approximation)
 * Usually ~4 chars per token for English
 */
export function estimateTokens(text: string): number {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}

/**
 * Model pricing per 1M tokens (input/output)
 * Prices as of early 2025
 */
const PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4-turbo": { input: 10.0, output: 30.0 },

  // Grok (xAI) - Using OpenAI-compatible pricing
  "grok-beta": { input: 5.0, output: 15.0 },
  "grok-2-1212": { input: 2.0, output: 10.0 },

  // Anthropic
  "claude-3-5-sonnet-20241022": { input: 3.0, output: 15.0 },
  "claude-sonnet-4-20250514": { input: 3.0, output: 15.0 },
  "claude-haiku-4-5-20251001": { input: 0.25, output: 1.25 },

  // Google Gemini
  "gemini-2.0-flash-exp": { input: 0.1, output: 0.4 }, // Approx
  "gemini-1.5-flash": { input: 0.075, output: 0.3 },
  "gemini-1.5-pro": { input: 1.25, output: 5.0 },
}

/**
 * Calculate estimated cost in USD
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const price = PRICING[model] || PRICING["gpt-4o-mini"]
  const inputCost = (inputTokens / 1_000_000) * price.input
  const outputCost = (outputTokens / 1_000_000) * price.output
  return inputCost + outputCost
}

export type AIUsageLog = {
  provider: string
  model: string
  inputTokens: number
  outputTokens: number
  contextType: string
}

/**
 * Log AI usage to Supabase
 */
export async function logAIUsage({
  provider,
  model,
  inputTokens,
  outputTokens,
  contextType,
}: AIUsageLog) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const estimated_cost = calculateCost(model, inputTokens, outputTokens)

    const { error } = await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      provider,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      estimated_cost,
      context_type: contextType,
    })

    if (error) throw error
  } catch (err) {
    console.error("Failed to log AI usage:", err)
  }
}

/**
 * Fetch usage stats for current user
 */
export async function getUsageStats() {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from("ai_usage_logs")
      .select("estimated_cost, input_tokens, output_tokens")
      .eq("user_id", user.id)

    if (error) throw error

    return data.reduce(
      (acc, log) => ({
        totalCost: acc.totalCost + Number(log.estimated_cost),
        totalInputTokens: acc.totalInputTokens + log.input_tokens,
        totalOutputTokens: acc.totalOutputTokens + log.output_tokens,
        totalCalls: acc.totalCalls + 1,
      }),
      { totalCost: 0, totalInputTokens: 0, totalOutputTokens: 0, totalCalls: 0 }
    )
  } catch (err) {
    console.error("Failed to fetch usage stats:", err)
    return null
  }
}
