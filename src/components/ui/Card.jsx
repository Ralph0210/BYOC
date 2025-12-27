import { cn } from "../../lib/utils"

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
        "bg-white dark:bg-surface-dark rounded-2xl shadow-card",
        "border border-transparent dark:border-gray-800",
        paddingSizes[padding],
        interactive &&
          "card-interactive cursor-pointer hover:shadow-card-hover",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
