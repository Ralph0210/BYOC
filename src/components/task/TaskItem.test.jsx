import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import { TaskItem } from "./TaskItem"

describe("TaskItem", () => {
  const task = {
    id: "t1",
    name: "Test Task",
    description: "Do the thing",
    icon: "check", // Maps to Check icon
    color: "#ff0000",
    frequency_count: 1,
  }

  it("renders task name and description", () => {
    render(<TaskItem task={task} />)
    expect(screen.getByText("Test Task")).toBeInTheDocument()
    expect(screen.getByText("Do the thing")).toBeInTheDocument()
  })

  it("calls onComplete when toggle button is clicked (incomplete)", () => {
    const handleComplete = vi.fn()
    render(
      <TaskItem
        task={task}
        completionCount={0}
        onComplete={handleComplete}
        date="2024-01-01"
      />
    )

    const toggleBtn = screen.getByLabelText("Toggle completion status")
    fireEvent.click(toggleBtn)

    expect(handleComplete).toHaveBeenCalledWith("t1", "2024-01-01")
  })

  it("calls onUncomplete when toggle button is clicked (complete)", () => {
    const handleUncomplete = vi.fn()
    render(
      <TaskItem
        task={task}
        completionCount={1}
        onUncomplete={handleUncomplete}
        date="2024-01-01"
      />
    )

    const toggleBtn = screen.getByLabelText("Toggle completion status")
    fireEvent.click(toggleBtn)

    expect(handleUncomplete).toHaveBeenCalledWith("t1", "2024-01-01")
  })
})
