import {
  Menu,
  X,
  Plus,
  Settings,
  Sparkles,
  Trophy,
  PanelLeft,
} from "lucide-react"
import { useAuth } from "../../hooks/useAuth.jsx"
import { useAIConfig } from "../../hooks/useAIConfig"
import { cn, daysDiff, getToday, isTaskActiveOnDate } from "../../lib/utils"
import { calculateChallengeStats } from "../../lib/stats"

/**
 * Sidebar - Main navigation for web app layout
 * Hides completely when collapsed, with toggle button in main content
 */
export function Sidebar({
  challenges = [],
  tasks = [],
  completions = [],
  selectedChallengeId,
  onSelectChallenge,
  onNewChallenge,
  onOpenSettings,
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) {
  const { user, isAuthenticated, signInWithGoogle, loading } = useAuth()
  const { config } = useAIConfig()
  const today = getToday()

  const isAIConfigured = !!config?.api_key

  // Calculate actual completion progress for a challenge
  const getChallengeProgress = (challenge) => {
    const challengeTasks = tasks.filter((t) => t.challenge_id === challenge.id)
    const { overall } = calculateChallengeStats(
      challenge,
      challengeTasks,
      completions
    )
    return overall
  }

  // Get today's completion count for a challenge
  const getTodayStats = (challenge) => {
    const challengeTasks = tasks.filter((t) => t.challenge_id === challenge.id)
    let done = 0
    let total = 0

    challengeTasks.forEach((task) => {
      if (isTaskActiveOnDate(task, today)) {
        const target = task.frequency_count || 1
        const completed = completions.filter(
          (c) => c.task_id === task.id && c.date === today
        ).length
        done += Math.min(completed, target)
        total += target
      }
    })

    return { done, total }
  }

  // If collapsed on desktop, don't render sidebar at all
  if (isCollapsed && !isOpen) {
    return null
  }

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className={cn("sidebar-overlay", isOpen && "open")}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className={cn("sidebar", isOpen && "open")}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="flex items-center justify-between">
            <span className="wordmark text-lg">BYOC</span>

            <div className="flex items-center gap-1">
              {/* Collapse button (desktop) */}
              <button
                onClick={onToggleCollapse}
                className="hidden lg:flex p-2 rounded-lg hover:bg-surface-hover transition-colors"
                aria-label="Hide sidebar"
                title="Hide sidebar"
              >
                <PanelLeft className="w-4 h-4 text-tertiary" />
              </button>

              {/* Close button (mobile) */}
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-lg hover:bg-surface-hover transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-tertiary" />
              </button>
            </div>
          </div>

          {isAIConfigured && (
            <div className="mt-3 flex items-center gap-2 text-xs text-ai-primary">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Companion Active</span>
            </div>
          )}
        </div>

        {/* Content - Challenge List */}
        <div className="sidebar-content">
          {/* Section Label */}
          <div className="px-5 py-2">
            <h3 className="text-xs font-semibold text-tertiary uppercase tracking-wider">
              Challenges
            </h3>
          </div>

          {/* Challenge Items */}
          {challenges.length > 0 ? (
            <div className="space-y-1 px-3">
              {challenges.map((challenge) => {
                const isActive = challenge.id === selectedChallengeId
                const daysRemaining =
                  challenge.end_date >= today
                    ? daysDiff(today, challenge.end_date) + 1
                    : 0
                const progress = getChallengeProgress(challenge)
                const todayStats = getTodayStats(challenge)

                return (
                  <button
                    key={challenge.id}
                    onClick={() => {
                      onSelectChallenge(challenge.id)
                      onClose?.()
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                      "hover:bg-surface-hover",
                      isActive && "bg-accent-soft"
                    )}
                    style={
                      isActive
                        ? { border: "1px solid rgba(99, 102, 241, 0.2)" }
                        : undefined
                    }
                  >
                    {/* Progress Ring */}
                    <div className="relative w-10 h-10 flex-shrink-0">
                      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          fill="none"
                          stroke="var(--color-border)"
                          strokeWidth="3"
                        />
                        <circle
                          cx="20"
                          cy="20"
                          r="16"
                          fill="none"
                          stroke={
                            isActive
                              ? "var(--color-accent)"
                              : "var(--color-text-tertiary)"
                          }
                          strokeWidth="3"
                          strokeDasharray={2 * Math.PI * 16}
                          strokeDashoffset={
                            2 * Math.PI * 16 * (1 - progress / 100)
                          }
                          strokeLinecap="round"
                          className="transition-all duration-500"
                        />
                      </svg>
                      <span
                        className={cn(
                          "absolute inset-0 flex items-center justify-center text-[10px] font-bold",
                          isActive ? "text-accent" : "text-secondary"
                        )}
                      >
                        {progress}%
                      </span>
                    </div>

                    {/* Challenge Info */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-medium truncate",
                            isActive ? "text-accent" : "text-primary"
                          )}
                        >
                          {challenge.name}
                        </span>
                        {challenge.reward_text && (
                          <Trophy className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-tertiary mt-0.5">
                        {todayStats.total > 0 && (
                          <span
                            className={cn(
                              todayStats.done === todayStats.total &&
                                "text-green-500"
                            )}
                          >
                            Today: {todayStats.done}/{todayStats.total}
                          </span>
                        )}
                        {todayStats.total > 0 && daysRemaining > 0 && (
                          <span className="text-border">•</span>
                        )}
                        {daysRemaining > 0 && (
                          <span>{daysRemaining}d left</span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-tertiary mb-4">No challenges yet</p>
            </div>
          )}

          {/* New Challenge Button */}
          <div className="px-3 mt-4">
            <button
              onClick={() => {
                onNewChallenge()
                onClose?.()
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed text-secondary hover:text-accent hover:bg-accent-soft transition-all text-sm font-medium"
              style={{ borderColor: "var(--color-border)" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "var(--color-accent)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "var(--color-border)")
              }
            >
              <Plus className="w-4 h-4" />
              New Challenge
            </button>
          </div>
        </div>

        {/* Footer - User & Settings */}
        <div className="sidebar-footer">
          {isAuthenticated ? (
            <button
              onClick={() => {
                onOpenSettings()
                onClose?.()
              }}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-surface-hover transition-colors"
            >
              {/* User Avatar */}
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt={user.user_metadata.full_name || "User"}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-white text-sm font-medium">
                  {(user?.email?.[0] || "U").toUpperCase()}
                </div>
              )}

              {/* User Info */}
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-primary truncate">
                  {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
                </p>
                <p className="text-xs text-tertiary truncate">{user?.email}</p>
              </div>

              <Settings className="w-5 h-5 text-tertiary" />
            </button>
          ) : (
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="w-full btn btn-primary"
            >
              Sign In
            </button>
          )}
        </div>
      </aside>
    </>
  )
}

/**
 * MobileHeader - Top bar for mobile with hamburger menu
 */
export function MobileHeader({ onMenuClick, title }) {
  return (
    <div className="mobile-header">
      <button
        onClick={onMenuClick}
        className="p-2 -ml-2 rounded-lg hover:bg-surface-hover transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-primary" />
      </button>
      <span className="wordmark text-base">{title || "BYOC"}</span>
      <div className="w-9" />
    </div>
  )
}

/**
 * SidebarToggle - Floating button to show sidebar when hidden
 */
export function SidebarToggle({ onClick, isVisible }) {
  if (!isVisible) return null

  return (
    <button
      onClick={onClick}
      className="fixed top-4 left-4 z-30 p-2.5 rounded-xl bg-surface shadow-lg hover:bg-surface-hover transition-all hidden lg:flex items-center justify-center"
      style={{ border: "1px solid var(--color-border)" }}
      aria-label="Show sidebar"
      title="Show sidebar"
    >
      <PanelLeft className="w-5 h-5 text-secondary" />
    </button>
  )
}
