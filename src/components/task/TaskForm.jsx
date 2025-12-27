import { useState } from "react"
import { Button } from "../ui/Button"
import { ColorPicker } from "../ui/ColorPicker"
import { IconPicker } from "../ui/IconPicker"
import { FrequencySelector } from "./FrequencySelector"
import { FREQUENCY_TYPES } from "../../lib/constants"

export function TaskForm({ task, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: task?.name || "",
    description: task?.description || "",
    icon: task?.icon || "circle",
    color: task?.color || "#007AFF",
    frequency_type: task?.frequency_type || FREQUENCY_TYPES.DAILY,
    frequency_count: task?.frequency_count || 1,
    frequency_days: task?.frequency_days || [],
  })

  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = "Task name is required"
    }
    if (
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

      {/* Frequency */}
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
          <p className="mt-1 text-sm text-task-red">{errors.frequency_days}</p>
        )}
      </div>

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
