import { test, expect } from '@playwright/test'
import { bypassAuth } from './auth.setup'

test.describe('Dashboard e2e', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAuth(page)
  })

  test('dashboard page shows THI gauge and KPI cards', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // THI gauge section
    await expect(page.getByRole('heading', { name: /technology health index/i })).toBeVisible()

    // Key KPI cards (use first() for text that appears in both title and description)
    await expect(page.getByText('Vulnerabilidades Críticas').first()).toBeVisible()
    await expect(page.getByText('Total Aplicaciones').first()).toBeVisible()
    await expect(page.getByText('Incidentes P1').first()).toBeVisible()
  })

  test('dashboard period selector works', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Main period button should be present (defaults to "30 días")
    await expect(page.getByRole('button', { name: /30 días/i })).toBeVisible()

    // Click to open dropdown
    await page.getByRole('button', { name: /30 días/i }).click()

    // Now dropdown options should be visible
    await expect(page.getByText('90 días')).toBeVisible()
    await expect(page.getByText('YTD')).toBeVisible()
  })
})

test.describe('Sidebar Navigation e2e', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAuth(page)
  })

  test('sidebar direct links navigate correctly', async ({ page }) => {
    // Navigate from dashboard
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Click "Reportes" link and verify navigation
    await page.getByRole('link', { name: /reportes/i }).click()
    await expect(page).toHaveURL(/\/reports/)

    // Navigate back to dashboard via sidebar link
    await page.getByRole('link', { name: /dashboard/i }).click()
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('sidebar collapsible sections expand and navigate', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Expand Catálogo section
    await page.getByRole('button', { name: /catálogo/i }).click()

    // Click Aplicaciones link and verify navigation
    await page.getByRole('link', { name: /aplicaciones/i }).click()
    await expect(page).toHaveURL(/\/catalog\/applications/)

    // Navigate back
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Expand Seguridad section
    await page.getByRole('button', { name: /seguridad/i }).click()
    await page.getByRole('link', { name: /vulnerabilidades/i }).click()
    await expect(page).toHaveURL(/\/security\/vulnerabilities/)
  })

  test('sidebar navigation to all main sections works', async ({ page }) => {
    await page.goto('/dashboard')
    await page.waitForLoadState('networkidle')

    // Create a list of navigation routes to test
    const routes = [
      { section: 'Catálogo', link: 'Obsolescencia', url: '/catalog/obsolescence' },
      { section: 'Equipos', link: 'Rendimiento', url: '/teams' },
      { section: 'Estrategia', link: /OKRs|KPIs/i, url: '/strategy/objectives' },
      { section: 'Administración', link: 'General', url: '/admin' },
    ]

    for (const route of routes) {
      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')
      await page.getByRole('button', { name: route.section }).click()
      await page.getByRole('link', { name: route.link }).click()
      await expect(page).toHaveURL(new RegExp(route.url))
    }
  })
})
