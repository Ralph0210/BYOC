import { PERSONALITY_PRESETS } from "./personalities"

/**
 * Build the system prompt for AI interactions
 * Includes personality, custom instructions, context, and long-term memories
 */
export const buildSystemPrompt = (
  config,
  context,
  memories = null,
  userName = null,
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
- Day: ${stats.daysElapsed || 1} of ${stats.totalDays || "?"}
- Days Remaining: ${stats.daysRemaining || 0}
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

/**
 * Build a prompt to generate clarifying questions for a goal
 * Returns JSON with goal type, duration, and 1-3 questions
 */
export const buildClarifyingQuestionsPrompt = (goalData) => {
  const { goal, motivation, concerns } = goalData

  return `You are helping someone clarify their goal before creating an action plan.

## User's Goal
Goal: "${goal}"
Motivation: "${motivation}"
Concerns: "${concerns || "none mentioned"}"

## Your Task
1. ANALYZE the goal to determine its TYPE and DURATION
2. CHECK FOR AMBIGUITIES (Crucial for preventing hallucination)
3. Ask 1-3 CRUCIAL clarifying questions

## Goal Types
- **habit**: Ongoing daily behavior (wake up at 7am)
- **deadline**: Time-sensitive goal (finals in 12 days)
- **achievement**: Milestone goal (run a 5K)
- **project**: Defined scope (declutter house)
- **skill**: Ongoing improvement (learn guitar)

## Ambiguity Check (PREVENT HALLUCINATION)
If the goal is "Study Physics" or "Learn History" but lacks specifics:
- YOU MUST ASK: "What specific chapters, topics, or syllabus are you covering?"
- Do NOT assume they are studying Newtonian physics or WW2 unless stated.
- If they say "Prepare for interview", ASK: "What role or company? Technical or behavioral?"

## Duration Detection
- "in 12 days" → 12 days
- "finals next week" → 7 days
- Default: 28 days

## Output Format
Return ONLY valid JSON:
{
  "goal_type": "habit" | "deadline" | "achievement" | "project" | "skill",
  "goal_type_reason": "Brief explanation",
  "suggested_duration_days": 12,
  "duration_reason": "Finals are in 12 days",
  "questions": [
    {
      "id": "q1",
      "question": "Do you have a syllabus or specific list of topics to cover?",
      "placeholder": "e.g., Chapters 1-5, Thermodynamics, Mechanics",
      "why": "I need specific topics to create a relevant study plan."
    }
  ],
  "skip_reason": null
}

RETURN QUESTIONS IF THE GOAL IS VAGUE.
For study goals without topics, QUESTION 1 MUST ASK FOR TOPICS.`
}

/**
 * Build a prompt to generate a progressive goal plan
 * Adapts duration based on goal type and detected timeline
 */
export const buildGoalPlanPrompt = (goalData, userContext = "") => {
  const {
    goal,
    motivation,
    concerns,
    startDate,
    clarificationContext,
    goalType,
    durationDays,
  } = goalData

  // Calculate phases based on duration
  const days = durationDays || 28
  let numPhases, phaseUnit, phaseNames

  if (days <= 3) {
    // Very short: phases are half-days or time blocks
    numPhases = days
    phaseUnit = "Day"
    phaseNames = Array.from({ length: days }, (_, i) => `Day ${i + 1}`)
  } else if (days <= 14) {
    // Short deadline: phases are days or 2-3 day chunks
    numPhases = Math.min(days, 7) // Max 7 phases
    const daysPerPhase = Math.ceil(days / numPhases)
    phaseUnit = daysPerPhase === 1 ? "Day" : `Days`
    phaseNames = Array.from({ length: numPhases }, (_, i) => {
      const startDay = i * daysPerPhase + 1
      const endDay = Math.min((i + 1) * daysPerPhase, days)
      return startDay === endDay
        ? `Day ${startDay}`
        : `Days ${startDay}-${endDay}`
    })
  } else {
    // Standard: weekly phases
    numPhases = Math.ceil(days / 7)
    phaseUnit = "Week"
    phaseNames = Array.from({ length: numPhases }, (_, i) => `Week ${i + 1}`)
  }

  // Determine goal framing
  const isDeadline = goalType === "deadline" || days < 28
  const isOngoing = goalType === "habit" || goalType === "skill"

  const planTitle = isDeadline
    ? `${days}-Day Sprint`
    : goalType === "habit"
      ? "4-Week Kickstart"
      : `${numPhases}-Week Plan`

  return `You are generating a ${planTitle} to help someone achieve their goal.

## User's Goal
I want to: ${goal}
Because: ${motivation}
But I worry about: ${concerns || "nothing specific"}

## Goal Type: ${(goalType || "deadline").toUpperCase()}
${isDeadline ? `This is a TIME-SENSITIVE goal. The plan MUST fit within ${days} days!` : ""}
${isOngoing ? "After the plan ends, the habit continues indefinitely." : ""}

## User Context
${userContext || "No additional context provided."}

${clarificationContext ? "## Clarifying Details\n" + clarificationContext : ""}

## Timeline
- Start date: ${startDate || "Today"}
- Duration: **${days} days** (${numPhases} phases)
- Phase structure: ${phaseNames.join(" → ")}

## Output Format
Return ONLY valid JSON:
{
  "plan_title": "${planTitle}: [Goal Summary]",
  "goal_type": "${goalType || "deadline"}",
  "duration_days": ${days},
  "is_ongoing": ${isOngoing},
  "phases": [
    {
      "phase": 1,
      "name": "${phaseNames[0]}",
      "tagline": "Phase focus",
      "tasks": [
        {
          "name": "Specific action task",
          "frequency": "Daily" or "Once",
          "duration_minutes": 30,
          "notes": "Short tip"
        }
      ]
    }
  ],
  "encouragement": "Motivational message",
  "after_plan": ${isOngoing ? '"Continue the habit indefinitely"' : "null"}
}

## CRITICAL RULES
1. **CREATE EXACTLY ${numPhases} PHASES** matching: ${phaseNames.join(", ")}
2. **THE MAIN GOAL MUST BE THE PRIMARY TASK** - not supporting activities
3. For ${days}-day plans:
   - Front-load important work (don't leave studying to last day!)
   - Phase 1: 30% of work (setup/foundation)
   - Middle phases: 50% of work (main effort)
   - Final phase: 20% of work (review/polish)
4. Task frequency should fit the timeline:
   - Short plans (< 7 days): "Daily" or "Once this phase"
   - Longer plans: "3-4x per week" or "Daily"
5. Notes should be SHORT (under 40 characters)
6. **PREVENT HALLUCINATION (Study/Learning Goals):**
   - IF YOU DON'T KNOW the specific chapters/syllabus:
   - **DO NOT INVENT** topics (e.g., don't say "Study Newton's Laws" if not mentioned).
   - **USE PLACEHOLDERS**: "Study Topic 1", "Review Chapter 1", "Practice Problem Set".
   - **Notes**: "Replace with your specific topic".`
}
