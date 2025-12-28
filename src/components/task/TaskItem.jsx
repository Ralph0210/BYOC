import { useMemo } from "react"
import * as LucideIcons from "lucide-react"
import { Edit2, Trash2, Plus, Minus, Check, Moon } from "lucide-react"
import { cn } from "../../lib/utils"
import { TaskAmbientNote } from "../ai/AmbientNote"

export function TaskItem({
  task,
  completionCount = 0,
  onComplete,
  onUncomplete,
  onEdit,
  onDelete,
  onSnooze,
  date,
  disabled = false,
  isSnoozed = false,
  lastCompletedDate = null,
  onAmbientClick = null,
}) {
  // Get the icon component
  const Icon = useMemo(() => {
    const pascalName = task.icon
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("")
    return LucideIcons[pascalName] || LucideIcons.Circle
  }, [task.icon])

  const targetCount = task.frequency_count || 1
  const isComplete = completionCount >= targetCount
  const progress = Math.min(completionCount / targetCount, 1)

  // Calculate ring properties
  const size = 32
  const strokeWidth = 3
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  const handleIncrement = () => {
    if (!disabled && completionCount < targetCount) {
      onComplete(task.id, date)
    }
  }

  const handleDecrement = () => {
    if (!disabled && completionCount > 0) {
      onUncomplete(task.id, date)
    }
  }

  const handleClick = () => {
    if (disabled) return
    if (completionCount < targetCount) {
      onComplete(task.id, date)
    } else {
      onUncomplete(task.id, date)
    }
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-4 p-4 rounded-2xl transition-all duration-150",
        "bg-white dark:bg-surface-dark",
        "hover:shadow-card",
        disabled && "opacity-50 cursor-not-allowed",
        isSnoozed && "opacity-60 bg-gray-50 dark:bg-gray-800/50"
      )}
    >
      {/* Premium Icon Container (Left) */}
      <div className="relative w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-15 transition-colors duration-300"
          style={{ backgroundColor: task.color }}
        />
        <Icon
          className="w-6 h-6 relative z-10 transition-colors duration-300"
          style={{ color: task.color }}
        />
      </div>

      {/* Task Info */}
      <div className="flex-1 min-w-0">
        <h3
          className={cn(
            "font-medium transition-colors duration-200 leading-snug break-words",
            isComplete ? "text-tertiary line-through" : "text-primary"
          )}
        >
          {task.name}
        </h3>
        {task.description && (
          <p className="text-sm text-tertiary truncate mt-1">
            {task.description}
          </p>
        )}

        {/* AI Ambient Note for neglected tasks */}
        {!isComplete && (
          <div
            onClick={onAmbientClick ? () => onAmbientClick(task) : undefined}
            className={onAmbientClick ? "cursor-pointer hover:opacity-80" : ""}
          >
            <TaskAmbientNote
              task={task}
              lastCompletedDate={lastCompletedDate}
            />
          </div>
        )}

        {/* Counter Controls (Only if count > 1) */}
        {targetCount > 1 && (
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDecrement()
              }}
              disabled={disabled || completionCount === 0}
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center",
                "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700",
                "transition-colors active:scale-95",
                (disabled || completionCount === 0) &&
                  "opacity-40 cursor-not-allowed"
              )}
            >
              <Minus className="w-3.5 h-3.5 text-tertiary" />
            </button>
            <span className="text-xs text-secondary font-medium w-[40px] text-center">
              {completionCount} / {targetCount}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleIncrement()
              }}
              disabled={disabled || completionCount >= targetCount}
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center",
                "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700",
                "transition-colors active:scale-95",
                (disabled || completionCount >= targetCount) &&
                  "opacity-40 cursor-not-allowed"
              )}
            >
              <Plus className="w-3.5 h-3.5 text-tertiary" />
            </button>
          </div>
        )}
      </div>

      {/* Actions (Snooze/Edit/Delete) - Always visible */}
      <div className="flex gap-1">
        {onSnooze && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onSnooze(task.id, date)
            }}
            aria-label={isSnoozed ? "Unsnooze task" : "Snooze task for today"}
            className={cn(
              "p-2 rounded-lg transition-colors",
              isSnoozed
                ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-tertiary hover:text-purple-500"
            )}
            title={isSnoozed ? "Unsnooze" : "Snooze for today"}
          >
            <Moon className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit(task)
          }}
          aria-label="Edit task"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-tertiary hover:text-primary"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(task.id)
          }}
          aria-label="Delete task"
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-tertiary hover:text-task-red"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Completion Button (Right) */}
      <button
        onClick={handleClick}
        disabled={disabled}
        aria-label="Toggle completion status"
        className={cn(
          "relative flex-shrink-0 focus:outline-none rounded-full ml-2",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <div
          className={cn(
            "relative w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform active:scale-90",
            isComplete
              ? "border-transparent bg-primary-500"
              : "border-gray-200 dark:border-gray-700 bg-transparent hover:border-primary-500/50"
          )}
        >
          {/* Progress Ring for partial completion */}
          {!isComplete && completionCount > 0 && (
            <svg
              width={32}
              height={32}
              className="absolute inset-0 -rotate-90 pointer-events-none"
            >
              <circle
                cx={16}
                cy={16}
                r={14}
                fill="none"
                stroke={task.color}
                strokeWidth={2}
                strokeDasharray={2 * Math.PI * 14}
                strokeDashoffset={2 * Math.PI * 14 * (1 - progress)}
                className="transition-all duration-300"
              />
            </svg>
          )}

          {/* Checkmark with Pop Animation */}
          {isComplete && (
            <Check
              className="w-4 h-4 text-white animate-in zoom-in-50 duration-300 spring-bounce"
              strokeWidth={3}
            />
          )}
        </div>
      </button>
    </div>
  )
}
