import { ArrowLeft, Shield, Lock, Eye, Server, UserCheck } from "lucide-react"
import { Button } from "../ui/Button"
import logo from "../../assets/byoc-logo.png"

export function PrivacyPolicyPage({ onBack }) {
  return (
    <div className="min-h-screen bg-app">
      {/* Header */}
      <header className="px-6 py-5 border-b border-app sticky top-0 bg-app/80 backdrop-blur-lg z-50">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="BYOC" className="w-9 h-9 rounded-xl" />
            <span className="text-xl font-bold tracking-tight text-primary">
              BYOC
            </span>
          </div>
          <Button variant="ghost" onClick={onBack} icon={ArrowLeft}>
            Back
          </Button>
        </div>
      </header>

      <main className="px-6 py-12 md:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-sm font-semibold mb-6">
              <Shield className="w-4 h-4" />
              Privacy Policy
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Your Data, Your Control
            </h1>
            <p className="text-lg text-secondary">
              Last Updated: December 27, 2025
            </p>
          </div>

          <div className="space-y-12 text-primary leading-relaxed">
            <section className="prose dark:prose-invert max-w-none">
              <p className="text-lg text-secondary leading-relaxed">
                At BYOC, we believe that your habits and personal challenges are
                yours alone. We operate on a{" "}
                <strong>"Data Minimization"</strong> principle. We only store
                the absolute minimum information required to make the
                application function.
              </p>
            </section>

            <section className="grid gap-8 md:grid-cols-2">
              <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-app">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                  <Lock className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold mb-2">
                  Total Content Encryption
                </h3>
                <p className="text-sm text-secondary">
                  We don't just encrypt your API keys. Your **Challenges, Tasks,
                  and AI Personality** settings are all encrypted with AES-256
                  before they touch our database. We store them as unreadable
                  ciphertext. We literally cannot see your goals or habits.
                </p>
              </div>

              <div className="bg-surface-light dark:bg-surface-dark p-6 rounded-2xl border border-app">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                  <UserCheck className="w-5 h-5 text-green-500" />
                </div>
                <h3 className="text-lg font-bold mb-2">Authenticated Access</h3>
                <p className="text-sm text-secondary">
                  We use Row Level Security (RLS) to physically prevent access.
                  Your data is tied to your unique authenticated ID. The
                  database rejects any request for your data that doesn't come
                  from you.
                </p>
              </div>
            </section>

            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-tertiary" />
                  Data We Collect
                </h2>
                <ul className="list-disc pl-5 space-y-2 text-secondary">
                  <li>
                    <strong>Identity:</strong> Email, Display Name, Profile
                    Picture (from Google Auth).
                  </li>
                  <li>
                    <strong>Content (Stored Encrypted):</strong> Challenges,
                    Tasks, and Completion History you create.
                  </li>
                  <li>
                    <strong>Preferences (Stored Encrypted):</strong> Theme
                    settings and AI personality configuration.
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Server className="w-5 h-5 text-tertiary" />
                  Third-Party Services
                </h2>
                <p className="text-secondary mb-3">
                  We rely on trusted infrastructure:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-secondary">
                  <li>
                    <strong>Supabase:</strong> Backend-as-a-Service (Database &
                    Auth).
                  </li>
                  <li>
                    <strong>Vercel:</strong> Frontend hosting and deployment.
                  </li>
                  <li>
                    <strong>AI Providers:</strong> Direct requests to
                    OpenAI/Anthropic/Google using your key.
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-8 border-t border-app text-center">
              <p className="text-secondary mb-6">
                You have the right to delete your account and all associated
                data at any time.
              </p>
              <Button onClick={onBack}>Return to Home</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
