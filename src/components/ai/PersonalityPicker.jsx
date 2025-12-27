import { PERSONALITY_PRESETS } from "../../lib/ai/personalities"

export function PersonalityPicker({ value, onChange }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {Object.entries(PERSONALITY_PRESETS).map(([key, preset]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`p-3 rounded-xl border text-left transition-all ${
            value === key
              ? "border-primary bg-primary/5 ring-1 ring-primary"
              : "border-transparent bg-surface-light dark:bg-white/5 hover:bg-surface-dark/5"
          }`}
        >
          <div className="font-medium text-sm">{preset.name}</div>
          <div className="text-xs text-tertiary line-clamp-2">
            {preset.description}
          </div>
        </button>
      ))}
    </div>
  )
}
