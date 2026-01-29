import { useState } from "react"
import { Button } from "../ui/Button"
import { ColorPicker } from "../ui/ColorPicker"
import { IconPicker } from "../ui/IconPicker"
import { FrequencySelector } from "./FrequencySelector"
import { FREQUENCY_TYPES } from "../../lib/constants"
import { Clock, Repeat, Plus, Trash2, Check } from "lucide-react"
import { cn } from "../../lib/utils"

export function TaskForm({ task, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: task?.name || "",
    description: task?.description || "",
    subtasks: task?.subtasks || [],
    icon: task?.icon || "circle",
    color: task?.color || "#007AFF",
    frequency_type: task?.frequency_type || FREQUENCY_TYPES.DAILY,
    frequency_count: task?.frequency_count || 1,
    frequency_days: task?.frequency_days || [],
    scheduled_time: task?.scheduled_time || "",
    duration_minutes: task?.duration_minutes || null,
    is_recurring: task?.is_recurring ?? true,
  })

  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const handleAddSubtask = (title) => {
    if (!title.trim()) return
    const newSubtask = {
      id: crypto.randomUUID(),
      title: title.trim(),
      completed: false,
    }
    setFormData((prev) => ({
      ...prev,
      subtasks: [...prev.subtasks, newSubtask],
    }))
  }

  const handleDeleteSubtask = (id) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks.filter((st) => st.id !== id),
    }))
  }

  const handleToggleSubtask = (id) => {
    setFormData((prev) => ({
      ...prev,
      subtasks: prev.subtasks.map((st) =>
        st.id === id ? { ...st, completed: !st.completed } : st,
      ),
    }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = "Task name is required"
    }
    if (
      formData.is_recurring &&
      formData.frequency_type === FREQUENCY_TYPES.SPECIFIC_DAYS &&
      formData.frequency_days.length === 0
    ) {
      newErrors.frequency_days = "Select at least one day"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  const durationOptions = [
    { value: null, label: "Not set" },
    { value: 5, label: "5 min" },
    { value: 10, label: "10 min" },
    { value: 15, label: "15 min" },
    { value: 30, label: "30 min" },
    { value: 45, label: "45 min" },
    { value: 60, label: "1 hour" },
    { value: 90, label: "1.5 hours" },
    { value: 120, label: "2 hours" },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Task Name */}
      <div>
        <label className="block text-sm font-medium text-secondary mb-2">
          Task Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="e.g., Drink water"
          className="w-full px-4 py-3 rounded-xl bg-surface-light dark:bg-gray-800 border border-app focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-task-red">{errors.name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-secondary mb-2">
          Description (optional)
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Add details about this task..."
          rows={2}
          className="w-full px-4 py-3 rounded-xl bg-surface-light dark:bg-gray-800 border border-app focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors resize-none"
        />
      </div>

      {/* Subtasks */}
      <div>
        <label className="block text-sm font-medium text-secondary mb-2">
          Checklist
        </label>
        <div className="space-y-2">
          {formData.subtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center gap-2 group p-2 rounded-lg bg-surface-light dark:bg-gray-800/50"
            >
              <button
                type="button"
                onClick={() => handleToggleSubtask(subtask.id)}
                className={cn(
                  "w-5 h-5 rounded border flex items-center justify-center transition-colors flex-shrink-0",
                  subtask.completed
                    ? "bg-primary-500 border-primary-500"
                    : "border-gray-300 dark:border-gray-600 hover:border-primary-500",
                )}
              >
                {subtask.completed && (
                  <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                )}
              </button>
              <span
                className={cn(
                  "text-sm flex-1 leading-tight transition-colors break-words",
                  subtask.completed
                    ? "text-tertiary line-through"
                    : "text-secondary",
                )}
              >
                {subtask.title}
              </span>
              <button
                type="button"
                onClick={() => handleDeleteSubtask(subtask.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-tertiary hover:text-red-500 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* Add Subtask Input */}
          <div className="flex items-center gap-2 mt-2">
            <Plus className="w-4 h-4 text-tertiary" />
            <input
              type="text"
              placeholder="Add checklist item..."
              className="bg-transparent border-none p-0 text-sm focus:ring-0 placeholder:text-tertiary/50 w-full"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault() // Prevent form submission
                  handleAddSubtask(e.currentTarget.value)
                  e.currentTarget.value = ""
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Schedule Time & Duration Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Scheduled Time */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">
            <Clock className="w-4 h-4 inline mr-1" />
            Preferred Time
          </label>
          <input
            type="time"
            value={formData.scheduled_time}
            onChange={(e) => handleChange("scheduled_time", e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-surface-light dark:bg-gray-800 border border-app focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
          />
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">
            Duration
          </label>
          <select
            value={formData.duration_minutes ?? ""}
            onChange={(e) =>
              handleChange(
                "duration_minutes",
                e.target.value ? parseInt(e.target.value) : null,
              )
            }
            className="w-full px-4 py-3 rounded-xl bg-surface-light dark:bg-gray-800 border border-app focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
          >
            {durationOptions.map((opt) => (
              <option key={opt.value ?? "null"} value={opt.value ?? ""}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Icon & Color Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Icon */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">
            Icon
          </label>
          <IconPicker
            value={formData.icon}
            onChange={(icon) => handleChange("icon", icon)}
            color={formData.color}
          />
        </div>

        {/* Color */}
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">
            Color
          </label>
          <ColorPicker
            value={formData.color}
            onChange={(color) => handleChange("color", color)}
          />
        </div>
      </div>

      {/* Recurring Toggle */}
      <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              formData.is_recurring ? "bg-indigo-500/15" : "bg-surface",
            )}
          >
            <Repeat
              className={cn(
                "w-5 h-5",
                formData.is_recurring ? "text-indigo-500" : "text-tertiary",
              )}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">Recurring Task</p>
            <p className="text-xs text-tertiary">
              {formData.is_recurring
                ? "Repeats based on frequency"
                : "One-time task"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => handleChange("is_recurring", !formData.is_recurring)}
          className={cn(
            "relative w-14 h-8 rounded-full transition-colors duration-200",
            formData.is_recurring ? "bg-indigo-500" : "bg-gray-300",
          )}
          role="switch"
          aria-checked={formData.is_recurring}
        >
          <span
            className={cn(
              "absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200",
              formData.is_recurring ? "translate-x-7" : "translate-x-1",
            )}
          />
        </button>
      </div>

      {/* Frequency (only show if recurring) */}
      {formData.is_recurring && (
        <div>
          <label className="block text-sm font-medium text-secondary mb-2">
            Frequency
          </label>
          <FrequencySelector
            type={formData.frequency_type}
            count={formData.frequency_count}
            days={formData.frequency_days}
            onChange={(field, value) => handleChange(field, value)}
          />
          {errors.frequency_days && (
            <p className="mt-1 text-sm text-task-red">
              {errors.frequency_days}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          {task ? "Save Changes" : "Add Task"}
        </Button>
      </div>
    </form>
  )
}
