import OpenAI from "openai"
import { getProviderById } from "./providers"

/**
 * Create OpenAI-compatible client (works for OpenAI and xAI)
 */
function getOpenAIClient(config) {
  const baseURLs = {
    openai: "https://api.openai.com/v1",
    grok: "https://api.x.ai/v1",
  }

  return new OpenAI({
    apiKey: config.api_key,
    baseURL: baseURLs[config.provider] || baseURLs.openai,
    dangerouslyAllowBrowser: true,
  })
}

/**
 * Call Anthropic API directly (different format from OpenAI)
 */
async function callAnthropic(messages, config) {
  // Convert OpenAI-style messages to Anthropic format
  const systemMessage = messages.find((m) => m.role === "system")
  const chatMessages = messages.filter((m) => m.role !== "system")

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.api_key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: config.model || "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: systemMessage?.content || "",
      messages: chatMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || "Anthropic API error")
  }

  const data = await response.json()
  return data.content[0]?.text || null
}

/**
 * Call Google Gemini API directly
 */
async function callGoogle(messages, config) {
  const systemMessage = messages.find((m) => m.role === "system")
  const chatMessages = messages.filter((m) => m.role !== "system")

  // Convert to Gemini format
  const contents = chatMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))

  const model = config.model || "gemini-1.5-flash"
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.api_key}`

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents,
      systemInstruction: systemMessage
        ? { parts: [{ text: systemMessage.content }] }
        : undefined,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error?.message || "Google API error")
  }

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || null
}

/**
 * Call AI with messages and config - supports all providers
 */
export async function callAI(messages, config) {
  if (!config?.api_key) {
    throw new Error("No API key configured")
  }

  const provider = getProviderById(config.provider)

  try {
    // Use Anthropic's native API
    if (provider.apiFormat === "anthropic") {
      return await callAnthropic(messages, config)
    }

    // Use Google's native API
    if (provider.apiFormat === "google") {
      return await callGoogle(messages, config)
    }

    // Use OpenAI SDK for OpenAI-compatible APIs
    const client = getOpenAIClient(config)
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
 * Test connection to verify API key works
 */
export async function testConnection(config) {
  if (!config?.api_key) {
    return { success: false, error: "No API key provided" }
  }

  try {
    const testMessages = [
      { role: "system", content: "Respond with exactly: OK" },
      { role: "user", content: "Test" },
    ]

    const response = await callAI(testMessages, config)

    if (response) {
      return { success: true, message: "Connection successful" }
    }
    return { success: false, error: "No response received" }
  } catch (error) {
    return {
      success: false,
      error: error.message || "Connection failed",
    }
  }
}

/**
 * List available models from provider
 */
export async function listModels(config) {
  if (!config?.api_key) {
    return []
  }

  const provider = getProviderById(config.provider)

  // Anthropic doesn't have a models list API, return preset models
  if (provider.apiFormat === "anthropic") {
    return provider.models
  }

  // OpenAI-compatible providers
  try {
    const client = getOpenAIClient(config)
    const response = await client.models.list()
    return response.data
      .filter(
        (m) =>
          m.id.includes("gpt") ||
          m.id.includes("grok") ||
          m.id.includes("claude")
      )
      .map((m) => m.id)
      .slice(0, 20)
  } catch (error) {
    console.warn("Failed to fetch models:", error)
    return provider.models // Fallback to preset models
  }
}
