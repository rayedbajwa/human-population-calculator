import { expect, test } from '@playwright/test'
import { openApp, searchAndSelect } from './helpers'

test.describe('US1 — first-use interaction hint', () => {
  test('is visible on load and dismissible', async ({ page }) => {
    await openApp(page)
    const hint = page.getByTestId('interaction-hint')
    await expect(hint).toBeVisible()
    await expect(hint).toContainText(/rotate/i)
    await expect(hint).toContainText(/zoom/i)
    await expect(hint).toContainText(/select/i)

    await page.getByRole('button', { name: /dismiss hint/i }).click()
    await expect(hint).toHaveCount(0)
  })

  test('hides automatically after a country is selected', async ({ page }) => {
    await openApp(page)
    await searchAndSelect(page, 'Brazil', 'BRA')
    await expect(page.getByTestId('interaction-hint')).toHaveCount(0)
  })
})
