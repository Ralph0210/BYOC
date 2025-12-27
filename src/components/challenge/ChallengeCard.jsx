import { useMemo } from "react"
import { ChevronRight, Gift, Edit2, Trash2 } from "lucide-react"
import { Card } from "../ui/Card"
import { cn, formatDisplayDate, daysDiff, getToday } from "../../lib/utils"

export function ChallengeCard({
  challenge,
  taskCount = 0,
  completionRate = 0,
  onClick,
  onEdit,
  onDelete,
}) {
  const today = getToday()

  const progress = useMemo(() => {
    if (!challenge.start_date || !challenge.end_date) return 0

    const totalDays = daysDiff(challenge.start_date, challenge.end_date) + 1
    const elapsedDays = Math.max(0, daysDiff(challenge.start_date, today) + 1)

    return Math.min(Math.round((elapsedDays / totalDays) * 100), 100)
  }, [challenge.start_date, challenge.end_date, today])

  const daysRemaining = useMemo(() => {
    if (!challenge.end_date) return null
    const diff = daysDiff(today, challenge.end_date)
    if (challenge.end_date < today) return 0
    return diff
  }, [challenge.end_date, today])

  const isCompleted = daysRemaining === 0 || challenge.end_date < today

  return (
    <Card
      interactive
      className="group relative overflow-hidden"
      onClick={onClick}
    >
      {/* Progress bar background */}
      <div
        className="absolute bottom-0 left-0 h-1 bg-primary-500 transition-all duration-500"
        style={{ width: `${progress}%` }}
      />

      <div className="flex items-center gap-4">
        {/* Challenge Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-primary truncate">
              {challenge.name}
            </h3>
            {challenge.reward_text && (
              <Gift className="w-4 h-4 text-task-yellow flex-shrink-0" />
            )}
          </div>

          {challenge.description && (
            <p className="text-sm text-tertiary truncate mb-2">
              {challenge.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-secondary">
            <span>
              {taskCount} task{taskCount !== 1 ? "s" : ""}
            </span>
            <span>•</span>
            <span>
              {formatDisplayDate(challenge.start_date)} →{" "}
              {formatDisplayDate(challenge.end_date)}
            </span>
            {daysRemaining !== null && daysRemaining > 0 && (
              <>
                <span>•</span>
                <span
                  className={cn(
                    daysRemaining <= 3 && "text-task-orange font-medium"
                  )}
                >
                  {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left
                </span>
              </>
            )}
            {isCompleted && (
              <>
                <span>•</span>
                <span className="text-task-green font-medium">Completed</span>
              </>
            )}
          </div>
        </div>

        {/* Completion Rate */}
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            {Math.round(completionRate)}%
          </div>
          <div className="text-xs text-tertiary">complete</div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEdit(challenge)
              }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Edit2 className="w-4 h-4 text-tertiary" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(challenge.id)
              }}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Trash2 className="w-4 h-4 text-tertiary hover:text-task-red" />
            </button>
          </div>
          <ChevronRight className="w-5 h-5 text-tertiary" />
        </div>
      </div>
    </Card>
  )
}
