import { useEffect, useCallback } from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

/**
 * BYOC Modal Component
 * Accessible modal with design system tokens
 * - Mobile: slides up from bottom with rounded top
 * - Desktop: centered with full rounding
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showClose = true,
}) {
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    full: "max-w-4xl",
  }

  // Handle escape key
  const handleEscape = useCallback(
    (e) => {
      if (e.key === "Escape") onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 modal-backdrop animate-fade-in"
        onClick={onClose}
      />

      {/* Modal content */}
      <div
        className={cn(
          "relative w-full bg-surface rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-lg)]",
          "shadow-xl dark:shadow-2xl",
          "animate-slide-up sm:animate-scale-in",
          "max-h-[90vh] overflow-hidden flex flex-col",
          sizes[size]
        )}
      >
        {/* Header */}
        {(title || showClose) && (
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: "var(--color-border)" }}
          >
            <h2 className="text-h2 text-primary">{title}</h2>
            {showClose && (
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-[var(--radius-md)] hover:bg-surface-hover transition-colors"
              >
                <X className="h-5 w-5 text-tertiary" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
      </div>
    </div>
  )
}
