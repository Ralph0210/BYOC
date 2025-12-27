import { cn } from "../../lib/utils"
import { TASK_COLORS } from "../../lib/constants"

export function ColorPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-6 gap-2 justify-items-center">
      {TASK_COLORS.map((color) => (
        <button
          key={color.value}
          type="button"
          onClick={() => onChange(color.value)}
          className={cn(
            "w-10 h-10 rounded-full transition-all duration-150",
            "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500",
            value === color.value &&
              "ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-600"
          )}
          style={{ backgroundColor: color.value }}
          title={color.name}
        >
          {value === color.value && (
            <svg
              className="w-5 h-5 mx-auto text-white drop-shadow"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </button>
      ))}
    </div>
  )
}
