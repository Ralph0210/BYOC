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
    title: "I want to",
    icon: Target,
    placeholder: "run a 5K without stopping...",
    helper: "What do you want to achieve?",
  },
  {
    id: "motivation",
    title: "Because",
    icon: Heart,
    placeholder: "I want to feel healthier and have more energy...",
    helper: "Why does this matter to you?",
  },
  {
    id: "concerns",
    title: "But I worry about",
    icon: AlertCircle,
    placeholder: "losing motivation, not having enough time...",
    helper: "What obstacles might get in your way?",
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
    motivation: "",
    concerns: "",
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
        return goalData.motivation.trim().length > 0
      case 2:
        return true // Concerns are optional
      case 3:
        return true // Clarify answers are optional
      case 4:
        return true // Start date has default
      default:
        return false
    }
  }

  const handleNext = async () => {
    // After concerns step, generate clarifying questions
    if (currentStep === 2) {
      if (onGenerateClarifyingQuestions) {
        const result = await onGenerateClarifyingQuestions({
          goal: goalData.goal,
          motivation: goalData.motivation,
          concerns: goalData.concerns,
        })

        // If no questions, skip to start date
        if (!result?.questions || result.questions.length === 0) {
          setCurrentStep(4) // Skip to start date
          return
        }
      }
      setCurrentStep(3) // Go to clarify step
      return
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Build enhanced goal data with clarifications
      const enhancedGoalData = { ...goalData }

      // Compile all clarification context
      let clarificationContext = ""
      if (
        clarifyingQuestions?.questions &&
        Object.keys(goalData.clarifications).length > 0
      ) {
        clarificationContext = clarifyingQuestions.questions
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

      // Pass goal type and duration inferred by AI
      if (clarifyingQuestions?.goal_type) {
        enhancedGoalData.goalType = clarifyingQuestions.goal_type
      }
      if (clarifyingQuestions?.suggested_duration_days) {
        enhancedGoalData.durationDays =
          clarifyingQuestions.suggested_duration_days
      }

      onGenerate(enhancedGoalData)
    }
  }

  const handleBack = () => {
    if (currentStep === 4 && !hasQuestions) {
      // If we skipped clarify, go back to concerns
      setCurrentStep(2)
    } else if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const step = STEPS[currentStep]
  const StepIcon = step.icon

  // Calculate progress (adjusting for optional clarify step)
  const totalSteps = hasQuestions ? 5 : 4
  const progressStep = hasQuestions
    ? currentStep
    : currentStep > 2
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
            <h3 className="text-lg font-semibold text-primary">{step.title}</h3>
            <p className="text-sm text-tertiary">{step.helper}</p>
          </div>
        </div>

        {/* Step Input */}
        {currentStep < 3 ? (
          <textarea
            value={goalData[step.id]}
            onChange={(e) => updateField(step.id, e.target.value)}
            placeholder={step.placeholder}
            rows={4}
            className="w-full px-4 py-3 rounded-xl bg-surface-light dark:bg-gray-800 border border-app focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors resize-none text-primary"
            autoFocus
          />
        ) : currentStep === 3 ? (
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
              We'll create a 4-week plan starting from this date.
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
          {currentStep === 2
            ? "Analyze"
            : currentStep === STEPS.length - 1
              ? "Generate Plan"
              : "Next"}
        </Button>
      </div>
    </div>
  )
}
