import { useState, useCallback } from "react"
import { callAI } from "../lib/ai/client"
import {
  buildGoalPlanPrompt,
  buildClarifyingQuestionsPrompt,
} from "../lib/ai/prompts"
import { buildCalendarContext } from "../lib/ai/calendarContext"
import { useAIConfig } from "./useAIConfig"
import { useCapacityEngine } from "./useCapacityEngine"
import goalTypesSchema from "../lib/ai/goalTypes.json"

/**
 * Hook for generating and managing AI goal plans
 */
export function useGoalPlanGenerator() {
  const { config } = useAIConfig()
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [regeneratingWeek, setRegeneratingWeek] = useState(null)
  const [error, setError] = useState(null)
  const [rawResponse, setRawResponse] = useState(null)
  const [clarifyingQuestions, setClarifyingQuestions] = useState(null)

  /**
   * Generate clarifying questions based on user's goal
   */
  const generateClarifyingQuestions = useCallback(
    async (goalData, previousAnswers = []) => {
      if (!config?.api_key) {
        setError("Please configure your AI settings first")
        return null
      }

      setLoadingQuestions(true)
      setError(null)
      setClarifyingQuestions(null)

      try {
        const goalText = typeof goalData === "string" ? goalData : goalData.goal
        const messages = [
          {
            role: "system",
            content: buildClarifyingQuestionsPrompt(
              goalText,
              goalTypesSchema,
              previousAnswers,
            ),
          },
          {
            role: "user",
            content:
              "Analyze my goal based on the schema and extract information or ask questions.",
          },
        ]

        const response = await callAI(messages, config, {
          contextType: "goal_clarify",
        })

        if (!response) {
          throw new Error("No response from AI")
        }

        // Parse JSON response
        let parsed = null
        try {
          parsed = JSON.parse(response.trim())
        } catch {
          const jsonMatch = response.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0])
          }
        }

        if (!parsed) {
          // If we can't parse, just skip to plan generation
          return { questions: [], skip_reason: "Could not parse response" }
        }

        setClarifyingQuestions(parsed)
        return parsed
      } catch (err) {
        console.error("Clarifying questions error:", err)
        // Don't block on this - if it fails, just skip clarification
        return { questions: [], skip_reason: err.message }
      } finally {
        setLoadingQuestions(false)
      }
    },
    [config],
  )

  /**
   * Generate a complete 4-week plan from goal data
   */
  // Import capacity engine (assuming it's a hook we can use at top level)
  const { calculateDailyLoad } = useCapacityEngine()

  /**
   * Generate a complete 4-week plan from goal data
   */
  const generatePlan = useCallback(
    async (goalData, existingTasks = []) => {
      if (!config?.api_key) {
        setError("Please configure your AI settings first")
        return null
      }

      setLoading(true)
      setError(null)
      setRawResponse(null)

      try {
        // Build user context from config
        const userContext = config.user_details || ""

        // Build calendar context for smarter scheduling
        const calendarContext = await buildCalendarContext([])

        // Build Multi-Goal / Capacity Context
        // We calculate load for the next 4 weeks (approximate)
        // Since we don't know the exact range, we can just dump the next 30 days of load if relevant
        const today = new Date()
        const loadContextLines = []

        // Check next 28 days
        for (let i = 0; i < 28; i++) {
          const d = new Date(today)
          d.setDate(today.getDate() + i)
          const dateStr = d.toISOString().split("T")[0]
          const load = calculateDailyLoad(existingTasks, d)

          if (load.isFull || load.status === "Heavy") {
            loadContextLines.push(
              `${dateStr} (${d.toLocaleDateString("en-US", { weekday: "short" })}): ${load.status.toUpperCase()} (${load.breakdown.big} Big, ${load.breakdown.medium} Med, ${load.breakdown.small} Small)`,
            )
          }
        }

        const capacityContext =
          loadContextLines.length > 0
            ? `\n## Existing Commitments (Busy Days)\n${loadContextLines.join("\n")}\n\nINSTRUCTION: Avoid scheduling Heavy/Big tasks on these 'FULL' or 'HEAVY' days if possible. Defer to lighter days.`
            : ""

        const systemPrompt = buildGoalPlanPrompt(
          goalData,
          userContext,
          calendarContext + capacityContext, // Append capacity to calendar context
        )

        const messages = [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content:
              "Generate my personalized goal plan. Return only valid JSON.",
          },
        ]

        const response = await callAI(messages, config, {
          contextType: "goal_plan",
        })

        if (!response) {
          throw new Error("No response from AI")
        }

        // Store raw response for debugging
        setRawResponse(response)

        // Try to parse JSON from response with multiple strategies
        let generatedPlan = null
        let parseError = null

        // Strategy 1: Try parsing the whole response as JSON
        try {
          generatedPlan = JSON.parse(response.trim())
        } catch (e) {
          parseError = e.message
          // Strategy 2: Extract JSON block from markdown code fence
          const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
          if (codeBlockMatch) {
            try {
              generatedPlan = JSON.parse(codeBlockMatch[1].trim())
              parseError = null
            } catch (e2) {
              parseError = e2.message
            }
          }

          // Strategy 3: Find balanced braces for the outermost JSON object
          if (!generatedPlan) {
            const startIdx = response.indexOf("{")
            if (startIdx !== -1) {
              let braceCount = 0
              let endIdx = startIdx
              for (let i = startIdx; i < response.length; i++) {
                if (response[i] === "{") braceCount++
                if (response[i] === "}") braceCount--
                if (braceCount === 0) {
                  endIdx = i + 1
                  break
                }
              }
              try {
                generatedPlan = JSON.parse(response.slice(startIdx, endIdx))
                parseError = null
              } catch (e3) {
                parseError = e3.message
                console.error("JSON parse error:", e3.message)
                console.error("Raw AI response:", response)
              }
            }
          }
        }

        if (!generatedPlan) {
          throw new Error(
            `Could not parse JSON: ${parseError}. Check console for raw response.`,
          )
        }

        // Validate plan structure
        if (!generatedPlan.phases || !Array.isArray(generatedPlan.phases)) {
          throw new Error("Invalid plan structure - missing phases array")
        }

        // Assign IDs to phases and tasks for stable keys
        generatedPlan.phases = generatedPlan.phases.map((phase) => ({
          ...phase,
          id: phase.id || crypto.randomUUID(),
          tasks: phase.tasks.map((task) => ({
            ...task,
            id: task.id || crypto.randomUUID(), // Stable ID
          })),
        }))

        setPlan(generatedPlan)
        return generatedPlan
      } catch (err) {
        console.error("Goal plan generation error:", err)
        setError(err.message || "Failed to generate plan")
        return null
      } finally {
        setLoading(false)
      }
    },
    [config, calculateDailyLoad],
  )

  /**
   * Regenerate a specific week's tasks
   */
  /**
   * Regenerate a specific week's tasks
   * @param {number} weekNumber
   * @param {object} goalData
   * @param {string} userPrompt
   * @param {array} protectedTasks - Tasks that should be preserved (e.g. completed ones)
   */
  const regenerateWeek = useCallback(
    async (weekNumber, goalData, userPrompt = "", protectedTasks = []) => {
      if (!config?.api_key || !plan) {
        return null
      }

      setRegeneratingWeek(weekNumber)
      setError(null)

      try {
        const userContext = config.user_details || ""
        // For partial regeneration, we might skip calendar context or re-fetch it
        // Re-fetching ensures up-to-date availability for the new week tasks
        const calendarContext = await buildCalendarContext([])

        const basePrompt = buildGoalPlanPrompt(
          goalData,
          userContext,
          calendarContext,
        )

        // Format protected tasks for the prompt
        const protectedContext =
          protectedTasks.length > 0
            ? `\nPRESERVED TASKS (DO NOT GENERATE THESE):
${protectedTasks.map((t) => `- "${t.name}" (${t.frequency || "Once"})`).join("\n")}
INSTRUCTION: The user has already done/committed to the above. Generate the COMPLEMENTARY tasks to finish the week's goal.`
            : ""

        const weekPrompt = `${basePrompt}

SPECIAL INSTRUCTION: Only regenerate Week ${weekNumber}. The other weeks are already set.
Current Week ${weekNumber} phase name: "${plan.phases.find((p) => p.week === weekNumber)?.name || "Unknown"}"
${userPrompt ? `\nUSER FEEDBACK: ${userPrompt}` : ""}
${protectedContext}

Return ONLY the single week object, not the full plan:
{
  "week": ${weekNumber},
  "name": "Phase name",
  "tagline": "Brief tagline",
  "tasks": [...]
}`

        const messages = [
          { role: "system", content: weekPrompt },
          {
            role: "user",
            content: userPrompt
              ? `Regenerate week ${weekNumber} with these changes: ${userPrompt}`
              : `Regenerate week ${weekNumber} with fresh tasks.${protectedTasks.length ? " (Respect preserved tasks)" : ""}`,
          },
        ]

        const response = await callAI(messages, config, {
          contextType: "goal_plan_week",
        })

        if (!response) {
          throw new Error("No response from AI")
        }

        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (!jsonMatch) {
          throw new Error("Could not parse week response")
        }

        const newWeek = JSON.parse(jsonMatch[0])

        // Assign IDs to new tasks
        if (newWeek.tasks) {
          newWeek.tasks = newWeek.tasks.map((t) => ({
            ...t,
            id: t.id || crypto.randomUUID(),
          }))
        }

        // MERGE LOGIC: Combine protected tasks + new AI tasks
        // We put protected tasks FIRST (or should we respect order? simple append is safest for now)
        const mergedTasks = [...protectedTasks, ...(newWeek.tasks || [])]

        // Update plan with new week
        const updatedPlan = {
          ...plan,
          phases: plan.phases.map((phase) =>
            phase.week === weekNumber
              ? {
                  ...newWeek,
                  week: weekNumber,
                  id: phase.id,
                  tasks: mergedTasks,
                } // Preserve phase ID, use merged tasks
              : phase,
          ),
        }

        setPlan(updatedPlan)
        return updatedPlan
      } catch (err) {
        console.error("Week regeneration error:", err)
        setError(err.message || "Failed to regenerate week")
        return null
      } finally {
        setRegeneratingWeek(null)
      }
    },
    [config, plan],
  )

  /**
   * Update a specific task in the plan
   */
  const updateTask = useCallback(
    (weekNumber, taskIndex, updates) => {
      if (!plan) return

      const updatedPlan = {
        ...plan,
        phases: plan.phases.map((phase) => {
          if (phase.week !== weekNumber) return phase
          return {
            ...phase,
            tasks: phase.tasks.map((task, i) =>
              i === taskIndex ? { ...task, ...updates } : task,
            ),
          }
        }),
      }

      setPlan(updatedPlan)
    },
    [plan],
  )

  /**
   * Delete a task from the plan
   */
  const deleteTask = useCallback(
    (weekNumber, taskIndex) => {
      if (!plan) return

      const updatedPlan = {
        ...plan,
        phases: plan.phases.map((phase) => {
          if (phase.week !== weekNumber) return phase
          return {
            ...phase,
            tasks: phase.tasks.filter((_, i) => i !== taskIndex),
          }
        }),
      }

      setPlan(updatedPlan)
    },
    [plan],
  )

  /**
   * Add a custom task to a specific week
   */
  const addTask = useCallback(
    (weekNumber, task) => {
      if (!plan) return

      const updatedPlan = {
        ...plan,
        phases: plan.phases.map((phase) => {
          if (phase.week !== weekNumber) return phase
          return {
            ...phase,
            tasks: [...phase.tasks, { ...task, id: crypto.randomUUID() }],
          }
        }),
      }

      setPlan(updatedPlan)
    },
    [plan],
  )

  /**
   * Reset plan state
   */
  const resetPlan = useCallback(() => {
    setPlan(null)
    setError(null)
  }, [])

  return {
    plan,
    loading,
    loadingQuestions,
    regeneratingWeek,
    error,
    rawResponse,
    clarifyingQuestions,
    generateClarifyingQuestions,
    generatePlan,
    regenerateWeek,
    updateTask,
    deleteTask,
    addTask,
    resetPlan,
    hasApiKey: !!config?.api_key,
  }
}
