import { useState, useRef, useEffect } from "react"
import { LogOut, User, Sparkles } from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"
import { useAuth } from "../../hooks/useAuth.jsx"
import { cn } from "../../lib/utils"

export function Header({ title, subtitle, onOpenAISettings, onSignOut }) {
  const { user, isAuthenticated, signInWithGoogle, signOut, loading } =
    useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-40 bg-app/80 backdrop-blur-lg border-b border-app">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex flex-col justify-center min-h-[44px]">
          <h1 className="text-xl font-bold text-primary">{title}</h1>
          {subtitle && <p className="text-sm text-secondary">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated ? (
            <div className="relative flex items-center" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                aria-label="User menu"
                className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-primary-500/20 hover:ring-primary-500/40 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata.full_name || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary-500 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </button>

              {showMenu && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-surface-light dark:bg-gray-800 shadow-xl border border-app py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-3 border-b border-app">
                    <p className="font-medium text-primary truncate">
                      {user?.user_metadata?.full_name || "User"}
                    </p>
                    <p className="text-sm text-secondary truncate">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onOpenAISettings?.()
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-3 text-left text-secondary hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors border-b border-app"
                  >
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    AI Companion
                  </button>
                  <button
                    onClick={() => {
                      if (onSignOut) {
                        onSignOut()
                      } else {
                        signOut()
                      }
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-3 text-left text-secondary hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className={cn(
                "min-h-[44px] px-4 py-2 text-sm font-medium rounded-xl",
                "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
