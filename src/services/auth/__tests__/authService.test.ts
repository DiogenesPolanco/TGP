import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  isConfigured,
  generateSecret,
  verifyTotp,
  getSession,
  clearSession,
  createSession,
  getOtpRemainingMs,
  recordFailedAttempt,
  getLockoutStatus,
  resetRateLimit,
  logout,
  clearSecret,
  confirmSetup,
  getSecret,
} from '../authService'

// --- Mocks ---

const mockLocalStorage = new Map<string, string>()
const mockSessionStorage = new Map<string, string>()

beforeEach(() => {
  mockLocalStorage.clear()
  mockSessionStorage.clear()
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
    return mockLocalStorage.get(key) ?? mockSessionStorage.get(key) ?? null
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
    mockLocalStorage.set(key, value)
  })
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
    mockLocalStorage.delete(key)
    mockSessionStorage.delete(key)
  })
  // Mock crypto.randomUUID
  vi.spyOn(crypto, 'randomUUID').mockReturnValue('00000000-0000-0000-0000-000000000000')
  // Mock Date.now for deterministic tests
  vi.useFakeTimers({ now: 1_700_000_000_000 })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

// ─── isConfigured ──────────────────────────────────────────────────────

describe('isConfigured', () => {
  it('returns false when no secret stored', () => {
    expect(isConfigured()).toBe(false)
  })

  it('returns true when secret exists', () => {
    mockLocalStorage.set('tgp-auth-secret', 'some-secret')
    expect(isConfigured()).toBe(true)
  })
})

// ─── generateSecret ────────────────────────────────────────────────────

describe('generateSecret', () => {
  it('returns base32 and uri', () => {
    const result = generateSecret()

    expect(result).toHaveProperty('base32')
    expect(result).toHaveProperty('uri')
    expect(typeof result.base32).toBe('string')
    expect(result.base32.length).toBeGreaterThan(0)
    expect(typeof result.uri).toBe('string')
    expect(result.uri).toContain('otpauth://totp/')
    expect(result.uri).toContain('TGP')
  })
})

// ─── verifyTotp ────────────────────────────────────────────────────────

describe('verifyTotp', () => {
  it('returns false for invalid token', () => {
    const secret = generateSecret()
    const result = verifyTotp('000000', secret.base32)
    expect(result).toBe(false)
  })

  it('returns false for empty token', () => {
    const secret = generateSecret()
    expect(verifyTotp('', secret.base32)).toBe(false)
  })

  it('throws for malformed secret', () => {
    expect(() => verifyTotp('123456', 'INVALID_BASE32!!!')).toThrow()
  })
})

// ─── Session Management ────────────────────────────────────────────────

describe('session management', () => {
  it('createSession stores session and returns it', () => {
    const session = createSession(1)

    expect(session).toHaveProperty('token')
    expect(session).toHaveProperty('createdAt', 1_700_000_000_000)
    expect(session).toHaveProperty('expiresAt', 1_700_000_000_000 + 3_600_000)
    expect(session.token).toBe('00000000-0000-0000-0000-000000000000')
  })

  it('getSession returns session when valid', () => {
    createSession(1)
    const session = getSession()
    expect(session).not.toBeNull()
    expect(session!.token).toBe('00000000-0000-0000-0000-000000000000')
  })

  it('getSession returns null when no session exists', () => {
    expect(getSession()).toBeNull()
  })

  it('getSession returns null when session expired', () => {
    createSession(1)
    // Advance past expiry
    vi.advanceTimersByTime(3_600_001)
    const session = getSession()
    expect(session).toBeNull()
  })

  it('clearSession removes session', () => {
    createSession(1)
    clearSession()
    expect(getSession()).toBeNull()
  })

  it('logout clears session', () => {
    createSession(1)
    logout()
    expect(getSession()).toBeNull()
  })

  it('createSession clamps interval between 1 and 720 hours', () => {
    const minSession = createSession(0)
    expect(minSession.expiresAt).toBe(1_700_000_000_000 + 3_600_000) // 1 hour min

    const maxSession = createSession(1000)
    expect(maxSession.expiresAt).toBe(1_700_000_000_000 + 720 * 3_600_000) // 720 hours max
  })
})

// ─── Rate Limiting ─────────────────────────────────────────────────────

