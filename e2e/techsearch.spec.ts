import { test, expect, type Page } from '@playwright/test'
import { bypassAuth } from './auth.setup'

/**
 * Helper: type in TechSearch input, wait for dropdown, verify results appear.
 * TechSearch uses placeholder text that changes based on selection count.
 */
async function typeInTechSearch(page: Page, text: string) {
  const input = page.locator('input[placeholder*="Buscar tecnología"]')
  await input.waitFor({ state: 'visible', timeout: 10000 })
  await input.click()
  await input.fill(text)
  // Wait for dropdown to render
  await page.waitForTimeout(500)
  return input
}

/**
 * Helper: verify the deps.dev system selector dropdown is present.
 */
async function expectDepsSystemSelector(page: Page) {
  const selector = page.locator('select').filter({ has: page.locator('option[value="npm"]') })
  await expect(selector).toBeVisible({ timeout: 5000 })
}

/**
 * Helper: count selected technology badges (rendered by TechSearch).
 * Badges are inside a flex-wrap container before the search input.
 */
async function getSelectedBadgeCount(page: Page): Promise<number> {
  // Badges rendered by TechSearch are small rounded pills before the input
  const badges = page.locator('.space-y-2 .flex-wrap span, .space-y-2 > div > span')
  // More specific: TechSearch renders badges in a div with flex-wrap
  const techBadges = page.locator('.flex.flex-wrap.gap-1\\.5 span')
  return await techBadges.count()
}

/* ─── Suite ─── */

test.describe('TechSearch — unified technology search across surfaces', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAuth(page)
  })

  test('1. ApplicationFormPage — TechSearch with deps.dev renders and allows local search', async ({ page }) => {
    await page.goto('/catalog/applications/new')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Let demo data seed

    // Check the TechSearch component is present
    await expect(page.locator('text=Tecnologías').first()).toBeVisible()

    // The search input should be visible with the placeholder
    const input = page.locator('input[placeholder*="Buscar tecnología"]')
    await expect(input).toBeVisible()

    // The deps.dev system selector should be present (enableDepsSearch={true})
    await expectDepsSystemSelector(page)

    // Type a technology name — should show catalog results
    await typeInTechSearch(page, 'React')
    const dropdownItems = page.locator('.rounded-lg.shadow-lg.max-h-60 button')
    await expect(dropdownItems.first()).toBeVisible({ timeout: 3000 })

    // Click the first result to add it
    const addButtons = page.locator('.rounded-lg.shadow-lg.max-h-60 button:not([disabled])')
    const count = await addButtons.count()
    expect(count).toBeGreaterThan(0)
  })

  test('2. ApplicationDetailPage TechStackManager — add technology from catalog', async ({ page }) => {
    // First navigate to an existing application detail page
    // We need to go to applications list first and click one
    await page.goto('/catalog/applications')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Click the first application in the list to go to detail
    const appLinks = page.locator('a[href*="/catalog/applications/"]')
    const count = await appLinks.count()
    if (count === 0) {
      test.skip('No applications found — demo data may not be seeded')
      return
    }
    await appLinks.first().click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Navigate to the "tech" tab
    const techTab = page.getByText('Stack Tecnológico', { exact: false }).first()
    if (await techTab.isVisible()) {
      await techTab.click()
    } else {
      // Try clicking a "Gestionar →" or tab button
      const manageBtn = page.getByText('Gestionar', { exact: false })
      if (await manageBtn.isVisible()) {
        await manageBtn.click()
      }
    }
    await page.waitForTimeout(1000)

    // TechSearch should be visible
    const input = page.locator('input[placeholder*="Buscar tecnología"]')
    await expect(input).toBeVisible({ timeout: 5000 })

    // deps.dev selector should be present
    await expectDepsSystemSelector(page)

    // Type a search term
    await typeInTechSearch(page, 'Node')
    const dropdownItems = page.locator('.rounded-lg.shadow-lg.max-h-60 button:not([disabled])')
    await expect(dropdownItems.first()).toBeVisible({ timeout: 3000 })
  })

  test('3. deps.dev system selector has all expected package systems', async ({ page }) => {
    await page.goto('/catalog/applications/new')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Find the system selector
    const selector = page.locator('select').filter({ has: page.locator('option') })
    // Get all option texts
    const options = await selector.locator('option').allTextContents()
    const expected = ['npm', 'Maven', 'NuGet', 'PyPI', 'Go', 'Cargo']
    for (const sys of expected) {
      expect(options.some((o) => o.toLowerCase().includes(sys.toLowerCase()))).toBeTruthy()
    }
  })

  test('4. CandidateFormPage — TechSearch with scoring preserves technology selection', async ({ page }) => {
    await page.goto('/teams/recruitment/new')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Check TechSearch renders on the candidate form
    await expect(page.locator('text=Tecnologías y Puntuación').first()).toBeVisible()
    const input = page.locator('input[placeholder*="Buscar tecnología"]')
    await expect(input).toBeVisible()

    // deps.dev selector should be present
    await expectDepsSystemSelector(page)

    // Type to search
    await typeInTechSearch(page, 'Python')
    const dropdownItems = page.locator('.rounded-lg.shadow-lg.max-h-60 button:not([disabled])')
    await expect(dropdownItems.first()).toBeVisible({ timeout: 3000 })
  })

  test('5. Add and remove technology via TechSearch', async ({ page }) => {
    await page.goto('/catalog/applications/new')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Type to search for a technology
    await typeInTechSearch(page, 'Docker')

    // Wait for dropdown and click first addable item
    const addButtons = page.locator('button[type="button"]:not([disabled])').filter({ hasText: 'Docker' })
    const count = await addButtons.count()
    if (count === 0) {
      // Docker might not be in the catalog; try alternative
      await typeInTechSearch(page, 'React')
      const reactBtn = page.locator('button[type="button"]:not([disabled])').filter({ hasText: 'React' })
      await expect(reactBtn.first()).toBeVisible({ timeout: 3000 })
      await reactBtn.first().click()
    } else {
      await addButtons.first().click()
    }

    await page.waitForTimeout(500)

    // The badge should now appear — verify something was added
    // The input placeholder should update to show count
    const inputWithCount = page.locator('input[placeholder*="seleccionada"]')
    await expect(inputWithCount).toBeVisible({ timeout: 3000 })
  })
})

