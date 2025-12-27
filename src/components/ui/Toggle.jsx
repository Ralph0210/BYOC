import { cn } from "../../lib/utils"

export function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-12 h-7 rounded-full transition-colors duration-200",
          checked ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-600"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow transition-transform duration-200",
            checked && "translate-x-5"
          )}
        />
      </button>
      {label && <span className="text-sm text-primary">{label}</span>}
    </label>
  )
}
