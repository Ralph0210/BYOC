import { useRef, useEffect, useMemo } from "react"
import { useConversation } from "../../hooks/useConversation"
import { useAIConfig } from "../../hooks/useAIConfig"
import {
  getSuggestedPrompts,
  buildSuggestionsContext,
} from "../../lib/ai/suggestions"
import { X, Send, User, Sparkles } from "lucide-react"
import { cn } from "../../lib/utils"

export function ConversationPanel({ challenge, tasks, completions, onClose }) {
  const { messages, sendMessage, generating, hasKey, error } = useConversation(
    challenge,
    tasks,
    completions
  )
  const { config } = useAIConfig()
  const inputRef = useRef(null)
  const scrollRef = useRef(null)

  const companionName = config?.companion_name || "Companion"
  const companionPhoto = config?.companion_photo_url

  // Generate suggested prompts based on context
  const suggestedPrompts = useMemo(() => {
    const context = buildSuggestionsContext(challenge, tasks, completions)
    return getSuggestedPrompts(context)
  }, [challenge, tasks, completions])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

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

  const CompanionAvatar = ({ size = "md" }) => {
    const sizeClasses = size === "sm" ? "w-8 h-8" : "w-10 h-10"
    const iconSize = size === "sm" ? "w-4 h-4" : "w-5 h-5"

    if (companionPhoto) {
      return (
        <img
          src={companionPhoto}
          alt={companionName}
          className={cn(sizeClasses, "rounded-full object-cover")}
        />
      )
    }
    return (
      <div
        className={cn(
          sizeClasses,
          "rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center text-white"
        )}
      >
        <Sparkles className={iconSize} />
      </div>
    )
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-surface-dark shadow-xl border-l dark:border-white/10 flex flex-col z-50 animate-slide-in-right">
      {/* Header */}
      <div className="p-4 border-b dark:border-white/10 flex items-center justify-between bg-surface-light dark:bg-white/5">
        <div className="flex items-center gap-3">
          <CompanionAvatar />
          <div>
            <h3 className="font-semibold text-sm">{companionName}</h3>
            <p className="text-xs text-tertiary">
              {challenge ? `Focusing on: ${challenge.name}` : "Always here."}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {!hasKey ? (
          <div className="text-center text-sm text-tertiary p-8">
            <p>Please configure your AI settings to start chatting.</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-sm text-tertiary p-8 space-y-3">
            <CompanionAvatar size="md" />
            <p>
              I see your progress on "{challenge?.name}". How are you feeling
              about it today?
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3 text-sm",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === "user" ? "bg-primary text-white" : ""
                )}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4" />
                ) : (
                  <CompanionAvatar size="sm" />
                )}
              </div>
              <div
                className={cn(
                  "p-3 rounded-2xl max-w-[80%] leading-relaxed",
                  msg.role === "user"
                    ? "bg-primary text-white rounded-tr-none"
                    : "bg-surface-light dark:bg-white/10 rounded-tl-none"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}

        {generating && (
          <div className="flex gap-3 text-sm">
            <CompanionAvatar size="sm" />
            <div className="p-3 rounded-2xl bg-surface-light dark:bg-white/10 rounded-tl-none">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-xs text-center">
            {error}
          </div>
        )}
      </div>

      {/* Suggested Prompts */}
      {hasKey && messages.length <= 2 && !generating && (
        <div className="px-4 pb-2 flex flex-wrap gap-2">
          {suggestedPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSuggestionClick(prompt)}
              className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="p-4 border-t dark:border-white/10 bg-surface-light dark:bg-white/5"
      >
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder={hasKey ? "Type a message..." : "Set up API key first"}
            disabled={!hasKey || generating}
            className="w-full pl-4 pr-12 py-3 rounded-xl border-none ring-1 ring-black/5 dark:ring-white/10 bg-white dark:bg-black/20 focus:ring-2 focus:ring-primary placeholder:text-tertiary"
          />
          <button
            type="submit"
            disabled={!hasKey || generating}
            className="absolute right-2 top-2 p-1.5 bg-primary text-white rounded-lg disabled:opacity-50 hover:bg-primary-600 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}
