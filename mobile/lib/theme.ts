/**
 * Design System for BYOC Mobile App
 *
 * Following Apple Human Interface Guidelines:
 * - Dynamic Type support ready
 * - Semantic colors for light/dark mode
 * - 8pt spacing grid
 * - SF Pro-inspired typography scale
 */

import { Appearance } from "react-native"

// ============================================
// COLOR TOKENS
// ============================================

const palette = {
  // Neutrals - Warm tones matching web
  white: "#ffffff",
  gray50: "#f8f7f5",
  gray100: "#f5f4f2",
  gray200: "#f0eeea",
  gray300: "#e5e3df",
  gray400: "#8c8c8c",
  gray500: "#5c5c5c",
  gray600: "#1a1a1a",

  // Dark mode neutrals
  dark50: "#0a0a0a",
  dark100: "#111111",
  dark200: "#161616",
  dark300: "#1a1a1a",
  dark400: "#1f1f1f",
  dark500: "#262626",
  dark600: "#737373",
  dark700: "#a3a3a3",
  dark800: "#fafafa",

  // Accent - Indigo
  indigo400: "#818cf8",
  indigo500: "#6366f1",
  indigo600: "#4f46e5",
  indigoAlpha10: "rgba(99, 102, 241, 0.1)",
  indigoAlpha15: "rgba(129, 140, 248, 0.15)",

  // AI - Purple
  purple400: "#c084fc",
  purple500: "#a855f7",
  purpleAlpha8: "rgba(168, 85, 247, 0.08)",
  purpleAlpha12: "rgba(192, 132, 252, 0.12)",
  purpleAlpha15: "rgba(168, 85, 247, 0.15)",
  purpleAlpha20: "rgba(192, 132, 252, 0.2)",

  // Success - Green
  green400: "#4ade80",
  green500: "#22c55e",
  greenAlpha10: "rgba(34, 197, 94, 0.1)",
  greenAlpha15: "rgba(74, 222, 128, 0.15)",

  // Semantic
  transparent: "transparent",
} as const

export const colors = {
  light: {
    // Backgrounds
    background: palette.gray50,
    backgroundSecondary: palette.white,
    backgroundTertiary: palette.gray100,

    // Surfaces
    surface: palette.white,
    surfaceElevated: palette.white,
    surfaceHover: palette.gray100,

    // Text
    textPrimary: palette.gray600,
    textSecondary: palette.gray500,
    textTertiary: palette.gray400,

    // Borders
    border: palette.gray300,
    borderSubtle: palette.gray200,
    divider: palette.gray200,

    // Accent
    accent: palette.indigo500,
    accentSoft: palette.indigoAlpha10,
    accentHover: palette.indigo600,

    // AI
    aiPrimary: palette.purple500,
    aiSurface: palette.purpleAlpha8,
    aiGlow: palette.purpleAlpha15,

    // Success
    success: palette.green500,
    successSoft: palette.greenAlpha10,
  },
  dark: {
    // Backgrounds
    background: palette.dark50,
    backgroundSecondary: palette.dark100,
    backgroundTertiary: palette.dark200,

    // Surfaces
    surface: palette.dark200,
    surfaceElevated: palette.dark400,
    surfaceHover: palette.dark400,

    // Text
    textPrimary: palette.dark800,
    textSecondary: palette.dark700,
    textTertiary: palette.dark600,

    // Borders
    border: palette.dark500,
    borderSubtle: palette.dark300,
    divider: palette.dark300,

    // Accent
    accent: palette.indigo400,
    accentSoft: palette.indigoAlpha15,
    accentHover: palette.indigo400,

    // AI
    aiPrimary: palette.purple400,
    aiSurface: palette.purpleAlpha12,
    aiGlow: palette.purpleAlpha20,

    // Success
    success: palette.green400,
    successSoft: palette.greenAlpha15,
  },
} as const

// ============================================
// TYPOGRAPHY
// ============================================

/**
 * Typography scale following iOS conventions
 * Using system font (San Francisco) via fontWeight
 */
export const typography = {
  // Display - Hero text
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: "700" as const,
    letterSpacing: 0.37,
  },

  // Titles
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700" as const,
    letterSpacing: 0.36,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700" as const,
    letterSpacing: 0.35,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "600" as const,
    letterSpacing: 0.38,
  },

  // Headlines
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600" as const,
    letterSpacing: -0.41,
  },

  // Body
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "400" as const,
    letterSpacing: -0.41,
  },
  bodyBold: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600" as const,
    letterSpacing: -0.41,
  },

  // Callout
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "400" as const,
    letterSpacing: -0.32,
  },

  // Subhead
  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "400" as const,
    letterSpacing: -0.24,
  },
  subheadlineBold: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600" as const,
    letterSpacing: -0.24,
  },

  // Footnote
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400" as const,
    letterSpacing: -0.08,
  },

  // Caption
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "400" as const,
    letterSpacing: 0,
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: "400" as const,
    letterSpacing: 0.07,
  },
} as const

// ============================================
// SPACING (8pt Grid)
// ============================================

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
} as const

// ============================================
// BORDER RADIUS
// ============================================

export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const

// ============================================
// SHADOWS (iOS-style)
// ============================================

export const shadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 5,
  },
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
} as const

// ============================================
// ANIMATION DURATIONS
// ============================================

export const animation = {
  fast: 150,
  normal: 250,
  slow: 350,
} as const

// ============================================
// LAYOUT CONSTANTS
// ============================================

export const layout = {
  screenPaddingHorizontal: spacing.lg,
  cardPadding: spacing.lg,
  listItemHeight: 56,
  headerHeight: 56,
  tabBarHeight: 83, // iOS standard with safe area
} as const

// ============================================
// THEME HELPER
// ============================================

export type ColorScheme = "light" | "dark"
export type ThemeColors = typeof colors.light

export const getColors = (scheme: ColorScheme): ThemeColors => {
  return scheme === "dark" ? colors.dark : colors.light
}

export const getSystemColorScheme = (): ColorScheme => {
  return Appearance.getColorScheme() === "dark" ? "dark" : "light"
}
