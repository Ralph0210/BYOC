import { describe, it, expect } from "vitest"
import { calculateChallengeStats } from "./stats"

describe("calculateChallengeStats", () => {
  const challenge = {
    id: "c1",
    start_date: "2024-01-01",
    end_date: "2024-01-07", // 7 days (Monday to Sunday)
    duration_days: 7,
  }

  it("calculates 0% when no tasks defined", () => {
    const stats = calculateChallengeStats(challenge, [], [])
    expect(stats.overall).toBe(0)
  })

  it("calculates 100% when all tasks completed", () => {
    const task = {
      id: "t1",
      challenge_id: "c1",
      frequency_type: "daily",
      frequency_days: [],
      frequency_count: 1,
    }

    // Simulate completing task on all 7 days
    const completions = []
    for (let i = 1; i <= 7; i++) {
      completions.push({ task_id: "t1", date: `2024-01-0${i}` })
    }

    const stats = calculateChallengeStats(challenge, [task], completions)
    expect(stats.overall).toBe(100)
    expect(stats.byTask["t1"].completed).toBe(7)
    expect(stats.byTask["t1"].total).toBe(7)
  })

  it("calculates partial progress correctly", () => {
    const task = {
      id: "t1",
      challenge_id: "c1",
      frequency_type: "daily",
      frequency_count: 1,
    }

    // Complete 3 out of 7 days
    const completions = [
      { task_id: "t1", date: "2024-01-01" },
      { task_id: "t1", date: "2024-01-02" },
      { task_id: "t1", date: "2024-01-03" },
    ]

    const stats = calculateChallengeStats(challenge, [task], completions)
    // 3/7 = 42.85 -> 43%
    expect(stats.overall).toBe(43)
  })

  it("caps completion at target count", () => {
    const task = {
      id: "t1",
      challenge_id: "c1",
      frequency_type: "daily",
      frequency_count: 1,
    }

    // Complete twice on same day (should count as 1)
    const completions = [
      { task_id: "t1", date: "2024-01-01" },
      { task_id: "t1", date: "2024-01-01" }, // Duplicate/Extra
    ]

    const stats = calculateChallengeStats(challenge, [task], completions)
    // 1/7 = 14%
    expect(stats.overall).toBe(14)
    expect(stats.byTask["t1"].completed).toBe(1)
  })

  it("respects specific days of week", () => {
    const task = {
      id: "t2",
      frequency_type: "specific_days",
      frequency_days: [1, 3, 5], // Mon, Wed, Fri
      frequency_count: 1,
    }

    // Range 2024-01-01 (Mon) to 2024-01-07 (Sun)
    // Active days: 1 (Mon), 3 (Wed), 5 (Fri) -> 3 days total

    const completions = [
      { task_id: "t2", date: "2024-01-01" }, // Mon (Active)
      { task_id: "t2", date: "2024-01-02" }, // Tue (Inactive, shouldn't count ideally, logic filters it?)
    ]

    // Our stats logic checks 'isTaskActiveOnDate(task, date)'
    // If we complete a task on an inactive day, does it count?
    // Math.min(completedCount, target) runs only if isTaskActiveOnDate is true.
    // So completion on inactive day adds 0 to score.

    const stats = calculateChallengeStats(challenge, [task], completions)

    expect(stats.byTask["t2"].total).toBe(3) // Mon, Wed, Fri
    expect(stats.byTask["t2"].completed).toBe(1) // Only Mon counts
    expect(stats.overall).toBe(33) // 1/3 = 33%
  })
})
