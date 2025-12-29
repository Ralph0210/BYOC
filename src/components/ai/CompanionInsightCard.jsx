import { useState, useEffect } from "react"
import { Sparkles, MessageCircle, User } from "lucide-react"
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
  embedded = false, // When true, renders without card wrapper (for dashboard integration)
}) {
  const { config } = useAIConfig()
  const { user } = useAuth()
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

  // Content for both embedded and standalone modes
  const content = (
    <div className="flex items-start gap-3">
      {/* Avatar - AI Orb */}
      <div className="flex-shrink-0">
        {displayPhoto ? (
          <img
            src={displayPhoto}
            alt={displayName}
            className={cn(
              "rounded-full object-cover",
              embedded
                ? "w-9 h-9 ring-2 ring-ai-primary/20"
                : "w-11 h-11 ring-2 ring-ai-primary/30"
            )}
          />
        ) : isInnerSelf ? (
          <div
            className={cn(
              "ai-orb flex items-center justify-center text-white",
              embedded ? "w-9 h-9" : "w-11 h-11"
            )}
          >
            <User className={embedded ? "w-4 h-4" : "w-5 h-5"} />
          </div>
        ) : (
          <div
            className={cn(
              "ai-orb flex items-center justify-center text-white",
              embedded ? "w-9 h-9" : "w-11 h-11"
            )}
          >
            <Sparkles className={embedded ? "w-4 h-4" : "w-5 h-5"} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className={cn("font-semibold text-primary", "text-base")}>
            {isInnerSelf ? `${displayName}'s Inner Voice` : displayName}
          </span>
        </div>

        {/* Full message - no truncation */}
        {note ? (
          <p className={cn("text-secondary leading-relaxed", "text-sm")}>
            {note}
          </p>
        ) : loading ? (
          <p className={cn("text-tertiary italic animate-pulse", "text-sm")}>
            Thinking...
          </p>
        ) : null}

        {/* Actions - only in standalone mode */}
        {!embedded && note && (
          <div className="flex items-center gap-2 mt-3">
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
    </div>
  )

  // Embedded mode: return content without wrapper
  if (embedded) {
    return content
  }

  // Standalone mode: wrap in Card
  return (
    <Card className="mb-4 card-soft ai-glow" padding="md">
      {content}
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
