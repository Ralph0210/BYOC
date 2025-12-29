import {
  ArrowRight,
  Sparkles,
  Key,
  Shield,
  Heart,
  Palette,
  Gift,
  Calendar,
  Check,
} from "lucide-react"
import { Button } from "../ui/Button"

import logo from "../../assets/byoc-logo.png"

export function LandingPage({
  onGetStarted,
  onSignIn,
  loading,
  onViewPrivacy,
}) {
  // Pre-generated heatmap data for consistency
  const heatmapData = [
    1, 1, 0.8, 1, 0.6, 0, 0.9, 1, 1, 0.7, 1, 0.5, 1, 1, 0.8, 1, 1, 0.9, 0, 0.4,
    1, 1, 1, 0.7, 1, 0.8, 1, 1, 0.6, 1,
  ]

  return (
    <div className="min-h-screen bg-app">
      {/* Header */}
      <header className="px-6 py-5 border-b border-app sticky top-0 bg-app/80 backdrop-blur-lg z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="BYOC" className="w-9 h-9 rounded-xl" />
            <span className="text-xl font-bold tracking-tight text-primary">
              BYOC
            </span>
          </div>
          <Button variant="ghost" onClick={onSignIn} disabled={loading}>
            Sign In
          </Button>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="px-6 py-24 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-semibold mb-8">
              <Sparkles className="w-4 h-4" />
              Bring Your Own Companion
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-8 leading-[1.15] tracking-tight">
              The AI habit tracker
              <br />
              <span className="text-primary-500">
                that doesn't cost $20/month.
              </span>
            </h1>

            <p className="text-lg text-secondary mb-10 max-w-lg mx-auto leading-relaxed">
              Other AI companions charge subscriptions. BYOC lets you use your
              own API key—so you pay cents, not dollars.
            </p>

            <Button size="lg" onClick={onSignIn} className="group">
              Get Started — It's Free
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Button>

            <p className="text-xs text-tertiary mt-5">
              No credit card. Just your OpenAI, Anthropic, or Gemini key.
            </p>
          </div>
        </section>

        {/* Why BYOK Section */}
        <section className="px-6 py-24 bg-surface-light dark:bg-surface-dark">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
                Why Bring Your Own Key?
              </h2>
              <p className="text-secondary max-w-md mx-auto">
                AI subscriptions add up. We believe you should own your tools.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Card 1 - Green accent */}
              <div className="p-8 rounded-3xl bg-white dark:bg-gray-800/50 border border-app">
                <div className="w-12 h-12 rounded-2xl bg-task-green/10 flex items-center justify-center mb-6">
                  <Key className="w-6 h-6 text-task-green" />
                </div>
                <h3 className="font-semibold text-primary text-lg mb-3">
                  Pay What You Use
                </h3>
                <p className="text-secondary leading-relaxed">
                  A typical month costs under $1. Compare that to $20/month
                  subscriptions for similar AI features.
                </p>
              </div>

              {/* Card 2 - Purple accent */}
              <div className="p-8 rounded-3xl bg-white dark:bg-gray-800/50 border border-app">
                <div className="w-12 h-12 rounded-2xl bg-task-purple/10 flex items-center justify-center mb-6">
                  <Shield className="w-6 h-6 text-task-purple" />
                </div>
                <h3 className="font-semibold text-primary text-lg mb-3">
                  100% Private & Encrypted
                </h3>
                <p className="text-secondary leading-relaxed">
                  Everything—your API keys, challenges, and tasks—is encrypted
                  before it touches our database. We literally cannot read your
                  data.
                </p>
              </div>

              {/* Card 3 - Teal accent */}
              <div className="p-8 rounded-3xl bg-white dark:bg-gray-800/50 border border-app">
                <div className="w-12 h-12 rounded-2xl bg-task-teal/10 flex items-center justify-center mb-6">
                  <Palette className="w-6 h-6 text-task-teal" />
                </div>
                <h3 className="font-semibold text-primary text-lg mb-3">
                  Pick Your Model
                </h3>
                <p className="text-secondary leading-relaxed">
                  GPT-4o, Claude, Gemini—use whatever you prefer. Switch
                  anytime. No lock-in.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Companion Section */}
        <section className="px-6 py-28">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-task-pink/10 text-task-pink text-xs font-semibold mb-6">
                  <Heart className="w-3.5 h-3.5" />
                  AI Companion
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6 leading-snug">
                  More than reminders.
                  <br />
                  <span className="text-task-pink">Real support.</span>
                </h2>
                <p className="text-secondary mb-8 leading-relaxed">
                  Your companion learns your patterns. It notices when you're on
                  a streak, and when you're struggling. It speaks in a voice you
                  choose.
                </p>
                <ul className="space-y-4">
                  {[
                    "Choose from 4 personalities or create your own",
                    "Context-aware encouragement based on your progress",
                    "Remembers what you've shared across sessions",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 text-secondary"
                    >
                      <Check className="w-5 h-5 text-task-green mt-0.5 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Chat Preview */}
              <div className="bg-surface-light dark:bg-surface-dark rounded-3xl border border-app p-6 space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-app">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-task-pink to-task-purple flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-primary">Companion</p>
                    <p className="text-xs text-tertiary">Warm Encourager</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm p-4 max-w-[85%] shadow-sm">
                    <p className="text-sm text-primary leading-relaxed">
                      Day 12 already. You've shown up more this week than
                      last—momentum is real.
                    </p>
                  </div>
                  <div className="bg-primary-500 text-white rounded-2xl rounded-tr-sm p-4 max-w-[85%] ml-auto shadow-sm">
                    <p className="text-sm leading-relaxed">
                      Honestly feeling a bit off today.
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-sm p-4 max-w-[85%] shadow-sm">
                    <p className="text-sm text-primary leading-relaxed">
                      That's okay. Some days are like that. Show up small
                      today—one task is still progress.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="px-6 py-24 bg-surface-light dark:bg-surface-dark">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-3xl font-bold text-primary mb-4">
                Everything you need to build habits.
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
              {/* Rewards */}
              <div className="p-8 rounded-3xl bg-white dark:bg-gray-800/50 border border-app">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-task-orange/10 flex items-center justify-center">
                    <Gift className="w-6 h-6 text-task-orange" />
                  </div>
                  <h3 className="font-semibold text-primary text-lg">
                    Reward Yourself
                  </h3>
                </div>
                <p className="text-secondary mb-6 leading-relaxed">
                  Set a reward for each challenge. Complete 21 days of reading?
                  New headphones. The goal is tangible.
                </p>
                <div className="p-4 rounded-2xl bg-task-orange/5 border border-task-orange/20">
                  <p className="text-xs text-task-orange font-medium mb-1.5">
                    Reward for "Morning Routine"
                  </p>
                  <p className="font-semibold text-primary">
                    🎧 Nice dinner at that new place
                  </p>
                </div>
              </div>

              {/* Heatmap */}
              <div className="p-8 rounded-3xl bg-white dark:bg-gray-800/50 border border-app">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-task-indigo/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-task-indigo" />
                  </div>
                  <h3 className="font-semibold text-primary text-lg">
                    Visual Progress
                  </h3>
                </div>
                <p className="text-secondary mb-6 leading-relaxed">
                  A heatmap shows your consistency at a glance. The more color,
                  the stronger the habit.
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {heatmapData.map((intensity, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-lg"
                      style={{
                        backgroundColor:
                          intensity > 0.8
                            ? "#5856D6"
                            : intensity > 0.5
                              ? "#8E8AE9"
                              : intensity > 0.2
                                ? "#C7C5F4"
                                : "#F2F2F7",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 py-28">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-primary mb-6">
              Stop paying for AI subscriptions.
            </h2>
            <p className="text-secondary mb-10 leading-relaxed">
              BYOC gives you the same features—companion support, rewards, and
              progress tracking—without the monthly fee. Just bring your API
              key.
            </p>
            <Button size="lg" onClick={onSignIn} className="group">
              Start Free
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-app">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src="/byoc-logo.png" alt="BYOC" className="w-4 h-4" />
            <span className="font-semibold text-primary">BYOC</span>
          </div>
          <p className="text-xs text-tertiary">
            © 2025 BYOC. Built for people who own their tools.
          </p>
          <div className="flex gap-5 text-xs text-tertiary">
            <button
              onClick={onViewPrivacy}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Privacy
            </button>
            <a href="#" className="hover:text-primary transition-colors">
              Open Source
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
