import { expect, type Page } from '@playwright/test'

/** Open the app and wait for the globe, legend and canvas to render. */
export async function openApp(page: Page): Promise<void> {
  await page.goto('/')
  await expect(page.getByTestId('legend')).toBeVisible()
  await expect(page.getByTestId('globe-view')).toBeVisible()
  await expect(page.locator('.pg-globe-wrap canvas')).toBeVisible({ timeout: 20_000 })
  // Wait for the boundary TopoJSON to be decoded and joined to countries.
  await expect(page.getByTestId('shading-stats')).toHaveAttribute('data-total', /[1-9]/)
}

/** Select a country through the search box (the reliable, DOM-visible path). */
export async function searchAndSelect(page: Page, query: string, code: string): Promise<void> {
  const input = page.getByTestId('search-input')
  await input.fill(query)
  await page.getByTestId(`suggestion-${code}`).click()
  await expect(page.getByTestId('detail-panel')).toBeVisible()
}
