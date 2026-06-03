import { TOTP, Secret, URI } from 'otpauth'

const STORAGE_KEYS = {
  secret: 'tgp-auth-secret',
  session: 'tgp-auth-session',
} as const

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000

export interface AuthSession {
  token: string
  createdAt: number
  expiresAt: number
}

/* ─── Secret management ─── */

export function isConfigured(): boolean {
  return !!localStorage.getItem(STORAGE_KEYS.secret)
}

export function getSecret(): string | null {
  return localStorage.getItem(STORAGE_KEYS.secret)
}

export function clearSecret(): void {
  localStorage.removeItem(STORAGE_KEYS.secret)
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

export function confirmSetup(base32Secret: string): void {
  localStorage.setItem(STORAGE_KEYS.secret, base32Secret)
  createSession()
}

export function logout(): void {
  clearSession()
}

/* ─── Time remaining for current OTP ─── */

export function getOtpRemainingMs(): number {
  return TOTP.remaining({ period: 30 })
}
