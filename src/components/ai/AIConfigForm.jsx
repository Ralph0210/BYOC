import { useState, useEffect, useRef } from "react"
import { useAIConfig } from "../../hooks/useAIConfig"
import { PERSONALITY_PRESETS } from "../../lib/ai/personalities"
import { PROVIDERS } from "../../lib/ai/providers"
import { listModels } from "../../lib/ai/client"
import { PersonalityPicker } from "./PersonalityPicker"
import { supabase } from "../../lib/supabase"
import {
  Sparkles,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  Settings,
  Key,
  Cpu,
  User,
  Camera,
  X,
  Loader2,
} from "lucide-react"

const MAX_FILE_SIZE = 2 * 1024 * 1024 // 2MB

export function AIConfigForm() {
  const { config, updateConfig, loading } = useAIConfig()
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fetchingModels, setFetchingModels] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [message, setMessage] = useState(null)
  const [availableModels, setAvailableModels] = useState([])
  const [isEditing, setIsEditing] = useState(true)
  const [photoPreview, setPhotoPreview] = useState(null)
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    provider: "openai",
    api_key: "",
    model: "gpt-4o-mini",
    personality_preset: "warm_encourager",
    custom_instructions: "",
    companion_name: "",
    companion_photo_url: "",
  })

  // Sync with config when loaded
  useEffect(() => {
    if (config) {
      setFormData((prev) => ({
        ...prev,
        provider: config.provider || "openai",
        api_key: config.api_key || "",
        model: config.model || "gpt-4o-mini",
        personality_preset: config.personality_preset || "warm_encourager",
        custom_instructions: config.custom_instructions || "",
        companion_name: config.companion_name || "",
        companion_photo_url: config.companion_photo_url || "",
      }))
      setPhotoPreview(config.companion_photo_url || null)

      if (config.api_key) {
        setIsEditing(false)
      }
    }
  }, [config])

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setMessage({ type: "error", text: "Image must be less than 2MB" })
      return
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please upload an image file" })
      return
    }

    setUploadingPhoto(true)
    setMessage(null)

    try {
      // Create preview immediately
      const previewUrl = URL.createObjectURL(file)
      setPhotoPreview(previewUrl)

      // Get user ID for unique file path
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("Please sign in to upload a photo")
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop()
      const fileName = `companion_${user.id}_${Date.now()}.${fileExt}`
      const filePath = `companion-avatars/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        })

      if (error) throw error

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)

      setFormData((prev) => ({
        ...prev,
        companion_photo_url: urlData.publicUrl,
      }))
      setPhotoPreview(urlData.publicUrl)
      setMessage({ type: "success", text: "Photo uploaded!" })
    } catch (err) {
      console.error("Upload error:", err)
      setMessage({
        type: "error",
        text: err.message || "Failed to upload photo",
      })
      setPhotoPreview(formData.companion_photo_url || null)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = () => {
    setFormData((prev) => ({ ...prev, companion_photo_url: "" }))
    setPhotoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleFetchModels = async () => {
    if (!formData.api_key) {
      setMessage({ type: "error", text: "Please enter an API Key first." })
      return
    }
    setFetchingModels(true)
    setMessage(null)
    try {
      const models = await listModels(formData)
      if (models.length > 0) {
        setAvailableModels(models)
        setMessage({ type: "success", text: `Found ${models.length} models.` })
      } else {
        setMessage({ type: "error", text: "No models found or key invalid." })
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to fetch models." })
    } finally {
      setFetchingModels(false)
    }
  }

  const defaultModels =
    PROVIDERS.find((p) => p.id === formData.provider)?.models || []
  const currentOptions =
    availableModels.length > 0 ? availableModels : defaultModels

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      await updateConfig(formData)
      setMessage({ type: "success", text: "Settings saved successfully." })
      setTimeout(() => setIsEditing(false), 800)
    } catch (err) {
      console.error("Save error details:", err)
      const errorText =
        err?.message ||
        err?.details ||
        "Failed to save settings. Check console for details."
      setMessage({ type: "error", text: errorText })
    } finally {
      setSaving(false)
    }
  }

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Sparkles className="w-8 h-8 text-primary animate-pulse" />
        <p className="text-sm text-tertiary">Connecting to Neural Core...</p>
      </div>
    )

  // VIEW MODE (Connected Dashboard - Single Card Design)
  if (!isEditing && config?.api_key) {
    const providerName =
      PROVIDERS.find((p) => p.id === config.provider)?.name || config.provider
    const personalityName =
      PERSONALITY_PRESETS[config.personality_preset]?.name || "Custom"
    const companionName = config.companion_name || "Companion"

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Single Card Design */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 border border-primary/10">
          {/* Ambient Glow Effect */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative p-6">
            {/* Hero Section - Avatar Centered */}
            <div className="flex flex-col items-center text-center mb-6">
              {/* Large Avatar */}
              <div className="relative mb-4">
                {config.companion_photo_url ? (
                  <img
                    src={config.companion_photo_url}
                    alt={companionName}
                    className="w-24 h-24 rounded-full object-cover ring-4 ring-white dark:ring-surface-dark shadow-xl"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-xl ring-4 ring-white dark:ring-surface-dark">
                    <Sparkles className="w-10 h-10" />
                  </div>
                )}
                {/* Online Indicator */}
                <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500 border-3 border-white dark:border-surface-dark shadow-lg" />
              </div>

              {/* Name & Status */}
              <h2 className="text-xl font-bold text-primary">
                {companionName}
              </h2>
              <p className="text-sm text-secondary mt-1">{personalityName}</p>
            </div>

            {/* Minimal Info Row */}
            <div className="flex items-center justify-center gap-4 py-3 border-t border-primary/10">
              <div className="flex items-center gap-1.5 text-xs text-tertiary">
                <Cpu className="w-3.5 h-3.5" />
                <span>{providerName}</span>
              </div>
              <div className="w-px h-3 bg-primary/20" />
              <div className="text-xs text-tertiary font-mono">
                {config.model}
              </div>
            </div>

            {/* Configure Button */}
            <button
              onClick={() => setIsEditing(true)}
              className="w-full mt-4 py-2.5 rounded-xl bg-white/50 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-primary/10 text-sm font-medium text-secondary hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Configure
            </button>
          </div>
        </div>
      </div>
    )
  }

  // EDIT MODE (Form)
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="border-b pb-4 dark:border-white/10 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">AI Configuration</h3>
          <p className="text-sm text-tertiary">Connect your own AI provider.</p>
        </div>
        {config?.api_key && (
          <button
            onClick={() => setIsEditing(false)}
            className="text-xs text-secondary hover:text-primary"
          >
            Cancel
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Companion Identity Section */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-primary/5 to-purple-500/5 border border-primary/10 space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Companion Identity
          </h4>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Photo Upload */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative group">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Companion"
                      className="w-20 h-20 rounded-full object-cover ring-2 ring-primary/20"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <label className="w-20 h-20 rounded-full bg-surface-light dark:bg-white/10 border-2 border-dashed border-primary/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
                    {uploadingPhoto ? (
                      <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-tertiary" />
                        <span className="text-[10px] text-tertiary mt-1">
                          Upload
                        </span>
                      </>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploadingPhoto}
                    />
                  </label>
                )}
              </div>
              <p className="text-[10px] text-tertiary">Max 2MB</p>
            </div>

            {/* Companion Name */}
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1 text-secondary">
                Name
              </label>
              <input
                type="text"
                value={formData.companion_name}
                onChange={(e) =>
                  setFormData({ ...formData, companion_name: e.target.value })
                }
                className="w-full p-2.5 rounded-lg border dark:border-white/10 bg-white dark:bg-black/20 text-sm"
                placeholder="e.g., Sage, Buddy, Coach..."
              />
              <p className="text-xs text-tertiary mt-2">
                Give your AI companion a name to make it feel more personal.
              </p>
            </div>
          </div>
        </div>

        {/* Provider */}
        <div>
          <label className="block text-sm font-medium mb-1">Provider</label>
          <select
            value={formData.provider}
            onChange={(e) => {
              setFormData({ ...formData, provider: e.target.value })
              setAvailableModels([])
            }}
            className="w-full p-2 rounded-lg border dark:border-white/10 bg-transparent"
          >
            {PROVIDERS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">API Key</label>
            {formData.provider === "grok" && (
              <a
                href="https://console.x.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                Get key <ExternalLink className="w-3 h-3" />
              </a>
            )}
            {formData.provider === "openai" && (
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                Get key <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Key className="h-4 w-4 text-tertiary" />
            </div>
            <input
              type={showKey ? "text" : "password"}
              value={formData.api_key}
              onChange={(e) =>
                setFormData({ ...formData, api_key: e.target.value })
              }
              className="w-full pl-10 p-2 rounded-lg border dark:border-white/10 bg-transparent pr-10"
              placeholder="sk-..."
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-2 text-tertiary hover:text-primary text-xs"
            >
              {showKey ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        {/* Model */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium">Model</label>
            <button
              type="button"
              onClick={handleFetchModels}
              disabled={fetchingModels || !formData.api_key}
              className="text-xs flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3 h-3 ${fetchingModels ? "animate-spin" : ""}`}
              />
              {fetchingModels ? "Loading..." : "Load from Key"}
            </button>
          </div>
          <input
            list="model-options"
            value={formData.model}
            onChange={(e) =>
              setFormData({ ...formData, model: e.target.value })
            }
            className="w-full p-2 rounded-lg border dark:border-white/10 bg-transparent"
            placeholder="Select or type model name..."
          />
          <datalist id="model-options">
            {currentOptions.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
        </div>

        {/* Personality Presets */}
        <div>
          <label className="block text-sm font-medium mb-1">Personality</label>
          <PersonalityPicker
            value={formData.personality_preset}
            onChange={(val) =>
              setFormData({ ...formData, personality_preset: val })
            }
          />
        </div>

        {/* Custom Instructions */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Custom Instructions
          </label>
          <textarea
            value={formData.custom_instructions}
            onChange={(e) =>
              setFormData({ ...formData, custom_instructions: e.target.value })
            }
            className="w-full p-3 rounded-lg border dark:border-white/10 bg-transparent text-sm min-h-[80px]"
            placeholder="E.g., Speak like a wise mentor, never mention my calorie counting..."
          />
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
              message.type === "success"
                ? "bg-green-500/10 text-green-600"
                : "bg-red-500/10 text-red-600"
            }`}
          >
            {message.type === "success" && <CheckCircle className="w-4 h-4" />}
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary text-white py-2.5 rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 shadow-lg shadow-primary/20"
        >
          {saving ? "Saving Configuration..." : "Save Configuration"}
        </button>
      </form>
    </div>
  )
}
