import { cn } from "../../lib/utils"

/**
 * DashboardCard - Skeuomorphic card for dashboard sections
 * Modular component with consistent styling and depth
 */
export function DashboardCard({
  children,
  title,
  titleRight,
  icon: Icon,
  className,
  noPadding = false,
}) {
  return (
    <div className={cn("dashboard-card", noPadding ? "" : "p-4", className)}>
      {/* Card Header */}
      {(title || titleRight) && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {Icon && (
              <div className="dashboard-card-icon">
                <Icon className="w-4 h-4" />
              </div>
            )}
            {title && (
              <h3 className="text-sm font-semibold text-primary">{title}</h3>
            )}
          </div>
          {titleRight && (
            <div className="text-xs font-medium text-secondary">
              {titleRight}
            </div>
          )}
        </div>
      )}

      {/* Card Content */}
      {children}
    </div>
  )
}

/**
 * DashboardHeader - Challenge header with name, duration, and progress
 */
export function DashboardHeader({
  name,
  duration,
  progress,
  todayDone,
  todayTarget,
  onEdit,
  onDelete,
}) {
  return (
    <div className="dashboard-header">
      {/* Left: Name & Duration */}
      <div className="flex-1 min-w-0">
        <h2 className="text-xl font-bold text-primary truncate">{name}</h2>
        <p className="text-sm text-secondary">{duration}</p>
      </div>

      {/* Right: Progress */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{progress}%</div>
          <div className="text-xs text-tertiary">progress</div>
        </div>
        {todayTarget > 0 && (
          <div className="text-right">
            <div className="text-lg font-semibold text-primary">
              {todayDone}/{todayTarget}
            </div>
            <div className="text-xs text-tertiary">today</div>
          </div>
        )}
      </div>
    </div>
  )
}
