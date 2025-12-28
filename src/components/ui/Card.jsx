import { cn } from "../../lib/utils"

/**
 * Soft Focus Card Component
 * Clean, minimal card with warm shadows and subtle borders
 */
export function Card({
  children,
  className,
  interactive = false,
  padding = "md",
  ...props
}) {
  const paddingSizes = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  }

  return (
    <div
      className={cn(
        "card",
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
