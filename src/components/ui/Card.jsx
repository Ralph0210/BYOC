import { cn } from "../../lib/utils"

/**
 * BYOC Card Component
 * Clean, minimal card with consistent design tokens
 * Variants: default, elevated, outline
 */
export function Card({
  children,
  className,
  variant = "default",
  interactive = false,
  padding = "md",
  ...props
}) {
  const paddingSizes = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  }

  const variants = {
    default: "card",
    elevated: "card shadow-lg",
    outline: "bg-transparent border border-border rounded-[var(--radius-lg)]",
  }

  return (
    <div
      className={cn(
        variants[variant],
        paddingSizes[padding],
        interactive && "card-interactive cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
