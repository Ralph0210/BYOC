module.exports = {
  preset: "jest-expo",
  setupFiles: ["./jest-setup.js"],
  testEnvironment: "node",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|crypto-js)",
  ],
  moduleNameMapper: {
    "^crypto-js$": "<rootDir>/node_modules/crypto-js",
    // Mock expo winter internals
    "^expo/src/winter/(.*)$": "<rootDir>/__mocks__/expo-winter.js",
  },
}
