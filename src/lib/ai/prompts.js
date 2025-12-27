import { PERSONALITY_PRESETS } from "./personalities"

export const buildSystemPrompt = (config, context) => {
  const basePrompt = `You are a supportive companion in Path, a challenge-based habit tracker.
Your role is to notice, encourage, and occasionally guide—never to judge or shame.

STRICT TERMINOLOGY RULES:
- Use "progress" or "completion percentage", NEVER "score", "points", or "XP".
- Refer to "tasks" or "habits", NEVER "quests" or "missions".
- Speak naturally, like a human (e.g., "You're 50% through" rather than "Your progress is 50%").

Keep responses brief for ambient notes (1-2 sentences) and conversational for chat.
`

  const preset =
    PERSONALITY_PRESETS[config.personality_preset || "warm_encourager"]
  const personalityPrompt = preset ? `\n${preset.prompt}` : ""

  const customInstructions = config.custom_instructions
    ? `\n\nUser's custom instructions:\n${config.custom_instructions}`
    : ""

  // Format context for the AI
  const formattedContext = JSON.stringify(context, null, 2)
  const contextPrompt = `\n\nCurrent user context:\n${formattedContext}`

  return `${basePrompt}${personalityPrompt}${customInstructions}${contextPrompt}`
}
