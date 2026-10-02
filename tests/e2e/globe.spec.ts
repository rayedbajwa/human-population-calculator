import { expect, test } from '@playwright/test'
import { openApp, searchAndSelect } from './helpers'

test.describe('US1 — interactive population globe', () => {
  test('loads a shaded globe, a legend and the first-use hint', async ({ page }) => {
    await openApp(page)
    await expect(page.getByTestId('interaction-hint')).toBeVisible()

    const legendItems = page.getByTestId('legend-item')
    await expect(legendItems).toHaveCount(6)
    await expect(page.getByTestId('legend-no-data')).toBeVisible()

    const stats = page.getByTestId('shading-stats')
    await expect(stats).toHaveAttribute('data-total', /[1-9]/)
  })

  test('rotates the camera when dragged', async ({ page }) => {
    // Reduced motion disables auto-spin so the only camera movement is the drag.
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await openApp(page)

    const globe = page.getByTestId('globe-view')
    const canvas = page.locator('.pg-globe-wrap canvas')
    const box = await canvas.boundingBox()
    test.skip(!box, 'canvas is not measurable')

    // Wheel once to let the controls emit an initial camera position.
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.wheel(0, -200)
    await expect(globe).toHaveAttribute('data-camera-lng', /.+/)
    const before = await globe.getAttribute('data-camera-lng')

    await page.mouse.down()
    await page.mouse.move(box!.x + box!.width / 2 + 150, box!.y + box!.height / 2, { steps: 10 })
    await page.mouse.up()

    await expect
      .poll(async () => globe.getAttribute('data-camera-lng'))
      .not.toBe(before)
    await expect(page.getByTestId('globe-view')).toBeVisible()
    await expect(canvas).toBeVisible()
  })

  test('zooms without losing the current selection', async ({ page }) => {
    await openApp(page)
    await searchAndSelect(page, 'Japan', 'JPN')
    await expect(page.getByTestId('detail-panel')).toContainText('Japan')

    const canvas = page.locator('.pg-globe-wrap canvas')
    const box = await canvas.boundingBox()
    test.skip(!box, 'canvas is not measurable')
    await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
    await page.mouse.wheel(0, -400)

    await expect(page.getByTestId('detail-panel')).toContainText('Japan')
  })

  test('selects a country and shows name, population and reference year', async ({ page }) => {
    await openApp(page)
    await searchAndSelect(page, 'United States', 'USA')

    await expect(page.getByTestId('detail-panel')).toContainText('United States')
    await expect(page.getByTestId('population-exact')).toContainText(',')
    // US1-6: the shortened form is rendered alongside the exact figure.
    await expect(page.getByTestId('population-short')).toContainText('M')
    await expect(page.getByTestId('population-provenance')).toContainText(/20\d\d/)
  })

  test('keeps the selection across a reload', async ({ page }) => {
    await openApp(page)
    await searchAndSelect(page, 'Japan', 'JPN')
    await page.reload()
    await expect(page.getByTestId('detail-panel')).toContainText('Japan', { timeout: 20_000 })
  })
})
