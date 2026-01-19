// Force mock of expo's winter module before anything else
jest.mock("expo/src/winter/runtime.native", () => ({}), { virtual: true })
jest.mock("expo/src/winter/installGlobal", () => ({}), { virtual: true })

// Mock Reanimated
jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock")
)

// Mock Expo Constants
jest.mock("expo-constants", () => ({
  manifest: { extra: {} },
}))

// Mock Expo SecureStore
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}))
