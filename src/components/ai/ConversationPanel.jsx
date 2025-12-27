import { useRef, useEffect, useMemo, useState, useCallback } from "react"
import { useConversation } from "../../hooks/useConversation"
import { useAIConfig } from "../../hooks/useAIConfig"
import {
  getSuggestedPrompts,
  buildSuggestionsContext,
} from "../../lib/ai/suggestions"
import { X, Send, User, Sparkles, ChevronDown, Check, Plus } from "lucide-react"
import { cn } from "../../lib/utils"
import { calculateChallengeStats } from "../../lib/stats"

export function ConversationPanel({
  isOpen,
  challenges = [],
  tasks = [],
  completions = [],
  onClose,
  initialContext = null,
}) {
  const [activeContexts, setActiveContexts] = useState([])
  const [pickerTab, setPickerTab] = useState("challenges") // challenges | tasks
  const [showContextPicker, setShowContextPicker] = useState(false)

  // Helper to safely add context without duplicates and with enrichment
  const addContext = useCallback(
    (item, type = "challenge") => {
      setActiveContexts((prev) => {
        if (prev.some((c) => c.id === item.id)) return prev

        let enrichedItem = { ...item, type }

        if (type === "challenge") {
          const challengeTasks = tasks.filter((t) => t.challenge_id === item.id)
          const stats = calculateChallengeStats(
            item,
            challengeTasks,
            completions
          )
          enrichedItem.stats = stats
        } else if (type === "task") {
          const today = new Date().toISOString().split("T")[0]
          const isCompleted = completions.some(
            (c) => c.task_id === item.id && c.completion_date === today
          )
          enrichedItem.isCompleted = isCompleted

          // Find parent challenge name if exists
          const parent = challenges.find((c) => c.id === item.challenge_id)
          if (parent) enrichedItem.challengeName = parent.name
        }

        return [...prev, enrichedItem]
      })
    },
    [tasks, completions, challenges]
  )

  // Initialize from initialContext prop if provided (DISABLED per user request)
  /* useEffect(() => {
    if (initialContext && activeContexts.length === 0) {
      addContext(initialContext, "challenge")
    }
  }, [initialContext, addContext]) */

  const { messages, sendMessage, generating, hasKey, error } =
    useConversation(activeContexts)

  const { config } = useAIConfig()
  const inputRef = useRef(null)
  const scrollRef = useRef(null)

  const companionName = config?.companion_name || "Companion"
  const companionPhoto = config?.companion_photo_url

  // Close context selector when clicking outside
  useEffect(() => {
    if (!showContextPicker) return
    const handleClick = () => setShowContextPicker(false)
    document.addEventListener("click", handleClick)
    return () => document.removeEventListener("click", handleClick)
  }, [showContextPicker])

  // Generate suggested prompts based on context
  const suggestedPrompts = []
  /* useMemo(() => {
    // Use the first active context for suggestions, or null
    const primaryContext = activeContexts.find(c => c.type === 'challenge') || null
    const context = buildSuggestionsContext(primaryContext, tasks, completions)
    return getSuggestedPrompts(context)
  }, [activeContexts, tasks, completions]) */

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, generating])

  const handleSend = (e) => {
    e.preventDefault()
    const content = inputRef.current?.value?.trim()
    if (!content) return
    sendMessage(content)
    inputRef.current.value = ""
  }

  const handleSuggestionClick = (prompt) => {
    sendMessage(prompt)
  }

  const CompanionAvatar = ({ size = "md", className }) => {
    const sizeClasses = size === "sm" ? "w-8 h-8" : "w-10 h-10"
    const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5"

    if (companionPhoto) {
      return (
        <img
          src={companionPhoto}
          alt={companionName}
          className={cn(
            sizeClasses,
            "rounded-full object-cover ring-2 ring-white/20",
            className
          )}
        />
      )
    }
    return (
      <div
        className={cn(
          sizeClasses,
          "rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white ring-2 ring-white/20 shadow-lg",
          className
        )}
      >
        <Sparkles className={iconSize} />
      </div>
    )
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white/80 dark:bg-black/80 backdrop-blur-xl shadow-2xl border-l dark:border-white/10 flex flex-col z-50 animate-slide-in-right">
      {/* Header */}
      <div className="px-6 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-white/50 dark:bg-black/20 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3 relative">
          <CompanionAvatar />
          <div>
            <h3 className="font-semibold text-sm text-primary flex items-center gap-2">
              {companionName}
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            </h3>
            <p className="text-xs text-tertiary">Always here to help</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors text-tertiary hover:text-primary"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 flex flex-col"
        ref={scrollRef}
      >
        {!hasKey ? (
          <div className="text-center text-sm text-tertiary p-8 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-light dark:bg-white/5 flex items-center justify-center">
              <Sparkles className="w-6 h-6 opacity-50" />
            </div>
            <p>Configure your AI settings to start chatting.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-tertiary p-8 space-y-4 animate-fade-in">
            <CompanionAvatar size="lg" className="mx-auto w-16 h-16" />
            <div className="max-w-[240px] mx-auto leading-relaxed">
              <p>Hi! I'm here to chat. What's on your mind?</p>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col text-sm animate-scale-in origin-bottom-left max-w-[85%]",
                msg.role === "user"
                  ? "self-end items-end origin-bottom-right"
                  : "self-start items-start"
              )}
            >
              <div
                className={cn(
                  "px-4 py-2.5 rounded-2xl leading-relaxed shadow-sm",
                  msg.role === "user"
                    ? "bg-primary text-white rounded-tr-sm"
                    : "bg-surface-light dark:bg-white/10 text-primary border border-black/5 dark:border-white/5 rounded-tl-sm"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {generating && (
          <div className="flex flex-col cursor-default text-sm animate-pulse max-w-[85%] self-start items-start">
            <div className="px-4 py-3 rounded-2xl bg-surface-light dark:bg-white/10 rounded-tl-sm border border-black/5 dark:border-white/5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-tertiary rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-tertiary rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-tertiary rounded-full animate-bounce" />
            </div>
          </div>
        )}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 text-red-500 text-xs text-center border border-red-500/20">
            {error}
          </div>
        )}
        <div className="h-4" /> {/* Spacer for scroll */}
      </div>

      {/* Footer Area */}
      <div className="p-4 pb-6 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-black dark:via-black/80 dark:to-transparent pt-10 sticky bottom-0 z-10 w-full backdrop-blur-[2px]">
        {/* Context Pills */}
        {activeContexts.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 px-1">
            {activeContexts.map((ctx) => (
              <div
                key={ctx.id}
                className="flex items-center gap-1 text-xs px-2 py-1 bg-primary/10 text-primary rounded-full border border-primary/20"
              >
                <span className="max-w-[120px] truncate">{ctx.name}</span>
                <button
                  onClick={() =>
                    setActiveContexts((prev) =>
                      prev.filter((p) => p.id !== ctx.id)
                    )
                  }
                  className="hover:bg-black/10 dark:hover:bg-white/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Suggested Prompts */}
        {hasKey &&
          messages.length <= 2 &&
          !generating &&
          activeContexts.length === 0 && (
            <div className="flex flex-wrap gap-2 mb-3 px-1">
              {suggestedPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(prompt)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/50 dark:bg-white/10 border border-black/5 dark:border-white/10 text-primary hover:bg-white hover:scale-105 transition-all shadow-sm backdrop-blur-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

        {/* Floating Input */}
        <form
          onSubmit={handleSend}
          className="relative flex items-center gap-2"
        >
          <div className="relative flex-1 group flex items-center gap-2 bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-full p-1.5 pl-2 shadow-lg shadow-primary/5 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            {/* Attachment Button */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                  setShowContextPicker((prev) => !prev)
                }}
                className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-secondary transition-colors"
                title="Add Context"
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* Context Picker Popover */}
              {showContextPicker && (
                <div
                  className="absolute bottom-full left-0 mb-3 w-64 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-black/5 dark:border-white/10 overflow-hidden z-20 animate-scale-in origin-bottom-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex border-b border-black/5 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setPickerTab("challenges")}
                      className={cn(
                        "flex-1 px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors",
                        pickerTab === "challenges"
                          ? "bg-primary/10 text-primary"
                          : "text-tertiary hover:bg-black/5 dark:hover:bg-white/5"
                      )}
                    >
                      Challenges
                    </button>
                    <button
                      type="button"
                      onClick={() => setPickerTab("tasks")}
                      className={cn(
                        "flex-1 px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors",
                        pickerTab === "tasks"
                          ? "bg-primary/10 text-primary"
                          : "text-tertiary hover:bg-black/5 dark:hover:bg-white/5"
                      )}
                    >
                      Tasks
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto py-1">
                    {pickerTab === "challenges" ? (
                      challenges.length > 0 ? (
                        challenges.map((c) => {
                          const isSelected = activeContexts.some(
                            (ctx) => ctx.id === c.id && ctx.type === "challenge"
                          )
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                if (!isSelected) addContext(c, "challenge")
                                setShowContextPicker(false)
                              }}
                              disabled={isSelected}
                              className={cn(
                                "w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
                                isSelected && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <span className="truncate">{c.name}</span>
                              {isSelected && (
                                <Check className="w-3 h-3 text-primary" />
                              )}
                            </button>
                          )
                        })
                      ) : (
                        <p className="text-xs text-tertiary px-4 py-2 italic text-center">
                          No active challenges
                        </p>
                      )
                    ) : tasks.length > 0 ? (
                      tasks.map((t) => {
                        const isSelected = activeContexts.some(
                          (ctx) => ctx.id === t.id && ctx.type === "task"
                        )
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              if (!isSelected) addContext(t, "task")
                              setShowContextPicker(false)
                            }}
                            disabled={isSelected}
                            className={cn(
                              "w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
                              isSelected && "opacity-50 cursor-not-allowed"
                            )}
                          >
                            <span className="truncate">{t.name}</span>
                            {isSelected && (
                              <Check className="w-3 h-3 text-primary" />
                            )}
                          </button>
                        )
                      })
                    ) : (
                      <p className="text-xs text-tertiary px-4 py-2 italic text-center">
                        No active tasks
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              type="text"
              placeholder={
                hasKey ? "Type a message..." : "Set up API key first"
              }
              disabled={!hasKey || generating}
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-tertiary px-2 py-2"
            />
            <button
              type="submit"
              disabled={!hasKey || generating}
              className="p-2 bg-primary text-white rounded-full disabled:opacity-50 disabled:grayscale hover:bg-primary-600 hover:scale-105 transition-all active:scale-95 flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
