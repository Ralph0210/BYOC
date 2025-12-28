import { useState, useRef, useEffect } from "react"
import { Settings, LogOut, User, Moon, Sun } from "lucide-react"
import { useAuth } from "../../hooks/useAuth.jsx"
import { useTheme } from "../../hooks/useTheme"
import { cn } from "../../lib/utils"

/**
 * Soft Focus Header
 * Clean, minimal header with wordmark logo and user avatar
 */
export function Header({ onOpenAISettings, onSignOut }) {
  const { user, isAuthenticated, signInWithGoogle, signOut, loading } =
    useAuth()
  const { theme, setTheme } = useTheme()
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

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-app">
      <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Wordmark Logo */}
        <div className="flex items-center gap-3">
          <span className="wordmark">Path</span>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              "text-secondary hover:text-primary hover:bg-surface-elevated",
              "transition-colors focus-visible:ring-2 focus-visible:ring-accent"
            )}
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              {/* User Avatar Button */}
              <button
                onClick={() => setShowMenu(!showMenu)}
                aria-label="User menu"
                aria-expanded={showMenu}
                className={cn(
                  "w-10 h-10 rounded-full overflow-hidden",
                  "ring-2 ring-border hover:ring-accent/50",
                  "transition-all focus-visible:ring-accent"
                )}
              >
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata.full_name || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-accent flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div
                  className={cn(
                    "absolute right-0 top-full mt-2 w-64",
                    "rounded-xl bg-surface shadow-lg border border-app",
                    "animate-scale-in origin-top-right"
                  )}
                >
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-app">
                    <p className="font-medium text-primary truncate">
                      {user?.user_metadata?.full_name || "User"}
                    </p>
                    <p className="text-sm text-tertiary truncate">
                      {user?.email}
                    </p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onOpenAISettings?.()
                        setShowMenu(false)
                      }}
                      className={cn(
                        "w-full px-4 py-3 text-left",
                        "text-secondary hover:bg-surface-elevated hover:text-primary",
                        "flex items-center gap-3 transition-colors"
                      )}
                    >
                      <Settings className="w-5 h-5" />
                      Settings
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
                      className={cn(
                        "w-full px-4 py-3 text-left",
                        "text-secondary hover:bg-surface-elevated hover:text-primary",
                        "flex items-center gap-3 transition-colors"
                      )}
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className={cn(
                "btn btn-primary",
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
