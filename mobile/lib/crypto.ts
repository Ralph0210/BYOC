/**
 * Crypto utilities for encrypting/decrypting sensitive data
 * Uses crypto-js (pure JavaScript) for cross-platform compatibility
 *
 * Note: crypto-js doesn't support AES-GCM natively, so we use AES with
 * PBKDF2 key derivation. The format is: "encrypted:" + base64(salt + iv + ciphertext)
 */

import CryptoJS from "crypto-js"

// Salt used for key derivation (must match across platforms)
const SALT_PREFIX = "path-app-crypto-v2"
const ITERATIONS = 10000 // Lower than before for JS performance
const KEY_SIZE = 256 / 32 // 256 bits = 8 words
const IV_SIZE = 128 / 32 // 128 bits = 4 words

/**
 * Checks if a value is encrypted (has "encrypted:" prefix)
 */
export function isEncrypted(value: string | null | undefined): boolean {
  return value?.startsWith("encrypted:") ?? false
}

/**
 * Derives an encryption key from the user's ID using PBKDF2
 */
function deriveKey(
  userId: string,
  salt: CryptoJS.lib.WordArray
): CryptoJS.lib.WordArray {
  return CryptoJS.PBKDF2(userId, salt, {
    keySize: KEY_SIZE,
    iterations: ITERATIONS,
    hasher: CryptoJS.algo.SHA256,
  })
}

/**
 * Encrypts data using AES-256 with PBKDF2 key derivation
 *
 * @param plainText - The plain text to encrypt
 * @param userId - The user's unique ID (used to derive encryption key)
 * @returns Encrypted string with "encrypted:" prefix, or null if input is null
 */
export async function encryptData(
  plainText: string | null | undefined,
  userId: string
): Promise<string | null> {
  if (!plainText) return null

  try {
    // Generate random salt and IV
    const salt = CryptoJS.lib.WordArray.random(16) // 128 bits
    const iv = CryptoJS.lib.WordArray.random(16) // 128 bits

    // Derive key from user ID and salt
    const key = deriveKey(
      userId,
      CryptoJS.enc.Utf8.parse(SALT_PREFIX).concat(salt)
    )

    // Encrypt
    const encrypted = CryptoJS.AES.encrypt(plainText, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    })

    // Combine salt + iv + ciphertext
    const combined = salt.concat(iv).concat(encrypted.ciphertext)

    return "encrypted:" + CryptoJS.enc.Base64.stringify(combined)
  } catch (error) {
    console.error("Failed to encrypt data:", error)
    return null
  }
}

/**
 * Decrypts data encrypted by encryptData
 *
 * @param encryptedData - Encrypted string with "encrypted:" prefix
 * @param userId - The user's unique ID (used to derive decryption key)
 * @returns The decrypted plaintext, or null if decryption fails
 */
export async function decryptData(
  encryptedData: string | null | undefined,
  userId: string
): Promise<string | null> {
  if (!encryptedData) return null

  // If not encrypted (legacy plain text), return as-is
  if (!encryptedData.startsWith("encrypted:")) {
    return encryptedData
  }

  try {
    // Remove prefix and decode base64
    const base64Data = encryptedData.slice("encrypted:".length)
    const combined = CryptoJS.enc.Base64.parse(base64Data)

    // Extract salt (first 16 bytes / 4 words)
    const salt = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4), 16)

    // Extract IV (next 16 bytes / 4 words)
    const iv = CryptoJS.lib.WordArray.create(combined.words.slice(4, 8), 16)

    // Extract ciphertext (remaining bytes)
    const ciphertext = CryptoJS.lib.WordArray.create(
      combined.words.slice(8),
      combined.sigBytes - 32
    )

    // Derive key from user ID and salt
    const key = deriveKey(
      userId,
      CryptoJS.enc.Utf8.parse(SALT_PREFIX).concat(salt)
    )

    // Decrypt
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext: ciphertext } as CryptoJS.lib.CipherParams,
      key,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    )

    const plainText = decrypted.toString(CryptoJS.enc.Utf8)

    if (!plainText) {
      console.warn("[crypto] Decryption produced empty result")
      return null
    }

    return plainText
  } catch (error) {
    console.error("Failed to decrypt data:", error)
    return null
  }
}
