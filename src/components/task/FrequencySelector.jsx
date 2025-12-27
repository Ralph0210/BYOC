import { cn } from "../../lib/utils"
import { FREQUENCY_TYPES, DAYS_OF_WEEK } from "../../lib/constants"

export function FrequencySelector({ type, count, days, onChange }) {
  const handleTypeChange = (newType) => {
    onChange("frequency_type", newType)
    // Reset count to 1 when switching to weekly
    if (newType === FREQUENCY_TYPES.WEEKLY) {
      onChange("frequency_count", 1)
    }
  }

  const handleDayToggle = (dayValue) => {
    const newDays = days.includes(dayValue)
      ? days.filter((d) => d !== dayValue)
      : [...days, dayValue]
    onChange("frequency_days", newDays)
  }

  return (
    <div className="space-y-4">
      {/* Type Tabs */}
      <div className="flex gap-2 p-1 bg-surface-light dark:bg-gray-800 rounded-xl">
        {[
          { value: FREQUENCY_TYPES.DAILY, label: "Daily" },
          { value: FREQUENCY_TYPES.WEEKLY, label: "Weekly" },
          { value: FREQUENCY_TYPES.SPECIFIC_DAYS, label: "Specific Days" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleTypeChange(option.value)}
            className={cn(
              "flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all duration-150",
              type === option.value
                ? "bg-white dark:bg-gray-700 shadow-sm text-primary"
                : "text-secondary hover:text-primary"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Count Selector (for daily/weekly) */}
      {type !== FREQUENCY_TYPES.SPECIFIC_DAYS && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-secondary">
            {type === FREQUENCY_TYPES.DAILY
              ? "Times per day:"
              : "Times per week:"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onChange("frequency_count", Math.max(1, count - 1))
              }
              className="w-8 h-8 rounded-lg bg-surface-light dark:bg-gray-800 flex items-center justify-center text-secondary hover:text-primary transition-colors"
            >
              −
            </button>
            <span className="w-8 text-center font-medium">{count}</span>
            <button
              type="button"
              onClick={() =>
                onChange("frequency_count", Math.min(10, count + 1))
              }
              className="w-8 h-8 rounded-lg bg-surface-light dark:bg-gray-800 flex items-center justify-center text-secondary hover:text-primary transition-colors"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Day Pills (for specific days or weekly preference) */}
      {(type === FREQUENCY_TYPES.SPECIFIC_DAYS ||
        type === FREQUENCY_TYPES.WEEKLY) && (
        <div className="flex gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day.value}
              type="button"
              onClick={() => handleDayToggle(day.value)}
              className={cn(
                "w-10 h-10 rounded-full text-sm font-medium transition-all duration-150",
                days.includes(day.value)
                  ? "bg-primary-500 text-white"
                  : "bg-surface-light dark:bg-gray-800 text-secondary hover:text-primary"
              )}
              title={day.full}
            >
              {day.short}
            </button>
          ))}
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-tertiary">
        {type === FREQUENCY_TYPES.DAILY &&
          count === 1 &&
          "Complete this task once every day"}
        {type === FREQUENCY_TYPES.DAILY &&
          count > 1 &&
          `Complete this task ${count} times every day`}
        {type === FREQUENCY_TYPES.WEEKLY &&
          "Complete this task on selected days each week"}
        {type === FREQUENCY_TYPES.SPECIFIC_DAYS &&
          "This task only appears on selected days"}
      </p>
    </div>
  )
}
