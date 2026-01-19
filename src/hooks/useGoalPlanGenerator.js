import { useState, useCallback } from "react"
import { callAI } from "../lib/ai/client"
import {
  buildGoalPlanPrompt,
  buildClarifyingQuestionsPrompt,
} from "../lib/ai/prompts"
import { useAIConfig } from "./useAIConfig"

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
    async (goalData) => {
      if (!config?.api_key) {
        setError("Please configure your AI settings first")
        return null
      }

      setLoadingQuestions(true)
      setError(null)
      setClarifyingQuestions(null)

      try {
        const systemPrompt = buildClarifyingQuestionsPrompt(goalData)

        const messages = [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content:
              "Analyze my goal and generate clarifying questions if needed.",
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
  const generatePlan = useCallback(
    async (goalData) => {
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

        const systemPrompt = buildGoalPlanPrompt(goalData, userContext)

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
    [config],
  )

  /**
   * Regenerate a specific week's tasks
   */
  const regenerateWeek = useCallback(
    async (weekNumber, goalData, userPrompt = "") => {
      if (!config?.api_key || !plan) {
        return null
      }

      setRegeneratingWeek(weekNumber)
      setError(null)

      try {
        const userContext = config.user_details || ""
        const basePrompt = buildGoalPlanPrompt(goalData, userContext)

        const weekPrompt = `${basePrompt}

SPECIAL INSTRUCTION: Only regenerate Week ${weekNumber}. The other weeks are already set.
Current Week ${weekNumber} phase name: "${plan.phases.find((p) => p.week === weekNumber)?.name || "Unknown"}"
${userPrompt ? `\nUSER FEEDBACK: ${userPrompt}` : ""}

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
              : `Regenerate week ${weekNumber} with fresh tasks.`,
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

        // Update plan with new week
        const updatedPlan = {
          ...plan,
          phases: plan.phases.map((phase) =>
            phase.week === weekNumber
              ? { ...newWeek, week: weekNumber }
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
            tasks: [...phase.tasks, task],
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
