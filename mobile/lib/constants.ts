// Synced with src/lib/constants.js
// Visual assets and configuration

export const TASK_COLORS = [
  { name: "Blue", value: "#007AFF" },
  { name: "Green", value: "#34C759" },
  { name: "Orange", value: "#FF9500" },
  { name: "Red", value: "#FF3B30" },
  { name: "Purple", value: "#AF52DE" },
  { name: "Pink", value: "#FF2D55" },
  { name: "Teal", value: "#5AC8FA" },
  { name: "Indigo", value: "#5856D6" },
  { name: "Yellow", value: "#FFCC00" },
  { name: "Mint", value: "#00C7BE" },
  { name: "Brown", value: "#A2845E" },
  { name: "Gray", value: "#8E8E93" },
]

// Determine which Ionicons match the Lucide icons used on web
export const ICON_MAP: Record<string, string> = {
  circle: "radio-button-off",
  "check-circle": "checkmark-circle",
  star: "star",
  heart: "heart",
  sun: "sunny",
  moon: "moon",
  coffee: "cafe",
  book: "book",
  dumbbell: "barbell",
  apple: "nutrition",
  droplet: "water",
  brain: "school", // Closest approximation
  pencil: "pencil",
  music: "musical-notes",
  camera: "camera",
  phone: "call",
  mail: "mail",
  home: "home",
  briefcase: "briefcase",
  "dollar-sign": "cash",
  clock: "time",
  calendar: "calendar",
  target: "disc",
  trophy: "trophy",
}

export const TASK_ICONS = Object.keys(ICON_MAP)

export const FREQUENCY_TYPES = {
  DAILY: "daily",
  WEEKLY: "weekly",
  SPECIFIC_DAYS: "specific_days",
}

export const DAYS_OF_WEEK = [
  { short: "S", full: "Sunday", value: 0 },
  { short: "M", full: "Monday", value: 1 },
  { short: "T", full: "Tuesday", value: 2 },
  { short: "W", full: "Wednesday", value: 3 },
  { short: "T", full: "Thursday", value: 4 },
  { short: "F", full: "Friday", value: 5 },
  { short: "S", full: "Saturday", value: 6 },
]
