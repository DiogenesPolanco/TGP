import { TOTP, Secret } from 'otpauth'

/* ─── Storage keys ─── */

const STORAGE_KEYS = {
  secret: 'tgp-auth-secret',
  secretIv: 'tgp-auth-secret-iv',
  secretSalt: 'tgp-auth-secret-salt',
  session: 'tgp-auth-session',
} as const

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000

/* ─── Rate limiting ─── */

const RATE_LIMIT_KEY = 'tgp-auth-attempts'

interface RateLimitState {
  count: number
  lockoutUntil: number | null
}

const RATE_LIMIT_TIERS = [
  { threshold: 10, duration: 300_000 }, // 5 min after 10 failures
  { threshold: 5, duration: 60_000 },   // 1 min after 5 failures
  { threshold: 3, duration: 30_000 },   // 30s after 3 failures
]

function getRateLimitState(): RateLimitState {
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_KEY)
    if (raw) return JSON.parse(raw) as RateLimitState
  } catch { /* ignore corrupted data */ }
  return { count: 0, lockoutUntil: null }
}

function saveRateLimitState(state: RateLimitState): void {
  sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state))
}

export function recordFailedAttempt(): { locked: boolean; remainingMs: number } {
  const state = getRateLimitState()
  state.count++

  // Find applicable lockout tier
  for (const tier of RATE_LIMIT_TIERS) {
    if (state.count >= tier.threshold) {
      state.lockoutUntil = Date.now() + tier.duration
      break
    }
  }

  saveRateLimitState(state)
  return getLockoutStatus()
}

export function getLockoutStatus(): { locked: boolean; remainingMs: number } {
  const state = getRateLimitState()

  if (state.lockoutUntil && state.lockoutUntil > Date.now()) {
    return { locked: true, remainingMs: state.lockoutUntil - Date.now() }
  }

  // Lockout expired — reset count only if we were locked out
  if (state.lockoutUntil && state.lockoutUntil <= Date.now()) {
    state.count = 0
    state.lockoutUntil = null
    saveRateLimitState(state)
  }

  return { locked: false, remainingMs: 0 }
}

export function resetRateLimit(): void {
  sessionStorage.removeItem(RATE_LIMIT_KEY)
}

/* ─── Encryption helpers (AES-GCM at rest) ─── */

async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  const fingerprint = [
    window.location.origin,
    navigator.userAgent,
  ].join('::')

  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(fingerprint),
    'PBKDF2',
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

async function encryptSecret(plaintext: string): Promise<{ ciphertext: string; iv: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(salt)
  const enc = new TextEncoder()
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext),
  )

  return {
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
    iv: btoa(String.fromCharCode(...iv)),
    salt: btoa(String.fromCharCode(...salt)),
  }
}

async function decryptSecret(ciphertext: string, iv: string, salt: string): Promise<string> {
  const key = await deriveKey(
    new Uint8Array(atob(salt).split('').map((c) => c.charCodeAt(0))),
  )
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(atob(iv).split('').map((c) => c.charCodeAt(0))),
    },
    key,
    new Uint8Array(atob(ciphertext).split('').map((c) => c.charCodeAt(0))),
  )

  return new TextDecoder().decode(decrypted)
}

/* ─── Secret management (encrypted at rest) ─── */

export interface EncryptedSecret {
  ciphertext: string
  iv: string
  salt: string
}

export function isConfigured(): boolean {
  return !!localStorage.getItem(STORAGE_KEYS.secret)
}

export async function getSecret(): Promise<string | null> {
  const raw = localStorage.getItem(STORAGE_KEYS.secret)
  const iv = localStorage.getItem(STORAGE_KEYS.secretIv)
  const salt = localStorage.getItem(STORAGE_KEYS.secretSalt)
  if (!raw || !iv || !salt) return null

  try {
    return await decryptSecret(raw, iv, salt)
  } catch {
    // If decryption fails (e.g., userAgent changed after browser update),
    // force re-setup
    clearSecret()
    return null
  }
}

export function clearSecret(): void {
  localStorage.removeItem(STORAGE_KEYS.secret)
  localStorage.removeItem(STORAGE_KEYS.secretIv)
  localStorage.removeItem(STORAGE_KEYS.secretSalt)
}

export function generateSecret(): { base32: string; uri: string } {
  const totp = new TOTP({
    issuer: 'TGP',
    label: 'Admin',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: new Secret({ size: 20 }),
  })

  return {
    base32: totp.secret.base32,
    uri: totp.toString(),
  }
}

/* ─── TOTP verification ─── */

export function verifyTotp(token: string, base32Secret: string): boolean {
  const totp = new TOTP({
    secret: Secret.fromBase32(base32Secret),
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  })

  const delta = totp.validate({ token, window: 1 })
  return delta !== null
}

/* ─── Session management ─── */

export function createSession(): AuthSession {
  const session: AuthSession = {
    token: crypto.randomUUID(),
    createdAt: Date.now(),
    expiresAt: Date.now() + SESSION_DURATION_MS,
  }
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session))
  return session
}

export function getSession(): AuthSession | null {
  const raw = localStorage.getItem(STORAGE_KEYS.session)
  if (!raw) return null

  try {
    const session = JSON.parse(raw) as AuthSession
    if (session.expiresAt < Date.now()) {
      clearSession()
      return null
    }
    return session
  } catch {
    clearSession()
    return null
  }
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.session)
}

export async function confirmSetup(base32Secret: string): Promise<void> {
  const encrypted = await encryptSecret(base32Secret)
  localStorage.setItem(STORAGE_KEYS.secret, encrypted.ciphertext)
  localStorage.setItem(STORAGE_KEYS.secretIv, encrypted.iv)
  localStorage.setItem(STORAGE_KEYS.secretSalt, encrypted.salt)
  resetRateLimit()
  createSession()
}

export function logout(): void {
  clearSession()
}

/* ─── Time remaining for current OTP ─── */

export function getOtpRemainingMs(): number {
  return TOTP.remaining({ period: 30 })
}

export interface AuthSession {
  token: string
  createdAt: number
  expiresAt: number
}
