import { useMemo } from "react"
import * as LucideIcons from "lucide-react"
import { Edit2, Trash2, Plus, Minus } from "lucide-react"
import { cn } from "../../lib/utils"

export function TaskItem({
  task,
  completionCount = 0,
  onComplete,
  onUncomplete,
  onEdit,
  onDelete,
  date,
  disabled = false,
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
  const size = 44
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
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Completion Button with Progress Ring */}
      <button
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "relative flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-full",
          disabled && "cursor-not-allowed"
        )}
      >
        {/* Progress Ring */}
        <svg width={size} height={size} className="progress-ring">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={task.color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            className="transition-all duration-300"
          />
        </svg>

        {/* Icon in center */}
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-all duration-200",
            isComplete && "animate-checkmark"
          )}
        >
          <Icon
            className="w-5 h-5"
            style={{
              color: isComplete ? task.color : "var(--color-text-tertiary)",
            }}
          />
        </div>
      </button>

      {/* Task Info */}
      <div className="flex-1 min-w-0">
        <h3
          className={cn(
            "font-medium transition-colors duration-200",
            isComplete ? "text-tertiary line-through" : "text-primary"
          )}
        >
          {task.name}
        </h3>
        {task.description && (
          <p className="text-sm text-tertiary truncate mt-0.5">
            {task.description}
          </p>
        )}
        {targetCount > 1 && (
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={handleDecrement}
              disabled={disabled || completionCount === 0}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center",
                "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700",
                "transition-colors",
                (disabled || completionCount === 0) &&
                  "opacity-40 cursor-not-allowed"
              )}
            >
              <Minus className="w-3 h-3 text-tertiary" />
            </button>
            <span className="text-xs text-tertiary min-w-[40px] text-center">
              {completionCount} / {targetCount}
            </span>
            <button
              onClick={handleIncrement}
              disabled={disabled || completionCount >= targetCount}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center",
                "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700",
                "transition-colors",
                (disabled || completionCount >= targetCount) &&
                  "opacity-40 cursor-not-allowed"
              )}
            >
              <Plus className="w-3 h-3 text-tertiary" />
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(task)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Edit2 className="w-4 h-4 text-tertiary" />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Trash2 className="w-4 h-4 text-tertiary hover:text-task-red" />
        </button>
      </div>
    </div>
  )
}
