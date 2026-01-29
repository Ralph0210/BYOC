import { useState } from "react"
import {
  Target,
  Heart,
  AlertCircle,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  HelpCircle,
} from "lucide-react"
import { Button } from "../ui/Button"
import { formatDate, cn } from "../../lib/utils"

const STEPS = [
  {
    id: "goal",
    title: "My Goal",
    icon: Target,
    placeholder: "e.g., learn React in 2 weeks or run a 5K...",
    helper: "What do you want to achieve?",
  },
  {
    id: "clarify",
    title: "Quick questions",
    icon: HelpCircle,
    helper: "Help us understand your goal better",
  },
  {
    id: "start",
    title: "When to start?",
    icon: Calendar,
    helper: "Pick a start date for your challenge",
  },
]

export function GoalWizard({
  onGenerate,
  onCancel,
  loading = false,
  onGenerateClarifyingQuestions,
  loadingQuestions = false,
  clarifyingQuestions = null,
}) {
  const today = formatDate(new Date())
  const [currentStep, setCurrentStep] = useState(0)
  const [goalData, setGoalData] = useState({
    goal: "",
    clarifications: {},
    startDate: today,
  })

  const updateField = (field, value) => {
    setGoalData((prev) => ({ ...prev, [field]: value }))
  }

  const updateClarification = (questionId, value) => {
    setGoalData((prev) => ({
      ...prev,
      clarifications: { ...prev.clarifications, [questionId]: value },
    }))
  }

  // Check if we should show the clarify step
  const hasQuestions =
    clarifyingQuestions?.questions && clarifyingQuestions.questions.length > 0

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return goalData.goal.trim().length > 0
      case 1:
        return true // Clarify answers are optional
      case 2:
        return true // Start date has default
      default:
        return false
    }
  }

  const [questionsHistory, setQuestionsHistory] = useState([])
  const [clarificationRound, setClarificationRound] = useState(0)

  const handleNext = async () => {
    // Phase 0: Initial Goal -> Generate Qs (Round 1)
    if (currentStep === 0) {
      if (onGenerateClarifyingQuestions) {
        const result = await onGenerateClarifyingQuestions(goalData.goal)
        if (!result?.questions || result.questions.length === 0) {
          setCurrentStep(2) // Skip to start date
          return
        }
      }
      setCurrentStep(1) // Go to clarify step
      return
    }

    // Phase 1: Clarification Qs
    if (currentStep === 1) {
      if (onGenerateClarifyingQuestions) {
        // 1. Save current questions to history so we don't lose context
        const currentQs = clarifyingQuestions?.questions || []
        const newHistory = [...questionsHistory, ...currentQs]
        setQuestionsHistory(newHistory)

        // 2. Check if we should refine (Round 1 -> Round 2)
        // User requested "max 3 questions" in second round.
        if (clarificationRound === 0 && currentQs.length > 0) {
          // Build context from ALL answers so far
          const currentAnswers = newHistory
            .map((q) => ({
              question: q.question,
              answer: goalData.clarifications[q.id],
            }))
            .filter((a) => a.answer)

          // Ask AI for refinement
          const result = await onGenerateClarifyingQuestions(
            goalData.goal,
            currentAnswers,
          )

          if (result?.questions && result.questions.length > 0) {
            setClarificationRound(1)
            // Stay on step 1 (UI updates automatically with new questions)
            return
          }
        }
      }
      // Proceed to Step 2
      setCurrentStep(2)
      return
    }

    // Phase 2: Start Date & Duration -> Generate Plan
    if (currentStep < STEPS.length - 1) {
      // (This block usually handles intermediate steps, but we jumped to 2)
      // Logic moved to explicit steps above for clarity
      setCurrentStep(currentStep + 1)
    } else {
      // Build enhanced goal data
      const allQuestions = [
        ...questionsHistory,
        ...(clarifyingQuestions?.questions || []),
      ]
      // deduplicate by id
      const uniqueQuestions = [
        ...new Map(allQuestions.map((q) => [q.id, q])).values(),
      ]

      const enhancedGoalData = {
        ...goalData,
        extractedSlots: clarifyingQuestions?.extracted_slots, // Use latest
        goalType: clarifyingQuestions?.goal_type, // Use latest
        durationDays: clarifyingQuestions?.suggested_duration_days || 28,
      }

      // Compile all clarification context
      let clarificationContext = ""
      if (
        uniqueQuestions.length > 0 &&
        Object.keys(goalData.clarifications).length > 0
      ) {
        clarificationContext = uniqueQuestions
          .map((q) => {
            const answer = goalData.clarifications[q.id]
            if (answer) return `Q: ${q.question}\nA: ${answer}`
            return null
          })
          .filter(Boolean)
          .join("\n\n")
      }

      // Pass clarifications as separate context
      enhancedGoalData.clarificationContext = clarificationContext

      // Pass goal type and duration inferred by AI (using latest valid data)
      // Note: prioritizing user input handled in Step 2 transition logic
      if (clarifyingQuestions?.goal_type) {
        enhancedGoalData.goalType = clarifyingQuestions.goal_type
      }

      onGenerate(enhancedGoalData)
    }
  }

  const handleBack = () => {
    if (currentStep === 2 && !hasQuestions) {
      // If we skipped clarify, go back to goal input
      setCurrentStep(0)
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const step = STEPS[currentStep]
  const StepIcon = step.icon

  // Calculate progress
  const totalSteps = hasQuestions ? 3 : 2
  const progressStep = hasQuestions
    ? currentStep
    : currentStep > 0
      ? currentStep - 1
      : currentStep

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${
              i === progressStep
                ? "w-8 bg-primary-500"
                : i < progressStep
                  ? "bg-primary-500"
                  : "bg-gray-200 dark:bg-gray-700"
            }`}
          />
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[200px]">
        {/* Step Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
            <StepIcon className="w-5 h-5 text-primary-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-primary">
              {step.id === "clarify" && clarificationRound > 0
                ? "Refining Goal..."
                : step.title}
            </h3>
            <p className="text-sm text-tertiary">
              {step.id === "clarify" && clarificationRound > 0
                ? "Just a few more details to make it perfect"
                : step.helper}
            </p>
          </div>
        </div>

        {/* Step Input */}
        {currentStep === 0 ? (
          <textarea
            value={goalData[step.id]}
            onChange={(e) => updateField(step.id, e.target.value)}
            placeholder={step.placeholder}
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-surface-light dark:bg-gray-800 border border-app focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors resize-none text-primary"
            autoFocus
          />
        ) : currentStep === 1 ? (
          /* Clarifying Questions Step */
          <div className="space-y-4">
            {loadingQuestions ? (
              <div className="flex items-center justify-center py-8">
                <div className="flex items-center gap-3 text-secondary">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <span>Analyzing your goal...</span>
                </div>
              </div>
            ) : clarifyingQuestions?.questions?.length > 0 ? (
              clarifyingQuestions.questions.map((q, index) => (
                <div key={q.id} className="space-y-2">
                  <label className="block text-sm font-medium text-primary">
                    {q.question}
                  </label>
                  {q.why && <p className="text-xs text-tertiary">{q.why}</p>}
                  <input
                    type="text"
                    value={goalData.clarifications[q.id] || ""}
                    onChange={(e) => updateClarification(q.id, e.target.value)}
                    placeholder={q.placeholder || "Your answer..."}
                    className="w-full px-4 py-3 rounded-xl bg-surface-light dark:bg-gray-800 border border-app focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors text-primary"
                    autoFocus={index === 0}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-tertiary">
                <p>Your goal is clear! Moving on...</p>
              </div>
            )}
          </div>
        ) : (
          /* Start Date Step - Simplified */
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-4 py-4 rounded-xl bg-surface-light dark:bg-gray-800 border border-app">
              <Calendar className="w-5 h-5 text-primary-500" />
              <input
                type="date"
                value={goalData.startDate}
                min={today}
                onChange={(e) => updateField("startDate", e.target.value)}
                className="flex-1 bg-transparent border-none p-0 focus:ring-0 outline-none text-primary text-lg"
              />
            </div>

            <p className="text-sm text-tertiary text-center">
              We'll create a {Math.ceil((goalData.durationDays || 28) / 7)}-week
              plan.
              <br />
              <span className="text-xs">
                You can adjust task schedules after generating the plan.
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        {currentStep === 0 ? (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            onClick={handleBack}
            className="flex-1"
            icon={ChevronLeft}
          >
            Back
          </Button>
        )}
        <Button
          type="button"
          onClick={handleNext}
          disabled={!canProceed() || loading || loadingQuestions}
          loading={loading || loadingQuestions}
          className="flex-1"
          icon={currentStep === STEPS.length - 1 ? Sparkles : ChevronRight}
          iconPosition="right"
        >
          {currentStep === 0
            ? "Analyze"
            : currentStep === STEPS.length - 1
              ? "Generate Plan"
              : "Next"}
        </Button>
      </div>
    </div>
  )
}
