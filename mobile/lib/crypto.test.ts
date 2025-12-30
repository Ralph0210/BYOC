import { decryptData, isEncrypted } from "./crypto"

// Mock react-native-quick-crypto
jest.mock("react-native-quick-crypto", () => {
  return {
    pbkdf2: jest.fn((userId, salt, iterations, keyLength, digest, callback) => {
      // Return a mock derived key (32 bytes)
      const mockKey = new Uint8Array(32).fill(1)
      callback(null, mockKey.buffer)
    }),
    createDecipheriv: jest.fn(() => ({
      setAuthTag: jest.fn(),
      update: jest.fn(() => "decrypted-content"),
      final: jest.fn(() => ""),
    })),
  }
})

describe("Crypto Utility", () => {
  it("should identify encrypted values", () => {
    expect(isEncrypted("encrypted:abc")).toBe(true)
    expect(isEncrypted("plain")).toBe(false)
    expect(isEncrypted(null)).toBe(false)
  })

  it("should decrypt data successfully", async () => {
    const userId = "user-123"
    // Base64 of "iv" (12 bytes) + "ciphertext" + "tag" (16 bytes)
    // For test simplicity, we just pass a dummy string that decodes to enough bytes
    const mockEncrypted =
      "encrypted:" + Buffer.alloc(12 + 10 + 16).toString("base64")

    const result = await decryptData(mockEncrypted, userId)
    expect(result).toBe("decrypted-content")
  })

  it("should return plain text as-is", async () => {
    const result = await decryptData("simple-text", "user-123")
    expect(result).toBe("simple-text")
  })
})