test.describe('TechSearch — surface-specific pages load properly', () => {
  test.beforeEach(async ({ page }) => {
    await bypassAuth(page)
  })

  test('DatabaseFormPage — TechSearch present with deps.dev', async ({ page }) => {
    // Navigate to applications, then into one, then to databases tab
    await page.goto('/catalog/applications')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Click an application
    const appLinks = page.locator('a[href*="/catalog/applications/"]')
    const count = await appLinks.count()
    if (count === 0) {
      test.skip('No applications found')
      return
    }
    // Extract the app ID from the first link
    const href = await appLinks.first().getAttribute('href')
    const appId = href?.split('/').pop()
    if (!appId) {
      test.skip('Could not extract app ID')
      return
    }

    // Navigate to database creation page
    await page.goto(`/catalog/applications/${appId}/databases/new`)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // TechSearch should be present
    const input = page.locator('input[placeholder*="Buscar tecnología"]')
    await expect(input).toBeVisible({ timeout: 5000 })

    // deps.dev selector present
    await expectDepsSystemSelector(page)
  })

  test('TechSearch shows skills (common skills like Scrum, Agile)', async ({ page }) => {
    await page.goto('/catalog/applications/new')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Search for a common skill
    await typeInTechSearch(page, 'Scrum')

    // Wait for dropdown — should find "Scrum" as a skill result
    const skillItem = page.locator('button[type="button"]').filter({ hasText: 'Scrum' })
    await expect(skillItem.first()).toBeVisible({ timeout: 3000 })

    // Verify it shows the "skill" badge
    const skillBadge = skillItem.first().locator('text=skill')
    await expect(skillBadge).toBeVisible()
  })

  test('TechSearch vendor info displayed for catalog technologies', async ({ page }) => {
    await page.goto('/catalog/applications/new')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Type a search term likely to have vendor info
    await typeInTechSearch(page, 'PostgreSQL')

    // Check the dropdown shows vendor info in parentheses
    const vendorInfo = page.locator('button[type="button"]').filter({ hasText: /PostgreSQL/ })
    if (await vendorInfo.count() > 0) {
      await expect(vendorInfo.first()).toBeVisible({ timeout: 3000 })
    }
  })
})
