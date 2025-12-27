/**
 * Format a date as YYYY-MM-DD in local timezone
 */
export function formatDate(date) {
  if (typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Already in YYYY-MM-DD format, return as-is
    return date
  }
  const d = new Date(date)
  // Use local timezone
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Get today's date as YYYY-MM-DD in local timezone
 */
export function getToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Parse a date string (YYYY-MM-DD) to Date object in local timezone
 */
export function parseDate(dateStr) {
  if (typeof dateStr !== "string") {
    return new Date(dateStr)
  }
  // Parse YYYY-MM-DD in local timezone (not UTC)
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Get the start of week (Monday) for a given date
 */
export function getStartOfWeek(date) {
  const d = parseDate(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d
}

/**
 * Add days to a date
 */
export function addDays(date, days) {
  const d = parseDate(date)
  d.setDate(d.getDate() + days)
  return d
}

/**
 * Get difference in days between two dates
 */
export function daysDiff(date1, date2) {
  const d1 = parseDate(date1)
  const d2 = parseDate(date2)
  const diffTime = Math.abs(d2 - d1)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Check if a date is today
 */
export function isToday(date) {
  return formatDate(date) === getToday()
}

/**
 * Check if a date is in the past
 */
export function isPast(date) {
  return formatDate(date) < getToday()
}

/**
 * Check if a date is in the future
 */
export function isFuture(date) {
  return formatDate(date) > getToday()
}

/**
 * Get an array of dates between start and end (inclusive)
 */
export function getDateRange(startDate, endDate) {
  const dates = []
  let current = parseDate(startDate)
  const end = parseDate(endDate)

  while (current <= end) {
    dates.push(formatDate(current))
    current = addDays(current, 1)
  }

  return dates
}

/**
 * Format date for display (e.g., "Dec 26")
 */
export function formatDisplayDate(date) {
  if (!date) return ""
  const d = parseDate(date)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

/**
 * Format date with year for display (e.g., "Dec 26, 2024")
 */
export function formatFullDate(date) {
  if (!date) return ""
  const d = parseDate(date)
  if (isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

/**
 * Get day of week (0-6, 0 = Sunday)
 */
export function getDayOfWeek(date) {
  return parseDate(date).getDay()
}

/**
 * Check if a task should be active on a given date based on its frequency
 */
export function isTaskActiveOnDate(task, date) {
  const dayOfWeek = getDayOfWeek(date)

  switch (task.frequency_type) {
    case "daily":
      return true
    case "weekly":
      // For weekly tasks, check if it's the preferred day or any day if not set
      return task.frequency_days?.includes(dayOfWeek) ?? true
    case "specific_days":
      return task.frequency_days?.includes(dayOfWeek) ?? false
    default:
      return true
  }
}

/**
 * Calculate completion percentage
 */
export function calculateCompletionPercentage(completed, total) {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

/**
 * Generate a unique ID (for optimistic updates)
 */
export function generateId() {
  return crypto.randomUUID()
}

/**
 * Classnames utility (simple version)
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ")
}
