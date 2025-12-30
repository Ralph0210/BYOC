/**
 * Utility functions for the mobile app
 * Ported from web app with React Native adaptations
 */

/**
 * Classname utility - simplified version for React Native
 * Combines style objects or filters falsy values
 */
export function cn<T extends object>(
  ...styles: (T | false | null | undefined)[]
): T {
  return Object.assign({}, ...styles.filter(Boolean)) as T
}

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Get today's date as YYYY-MM-DD string
 */
export function getToday(): string {
  return formatDate(new Date())
}

/**
 * Format Date object to YYYY-MM-DD string
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Parse YYYY-MM-DD string to Date object
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(year, month - 1, day)
}

/**
 * Add days to a date string, returns new date string
 */
export function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr)
  date.setDate(date.getDate() + days)
  return formatDate(date)
}

/**
 * Calculate days difference between two date strings
 */
export function daysDiff(startDateStr: string, endDateStr: string): number {
  const start = parseDate(startDateStr)
  const end = parseDate(endDateStr)
  const diffTime = end.getTime() - start.getTime()
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Get array of date strings in range
 */
export function getDateRange(
  startDateStr: string,
  endDateStr: string
): string[] {
  const dates: string[] = []
  let current = startDateStr

  while (current <= endDateStr) {
    dates.push(current)
    current = addDays(current, 1)
  }

  return dates
}

/**
 * Format date for display (e.g., "Mon, Jan 15")
 */
export function formatDisplayDate(dateStr: string): string {
  const date = parseDate(dateStr)
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
}

/**
 * Get day of week (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(dateStr: string): number {
  return parseDate(dateStr).getDay()
}

/**
 * Check if date is today
 */
export function isToday(dateStr: string): boolean {
  return dateStr === getToday()
}

/**
 * Check if date is in the past
 */
export function isPast(dateStr: string): boolean {
  return dateStr < getToday()
}

/**
 * Check if date is in the future
 */
export function isFuture(dateStr: string): boolean {
  return dateStr > getToday()
}

// ============================================
// TASK UTILITIES
// ============================================

export type FrequencyType = "daily" | "weekdays" | "weekends" | "custom"

export interface Task {
  id: string
  challenge_id: string
  name: string
  frequency: FrequencyType
  custom_days?: number[] // 0-6 for custom frequency
  created_at: string
}

/**
 * Check if a task is active on a given date based on its frequency
 */
export function isTaskActiveOnDate(task: Task, dateStr: string): boolean {
  const dayOfWeek = getDayOfWeek(dateStr)

  switch (task.frequency) {
    case "daily":
      return true
    case "weekdays":
      return dayOfWeek >= 1 && dayOfWeek <= 5
    case "weekends":
      return dayOfWeek === 0 || dayOfWeek === 6
    case "custom":
      return task.custom_days?.includes(dayOfWeek) ?? false
    default:
      return true
  }
}

// ============================================
// CHALLENGE UTILITIES
// ============================================

export interface Challenge {
  id: string
  user_id: string
  name: string
  description?: string
  start_date: string
  end_date: string
  color: string
  icon: string
  created_at: string
}

/**
 * Calculate completion percentage for a challenge on a date
 */
export function calculateCompletionPercentage(
  tasks: Task[],
  completions: Set<string>,
  dateStr: string
): number {
  const activeTasks = tasks.filter((task) => isTaskActiveOnDate(task, dateStr))
  if (activeTasks.length === 0) return 100

  const completedCount = activeTasks.filter((task) =>
    completions.has(`${task.id}:${dateStr}`)
  ).length

  return Math.round((completedCount / activeTasks.length) * 100)
}

/**
 * Get the current day number in a challenge (1-indexed)
 */
export function getChallengeDay(challenge: Challenge, dateStr: string): number {
  const diff = daysDiff(challenge.start_date, dateStr)
  return Math.max(1, diff + 1)
}

/**
 * Get total days in a challenge
 */
export function getChallengeTotalDays(challenge: Challenge): number {
  return daysDiff(challenge.start_date, challenge.end_date) + 1
}

/**
 * Check if a date is within a challenge's date range
 */
export function isDateInChallenge(
  challenge: Challenge,
  dateStr: string
): boolean {
  return dateStr >= challenge.start_date && dateStr <= challenge.end_date
}

/**
 * Get the start of the week (Monday) for a given date
 */
export function getStartOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is sunday (Monday start)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}
