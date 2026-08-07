import type { Page } from '@playwright/test'

export const STORAGE_KEYS = {
  session: 'tgp-auth-session',
  secret: 'tgp-auth-secret',
  secretIv: 'tgp-auth-secret-iv',
  secretSalt: 'tgp-auth-secret-salt',
  terms: 'tgp-terms-accepted',
} as const

export function createAuthSession() {
  return JSON.stringify({
    token: crypto.randomUUID(),
    createdAt: Date.now(),
    expiresAt: Date.now() + 86_400_000, // 24h
  })
}

/**
 * Injects a valid auth session (localStorage) and clears the TOTP secret so
 * the app redirects straight to /dashboard. Must run before any navigation.
 */
export async function bypassAuth(page: Page) {
  await page.goto('/')
  await page.evaluate((keys) => {
    window.localStorage.setItem(
      keys.session,
      JSON.stringify({
        token: crypto.randomUUID(),
        createdAt: Date.now(),
        expiresAt: Date.now() + 86_400_000,
      }),
    )
    window.localStorage.setItem(keys.terms, 'true')
    window.localStorage.removeItem(keys.secret)
    window.localStorage.removeItem(keys.secretIv)
    window.localStorage.removeItem(keys.secretSalt)
  }, STORAGE_KEYS)
}

/**
 * Seeds the FinOps demo data directly through the Vite dev server module so
 * the dashboard and entries pages have content to render.
 */
export async function seedFinOpsData(page: Page) {
  await page.evaluate(async () => {
    const m = await import('/src/services/demo/seedData.ts')
    await m.seedDemoData(true)
  })
}
