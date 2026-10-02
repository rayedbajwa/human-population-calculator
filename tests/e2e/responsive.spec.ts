import { expect, test } from '@playwright/test'
import { openApp } from './helpers'

const VIEWPORTS = [
  { width: 360, height: 740 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
  { width: 1920, height: 1080 },
]

test.describe('Cross-cutting — responsive layout', () => {
  for (const viewport of VIEWPORTS) {
    test(`has no horizontal scroll and keeps controls reachable at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await openApp(page)

      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }))
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1)

      await expect(page.getByTestId('search-input')).toBeVisible()
      await expect(page.getByTestId('legend')).toBeVisible()
    })
  }
})
