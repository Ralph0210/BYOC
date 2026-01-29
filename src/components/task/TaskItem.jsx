import { useState, useRef, useEffect, useMemo } from "react"
import * as LucideIcons from "lucide-react"
import {
  Edit2,
  Trash2,
  Plus,
  Minus,
  Check,
  Moon,
  MoreVertical,
} from "lucide-react"
import { cn } from "../../lib/utils"
import { TaskAmbientNote } from "../ai/AmbientNote"
import { useTasks } from "../../hooks/useTasks"

/**
 * Dropdown menu for task actions
 */
function TaskActionsDropdown({
  task,
  date,
  isSnoozed,
  onSnooze,
  onEdit,
  onDelete,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        aria-label="More actions"
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-tertiary hover:text-primary"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 z-50 min-w-[140px] rounded-lg overflow-hidden shadow-lg border border-border bg-white dark:bg-gray-900">
          {onSnooze && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSnooze(task.id, date)
                setIsOpen(false)
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                isSnoozed
                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                  : "hover:bg-surface-hover text-secondary hover:text-primary",
              )}
            >
              <Moon className="w-4 h-4" />
              <span>{isSnoozed ? "Unsnooze" : "Snooze"}</span>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit(task)
              setIsOpen(false)
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-hover transition-colors text-secondary hover:text-primary"
          >
            <Edit2 className="w-4 h-4" />
            <span>Edit</span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(task.id)
              setIsOpen(false)
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-hover transition-colors text-secondary hover:text-task-red"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  )
}

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
  const { updateTask } = useTasks()
  const [isExpandingSubtasks, setIsExpandingSubtasks] = useState(false)

  // Subtask handlers
  const handleAddSubtask = async (title) => {
    if (!title.trim()) return
    const newSubtasks = [
      ...(task.subtasks || []),
      { id: crypto.randomUUID(), title, completed: false },
    ]
    await updateTask(task.id, { subtasks: newSubtasks })
  }

  const handleToggleSubtask = async (subtaskId) => {
    const newSubtasks = (task.subtasks || []).map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st,
    )
    await updateTask(task.id, { subtasks: newSubtasks })
  }

  const handleDeleteSubtask = async (subtaskId) => {
    const newSubtasks = (task.subtasks || []).filter(
      (st) => st.id !== subtaskId,
    )
    await updateTask(task.id, { subtasks: newSubtasks })
  }

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
        "group flex items-center gap-4 p-4 rounded-xl transition-all duration-200",
        "task-item-skeu",
        disabled && "opacity-50 cursor-not-allowed",
        isSnoozed && "opacity-50",
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
            isComplete ? "text-tertiary line-through" : "text-primary",
          )}
        >
          {task.name}
        </h3>
        {task.description && (
          <p className="text-sm text-tertiary truncate mt-1">
            {task.description}
          </p>
        )}

        {/* Subtasks */}
        <div className="mt-3">
          {(task.subtasks?.length > 0 || isExpandingSubtasks) && (
            <div className="space-y-2">
              {/* Progress Bar (if subtasks exist) */}
              {task.subtasks?.length > 0 && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 transition-all duration-300"
                      style={{
                        width: `${(task.subtasks.filter((st) => st.completed).length / task.subtasks.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-tertiary">
                    {task.subtasks.filter((st) => st.completed).length}/
                    {task.subtasks.length}
                  </span>
                </div>
              )}

              {/* List */}
              {task.subtasks?.map((subtask) => (
                <div
                  key={subtask.id}
                  className="flex items-start gap-2 group/subtask"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleSubtask(subtask.id)
                    }}
                    className={cn(
                      "mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                      subtask.completed
                        ? "bg-primary-500 border-primary-500"
                        : "border-gray-300 dark:border-gray-600 hover:border-primary-500",
                    )}
                  >
                    {subtask.completed && (
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    )}
                  </button>
                  <span
                    className={cn(
                      "text-sm flex-1 leading-tight transition-colors",
                      subtask.completed
                        ? "text-tertiary line-through"
                        : "text-secondary",
                    )}
                  >
                    {subtask.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteSubtask(subtask.id)
                    }}
                    className="opacity-0 group-hover/subtask:opacity-100 p-0.5 text-tertiary hover:text-red-500 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Add Input */}
              <div className="flex items-center gap-2 mt-1">
                <Plus className="w-4 h-4 text-tertiary" />
                <input
                  type="text"
                  placeholder="Add subtask..."
                  className="bg-transparent border-none p-0 text-sm focus:ring-0 placeholder:text-tertiary/50 w-full"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddSubtask(e.currentTarget.value)
                      e.currentTarget.value = ""
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}

          {/* Add Subtask Button (Initial) */}
          {!task.subtasks?.length && !isExpandingSubtasks && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsExpandingSubtasks(true)
              }}
              className="text-xs text-tertiary hover:text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Plus className="w-3 h-3" />
              Add checklist
            </button>
          )}
        </div>

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
                  "opacity-40 cursor-not-allowed",
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
                  "opacity-40 cursor-not-allowed",
              )}
            >
              <Plus className="w-3.5 h-3.5 text-tertiary" />
            </button>
          </div>
        )}
      </div>

      {/* Actions Dropdown Menu */}
      <TaskActionsDropdown
        task={task}
        date={date}
        isSnoozed={isSnoozed}
        onSnooze={onSnooze}
        onEdit={onEdit}
        onDelete={onDelete}
      />

      {/* Completion Button (Right) */}
      <button
        onClick={handleClick}
        disabled={disabled}
        aria-label="Toggle completion status"
        className={cn(
          "relative flex-shrink-0 focus:outline-none rounded-full ml-2",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <div
          className={cn(
            "relative w-8 h-8 rounded-full border-2 flex items-center justify-center transition-transform active:scale-90",
            isComplete
              ? "border-transparent bg-primary-500"
              : "border-gray-200 dark:border-gray-700 bg-transparent hover:border-primary-500/50",
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
