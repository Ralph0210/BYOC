import { useState } from "react"
import * as LucideIcons from "lucide-react"
import { cn } from "../../lib/utils"
import { TASK_ICONS } from "../../lib/constants"

export function IconPicker({ value, onChange, color = "#007AFF" }) {
  const [search, setSearch] = useState("")

  const filteredIcons = TASK_ICONS.filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  )

  const getIcon = (name) => {
    // Convert kebab-case to PascalCase for Lucide
    const pascalName = name
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("")
    return LucideIcons[pascalName] || LucideIcons.Circle
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Search icons..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={cn(
          "w-full px-3 py-2 rounded-xl text-sm",
          "bg-surface-light dark:bg-gray-800",
          "border border-app focus:border-primary-500 focus:ring-1 focus:ring-primary-500",
          "outline-none transition-colors"
        )}
      />
      <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto justify-items-center p-2">
        {filteredIcons.map((iconName) => {
          const Icon = getIcon(iconName)
          return (
            <button
              key={iconName}
              type="button"
              onClick={() => onChange(iconName)}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "focus:outline-none focus:ring-2 focus:ring-primary-500",
                value === iconName &&
                  "bg-gray-100 dark:bg-gray-800 ring-2 ring-primary-500"
              )}
              title={iconName}
            >
              <Icon
                className="w-5 h-5"
                style={{ color: value === iconName ? color : "currentColor" }}
              />
            </button>
          )
        })}
      </div>
    </div>
  )
}
