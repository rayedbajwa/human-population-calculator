import { expect, test } from '@playwright/test'
import { openApp } from './helpers'

test.describe('Cross-cutting — reduced motion', () => {
  test('renders the globe with auto-rotation disabled', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openApp(page)
    const globe = page.getByTestId('globe-view')
    await expect(globe).toBeVisible()
    await expect(page.getByTestId('interaction-hint')).toBeVisible()
    // The controls' autoRotate flag is exposed so reduced motion is actually
    // observable, not just claimed by the test name.
    await expect(globe).toHaveAttribute('data-auto-rotate', 'false')
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
