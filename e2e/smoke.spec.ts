import { test, expect } from '@playwright/test'
import { bypassAuth } from './auth.setup'

const ROUTES = [
  { path: '/dashboard', name: 'Dashboard' },
  { path: '/catalog/applications', name: 'Applications' },
  { path: '/catalog/obsolescence', name: 'Obsolescence' },
  { path: '/catalog/deliverables', name: 'Deliverables' },
  { path: '/security/vulnerabilities', name: 'Vulnerabilities' },
  { path: '/security/incidents', name: 'Incidents' },
  { path: '/governance/risks', name: 'Risks' },
  { path: '/governance/audit', name: 'Audit' },
  { path: '/teams', name: 'Teams' },
  { path: '/teams/members', name: 'Members' },
  { path: '/strategy/objectives', name: 'Objectives' },
  { path: '/admin', name: 'Admin' },
  { path: '/admin/import', name: 'Import' },
  { path: '/execution/daily', name: 'Daily' },
  { path: '/execution/plans', name: 'Plans' },
  { path: '/execution/commitments', name: 'Commitments' },
  { path: '/execution/blockers', name: 'Blockers' },
  { path: '/execution/tasks', name: 'Tasks' },
  { path: '/execution/dependencies', name: 'Dependencies' },
  { path: '/execution/predictability', name: 'Predictability' },
] as const

test.describe('Smoke tests — all routes render without errors', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAuth(page)
  })

  for (const { path, name } of ROUTES) {
    test(`${name} (${path}) loads without console errors`, async ({ page }) => {
      const consoleErrors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text())
      })

      await page.goto(path)
      await page.waitForLoadState('networkidle')

      // Wait a beat for any async render errors to surface
      await page.waitForTimeout(1000)

      // Check for React error boundaries or critical errors
      const hasReactError = await page.locator('text=Unexpected Application Error').isVisible().catch(() => false)
      expect(hasReactError, `Page ${path} should not show React error boundary`).toBe(false)

      // Filter out known benign console errors
      const benign = ['React DevTools', 'favicon.ico']
      const realErrors = consoleErrors.filter((e) => !benign.some((b) => e.includes(b)))
      expect(realErrors, `Page ${path} should have no console errors`).toEqual([])

      // Page rendered something meaningful
      await expect(page.locator('body')).not.toBeEmpty()
    })
  }
})
