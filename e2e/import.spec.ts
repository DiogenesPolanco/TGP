import { test, expect } from '@playwright/test'
import { bypassAuth } from './auth.setup'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

test.describe('Import Flow e2e', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAuth(page)
  })

  test('import page renders and allows file selection', async ({ page }) => {
    await page.goto('/admin/import')
    await page.waitForLoadState('networkidle')

    await expect(page.getByRole('heading', { name: /importar datos/i })).toBeVisible()

    // Select entity type
    await page.getByRole('combobox').selectOption('applications')

    // Verify file input appears
    await expect(page.locator('input[type="file"]')).toBeVisible()

    // Upload test file
    const filePath = path.join(__dirname, 'test-data/applications.xlsx')
    await page.setInputFiles('input[type="file"]', filePath)

    // Verify file name is displayed
    await expect(page.locator('text=applications.xlsx')).toBeVisible()

    // Verify preview button appears
    await expect(page.getByRole('button', { name: /previsualizar datos/i })).toBeVisible()
  })

  test('import page handles invalid file size', async ({ page }) => {
    await page.goto('/admin/import')
    await page.getByRole('combobox').selectOption('applications')

    // Create a dummy large file (11MB, exceeds the 10MB MAX_FILE_SIZE)
    const largeFile = path.join(__dirname, 'test-data/large.xlsx')
    fs.writeFileSync(largeFile, Buffer.alloc(11 * 1024 * 1024))

    await page.setInputFiles('input[type="file"]', largeFile)

    // Verify error notification (based on ImportPage.tsx line 36)
    await expect(page.getByText(/excede el tamaño máximo/i)).toBeVisible()
  })
})
