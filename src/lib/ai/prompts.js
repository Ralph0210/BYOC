import { PERSONALITY_PRESETS } from "./personalities"

/**
 * Build the system prompt for AI interactions
 * Includes personality, custom instructions, context, long-term memories, and calendar context
 */
export const buildSystemPrompt = (
  config,
  context,
  memories = null,
  userName = null,
  calendarContext = null,
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

  // Include calendar context if available
  const calendarPrompt = calendarContext
    ? `\n\n${calendarContext}

TASK PRIORITIZATION SKILLS:
When the user asks what to do first, which task to prioritize, or seems unsure where to start:
1. Look at their calendar free windows and match tasks to available time
2. Prioritize by: urgency (daily tasks > weekly), time sensitivity (scheduled times), and duration fit
3. On busy days: suggest shorter tasks for small gaps, longer tasks for big windows
4. On light days: suggest tackling harder/longer tasks first while energy is high
5. Consider time of day: morning = focused work, afternoon = routine tasks, evening = wind-down habits

When giving prioritization advice:
- Be specific: "Start with X at Y time, then Z"
- Explain briefly why (fits your 30-min window before the meeting)
- Keep it actionable, not overwhelming (suggest 2-3 tasks max at once)`
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

  return `${basePrompt}${personalityPrompt}${memoriesPrompt}${customInstructions}${calendarPrompt}${contextPrompt}`
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
 * Now uses the discovery-driven flow based on goalTypes schema
 */
export const buildClarifyingQuestionsPrompt = (
  goal,
  goalTypesSchema,
  previousAnswers = [],
) => {
  const contextStr = previousAnswers.length
    ? `\n## Previous Q&A Structure
${previousAnswers.map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`).join("\n")}`
    : ""

  return `You are helping someone clarify their goal before creating an action plan.

## User's Goal Input
"${goal}"${contextStr}

## Your Task
1. **CLASSIFY** the goal into one of these types: ${Object.keys(goalTypesSchema.goal_types).join(", ")}
2. **EXTRACT** information from the user's input that matches the "slots" defined for that goal type.
3. **IDENTIFY GAPS**: Check which "required" slots are missing.
4. **DETECT CLARITY**: If important slots are missing, ask 1-3 CRUCIAL clarifying questions.

## Goal Types Schema
${JSON.stringify(goalTypesSchema, null, 2)}

## Rules for Questions
- If the user provided enough info to fill the "required" slots, you can skip questions.
${previousAnswers.length ? "- **Refinement Mode**: The user has answered basics. Now ask 1-3 DEEPER questions about preferences, style, or specific constraints to avoid assumptions." : '- If the goal is vague (e.g., "Study Physics"), ALWAYS ask for the specific "scope" or "subject" details.'}
- Be supportive and curious, not clinical.
- Return ONLY valid JSON.

## Output Format
{
  "goal_type": "learning_studying",
  "goal_type_reason": "Explanation of classification",
  "extracted_slots": {
    "subject": "Physics",
    "deadline": null
  },
  "missing_required_slots": ["deadline", "scope", "daily_time"],
  "questions": [
    {
      "id": "deadline",
      "question": "When is your exam or deadline for this?",
      "placeholder": "e.g., March 15th, or in 2 weeks",
      "why": "I need to know how much time we have to prepare."
    }
  ],
  "suggested_duration_days": 28,
  "user_specified_duration_days": null, // If user explicitly said "in 2 weeks", set to 14
  "skip_reason": null
}`
}

/**
 * Build a prompt to generate a progressive goal plan
 * Adapts duration based on goal type and detected timeline
 */
export const buildGoalPlanPrompt = (
  goalData,
  userContext = "",
  calendarContext = "",
) => {
  const {
    goal,
    startDate,
    clarificationContext,
    goalType,
    durationDays,
    extractedSlots = {},
  } = goalData

  // Include extracted slots in the context
  const extractedContext = Object.entries(extractedSlots)
    .filter(([_, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")

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
      ? `${numPhases}-Week Kickstart`
      : `${numPhases}-Week Plan`

  return `You are generating a ${planTitle} to help someone achieve their goal.

## User's Goal
I want to: ${goal}
${extractedContext ? `\nEXTRA INFO:\n${extractedContext}` : ""}

## Goal Type: ${(goalType || "deadline").toUpperCase()}
${isDeadline ? `This is a TIME-SENSITIVE goal. The plan MUST fit within ${days} days!` : ""}
${isOngoing ? "After the plan ends, the habit continues indefinitely." : ""}

## User Context
${userContext || "No additional context provided."}
${calendarContext ? `\n## Calendar Context (Use this for scheduling)\n${calendarContext}` : ""}

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
          "notes": "Short tip",
          "scheduled_time": "09:00" // Optional: suggested start time (HH:MM) based on calendar/habits
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
5. Notes should be DETAILED and ACTIONABLE (explain "how" or "why", 1-2 sentences).
6. **SCHEDULE INTELLIGENTLY**:
   - **MANDATORY**: SUGGEST A TIME (\`scheduled_time\`) for every task that needs a specific slot.
   - Look at the **Calendar Context**. If they have a meeting at 10am, suggest 11am or 9am.
   - **Load Balancing**: If "Existing Commitments" show a "HEAVY" or "FULL" day, avoid scheduling big tasks there. Move them to a "LIGHT" day.
   - For morning habits, use 07:00-08:00. For evening habits, use 20:00-21:00.
   - If the day is busy, find the gap! 
7. **SUBTASKS (Break it down)**:
   - For **Complex/Big Tasks** (e.g., "Write Essay", "Plan Party"), include a \`subtasks\` array with 3-5 small, actionable steps.
   - Structure: \`subtasks: [{ "title": "Outline key points", "completed": false }, ...]\`
   - For simple tasks (e.g., "Drink water"), leave \`subtasks\` empty [].
8. **ROLLING WINDOW (Max 4 Weeks)**:
   - If the duration is > 28 days (4 weeks), you MUST still create **Phases** for the full duration (e.g. 8 weeks).
   - **HOWEVER**, only generate detailed \`tasks\` for the **FIRST 4 WEEKS**.
   - For Weeks 5+, return an empty tasks array \`[]\` or a single placeholder task like "Review progress and regenerate plan".
   - This ensures the user isn't overwhelmed.
9. **PREVENT HALLUCINATION (Study/Learning Goals):**
   - IF YOU DON'T KNOW the specific chapters/syllabus:
   - **DO NOT INVENT** topics (e.g., don't say "Study Newton's Laws" if not mentioned).
   - **USE PLACEHOLDERS**: "Study Topic 1", "Review Chapter 1", "Practice Problem Set".
   - **Notes**: "Replace with your specific topic".`
}
