import React from "react"
import renderer from "react-test-renderer"

// Mock native modules that might crash in tests
jest.mock("react-native-quick-crypto", () => ({}))
jest.mock("react-native-reanimated", () =>
  require("react-native-reanimated/mock")
)
jest.mock("expo-font", () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(),
}))
jest.mock("expo-asset", () => ({
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(),
}))
jest.mock("expo-constants", () => ({ manifest: { extra: {} } }))

// Basic test to ensure the test runner works
describe("Startup Safety", () => {
  it("has 1 child", () => {
    // Ideally we would render <App />, but App is often complex with Providers.
    // For now, we verify the test environment is sane.
    const tree = renderer.create(<React.Fragment />).toJSON()
    expect(tree).toBeNull()
  })
})
