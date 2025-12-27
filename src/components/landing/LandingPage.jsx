import {
  Target,
  CheckCircle2,
  Calendar,
  Gift,
  ArrowRight,
  Sparkles,
} from "lucide-react"
import { Button } from "../ui/Button"

export function LandingPage({ onGetStarted, onSignIn, loading }) {
  const features = [
    {
      icon: Target,
      title: "Set Your Goals",
      description:
        "Create challenges with custom durations and track your daily habits",
      color: "#0EA5E9",
    },
    {
      icon: CheckCircle2,
      title: "Build Consistency",
      description:
        "Mark off tasks daily and watch your streak grow with visual progress",
      color: "#22C55E",
    },
    {
      icon: Calendar,
      title: "Track Progress",
      description: "Beautiful heatmaps show your journey at a glance",
      color: "#F97316",
    },
    {
      icon: Gift,
      title: "Reward Yourself",
      description: "Set rewards for completing challenges to stay motivated",
      color: "#EAB308",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-primary">Path</span>
          </div>
          <Button variant="ghost" onClick={onSignIn} disabled={loading}>
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="px-6 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          {/* Hero */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Build habits that stick
            </div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
              Your journey to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-600">
                better habits
              </span>{" "}
              starts here
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Create personal challenges, track daily tasks, and reward yourself
              for consistency. Path makes building habits simple and rewarding.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={onGetStarted} className="group">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={onSignIn}
                disabled={loading}
                className="gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl bg-white dark:bg-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:scale-105 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${feature.color}20` }}
                >
                  <feature.icon
                    className="w-6 h-6"
                    style={{ color: feature.color }}
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Demo Preview */}
          <div className="relative max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-3xl blur-3xl" />
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 md:p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Morning Routine Challenge
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    30 days • 3 tasks
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-2xl font-bold text-primary-500">85%</div>
                  <div className="text-xs text-gray-500">complete</div>
                </div>
              </div>

              {/* Mock Heatmap */}
              <div className="flex gap-1 flex-wrap justify-center">
                {Array.from({ length: 30 }).map((_, i) => {
                  const intensity = Math.random()
                  return (
                    <div
                      key={i}
                      className="w-6 h-6 md:w-8 md:h-8 rounded-lg"
                      style={{
                        backgroundColor:
                          intensity > 0.7
                            ? "#22C55E"
                            : intensity > 0.4
                              ? "#22C55E80"
                              : intensity > 0.2
                                ? "#22C55E40"
                                : "#E5E7EB",
                      }}
                    />
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© 2025 Path. Build better habits, one day at a time.</p>
        </div>
      </footer>
    </div>
  )
}
