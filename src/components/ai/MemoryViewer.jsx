import { useState } from "react"
import { useAIMemory } from "../../hooks/useAIMemory"
import {
  Brain,
  Trash2,
  AlertCircle,
  Sparkles,
  Target,
  Lightbulb,
  MessageSquare,
} from "lucide-react"

const MEMORY_TYPE_CONFIG = {
  fact: { icon: Brain, label: "Facts", color: "text-blue-500" },
  preference: {
    icon: Sparkles,
    label: "Preferences",
    color: "text-purple-500",
  },
  pattern: { icon: Target, label: "Patterns", color: "text-green-500" },
  style: {
    icon: MessageSquare,
    label: "Communication Style",
    color: "text-orange-500",
  },
  conversation: {
    icon: Lightbulb,
    label: "From Conversations",
    color: "text-pink-500",
  },
}

export function MemoryViewer() {
  const { memories, loading, deleteMemory, clearAllMemories } = useAIMemory()
  const [deleting, setDeleting] = useState(null)
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  if (loading) {
    return (
      <div className="p-4 text-center text-tertiary">
        <Brain className="w-6 h-6 mx-auto mb-2 animate-pulse" />
        <p className="text-sm">Loading memories...</p>
      </div>
    )
  }

  if (memories.length === 0) {
    return (
      <div className="p-6 text-center">
        <Brain className="w-10 h-10 mx-auto mb-3 text-tertiary opacity-50" />
        <h4 className="text-sm font-medium text-secondary mb-1">
          No memories yet
        </h4>
        <p className="text-xs text-tertiary">
          As you chat and use the app, your companion will remember things about
          you.
        </p>
      </div>
    )
  }

  // Group memories by type
  const grouped = memories.reduce((acc, memory) => {
    const type = memory.memory_type || "other"
    if (!acc[type]) acc[type] = []
    acc[type].push(memory)
    return acc
  }, {})

  const handleDelete = async (memoryId) => {
    setDeleting(memoryId)
    await deleteMemory(memoryId)
    setDeleting(null)
  }

  const handleClearAll = async () => {
    await clearAllMemories()
    setShowConfirmClear(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          What I Know About You
        </h4>
        <span className="text-xs text-tertiary">
          {memories.length} memories
        </span>
      </div>

      {/* Grouped memories */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([type, items]) => {
          const config = MEMORY_TYPE_CONFIG[type] || MEMORY_TYPE_CONFIG.fact
          const Icon = config.icon

          return (
            <div key={type} className="space-y-2">
              <div
                className={`flex items-center gap-1.5 text-xs font-medium ${config.color}`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{config.label}</span>
              </div>
              <div className="space-y-1.5 pl-5">
                {items.map((memory) => (
                  <div
                    key={memory.id}
                    className="group flex items-start justify-between gap-2 p-2 rounded-lg bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 transition-colors"
                  >
                    <p className="text-sm text-secondary flex-1">
                      {memory.content}
                    </p>
                    <button
                      onClick={() => handleDelete(memory.id)}
                      disabled={deleting === memory.id}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-tertiary hover:text-red-500 transition-all disabled:opacity-50"
                      title="Remove this memory"
                    >
                      <Trash2
                        className={`w-3.5 h-3.5 ${deleting === memory.id ? "animate-pulse" : ""}`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Clear all button */}
      <div className="pt-3 border-t dark:border-white/10">
        {showConfirmClear ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="text-xs text-red-600 flex-1">
              Delete all memories? This cannot be undone.
            </p>
            <button
              onClick={handleClearAll}
              className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete All
            </button>
            <button
              onClick={() => setShowConfirmClear(false)}
              className="text-xs text-tertiary hover:text-primary"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="text-xs text-tertiary hover:text-red-500 transition-colors"
          >
            Clear all memories
          </button>
        )}
      </div>
    </div>
  )
}
