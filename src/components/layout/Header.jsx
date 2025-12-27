import { useState, useRef, useEffect } from "react"
import { LogOut, User } from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"
import { useAuth } from "../../hooks/useAuth.jsx"
import { cn } from "../../lib/utils"

export function Header({ title, subtitle }) {
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
      <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">{title}</h1>
          {subtitle && <p className="text-sm text-secondary">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isAuthenticated ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary-500/20 hover:ring-primary-500/40 transition-all"
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
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-white dark:bg-gray-800 shadow-lg border border-app py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-4 py-2 border-b border-app">
                    <p className="text-sm font-medium text-primary truncate">
                      {user?.user_metadata?.full_name || "User"}
                    </p>
                    <p className="text-xs text-secondary truncate">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      signOut()
                      setShowMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-secondary hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
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
                "px-3 py-1.5 text-sm font-medium rounded-lg",
                "bg-primary-500 text-white hover:bg-primary-600 transition-colors",
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
