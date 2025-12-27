import { useState } from "react"
import { Calendar, Gift, ExternalLink } from "lucide-react"
import { Button } from "../ui/Button"
import { formatDate, addDays } from "../../lib/utils"

export function ChallengeForm({ challenge, onSubmit, onCancel }) {
  const today = formatDate(new Date())

  const [formData, setFormData] = useState({
    name: challenge?.name || "",
    description: challenge?.description || "",
    start_date: challenge?.start_date || today,
    end_date: challenge?.end_date || "",
    duration_days: challenge?.duration_days || 30,
    use_duration: !challenge?.end_date,
    reward_text: challenge?.reward_text || "",
    reward_link: challenge?.reward_link || "",
  })

  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }

      // Auto-calculate end_date when duration changes
      if (field === "duration_days" && prev.use_duration) {
        const startDate = new Date(prev.start_date)
        newData.end_date = formatDate(addDays(startDate, value - 1))
      }

      // Auto-calculate end_date when start_date changes
      if (field === "start_date" && prev.use_duration) {
        const startDate = new Date(value)
        newData.end_date = formatDate(
          addDays(startDate, prev.duration_days - 1)
        )
      }

      return newData
    })

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = "Challenge name is required"
    }
    if (!formData.start_date) {
      newErrors.start_date = "Start date is required"
    }
    if (!formData.use_duration && !formData.end_date) {
      newErrors.end_date = "End date is required"
    }
    if (!formData.use_duration && formData.end_date < formData.start_date) {
      newErrors.end_date = "End date must be after start date"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      const submitData = {
        name: formData.name,
        description: formData.description,
        start_date: formData.start_date,
        end_date: formData.use_duration
          ? formatDate(
              addDays(new Date(formData.start_date), formData.duration_days - 1)
            )
          : formData.end_date,
        duration_days: formData.use_duration ? formData.duration_days : null,
        reward_text: formData.reward_text,
        reward_link: formData.reward_link,
      }
      onSubmit(submitData)
    }
  }

  const presetDurations = [7, 14, 21, 30, 60, 90]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Challenge Name */}
      <div>
        <label className="block text-sm font-medium text-secondary mb-2">
          Challenge Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="e.g., Morning Routine"
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
          placeholder="What is this challenge about?"
          rows={2}
          className="w-full px-4 py-3 rounded-xl bg-surface-light dark:bg-gray-800 border border-app focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors resize-none"
        />
      </div>

      {/* Duration Type Toggle */}
      <div>
        <label className="block text-sm font-medium text-secondary mb-2">
          Duration
        </label>
        <div className="flex gap-2 p-1 bg-surface-light dark:bg-gray-800 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => handleChange("use_duration", true)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all duration-150 ${
              formData.use_duration
                ? "bg-white dark:bg-gray-700 shadow-sm text-primary"
                : "text-secondary hover:text-primary"
            }`}
          >
            Days
          </button>
          <button
            type="button"
            onClick={() => handleChange("use_duration", false)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all duration-150 ${
              !formData.use_duration
                ? "bg-white dark:bg-gray-700 shadow-sm text-primary"
                : "text-secondary hover:text-primary"
            }`}
          >
            Date Range
          </button>
        </div>

        {formData.use_duration ? (
          <>
            {/* Preset Duration Pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {presetDurations.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleChange("duration_days", days)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ${
                    formData.duration_days === days
                      ? "bg-primary-500 text-white"
                      : "bg-surface-light dark:bg-gray-800 text-secondary hover:text-primary"
                  }`}
                >
                  {days} days
                </button>
              ))}
            </div>

            {/* Custom Duration Input */}
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-tertiary" />
              <input
                type="number"
                min="1"
                max="365"
                value={formData.duration_days}
                onChange={(e) =>
                  handleChange("duration_days", parseInt(e.target.value) || 1)
                }
                className="w-20 px-3 py-2 rounded-xl bg-surface-light dark:bg-gray-800 border border-app focus:border-primary-500 outline-none text-center"
              />
              <span className="text-secondary">days starting</span>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
                className="px-3 py-2 rounded-xl bg-surface-light dark:bg-gray-800 border border-app focus:border-primary-500 outline-none"
              />
            </div>
          </>
        ) : (
          /* Date Range Inputs */
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs text-tertiary mb-1">Start</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleChange("start_date", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-light dark:bg-gray-800 border border-app focus:border-primary-500 outline-none"
              />
              {errors.start_date && (
                <p className="mt-1 text-xs text-task-red">
                  {errors.start_date}
                </p>
              )}
            </div>
            <span className="text-tertiary mt-5">→</span>
            <div className="flex-1">
              <label className="block text-xs text-tertiary mb-1">End</label>
              <input
                type="date"
                value={formData.end_date}
                min={formData.start_date}
                onChange={(e) => handleChange("end_date", e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface-light dark:bg-gray-800 border border-app focus:border-primary-500 outline-none"
              />
              {errors.end_date && (
                <p className="mt-1 text-xs text-task-red">{errors.end_date}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reward Section */}
      <div className="pt-2 border-t border-app">
        <label className="flex items-center gap-2 text-sm font-medium text-secondary mb-3">
          <Gift className="w-4 h-4" />
          Reward (optional)
        </label>
        <input
          type="text"
          value={formData.reward_text}
          onChange={(e) => handleChange("reward_text", e.target.value)}
          placeholder="e.g., New running shoes!"
          className="w-full px-4 py-3 rounded-xl bg-surface-light dark:bg-gray-800 border border-app focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors mb-3"
        />
        <div className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-tertiary" />
          <input
            type="url"
            value={formData.reward_link}
            onChange={(e) => handleChange("reward_link", e.target.value)}
            placeholder="https://..."
            className="flex-1 px-4 py-3 rounded-xl bg-surface-light dark:bg-gray-800 border border-app focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
          />
        </div>
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
          {challenge ? "Save Changes" : "Create Challenge"}
        </Button>
      </div>
    </form>
  )
}
