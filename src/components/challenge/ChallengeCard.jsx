import { useMemo } from "react"
import { ChevronRight, Gift, Edit2, Trash2 } from "lucide-react"
import { Card } from "../ui/Card"
import { cn, formatDisplayDate, daysDiff, getToday } from "../../lib/utils"

export function ChallengeCard({
  challenge,
  taskCount = 0,
  completionRate = 0,
  todayRate = 0,
  onClick,
  onEdit,
  onDelete,
  children,
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

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Challenge Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-primary truncate leading-snug">
              {challenge.name}
            </h3>
            {challenge.reward_text && (
              <Gift className="w-4 h-4 text-task-yellow flex-shrink-0" />
            )}
          </div>

          {challenge.description && (
            <p className="text-sm text-tertiary truncate mb-3 sm:mb-2">
              {challenge.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-secondary">
            <span>
              {taskCount} task{taskCount !== 1 ? "s" : ""}
            </span>
            <span className="hidden sm:inline">•</span>
            <span>
              {formatDisplayDate(challenge.start_date)} →{" "}
              {formatDisplayDate(challenge.end_date)}
            </span>
            {daysRemaining !== null && daysRemaining > 0 && (
              <>
                <span className="hidden sm:inline">•</span>
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
                <span className="hidden sm:inline">•</span>
                <span className="text-task-green font-medium">Completed</span>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Stats & Actions */}
        <div className="flex items-center justify-between sm:justify-end gap-4 mt-2 sm:mt-0 border-t sm:border-t-0 border-app pt-3 sm:pt-0">
          {/* Stats Column */}
          <div className="flex flex-col items-end gap-1">
            {/* Today's Progress Badge */}
            <div
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                todayRate === 100
                  ? "bg-task-green/10 text-task-green"
                  : "bg-gray-100 text-secondary dark:bg-gray-800"
              )}
            >
              Today: {Math.round(todayRate)}%
            </div>

            {/* Overall Progress */}
            <div className="text-right">
              <div className="text-xl font-bold text-primary leading-none">
                {Math.round(completionRate)}%
              </div>
              <div className="text-[10px] text-tertiary font-medium">
                overall
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit(challenge)
                }}
                aria-label="Edit challenge"
                className="p-3 sm:p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <Edit2 className="w-5 h-5 sm:w-4 sm:h-4 text-tertiary" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(challenge.id)
                }}
                aria-label="Delete challenge"
                className="p-3 sm:p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-task-red"
              >
                <Trash2 className="w-5 h-5 sm:w-4 sm:h-4 text-tertiary hover:text-task-red" />
              </button>
            </div>
            <ChevronRight className="w-5 h-5 text-tertiary hidden sm:block" />
          </div>
        </div>
      </div>
      {children}
    </Card>
  )
}
