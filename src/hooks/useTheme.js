import { useState, useEffect, useCallback } from "react"
import { THEMES } from "../lib/constants"

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("theme") || THEMES.SYSTEM
    }
    return THEMES.SYSTEM
  })

  const [resolvedTheme, setResolvedTheme] = useState(() => {
    if (typeof window === "undefined") return THEMES.LIGHT
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme && savedTheme !== THEMES.SYSTEM) {
      return savedTheme
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? THEMES.DARK
      : THEMES.LIGHT
  })
  const updateResolvedTheme = useCallback(() => {
    if (theme === THEMES.SYSTEM) {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setResolvedTheme(isDark ? THEMES.DARK : THEMES.LIGHT)
    } else {
      setResolvedTheme(theme)
    }
  }, [theme])

  // Apply theme to document
  useEffect(() => {
    updateResolvedTheme()

    // Listen for system theme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const handleChange = () => {
      if (theme === THEMES.SYSTEM) {
        updateResolvedTheme()
      }
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [theme, updateResolvedTheme])

  // Apply dark class to document
  useEffect(() => {
    const root = document.documentElement
    if (resolvedTheme === THEMES.DARK) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [resolvedTheme])

  // Save theme preference
  const saveTheme = useCallback((newTheme) => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
  }, [])

  const toggleTheme = useCallback(() => {
    const themeOrder = [THEMES.LIGHT, THEMES.DARK, THEMES.SYSTEM]
    const currentIndex = themeOrder.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themeOrder.length
    saveTheme(themeOrder[nextIndex])
  }, [theme, saveTheme])

  return {
    theme,
    resolvedTheme,
    setTheme: saveTheme,
    toggleTheme,
    isDark: resolvedTheme === THEMES.DARK,
  }
}
