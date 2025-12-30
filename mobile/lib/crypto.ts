/**
 * Crypto utilities for decrypting AI config data
 * Matches web app encryption format: PBKDF2 + AES-GCM
 *
 * Uses react-native-quick-crypto for native crypto operations.
 */

import QuickCrypto from "react-native-quick-crypto"
import { Buffer } from "buffer"

// Salt used for key derivation (must match web app)
const SALT = "path-app-api-key-encryption-v1"
const ITERATIONS = 100000
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 12

/**
 * Checks if a value is encrypted (has "encrypted:" prefix)
 */
export function isEncrypted(value: string | null | undefined): boolean {
  return value?.startsWith("encrypted:") ?? false
}

/**
 * Derives an encryption key from the user's ID using PBKDF2
 */
async function deriveKey(userId: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    QuickCrypto.pbkdf2(
      userId,
      SALT,
      ITERATIONS,
      KEY_LENGTH,
      "sha256",
      (err, derivedKey) => {
        if (err) {
          reject(err)
        } else {
          resolve(Buffer.from(derivedKey as ArrayBuffer))
        }
      }
    )
  })
}

/**
 * Decrypts data encrypted by the web app using AES-256-GCM
 *
 * @param encryptedData - Base64 encoded encrypted data with "encrypted:" prefix
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
    // Remove "encrypted:" prefix and decode base64
    const base64Data = encryptedData.slice("encrypted:".length)
    const combined = Buffer.from(base64Data, "base64")

    // Extract IV (first 12 bytes) and ciphertext+tag (rest)
    const iv = combined.subarray(0, IV_LENGTH)
    const ciphertextWithTag = combined.subarray(IV_LENGTH)

    // Derive the decryption key
    const key = await deriveKey(userId)

    // Create decipher with AES-256-GCM
    const decipher = QuickCrypto.createDecipheriv("aes-256-gcm", key, iv)

    // Set the auth tag (last 16 bytes of ciphertext)
    const tagLength = 16
    const ciphertext = ciphertextWithTag.subarray(
      0,
      ciphertextWithTag.length - tagLength
    )
    const authTag = ciphertextWithTag.subarray(
      ciphertextWithTag.length - tagLength
    )
    decipher.setAuthTag(authTag)

    // Decrypt
    let decrypted = decipher.update(ciphertext, undefined, "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("Failed to decrypt data:", error)
    return null
  }
}

/**
 * Encrypts data using AES-256-GCM (for mobile-originated data)
 *
 * Note: For cross-platform compatibility, we encrypt with the same format as web.
 *
 * @param plainText - The plain text to encrypt
 * @param userId - The user's unique ID
 * @returns Base64 encoded encrypted data with "encrypted:" prefix
 */
export async function encryptData(
  plainText: string | null | undefined,
  userId: string
): Promise<string | null> {
  if (!plainText) return null

  try {
    // Derive the encryption key
    const key = await deriveKey(userId)

    // Generate random IV
    const iv = Buffer.from(QuickCrypto.randomBytes(IV_LENGTH))

    // Create cipher with AES-256-GCM
    const cipher = QuickCrypto.createCipheriv("aes-256-gcm", key, iv)

    // Encrypt the data
    let encrypted = cipher.update(plainText, "utf8")
    const final = cipher.final()
    encrypted = Buffer.concat([Buffer.from(encrypted), Buffer.from(final)])

    // Get the auth tag
    const authTag = Buffer.from(cipher.getAuthTag())

    // Combine IV + ciphertext + authTag
    const combined = Buffer.concat([iv, encrypted, authTag])

    // Return with prefix
    return "encrypted:" + combined.toString("base64")
  } catch (error) {
    console.error("Failed to encrypt data:", error)
    return null
  }
}
