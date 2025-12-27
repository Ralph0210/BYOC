export const PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    apiFormat: "openai",
  },
  {
    id: "grok",
    name: "xAI (Grok)",
    models: ["grok-beta", "grok-2-1212", "grok-2-vision-1212"],
    apiFormat: "openai", // Compatible with OpenAI SDK
  },
  {
    id: "anthropic",
    name: "Anthropic (Claude)",
    models: [
      "claude-sonnet-4-20250514",
      "claude-haiku-4-5-20251001",
      "claude-3-5-sonnet-20241022",
    ],
    apiFormat: "anthropic",
  },
  {
    id: "google",
    name: "Google (Gemini)",
    models: ["gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-pro"],
    apiFormat: "google",
  },
]

// Get provider config by id
export function getProviderById(id) {
  return PROVIDERS.find((p) => p.id === id) || PROVIDERS[0]
}
