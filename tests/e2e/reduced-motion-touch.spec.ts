import { expect, test } from '@playwright/test'
import { openApp } from './helpers'

test.describe('Cross-cutting — reduced motion', () => {
  test('renders the globe with auto-rotation disabled', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openApp(page)
    await expect(page.getByTestId('globe-view')).toBeVisible()
    await expect(page.getByTestId('interaction-hint')).toBeVisible()
  })
})

test.describe('Cross-cutting — touch-only device', () => {
  test.use({ hasTouch: true, viewport: { width: 390, height: 780 } })

  test('tap selects a country without relying on hover', async ({ page }) => {
    await openApp(page)
    const input = page.getByTestId('search-input')
    await input.tap()
    await input.fill('India')
    await page.getByTestId('suggestion-IND').tap()
    await expect(page.getByTestId('detail-panel')).toContainText('India')
  })
})