describe('rate limiting', () => {
  beforeEach(() => {
    // sessionStorage for rate limiting
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      return mockSessionStorage.get(key) ?? null
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      mockSessionStorage.set(key, value)
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key) => {
      mockSessionStorage.delete(key)
    })
  })

  it('starts unlocked', () => {
    const status = getLockoutStatus()
    expect(status.locked).toBe(false)
    expect(status.remainingMs).toBe(0)
  })

  it('locks after 3 attempts (30s lockout)', () => {
    recordFailedAttempt()
    recordFailedAttempt()
    recordFailedAttempt()

    const status = getLockoutStatus()
    expect(status.locked).toBe(true)
    expect(status.remainingMs).toBeGreaterThan(0)
    expect(status.remainingMs).toBeLessThanOrEqual(30_000)
  })

  it('locks for 60s after 5 attempts', () => {
    for (let i = 0; i < 5; i++) recordFailedAttempt()

    const status = getLockoutStatus()
    expect(status.locked).toBe(true)
    expect(status.remainingMs).toBeGreaterThan(30_000)
    expect(status.remainingMs).toBeLessThanOrEqual(60_000)
  })

  it('locks for 5min after 10 attempts', () => {
    for (let i = 0; i < 10; i++) recordFailedAttempt()

    const status = getLockoutStatus()
    expect(status.locked).toBe(true)
    expect(status.remainingMs).toBeGreaterThan(60_000)
    expect(status.remainingMs).toBeLessThanOrEqual(300_000)
  })

  it('resets after lockout expires', () => {
    for (let i = 0; i < 3; i++) recordFailedAttempt()
    expect(getLockoutStatus().locked).toBe(true)

    vi.advanceTimersByTime(30_001)

    const status = getLockoutStatus()
    expect(status.locked).toBe(false)
    expect(status.remainingMs).toBe(0)
  })

  it('resetRateLimit clears lockout', () => {
    for (let i = 0; i < 3; i++) recordFailedAttempt()
    expect(getLockoutStatus().locked).toBe(true)

    resetRateLimit()
    expect(getLockoutStatus().locked).toBe(false)
  })
})

// ─── Secret Management ─────────────────────────────────────────────────

describe('secret management', () => {
  const mockCiphertext = 'Y2lwaGVydGV4dA==' // "ciphertext" in base64
  const mockIv = 'aXZfdmFsdWU=' // "iv_value" in base64
  const mockSalt = 'c2FsdF92YWx1ZQ==' // "salt_value" in base64

  beforeEach(() => {
    // Mock crypto.subtle for encrypt/decrypt
    const subtleMock = {
      importKey: vi.fn().mockResolvedValue({}),
      deriveKey: vi.fn().mockResolvedValue({}),
      encrypt: vi
        .fn()
        .mockResolvedValue(new Uint8Array([99, 105, 112, 104, 101, 114, 116, 101, 120, 116])),
      decrypt: vi.fn().mockResolvedValue(new TextEncoder().encode('JBSWY3DPEHPK3PXP')),
    }
    Object.defineProperty(crypto, 'subtle', { value: subtleMock, writable: true })
    // Mock getRandomValues for deterministic salt/iv
    vi.spyOn(crypto, 'getRandomValues').mockImplementation((arr: any) => {
      arr.fill(42)
      return arr
    })
  })

  it('clearSecret removes all secret keys', () => {
    mockLocalStorage.set('tgp-auth-secret', mockCiphertext)
    mockLocalStorage.set('tgp-auth-secret-iv', mockIv)
    mockLocalStorage.set('tgp-auth-secret-salt', mockSalt)

    expect(isConfigured()).toBe(true)
    clearSecret()
    expect(isConfigured()).toBe(false)
  })

  it('getSecret returns null when no secret stored', async () => {
    const secret = await getSecret()
    expect(secret).toBeNull()
  })

  it('confirmSetup stores encrypted secret and creates session', async () => {
    await confirmSetup('JBSWY3DPEHPK3PXP', 24)

    expect(mockLocalStorage.has('tgp-auth-secret')).toBe(true)
    expect(mockLocalStorage.has('tgp-auth-secret-iv')).toBe(true)
    expect(mockLocalStorage.has('tgp-auth-secret-salt')).toBe(true)
    // Session should be created
    expect(getSession()).not.toBeNull()
  })

  it('returns null and clears secret when decryption fails', async () => {
    const subtleMock = {
      importKey: vi.fn().mockResolvedValue({}),
      deriveKey: vi.fn().mockResolvedValue({}),
      decrypt: vi.fn().mockRejectedValue(new Error('decrypt fail')),
    }
    Object.defineProperty(crypto, 'subtle', { value: subtleMock, writable: true })

    mockLocalStorage.set('tgp-auth-secret', 'Y2lwaGVydGV4dA==')
    mockLocalStorage.set('tgp-auth-secret-iv', 'aXZfdmFsdWU=')
    mockLocalStorage.set('tgp-auth-secret-salt', 'c2FsdF92YWx1ZQ==')

    const result = await getSecret()
    expect(result).toBeNull()
    expect(mockLocalStorage.has('tgp-auth-secret')).toBe(false)
  })
})

// ─── getOtpRemainingMs ────────────────────────────────────────────────

describe('getOtpRemainingMs', () => {
  it('returns a number between 0 and 30000', () => {
    const remaining = getOtpRemainingMs()
    expect(typeof remaining).toBe('number')
    expect(remaining).toBeGreaterThanOrEqual(0)
    expect(remaining).toBeLessThanOrEqual(30_000)
  })
})

// ─── clearSecret (cleanup) ─────────────────────────────────────────────

describe('clearSecret edge cases', () => {
  it('does not throw when no secret exists', () => {
    expect(() => clearSecret()).not.toThrow()
  })

  it('clears all three storage keys', () => {
    mockLocalStorage.set('tgp-auth-secret', 'a')
    mockLocalStorage.set('tgp-auth-secret-iv', 'b')
    mockLocalStorage.set('tgp-auth-secret-salt', 'c')
    clearSecret()
    expect(mockLocalStorage.size).toBe(0)
  })
})
