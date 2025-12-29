import { cn } from "../../lib/utils"

/**
 * BYOC Button Component
 * Consistent button styling with design system tokens
 */

const variants = {
  primary: "btn-primary",
  secondary:
    "bg-surface text-primary border border-border hover:bg-surface-hover",
  ghost: "btn-ghost",
  danger: "bg-red-500 text-white hover:bg-red-600",
  accent: "bg-accent text-white hover:bg-accent-hover",
}

const sizes = {
  xs: "px-2.5 py-1 text-xs",
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-8 py-4 text-lg",
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  disabled,
  loading,
  icon: Icon,
  iconPosition = "left",
  ...props
}) {
  return (
    <button
      className={cn(
        "btn",
        variants[variant],
        sizes[size],
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : Icon && iconPosition === "left" ? (
        <Icon className="h-4 w-4" />
      ) : null}
      {children}
      {Icon && iconPosition === "right" && !loading && (
        <Icon className="h-4 w-4" />
      )}
    </button>
  )
}
