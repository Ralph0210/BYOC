import { describe, it, expect } from "vitest"
import {
  calculateCompletionPercentage,
  isTaskActiveOnDate,
  getDayOfWeek,
} from "./utils"

describe("utils", () => {
  describe("calculateCompletionPercentage", () => {
    it("returns 0 for 0 total", () => {
      expect(calculateCompletionPercentage(0, 0)).toBe(0)
      expect(calculateCompletionPercentage(10, 0)).toBe(0)
    })

    it("calculates correct percentage", () => {
      expect(calculateCompletionPercentage(5, 10)).toBe(50)
      expect(calculateCompletionPercentage(1, 3)).toBe(33)
    })

    it("caps at 100", () => {
      expect(calculateCompletionPercentage(11, 10)).toBe(100)
    })
  })

  describe("isTaskActiveOnDate", () => {
    const monDate = "2024-01-01" // Monday
    const tueDate = "2024-01-02" // Tuesday

    it("returns true for daily task", () => {
      const task = { frequency_type: "daily" }
      expect(isTaskActiveOnDate(task, monDate)).toBe(true)
    })

    it("validates specific days", () => {
      const task = {
        frequency_type: "specific_days",
        frequency_days: [1], // Monday only
      }
      expect(isTaskActiveOnDate(task, monDate)).toBe(true)
      expect(isTaskActiveOnDate(task, tueDate)).toBe(false)
    })
  })
})
