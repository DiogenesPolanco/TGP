/**
 * Auth bypass for E2E tests.
 *
 * The app uses TOTP with sessionStorage. We bypass the login flow by
 * setting a valid session before each test, and clearing any existing
 * TOTP secret to avoid the QR setup screen.
 */
export const STORAGE_KEYS = {
  session: 'tgp-auth-session',
  secret: 'tgp-auth-secret',
  secretIv: 'tgp-auth-secret-iv',
  secretSalt: 'tgp-auth-secret-salt',
} as const

export function createAuthSession() {
  return JSON.stringify({
    token: crypto.randomUUID(),
    createdAt: Date.now(),
    expiresAt: Date.now() + 86_400_000, // 24h
  })
}

/**
 * Injects auth session and clears TOTP setup via page context.
 * Must be called before navigating to any protected route.
 */
export async function bypassAuth(page: import('@playwright/test').Page) {
  await page.goto('/')
  await page.evaluate((keys) => {
    window.sessionStorage.setItem(keys.session, JSON.stringify({
      token: crypto.randomUUID(),
      createdAt: Date.now(),
      expiresAt: Date.now() + 86_400_000,
    }))
    window.localStorage.removeItem(keys.secret)
    window.localStorage.removeItem(keys.secretIv)
    window.localStorage.removeItem(keys.secretSalt)
  }, STORAGE_KEYS)
}
