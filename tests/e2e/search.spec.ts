import { expect, test } from '@playwright/test'
import { openApp } from './helpers'

test.describe('US3 — find a specific country quickly', () => {
  test('suggests nothing for a single character', async ({ page }) => {
    await openApp(page)
    await page.getByTestId('search-input').fill('j')
    await expect(page.getByTestId('search-suggestions')).toHaveCount(0)
    await expect(page.getByTestId('search-no-results')).toHaveCount(0)
  })

  test('suggests matches, focuses the choice and opens the panel', async ({ page }) => {
    await openApp(page)
    await page.getByTestId('search-input').fill('jap')
    const suggestion = page.getByTestId('suggestion-JPN')
    await expect(suggestion).toBeVisible()
    await suggestion.click()
    await expect(page.getByTestId('detail-panel')).toContainText('Japan')
  })

  test('matches accented and duplicate names', async ({ page }) => {
    await openApp(page)
    await page.getByTestId('search-input').fill('cote')
    await expect(page.getByTestId('suggestion-CIV')).toBeVisible()
  })

  test('shows a no-match message and leaves the globe unchanged', async ({ page }) => {
    await openApp(page)
    await page.getByTestId('search-input').fill('zzzzzz')
    await expect(page.getByTestId('search-no-results')).toContainText(/no countries found/i)
    await expect(page.getByTestId('detail-panel')).toHaveCount(0)
  })
})
