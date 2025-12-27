import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"

// Mock supabase
vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() =>
            Promise.resolve({
              data: { id: "1", provider: "openai", api_key: "test-key" },
              error: null,
            })
          ),
        })),
      })),
    })),
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: { id: "user-1" } } })
      ),
    },
  },
}))

// Mock useAuth
vi.mock("./useAuth", () => ({
  useAuth: () => ({ user: { id: "user-1" } }),
}))

describe("useAIConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns initial loading state", async () => {
    const { useAIConfig } = await import("./useAIConfig")
    const { result } = renderHook(() => useAIConfig())

    expect(result.current.loading).toBe(true)
  })

  it("provides config, updateConfig, and hasKey after loading", async () => {
    const { useAIConfig } = await import("./useAIConfig")
    const { result } = renderHook(() => useAIConfig())

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false)
      },
      { timeout: 3000 }
    )

    expect(result.current.hasKey).toBe(false)
    expect(typeof result.current.updateConfig).toBe("function")
    expect(typeof result.current.refetch).toBe("function")
    expect(result.current.error).toBe(null)
  })
})
