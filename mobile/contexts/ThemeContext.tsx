/**
 * Theme Context Provider
 *
 * Provides theme colors and scheme throughout the app.
 * Follows React best practices with proper memoization.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react"
import { Appearance, ColorSchemeName, useColorScheme } from "react-native"
import { colors, getColors, ColorScheme, ThemeColors } from "../lib/theme"

type ThemeMode = "light" | "dark" | "system"

interface ThemeContextValue {
  /** Current color scheme being applied */
  colorScheme: ColorScheme
  /** User's preference: light, dark, or system */
  themeMode: ThemeMode
  /** Semantic colors for current theme */
  colors: ThemeColors
  /** Whether dark mode is active */
  isDark: boolean
  /** Update theme preference */
  setThemeMode: (mode: ThemeMode) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  /** Initial theme mode preference */
  initialMode?: ThemeMode
}

export function ThemeProvider({
  children,
  initialMode = "system",
}: ThemeProviderProps) {
  const systemScheme = useColorScheme()
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialMode)

  // Derive actual color scheme from mode + system preference
  const colorScheme = useMemo<ColorScheme>(() => {
    if (themeMode === "system") {
      return systemScheme === "dark" ? "dark" : "light"
    }
    return themeMode
  }, [themeMode, systemScheme])

  // Memoize colors object to prevent unnecessary re-renders
  const themeColors = useMemo(() => getColors(colorScheme), [colorScheme])

  const value = useMemo<ThemeContextValue>(
    () => ({
      colorScheme,
      themeMode,
      colors: themeColors,
      isDark: colorScheme === "dark",
      setThemeMode,
    }),
    [colorScheme, themeMode, themeColors]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

/**
 * Hook to access theme context
 * @throws Error if used outside ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}

/**
 * Hook for quick access to current theme colors
 */
export function useColors(): ThemeColors {
  const { colors } = useTheme()
  return colors
}
