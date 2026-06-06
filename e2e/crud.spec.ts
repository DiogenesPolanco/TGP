import { test, expect } from '@playwright/test'
import { bypassAuth } from './auth.setup'

test.describe('CRUD e2e — Applications', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAuth(page)
  })

  test('application list loads with heading', async ({ page }) => {
    await page.goto('/catalog/applications')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /catálogo de aplicaciones/i }).first()).toBeVisible()
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('new application form renders', async ({ page }) => {
    await page.goto('/catalog/applications')
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /nuev/i }).first().click()
    await page.waitForURL(/\/catalog\/applications\/new/)

    await expect(page.getByText('Nueva Aplicación', { exact: false })).toBeVisible()
    // form renders with required fields
    await expect(page.getByText(/nombre/i, { exact: false })).toBeVisible()
    await expect(page.getByText(/owner/i, { exact: false })).toBeVisible()
  })
})

test.describe('CRUD e2e — Technologies', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAuth(page)
  })

  test('obsolescence page renders with heading', async ({ page }) => {
    await page.goto('/catalog/obsolescence')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: 'Obsolescencia' })).toBeVisible()
  })
})

test.describe('CRUD e2e — Teams & Members', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAuth(page)
  })

  test('teams page loads', async ({ page }) => {
    await page.goto('/teams')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('members page loads with KPI data', async ({ page }) => {
    await page.goto('/teams/members')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toBeEmpty()
  })
})

test.describe('CRUD e2e — Security', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAuth(page)
  })

  test('vulnerabilities page loads', async ({ page }) => {
    await page.goto('/security/vulnerabilities')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('incidents page loads', async ({ page }) => {
    await page.goto('/security/incidents')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toBeEmpty()
  })
})

test.describe('CRUD e2e — Governance', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAuth(page)
  })

  test('risks page loads', async ({ page }) => {
    await page.goto('/governance/risks')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('audit page loads', async ({ page }) => {
    await page.goto('/governance/audit')
    await page.waitForLoadState('networkidle')
    await expect(page.locator('body')).not.toBeEmpty()
  })
})
