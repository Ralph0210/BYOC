// Mock Reanimated
require("react-native-reanimated/mock")

// Mock QuickCrypto
jest.mock("react-native-quick-crypto", () => {
  return {
    pbkdf2: jest.fn((userId, salt, iterations, keyLength, digest, callback) => {
      const mockKey = new Uint8Array(32).fill(1)
      callback(null, mockKey.buffer)
    }),
    createDecipheriv: jest.fn(() => ({
      setAuthTag: jest.fn(),
      update: jest.fn(() => "decrypted-content"),
      final: jest.fn(() => ""),
    })),
    // Add other methods if needed
    randomUUID: jest.fn(() => "mock-uuid"),
  }
})

// Mock Expo Constants
jest.mock("expo-constants", () => ({
  manifest: { extra: {} },
}))
