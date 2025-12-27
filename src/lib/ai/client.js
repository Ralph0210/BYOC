import OpenAI from "openai"

/**
 * Create AI client based on provider config
 */
function getClient(config) {
  const baseURLs = {
    openai: "https://api.openai.com/v1",
    grok: "https://api.x.ai/v1",
  }

  return new OpenAI({
    apiKey: config.api_key,
    baseURL: baseURLs[config.provider] || baseURLs.openai,
    dangerouslyAllowBrowser: true, // Required for client-side usage
  })
}

/**
 * Call AI with messages and config
 */
export async function callAI(messages, config) {
  if (!config?.api_key) {
    throw new Error("No API key configured")
  }

  const client = getClient(config)

  try {
    const response = await client.chat.completions.create({
      model: config.model || "gpt-4o-mini",
      messages,
      max_tokens: 500,
      temperature: 0.7,
    })

    return response.choices[0]?.message?.content || null
  } catch (error) {
    console.error("AI API Error:", error)
    throw error
  }
}

/**
 * List available models from provider
 */
export async function listModels(config) {
  if (!config?.api_key) {
    return []
  }

  const client = getClient(config)

  try {
    const response = await client.models.list()
    return response.data
      .filter((m) => m.id.includes("gpt") || m.id.includes("grok"))
      .map((m) => m.id)
      .slice(0, 20)
  } catch (error) {
    console.warn("Failed to fetch models:", error)
    return []
  }
}
