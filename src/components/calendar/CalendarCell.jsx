import { Check } from "lucide-react"
import { cn } from "../../lib/utils"

/**
 * CalendarCell - Premium heatmap cell design
 *
 * Design principles:
 * - Out-of-range: visible but clearly different (dotted, muted)
 * - In-range empty: solid fill (trackable but nothing done)
 * - In-range with progress: colored based on completion
 * - Future: lighter placeholder to show the runway ahead
 * - Today: pulsing glow effect for aesthetic focus
 * - Selected: subtle ring, not overwhelming
 */
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
    // Outside challenge range - visible but muted with bigger dotted border
    if (!inRange) {
      return {
        backgroundColor: "var(--color-bg)",
        border: "2px dashed var(--color-border)",
        opacity: 0.4,
      }
    }

    // Future dates within range - subtle placeholder
    if (isFuture) {
      return {
        backgroundColor: "var(--color-border-subtle)",
        border: "1px solid var(--color-border)",
      }
    }

    // Past/today with no completions - empty trackable day
    if (colors.length === 0) {
      return {
        backgroundColor: "var(--color-surface-hover)",
        border: "1px solid var(--color-border)",
      }
    }

    // Single color
    if (colors.length === 1) {
      return {
        backgroundColor: colors[0],
        opacity: isPerfect ? 1 : 0.5 + completionLevel * 0.5,
      }
    }

    // Multiple colors - gradient
    return {
      background: `linear-gradient(135deg, ${colors.slice(0, 4).join(", ")})`,
      opacity: isPerfect ? 1 : 0.5 + completionLevel * 0.5,
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={!inRange || isFuture}
      className={cn(
        "w-8 h-8 rounded-md transition-all duration-150 flex items-center justify-center relative",
        // Hover state for interactive cells
        inRange &&
          !isFuture &&
          "hover:scale-110 hover:shadow-md cursor-pointer",
        // Future cells - non-interactive
        isFuture && inRange && "cursor-default",
        // Selected state - clean subtle ring
        isSelected && !isToday && "ring-2 ring-indigo-500 ring-offset-2 z-10",
        // Today - special styling with glow
        isToday && inRange && "z-20"
      )}
      style={{
        ...getBackgroundStyle(),
        // Today gets a beautiful glowing effect
        ...(isToday && inRange
          ? {
              boxShadow: `
                0 0 0 2px #6366f1,
                0 0 8px rgba(99, 102, 241, 0.6),
                0 0 16px rgba(99, 102, 241, 0.3)
              `,
              transform: "scale(1.05)",
            }
          : {}),
      }}
      title={
        !inRange
          ? date
          : isFuture
            ? `${date} - upcoming`
            : `${date} - ${Math.round(completionLevel * 100)}%`
      }
    >
      {/* Perfect completion checkmark */}
      {isPerfect && !isFuture && inRange && (
        <Check className="w-4 h-4 text-white drop-shadow-md" strokeWidth={3} />
      )}
    </button>
  )
}
