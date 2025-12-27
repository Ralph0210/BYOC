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
      {/* Hero Section: Name & Description */}
      <div className="space-y-3">
        <div>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="Name your challenge..."
            className="w-full text-2xl font-bold bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-600 outline-none text-primary"
            autoFocus
          />
          {errors.name && (
            <p className="mt-1 text-sm text-task-red">{errors.name}</p>
          )}
        </div>

        <textarea
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Add a description (optional)..."
          rows={2}
          className="w-full text-secondary bg-transparent border-none p-0 focus:ring-0 resize-none outline-none leading-relaxed"
        />
      </div>

      <div className="h-px bg-gray-100 dark:bg-gray-800" />

      {/* Settings Section */}
      <div className="space-y-6">
        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-primary mb-3">
            Duration
          </label>
          <div className="flex gap-1 p-1 bg-surface-light dark:bg-gray-800/50 rounded-xl mb-4 border border-app">
            <button
              type="button"
              onClick={() => handleChange("use_duration", true)}
              className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-lg transition-all duration-150 ${
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
              className={`flex-1 py-1.5 px-3 text-sm font-medium rounded-lg transition-all duration-150 ${
                !formData.use_duration
                  ? "bg-white dark:bg-gray-700 shadow-sm text-primary"
                  : "text-secondary hover:text-primary"
              }`}
            >
              Date Range
            </button>
          </div>

          {formData.use_duration ? (
            <div className="space-y-4">
              {/* Preset Duration Pills */}
              <div className="flex flex-wrap gap-2">
                {presetDurations.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => handleChange("duration_days", days)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 border ${
                      formData.duration_days === days
                        ? "bg-primary-500 text-white border-primary-500"
                        : "bg-transparent border-app text-secondary hover:border-primary-500 hover:text-primary"
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>

              {/* Custom Duration Input */}
              <div className="flex items-center gap-3 text-sm text-secondary bg-surface-light dark:bg-gray-800/30 p-3 rounded-xl border border-app">
                <Calendar className="w-4 h-4 text-tertiary" />
                <span>Starts</span>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange("start_date", e.target.value)}
                  className="bg-transparent border-none p-0 focus:ring-0 text-primary font-medium outline-none"
                />
                <span>for</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.duration_days}
                    onChange={(e) =>
                      handleChange(
                        "duration_days",
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="w-12 bg-transparent border-b border-secondary focus:border-primary-500 p-0 text-center text-primary font-medium focus:ring-0 outline-none"
                  />
                  <span>days</span>
                </div>
              </div>
            </div>
          ) : (
            /* Date Range Inputs */
            <div className="flex items-center gap-3 bg-surface-light dark:bg-gray-800/30 p-3 rounded-xl border border-app">
              <div className="flex-1">
                <label className="block text-[10px] uppercase tracking-wider text-tertiary mb-1">
                  Start
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => handleChange("start_date", e.target.value)}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-primary font-medium outline-none text-sm"
                />
                {errors.start_date && (
                  <p className="mt-1 text-xs text-task-red">
                    {errors.start_date}
                  </p>
                )}
              </div>
              <span className="text-tertiary">→</span>
              <div className="flex-1 text-right">
                <label className="block text-[10px] uppercase tracking-wider text-tertiary mb-1">
                  End
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  min={formData.start_date}
                  onChange={(e) => handleChange("end_date", e.target.value)}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-primary font-medium outline-none text-sm text-right"
                />
                {errors.end_date && (
                  <p className="mt-1 text-xs text-task-red">
                    {errors.end_date}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Reward Section */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-primary mb-3">
            <Gift className="w-4 h-4" />
            Reward
          </label>
          <div className="space-y-3">
            <input
              type="text"
              value={formData.reward_text}
              onChange={(e) => handleChange("reward_text", e.target.value)}
              placeholder="e.g., New running shoes!"
              className="w-full px-4 py-3 rounded-xl bg-surface-light dark:bg-gray-800 border border-app focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
            />
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-light dark:bg-gray-800 border border-app focus-within:ring-1 focus-within:ring-primary-500 focus-within:border-primary-500 transition-colors">
              <ExternalLink className="w-4 h-4 text-tertiary flex-shrink-0" />
              <input
                type="url"
                value={formData.reward_link}
                onChange={(e) => handleChange("reward_link", e.target.value)}
                placeholder="Add a link..."
                className="flex-1 bg-transparent border-none p-0 focus:ring-0 outline-none text-sm"
              />
            </div>
          </div>
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
