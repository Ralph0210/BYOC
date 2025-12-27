import { Check } from "lucide-react"
import { cn } from "../../lib/utils"

export function CalendarCell({
  date,
  colors = [],
  totalTasks = 0,
  isToday = false,
  isSelected = false,
  isFuture = false,
  inRange = true,
  onClick,
}) {
  const completionLevel =
    totalTasks > 0 ? Math.min(colors.length / totalTasks, 1) : 0
  const isPerfect = totalTasks > 0 && colors.length === totalTasks

  // Determine background style
  const getBackgroundStyle = () => {
    if (!inRange || isFuture) {
      return { backgroundColor: "transparent" }
    }

    if (colors.length === 0) {
      return { backgroundColor: "var(--color-surface-hover)" }
    }

    // Single color
    if (colors.length === 1) {
      return {
        backgroundColor: colors[0],
        opacity: isPerfect ? 1 : 0.4 + completionLevel * 0.4,
      }
    }

    // Multiple colors - gradient
    return {
      background: `linear-gradient(135deg, ${colors.slice(0, 4).join(", ")})`,
      opacity: isPerfect ? 1 : 0.4 + completionLevel * 0.4,
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={!inRange || isFuture}
      className={cn(
        "w-8 h-8 rounded-lg transition-all duration-150 flex items-center justify-center relative",
        inRange &&
          !isFuture &&
          "hover:ring-2 hover:ring-primary-500 hover:ring-offset-1 cursor-pointer",
        !inRange && "opacity-20",
        isFuture && "opacity-30",
        isSelected && "ring-2 ring-primary-600 ring-offset-2 z-10",
        isToday && !isSelected && "ring-2 ring-primary-500/50 ring-offset-1"
      )}
      style={getBackgroundStyle()}
      title={`${date} - ${Math.round(completionLevel * 100)}%`}
    >
      {isPerfect && !isFuture && inRange && (
        <Check className="w-4 h-4 text-white drop-shadow-md" strokeWidth={3} />
      )}
    </button>
  )
}
