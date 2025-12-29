import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from "react"
import {
  makeRedirectUri,
  useAuthRequest,
  ResponseType,
} from "expo-auth-session"
import * as WebBrowser from "expo-web-browser"
import { supabase } from "../lib/supabase"
import type { Session, User } from "@supabase/supabase-js"

// Required for expo-auth-session to work properly
WebBrowser.maybeCompleteAuthSession()

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<{ error: Error | null }>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = useCallback(async () => {
    try {
      const redirectUri = makeRedirectUri({
        scheme: "byoc",
        path: "auth/callback",
      })

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUri,
          skipBrowserRedirect: true,
        },
      })

      if (error) throw error
      if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri
        )

        if (result.type === "success") {
          // Extract access_token and refresh_token from the URL
          const url = new URL(result.url)
          const params = new URLSearchParams(url.hash.substring(1))
          const accessToken = params.get("access_token")
          const refreshToken = params.get("refresh_token")

          if (accessToken && refreshToken) {
            await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
          }
        }
      }
    } catch (error) {
      console.error("Error signing in with Google:", error)
    }
  }, [])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error("Error signing out:", error)
      return { error }
    }
    setUser(null)
    setSession(null)
    return { error: null }
  }, [])

  const value: AuthContextType = {
    user,
    session,
    loading,
    signInWithGoogle,
    signOut,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
