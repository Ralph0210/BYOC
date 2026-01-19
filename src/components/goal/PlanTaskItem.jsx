import { Check, RefreshCw, Trash2, Edit2 } from "lucide-react"
import { cn } from "../../lib/utils"

export function PlanTaskItem({
  task,
  selected,
  onToggle,
  onEdit,
  onDelete,
  disabled = false,
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-3 p-3 rounded-xl transition-all",
        "bg-white dark:bg-gray-800/50 border",
        selected
          ? "border-primary-500 bg-primary-500/5"
          : "border-app hover:border-gray-300 dark:hover:border-gray-600",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      {/* Selection Checkbox */}
      <button
        type="button"
        onClick={() => !disabled && onToggle()}
        disabled={disabled}
        className={cn(
          "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
          selected
            ? "bg-primary-500 text-white"
            : "border-2 border-gray-300 dark:border-gray-600 hover:border-primary-500",
        )}
      >
        {selected && <Check className="w-4 h-4" strokeWidth={3} />}
      </button>

      {/* Task Info */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium text-sm transition-colors",
            selected ? "text-primary" : "text-secondary",
          )}
        >
          {task.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-tertiary">{task.frequency}</span>
          {task.duration_minutes && (
            <>
              <span className="text-xs text-tertiary">•</span>
              <span className="text-xs text-tertiary">
                {task.duration_minutes}m
              </span>
            </>
          )}
        </div>
        {task.notes && (
          <details className="mt-1">
            <summary className="text-xs text-tertiary cursor-pointer hover:text-secondary line-clamp-1">
              {task.notes}
            </summary>
            <p className="text-xs text-tertiary mt-1 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
              {task.notes}
            </p>
          </details>
        )}
      </div>

      {/* Actions (visible on hover) */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-tertiary hover:text-primary transition-colors"
            title="Edit task"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-tertiary hover:text-red-500 transition-colors"
            title="Remove task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
