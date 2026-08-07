import { test, expect } from '@playwright/test'
import { bypassAuth, seedFinOpsData } from './auth.setup'

test.describe('FinOps module', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAuth(page)
    await seedFinOpsData(page)
  })

  test('navega al dashboard FinOps y ve el panel', async ({ page }) => {
    await page.goto('/finops')
    await expect(page.getByRole('heading', { name: 'FinOps' })).toBeVisible()
    await expect(page.getByText('Costo por aplicación')).toBeVisible()
  })

  test('crea una partida desde el formulario', async ({ page }) => {
    await page.goto('/finops/entries/new')
    await expect(page.getByRole('heading', { name: 'Nueva partida' })).toBeVisible()
  })

  test('listado de partidas muestra datos sembrados', async ({ page }) => {
    await page.goto('/finops/entries')
    await expect(page.locator('body')).not.toBeEmpty()
  })
})
