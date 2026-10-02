import { expect, test } from '@playwright/test'
import { openApp } from './helpers'

/**
 * Performance smoke tests.
 *
 * Timing is measured inside the page with `performance.now()` so the result
 * reflects the app's own responsiveness, not Playwright's protocol round-trips.
 * The headless environment renders WebGL in software, so auto-spin is disabled
 * (reduced motion) to avoid measuring a background animation rather than the
 * interaction the success criterion is about.
 */
test.describe('Cross-cutting — performance smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
  })

  test('select-to-detail renders in under 2 seconds', async ({ page }) => {
    await openApp(page)
    await page.getByTestId('search-input').fill('China')
    await expect(page.getByTestId('suggestion-CHN')).toBeVisible()

    const duration = await page.evaluate(async () => {
      const button = document.querySelector<HTMLButtonElement>('[data-testid="suggestion-CHN"]')
      if (!button) throw new Error('suggestion missing')
      const started = performance.now()
      button.click()
      await new Promise<void>((resolve) => {
        const check = () =>
          document.querySelector('[data-testid="detail-panel"]') ? resolve() : requestAnimationFrame(check)
        check()
      })
      return performance.now() - started
    })

    expect(duration).toBeLessThan(2000)
    await expect(page.getByTestId('detail-panel')).toBeVisible()
  })

  test('search suggestions appear in under 1 second', async ({ page }) => {
    await openApp(page)

    const duration = await page.evaluate(async () => {
      const input = document.querySelector<HTMLInputElement>('[data-testid="search-input"]')
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      if (!input || !setter) throw new Error('search input missing')
      const started = performance.now()
      setter.call(input, 'germ')
      input.dispatchEvent(new Event('input', { bubbles: true }))
      await new Promise<void>((resolve) => {
        const check = () =>
          document.querySelector('[data-testid="suggestion-DEU"]') ? resolve() : requestAnimationFrame(check)
        check()
      })
      return performance.now() - started
    })

    expect(duration).toBeLessThan(1000)
  })

  test('at least 95% of boundary countries are shaded on first load', async ({ page }) => {
    await openApp(page)
    const stats = page.getByTestId('shading-stats')
    await expect(stats).toHaveAttribute('data-total', /[1-9]/)
    const shaded = Number(await stats.getAttribute('data-shaded'))
    const total = Number(await stats.getAttribute('data-total'))
    expect(shaded / total).toBeGreaterThanOrEqual(0.95)
  })
})
