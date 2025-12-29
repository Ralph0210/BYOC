import "react-native-url-polyfill/auto"
import { createClient } from "@supabase/supabase-js"
import * as SecureStore from "expo-secure-store"

// Supabase configuration
// In a real app, these would come from environment variables (app.config.js)
// For now, we use placeholders - replace with your actual values
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

// Custom storage adapter using SecureStore for auth tokens
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return await SecureStore.getItemAsync(key)
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await SecureStore.setItemAsync(key, value)
  },
  removeItem: async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(key)
  },
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Prevents issues with React Native
  },
})
