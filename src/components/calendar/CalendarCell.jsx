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
  const getBackgroundStyle = () => {
    if (!inRange || isFuture) {
      return { backgroundColor: "transparent" }
    }

    if (colors.length === 0) {
      return { backgroundColor: "var(--color-surface)" }
    }

    // Calculate average color or use first color with intensity based on completion
    if (colors.length === 1) {
      return {
        backgroundColor: colors[0],
        opacity: 0.4 + completionLevel * 0.6,
      }
    }

    // Multiple colors - create gradient
    return {
      background: `linear-gradient(135deg, ${colors.slice(0, 4).join(", ")})`,
      opacity: 0.4 + completionLevel * 0.6,
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={!inRange || isFuture}
      className={cn(
        "w-8 h-8 rounded-lg transition-all duration-150",
        inRange &&
          !isFuture &&
          "hover:ring-2 hover:ring-primary-500 hover:ring-offset-1 cursor-pointer",
        !inRange && "opacity-20",
        isFuture && "opacity-30",
        isSelected && "ring-2 ring-primary-600 ring-offset-2",
        isToday && !isSelected && "ring-2 ring-primary-500/50 ring-offset-1"
      )}
      style={getBackgroundStyle()}
      title={date}
    />
  )
}
