import { MMKV } from "react-native-mmkv"

// Create a single MMKV instance for the entire app
export const storage = new MMKV()

// Typed helper functions for common operations
export const Storage = {
  // String
  getString: (key: string): string | undefined => storage.getString(key),
  setString: (key: string, value: string): void => storage.set(key, value),

  // Boolean
  getBoolean: (key: string): boolean | undefined => storage.getBoolean(key),
  setBoolean: (key: string, value: boolean): void => storage.set(key, value),

  // Number
  getNumber: (key: string): number | undefined => storage.getNumber(key),
  setNumber: (key: string, value: number): void => storage.set(key, value),

  // JSON
  getObject: <T>(key: string): T | undefined => {
    const value = storage.getString(key)
    return value ? JSON.parse(value) : undefined
  },
  setObject: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value))
  },

  // Delete
  delete: (key: string): void => storage.delete(key),

  // Clear all
  clearAll: (): void => storage.clearAll(),
}

// Storage keys as constants to avoid typos
export const StorageKeys = {
  THEME: "app.theme",
  ONBOARDED: "app.onboarded",
  // AI Config is stored in secure store, not MMKV
} as const
