/**
 * Client-side encryption utilities for API keys
 * Uses Web Crypto API with AES-GCM for secure encryption
 */

// Salt used for key derivation (can be public, just needs to be consistent)
const SALT = "path-app-api-key-encryption-v1"

/**
 * Derives an encryption key from the user's ID
 * @param {string} userId - The user's unique ID
 * @returns {Promise<CryptoKey>} - The derived encryption key
 */
async function deriveKey(userId) {
  const encoder = new TextEncoder()

  // Import the user ID as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(userId),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  )

  // Derive the actual encryption key
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(SALT),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

/**
 * Encrypts data using AES-GCM
 * @param {string} plainText - The plain text to encrypt
 * @param {string} userId - The user's unique ID
 * @returns {Promise<string>} - Base64 encoded encrypted data (iv + ciphertext)
 */
export async function encryptData(plainText, userId) {
  if (!plainText) return null

  const encoder = new TextEncoder()
  const key = await deriveKey(userId)

  // Generate a random IV for each encryption
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // Encrypt the data
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plainText)
  )

  // Combine IV + ciphertext and encode as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv)
  combined.set(new Uint8Array(encrypted), iv.length)

  // Add a prefix to identify encrypted values
  return "encrypted:" + btoa(String.fromCharCode(...combined))
}

/**
 * Decrypts data using AES-GCM
 * @param {string} encryptedData - Base64 encoded encrypted data with "encrypted:" prefix
 * @param {string} userId - The user's unique ID
 * @returns {Promise<string>} - The decrypted text
 */
export async function decryptData(encryptedData, userId) {
  if (!encryptedData) return null

  // If not encrypted (legacy plain text), return as-is
  if (!encryptedData.startsWith("encrypted:")) {
    return encryptedData
  }

  try {
    const key = await deriveKey(userId)

    // Remove prefix and decode base64
    const base64Data = encryptedData.slice("encrypted:".length)
    const combined = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0))

    // Extract IV (first 12 bytes) and ciphertext (rest)
    const iv = combined.slice(0, 12)
    const ciphertext = combined.slice(12)

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    )

    return new TextDecoder().decode(decrypted)
  } catch (error) {
    console.error("Failed to decrypt data:", error)
    // Return the original data on failure (fallback) instead of null to avoid UI crashing on partial failures?
    // Actually, if it's encrypted but fails to decrypt, showing ciphertext is ugly.
    // Returning null is safer for logic, but might blank out fields.
    // Let's return original string if decryption fails, assuming it might not be encrypted correctly?
    // User requested "my supabase can see nothing". If I return null, data is lost in UI.
    // If I return original, UI shows "encrypted:...".
    // I'll stick to returning null or throwing?
    // Existing code returned null. I'll stick to null for consistency, but maybe I should return original for partial fails?
    // No, existing code returns null.
    return null
  }
}

// Legacy exports for backward compatibility if needed, or aliases
export const encryptApiKey = encryptData
export const decryptApiKey = decryptData

/**
 * Checks if a value is encrypted
 * @param {string} value - The value to check
 * @returns {boolean} - True if encrypted
 */
export function isEncrypted(value) {
  return value?.startsWith("encrypted:")
}
