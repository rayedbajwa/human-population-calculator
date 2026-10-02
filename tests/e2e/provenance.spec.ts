import { expect, test } from '@playwright/test'
import { openApp, searchAndSelect } from './helpers'

test.describe('Cross-cutting — provenance is visible for every figure (SC-007)', () => {
  test('population and breakdown rows show source name and reference year', async ({ page }) => {
    await openApp(page)
    await searchAndSelect(page, 'Nigeria', 'NGA')

    await expect(page.getByTestId('population-provenance')).toHaveText(/source:/i)
    await expect(page.getByTestId('population-provenance')).toHaveText(/20\d\d/)

    const ethnic = page.getByTestId('breakdown-ethnic')
    await expect(ethnic).toBeVisible()
    await expect(ethnic.locator('.pg-provenance').first()).toHaveText(/source:/i)
    await expect(ethnic.locator('.pg-provenance').first()).toHaveText(/20\d\d/)
  })

  test('the diversity indicator shows its own source and year', async ({ page }) => {
    await openApp(page)
    await searchAndSelect(page, 'Brazil', 'BRA')
    const indicator = page.getByTestId('diversity-indicator')
    await expect(indicator).toBeVisible()
    await expect(indicator).toHaveText(/source:/i)
    await expect(indicator).toHaveText(/20\d\d/)
  })
})
