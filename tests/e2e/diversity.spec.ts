import { expect, test } from '@playwright/test'
import { openApp, searchAndSelect } from './helpers'

test.describe('US2 — population diversity per country', () => {
  test('shows grouped shares and an indicator with provenance', async ({ page }) => {
    await openApp(page)
    await searchAndSelect(page, 'United States', 'USA')

    await expect(page.getByTestId('breakdown-ethnic')).toBeVisible()
    await expect(page.getByTestId('diversity-indicator')).toBeVisible()
    await expect(page.getByTestId('indicator-value')).toBeVisible()
    await expect(page.getByTestId('diversity-indicator')).toContainText(/source:/i)
    await expect(page.getByTestId('diversity-indicator')).toContainText(/20\d\d/)
  })

  test('shows an explicit unavailable state but keeps population for population-only countries', async ({ page }) => {
    await openApp(page)
    await searchAndSelect(page, 'Ivory Coast', 'CIV')

    await expect(page.getByTestId('diversity-block')).toContainText(/diversity data not available/i)
    await expect(page.getByTestId('diversity-indicator')).toHaveCount(0)
    await expect(page.getByTestId('population-exact')).not.toHaveText('')
  })
})
