import { PERSONALITY_PRESETS } from "./personalities"

/**
 * Build the system prompt for AI interactions
 * Includes personality, custom instructions, context, and long-term memories
 */
export const buildSystemPrompt = (
  config,
  context,
  memories = null,
  userName = null
) => {
  const companionName = config?.companion_name || "Companion"

  // User identity section
  const userSection =
    userName || config?.user_details
      ? `\n\nUSER INFO:\n${userName ? `Name: ${userName}` : ""}${config?.user_details ? `\nContext: ${config.user_details}` : ""}`
      : ""

  const basePrompt = `You are ${companionName}, a supportive companion in BYOC (Bring Your Own Companion), a character-driven habit tracker.
Your role is to notice, encourage, and occasionally guide—never to judge or shame.${userSection}

CORE IDENTITY:
- You're like a caring older sibling who sees the whole picture
- You notice patterns and offer observations, not commands
- You celebrate effort, not just results
- When things are hard, you acknowledge it without minimizing

STRICT RULES:
- Use "progress" or "completion", NEVER "score", "points", or "XP"
- Refer to "tasks" or "habits", NEVER "quests" or "missions"
- If the user seems to be struggling, be curious ("What's going on?") not prescriptive
`

  const preset =
    PERSONALITY_PRESETS[config?.personality_preset || "warm_encourager"]

  // Use custom personality prompt if preset is "custom", otherwise use preset prompt
  let personalityPrompt = ""
  if (preset?.isCustom && config?.custom_personality_prompt) {
    personalityPrompt = `\nPERSONALITY:\n${config.custom_personality_prompt}`
  } else if (preset?.prompt) {
    personalityPrompt = `\nPERSONALITY:\n${preset.prompt}`
  }

  // Include long-term memories if available
  const memoriesPrompt = memories
    ? `\n\nWHAT YOU KNOW ABOUT THIS USER:\n${memories}\n\nUse this knowledge naturally—don't announce that you "remember" things.`
    : ""

  const customInstructions = config?.custom_instructions
    ? `\n\nUSER'S CUSTOM INSTRUCTIONS (follow these closely):\n${config.custom_instructions}`
    : ""

  // Format context - handle missing data gracefully
  let contextPrompt = ""
  if (Array.isArray(context) && context.length > 0) {
    const contextSummaries = context.map((item) => {
      if (item.type === "challenge") {
        const stats = item.stats || {}
        const tasksList =
          item.tasks?.length > 0
            ? `\n- Tasks: ${item.tasks.map((t) => `"${t.name}" (${t.frequency_type}, ${t.frequency_count}x)`).join(", ")}`
            : ""
        return `[CHALLENGE: "${item.name}"]
- Progress: ${stats.overall || 0}%
- Day: ${stats.daysElapsed || 0}
- Goal: ${item.description || "No description"}${tasksList}`
      } else if (item.type === "task") {
        return `[TASK: "${item.name}"]
- Status: ${item.isCompleted ? "COMPLETED" : "PENDING"}
- From Challenge: ${item.challengeName || "None"}`
      }
      return `[REFERENCE: "${item.name}"]`
    })

    contextPrompt = `\n\nATTACHED CONTEXT:\n${contextSummaries.join("\n\n")}`
  } else if (context && typeof context === "object") {
    // Handling single object context (used by useAmbientNotes)
    const parts = []
    if (context.challengeName)
      parts.push(`Challenge: "${context.challengeName}"`)
    if (context.progress !== undefined)
      parts.push(`Progress: ${context.progress}%`)
    if (context.daysElapsed !== undefined)
      parts.push(`Day ${context.daysElapsed} of ${context.totalDays || "?"}`)
    if (context.taskName) parts.push(`Task: "${context.taskName}"`)

    if (parts.length > 0) {
      contextPrompt = `\n\nCURRENT CONTEXT:\n${parts.join(" | ")}`
    }
  }

  return `${basePrompt}${personalityPrompt}${memoriesPrompt}${customInstructions}${contextPrompt}`
}

/**
 * Build a prompt to extract memories from a conversation
 * Returns JSON with new memories to save
 */
export const buildMemoryExtractionPrompt = (existingMemories = []) => {
  return `You extract memorable facts from conversations to remember for future interactions.

Existing memories about this user:
${existingMemories.length ? existingMemories.map((m) => `- ${m.content}`).join("\n") : "None yet"}

From this conversation, identify:
1. New facts the user shared about themselves (e.g., "works night shifts", "has two kids")
2. Preferences they expressed (e.g., "prefers direct feedback", "doesn't like emojis")
3. Patterns you noticed (e.g., "struggles with mornings", "motivated by deadlines")
4. Communication style observations (e.g., "responds well to questions")

Return ONLY valid JSON in this exact format:
{
  "memories": [
    {"type": "fact", "content": "...", "confidence": 0.9},
    {"type": "preference", "content": "...", "confidence": 0.8},
    {"type": "pattern", "content": "...", "confidence": 0.7},
    {"type": "style", "content": "...", "confidence": 0.8}
  ]
}

Rules:
- Only include genuinely useful memories, not obvious or temporary things
- Keep each memory concise (under 50 words)
- confidence: 0.9+ for explicit statements, 0.6-0.8 for inferences
- Return empty array if nothing memorable was shared
- DO NOT include memories that are already in the existing list`
}
