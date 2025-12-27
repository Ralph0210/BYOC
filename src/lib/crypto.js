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
 * Encrypts an API key
 * @param {string} plainText - The plain text API key
 * @param {string} userId - The user's unique ID
 * @returns {Promise<string>} - Base64 encoded encrypted data (iv + ciphertext)
 */
export async function encryptApiKey(plainText, userId) {
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
 * Decrypts an API key
 * @param {string} encryptedData - Base64 encoded encrypted data with "encrypted:" prefix
 * @param {string} userId - The user's unique ID
 * @returns {Promise<string>} - The decrypted API key
 */
export async function decryptApiKey(encryptedData, userId) {
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
    console.error("Failed to decrypt API key:", error)
    // Return null on decryption failure (corrupted or wrong key)
    return null
  }
}

/**
 * Checks if an API key is encrypted
 * @param {string} apiKey - The API key to check
 * @returns {boolean} - True if encrypted
 */
export function isEncrypted(apiKey) {
  return apiKey?.startsWith("encrypted:")
}
