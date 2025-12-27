import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useReturnDetection, clearAmbientCache } from "./useAmbientNotes"

describe("useReturnDetection", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it("returns not returning for first-time visitor", () => {
    const { result } = renderHook(() => useReturnDetection())

    expect(result.current.isReturning).toBe(false)
    expect(result.current.daysAway).toBe(0)
  })

  it("sets last visit date in localStorage", () => {
    renderHook(() => useReturnDetection())

    const stored = localStorage.getItem("path_last_visit")
    expect(stored).toBeTruthy()
    expect(stored).toMatch(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD format
  })

  it("returns returning=true if last visit was 3+ days ago", () => {
    // Set last visit to 5 days ago
    const fiveDaysAgo = new Date()
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
    localStorage.setItem(
      "path_last_visit",
      fiveDaysAgo.toISOString().split("T")[0]
    )

    const { result } = renderHook(() => useReturnDetection())

    expect(result.current.isReturning).toBe(true)
    expect(result.current.daysAway).toBe(5)
  })

  it("returns returning=false if last visit was less than 3 days ago", () => {
    // Set last visit to yesterday
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    localStorage.setItem(
      "path_last_visit",
      yesterday.toISOString().split("T")[0]
    )

    const { result } = renderHook(() => useReturnDetection())

    expect(result.current.isReturning).toBe(false)
    expect(result.current.daysAway).toBe(0)
  })

  it("provides dismissReturn function", () => {
    const fiveDaysAgo = new Date()
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
    localStorage.setItem(
      "path_last_visit",
      fiveDaysAgo.toISOString().split("T")[0]
    )

    const { result } = renderHook(() => useReturnDetection())

    expect(result.current.isReturning).toBe(true)

    act(() => {
      result.current.dismissReturn()
    })

    expect(result.current.isReturning).toBe(false)
  })
})

describe("clearAmbientCache", () => {
  it("is a function that clears the cache", () => {
    expect(typeof clearAmbientCache).toBe("function")
    // Should not throw
    expect(() => clearAmbientCache()).not.toThrow()
  })
})
