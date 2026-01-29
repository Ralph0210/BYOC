import {
  Sun,
  Moon,
  LogOut,
  Sparkles,
  ChevronRight,
  User,
  Trash2,
  Calendar,
  Loader2,
  Zap,
  Search,
} from "lucide-react"
import { supabase } from "../../lib/supabase"
import { useTheme } from "../../hooks/useTheme"
import { useAuth } from "../../hooks/useAuth"
import { useAIConfig } from "../../hooks/useAIConfig"
import { useGoogleCalendar } from "../../hooks/useGoogleCalendar"
import { useTasks } from "../../hooks/useTasks"
import { AIConfigForm } from "../ai/AIConfigForm"
import { CalendarExplorer } from "../calendar/CalendarExplorer"
import { SmartScheduling } from "../calendar/SmartScheduling"
import { cn } from "../../lib/utils"
import { useState } from "react"

/**
 * SettingsPanel - Unified settings view
 * Design principles:
 * - Consistent 40px icon containers
 * - Uniform row padding and spacing
 * - Clear visual hierarchy
 * - Grouped sections with subtle dividers
 */
export function SettingsPanel({ onClose }) {
  const { theme, setTheme } = useTheme()
  const { signOut, user } = useAuth()
  const { config } = useAIConfig()
  const {
    isConnected: isCalendarConnected,
    isConnecting,
    connect: connectCalendar,
    disconnect: disconnectCalendar,
  } = useGoogleCalendar()
  const { tasks } = useTasks()
  const [activeSection, setActiveSection] = useState(null)
  const [calendarTab, setCalendarTab] = useState("scheduling")

  const handleSignOut = async () => {
    await signOut()
    onClose?.()
  }

  const isAIConfigured = !!config?.api_key

  // If viewing AI settings, show the full AIConfigForm
  if (activeSection === "ai") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setActiveSection(null)}
          className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors -ml-1"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Settings
        </button>
        <AIConfigForm />
      </div>
    )
  }

  // If viewing Calendar settings, show the CalendarExplorer
  if (activeSection === "calendar") {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setActiveSection(null)}
          className="flex items-center gap-2 text-sm text-secondary hover:text-primary transition-colors -ml-1"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Settings
        </button>

        {/* Connection Controls */}
        <div className="flex items-center justify-between p-4 bg-surface rounded-xl">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isCalendarConnected ? "bg-green-500/15" : "bg-surface",
              )}
            >
              <Calendar
                className={cn(
                  "w-5 h-5",
                  isCalendarConnected ? "text-green-500" : "text-tertiary",
                )}
              />
            </div>
            <div>
              <p className="text-sm font-medium text-primary">
                Google Calendar
              </p>
              <p className="text-xs text-tertiary">
                {isCalendarConnected ? "Connected" : "Not connected"}
              </p>
            </div>
          </div>

          {isCalendarConnected ? (
            <button
              onClick={disconnectCalendar}
              className="px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={connectCalendar}
              disabled={isConnecting}
              className="px-4 py-2 text-sm font-medium bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isConnecting && <Loader2 className="w-4 h-4 animate-spin" />}
              Connect
            </button>
          )}
        </div>

        {/* Tabs for Smart Scheduling / Explorer */}
        {isCalendarConnected && (
          <div className="flex gap-1 p-1 bg-surface rounded-lg">
            <button
              onClick={() => setCalendarTab("scheduling")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                calendarTab === "scheduling"
                  ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                  : "text-secondary hover:text-primary",
              )}
            >
              <Zap className="w-4 h-4" />
              Smart Schedule
            </button>
            <button
              onClick={() => setCalendarTab("explorer")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                calendarTab === "explorer"
                  ? "bg-white dark:bg-gray-700 text-primary shadow-sm"
                  : "text-secondary hover:text-primary",
              )}
            >
              <Search className="w-4 h-4" />
              Explorer
            </button>
          </div>
        )}

        {/* Tab Content */}
        {calendarTab === "scheduling" ? (
          <SmartScheduling tasks={tasks} />
        ) : (
          <CalendarExplorer />
        )}
      </div>
    )
  }

  // Reusable settings row component
  const SettingsRow = ({
    icon: Icon,
    iconBg = "bg-surface",
    iconColor = "text-secondary",
    title,
    subtitle,
    action,
    onClick,
    danger = false,
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 p-3 rounded-xl transition-colors",
        "hover:bg-surface-hover",
        danger && "text-red-500 hover:text-red-600",
      )}
    >
      {/* Icon Container - Fixed 40x40 */}
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
          iconBg,
        )}
      >
        <Icon className={cn("w-5 h-5", iconColor)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        <p
          className={cn(
            "text-sm font-medium",
            danger ? "text-red-500" : "text-primary",
          )}
        >
          {title}
        </p>
        {subtitle && (
          <p className="text-xs text-tertiary truncate">{subtitle}</p>
        )}
      </div>

      {/* Action */}
      {action}
    </button>
  )

  return (
    <div className="space-y-2">
      {/* User Profile Card */}
      {user && (
        <div className="flex items-center gap-4 p-4 mb-4 rounded-xl bg-surface">
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt={user.user_metadata.full_name || "User"}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-white text-lg font-medium">
              {(user?.email?.[0] || "U").toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-primary truncate">
              {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
            </p>
            <p className="text-sm text-tertiary truncate">{user?.email}</p>
          </div>
        </div>
      )}
      {/* General Section */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-tertiary uppercase tracking-wider px-3 py-2">
          General
        </p>

        {/* Theme Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                theme === "dark" ? "bg-indigo-500/15" : "bg-yellow-500/15",
              )}
            >
              {theme === "dark" ? (
                <Moon className="w-5 h-5 text-indigo-400" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-500" />
              )}
            </div>

            {/* Label */}
            <div>
              <p className="text-sm font-medium text-primary">Appearance</p>
              <p className="text-xs text-tertiary">
                {theme === "dark" ? "Dark mode" : "Light mode"}
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              "relative w-14 h-8 rounded-full transition-colors duration-200",
              theme === "dark" ? "bg-indigo-500" : "bg-gray-300",
            )}
            role="switch"
            aria-checked={theme === "dark"}
            aria-label="Toggle dark mode"
          >
            {/* Toggle Knob */}
            <span
              className={cn(
                "absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200 flex items-center justify-center",
                theme === "dark" ? "translate-x-7" : "translate-x-1",
              )}
            >
              {theme === "dark" ? (
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-yellow-500" />
              )}
            </span>
          </button>
        </div>
      </div>

      {/* AI Section */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-tertiary uppercase tracking-wider px-3 py-2">
          AI Companion
        </p>

        <SettingsRow
          icon={Sparkles}
          iconBg={
            isAIConfigured
              ? "bg-gradient-to-br from-purple-500/20 to-indigo-500/20"
              : "bg-surface"
          }
          iconColor={isAIConfigured ? "text-purple-400" : "text-tertiary"}
          title="AI Settings"
          subtitle={
            isAIConfigured
              ? `${config?.companion_name || "Companion"} active`
              : "Configure your AI companion"
          }
          onClick={() => setActiveSection("ai")}
          action={<ChevronRight className="w-5 h-5 text-tertiary" />}
        />
      </div>

      {/* Integrations Section */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-tertiary uppercase tracking-wider px-3 py-2">
          Integrations
        </p>

        <SettingsRow
          icon={Calendar}
          iconBg={isCalendarConnected ? "bg-green-500/15" : "bg-surface"}
          iconColor={isCalendarConnected ? "text-green-500" : "text-tertiary"}
          title="Google Calendar"
          subtitle={
            isCalendarConnected ? "Connected" : "Connect to sync events"
          }
          onClick={() => setActiveSection("calendar")}
          action={<ChevronRight className="w-5 h-5 text-tertiary" />}
        />
      </div>

      {/* Account Section */}
      <div className="space-y-1">
        <p className="text-xs font-medium text-tertiary uppercase tracking-wider px-3 py-2">
          Account
        </p>

        <SettingsRow
          icon={LogOut}
          iconBg="bg-red-500/10"
          iconColor="text-red-500"
          title="Sign Out"
          onClick={handleSignOut}
          danger
        />

        <SettingsRow
          icon={Trash2}
          iconBg="bg-red-500/10"
          iconColor="text-red-500"
          title="Delete Account"
          subtitle="Permanently remove all data"
          onClick={async () => {
            if (
              window.confirm(
                "Are you absolutely sure? This will permanently delete your account and all associated data (Challenges, Tasks, History). This action cannot be undone.",
              )
            ) {
              try {
                const { error } = await supabase.rpc("delete_user_account")
                if (error) throw error
                window.location.reload()
              } catch (err) {
                console.error("Delete account error:", err)
                alert(
                  "Failed to delete account. Please ensure the SQL function exists.",
                )
              }
            }
          }}
          danger
        />
      </div>
    </div>
  )
}
