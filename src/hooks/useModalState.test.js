import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useModalState } from "./useModalState"

describe("useModalState", () => {
  it("initializes with all modals closed", () => {
    const { result } = renderHook(() => useModalState())

    expect(result.current.showChallengeModal).toBe(false)
    expect(result.current.showTaskModal).toBe(false)
    expect(result.current.showSummaryModal).toBe(false)
    expect(result.current.showAISettings).toBe(false)
    expect(result.current.editingChallenge).toBe(null)
    expect(result.current.editingTask).toBe(null)
  })

  it("opens and closes challenge modal", () => {
    const { result } = renderHook(() => useModalState())

    act(() => {
      result.current.openChallengeModal()
    })
    expect(result.current.showChallengeModal).toBe(true)

    act(() => {
      result.current.closeChallengeModal()
    })
    expect(result.current.showChallengeModal).toBe(false)
  })

  it("opens challenge modal with edit item", () => {
    const { result } = renderHook(() => useModalState())
    const challenge = { id: "c1", name: "Test Challenge" }

    act(() => {
      result.current.openChallengeModal(challenge)
    })

    expect(result.current.showChallengeModal).toBe(true)
    expect(result.current.editingChallenge).toEqual(challenge)
  })

  it("clears editing state when modal closes", () => {
    const { result } = renderHook(() => useModalState())
    const challenge = { id: "c1", name: "Test" }

    act(() => {
      result.current.openChallengeModal(challenge)
    })
    expect(result.current.editingChallenge).toEqual(challenge)

    act(() => {
      result.current.closeChallengeModal()
    })
    expect(result.current.editingChallenge).toBe(null)
  })

  it("opens task modal for specific challenge", () => {
    const { result } = renderHook(() => useModalState())
    const challenge = { id: "c1", name: "Test" }

    act(() => {
      result.current.openTaskModalForChallenge(challenge)
    })

    expect(result.current.showTaskModal).toBe(true)
    expect(result.current.selectedChallengeForTask).toEqual(challenge)
    expect(result.current.editingTask).toBe(null)
  })

  it("manages chat state independently", () => {
    const { result } = renderHook(() => useModalState())

    expect(result.current.chatChallengeId).toBe(null)

    act(() => {
      result.current.openChat("challenge-123")
    })
    expect(result.current.chatChallengeId).toBe("challenge-123")

    act(() => {
      result.current.closeChat()
    })
    expect(result.current.chatChallengeId).toBe(null)
  })

  it("handles multiple modals independently", () => {
    const { result } = renderHook(() => useModalState())

    act(() => {
      result.current.openChallengeModal()
      result.current.openAISettings()
    })

    expect(result.current.showChallengeModal).toBe(true)
    expect(result.current.showAISettings).toBe(true)

    act(() => {
      result.current.closeChallengeModal()
    })

    expect(result.current.showChallengeModal).toBe(false)
    expect(result.current.showAISettings).toBe(true) // Still open
  })
})
