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

  // Determine background style based on completion - just color, no dots
  const isPerfect = totalTasks > 0 && colors.length === totalTasks

  // Determine background style
  const getBackgroundStyle = () => {
    if (!inRange || isFuture) {
      return { backgroundColor: "transparent" }
    }

    if (colors.length === 0) {
      return { backgroundColor: "var(--color-surface)" }
    }

    if (colors.length === 1) {
      return {
        backgroundColor: colors[0],
        opacity: isPerfect ? 1 : 0.4 + completionLevel * 0.4,
      }
    }

    // Multiple colors - create gradient
    return {
      background: `linear-gradient(135deg, ${colors.slice(0, 4).join(", ")})`,
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={!inRange || isFuture}
      className={cn(
        "w-8 h-8 rounded-lg transition-all duration-300 relative",
        inRange &&
          !isFuture &&
          "hover:scale-105 active:scale-95 cursor-pointer",
        !inRange && "opacity-20",
        isFuture && "opacity-30",
        isSelected && "ring-2 ring-primary-600 ring-offset-2 z-10",
        // Perfect day glow effect
        isPerfect &&
          !isFuture &&
          "ring-2 ring-primary-500/50 ring-offset-1 shadow-sm",
        !isPerfect && isToday && !isSelected && "ring-1 ring-primary-500/50"
      )}
      style={getBackgroundStyle()}
      title={date}
    >
      {isPerfect && (
        <div className="absolute inset-0 rounded-lg bg-white/20 animate-pulse" />
      )}
    </button>
  )
}
