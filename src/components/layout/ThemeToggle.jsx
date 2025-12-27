import { Sun, Moon, Laptop } from "lucide-react"
import { useTheme } from "../../hooks/useTheme"
import { THEMES } from "../../lib/constants"
import { cn } from "../../lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const options = [
    { value: THEMES.LIGHT, icon: Sun, label: "Light" },
    { value: THEMES.DARK, icon: Moon, label: "Dark" },
    { value: THEMES.SYSTEM, icon: Laptop, label: "System" },
  ]

  return (
    <div className="flex gap-1 p-1 bg-surface-light dark:bg-gray-800 rounded-xl">
      {options.map((option) => {
        const Icon = option.icon
        return (
          <button
            key={option.value}
            onClick={() => setTheme(option.value)}
            className={cn(
              "p-2 rounded-lg transition-all duration-150",
              theme === option.value
                ? "bg-white dark:bg-gray-700 shadow-sm text-primary"
                : "text-tertiary hover:text-secondary"
            )}
            title={option.label}
          >
            <Icon className="w-4 h-4" />
          </button>
        )
      })}
    </div>
  )
}
