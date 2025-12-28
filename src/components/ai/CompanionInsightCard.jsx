import { useState, useEffect } from "react"
import {
  Sparkles,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  User,
} from "lucide-react"
import { useAIConfig } from "../../hooks/useAIConfig"
import { useAmbientNotes } from "../../hooks/useAmbientNotes"
import { useAuth } from "../../hooks/useAuth"
import { Card } from "../ui/Card"
import { Button } from "../ui/Button"
import { cn, daysDiff, getToday } from "../../lib/utils"
import { calculateChallengeStats } from "../../lib/stats"

/**
 * Companion Insight Card - Shows challenge-specific companion insights
 * Appears above each challenge card when AI is enabled
 */
export function CompanionInsightCard({
  challenge,
  tasks,
  completions,
  onChat,
}) {
  const { config } = useAIConfig()
  const { user } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const today = getToday()

  // Check if inner_self personality
  const isInnerSelf = config?.personality_preset === "inner_self"

  // Build context data for challenge-specific note
  const contextData = challenge
    ? {
        challengeId: challenge.id,
        challengeName: challenge.name,
        daysElapsed: daysDiff(challenge.start_date, today) + 1,
        totalDays: daysDiff(challenge.start_date, challenge.end_date) + 1,
        progress: calculateProgress(challenge, tasks, completions),
        completionsCount: completions?.length || 0,
        trend: calculateTrend(tasks, completions),
      }
    : null

  const { note, loading } = useAmbientNotes("insight", contextData)

  // For inner_self: use user's info; otherwise use companion info
  const userName =
    user?.user_metadata?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Me"
  const userPhoto =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  const displayName = isInnerSelf
    ? userName
    : config?.companion_name || "Companion"
  const displayPhoto = isInnerSelf ? userPhoto : config?.companion_photo_url

  const handleChat = () => {
    if (onChat) {
      onChat()
    }
  }

  if (!config?.api_key) return null

  return (
    <Card
      className="mb-4 bg-gradient-to-r from-primary/5 to-purple-500/5 border-primary/10"
      padding="md"
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {displayPhoto ? (
            <img
              src={displayPhoto}
              alt={displayName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20"
            />
          ) : isInnerSelf ? (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white ring-2 ring-purple-500/20">
              <User className="w-6 h-6" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white ring-2 ring-primary/20">
              <Sparkles className="w-6 h-6" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-primary">
              {isInnerSelf ? `${displayName}'s Inner Voice` : displayName}
            </span>
          </div>
          {note ? (
            <p
              className={cn(
                "text-sm text-secondary leading-relaxed",
                !isExpanded && "line-clamp-3"
              )}
            >
              {note}
            </p>
          ) : loading ? (
            <p className="text-sm text-tertiary italic animate-pulse">
              Thinking...
            </p>
          ) : null}

          {/* Actions */}
          {note && (
            <div className="flex items-center gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                icon={MessageCircle}
                onClick={handleChat}
                className="text-xs"
              >
                Chat
              </Button>
            </div>
          )}
        </div>

        {/* Expand/Collapse Button */}
        {note && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 transition-colors flex-shrink-0"
            aria-label={isExpanded ? "Collapse insight" : "Expand insight"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-tertiary" />
            ) : (
              <ChevronDown className="w-4 h-4 text-tertiary" />
            )}
          </button>
        )}
      </div>
    </Card>
  )
}

// Helper functions (reused from AmbientNote)
function calculateProgress(challenge, tasks, completions) {
  const { overall } = calculateChallengeStats(challenge, tasks, completions)
  return overall
}

function calculateTrend(tasks, completions) {
  if (!completions?.length) return "neutral"

  const today = new Date().toISOString().split("T")[0]
  const last3Days = [0, 1, 2].map((i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split("T")[0]
  })
  const prev3Days = [3, 4, 5].map((i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split("T")[0]
  })

  const last3Count = completions.filter((c) =>
    last3Days.includes(c.date)
  ).length
  const prev3Count = completions.filter((c) =>
    prev3Days.includes(c.date)
  ).length

  if (last3Count > prev3Count) return "improving"
  if (last3Count < prev3Count) return "declining"
  return "stable"
}
