import { expect, test } from '@playwright/test'
import { openApp } from './helpers'

/**
 * SC-001: "A first-time visitor can identify the world's most populous country
 * within 60 seconds of opening the page, without external instructions."
 *
 * The 60-second part is a human-usability measurement, but the enabling
 * behaviour is machine-checkable: from a cold start, using only on-screen
 * controls, the visitor can reach the most populous country and read its exact
 * population. This test drives that path end to end.
 */
test.describe('SC-001 — most populous country is discoverable from the visible UI', () => {
  test('a first-time visitor reaches the most populous country without external instructions', async ({
    page,
    request,
  }) => {
    const response = await request.get('data/snapshot.json')
    expect(response.ok()).toBe(true)
    const snapshot = (await response.json()) as {
      countries: Array<{ code: string; commonName: string; totalPopulation: number | null }>
    }
    const mostPopulous = snapshot.countries
      .filter((country) => country.totalPopulation != null)
      .sort((a, b) => (b.totalPopulation ?? 0) - (a.totalPopulation ?? 0))[0]
    expect(mostPopulous).toBeTruthy()

    // Cold start: no persisted selection, as for a first-time visitor.
    await page.addInitScript(() => window.sessionStorage.clear())
    await openApp(page)
    await expect(page.getByTestId('legend-item')).toHaveCount(6)

    const input = page.getByTestId('search-input')
    await input.fill(mostPopulous!.commonName)
    await page.getByTestId(`suggestion-${mostPopulous!.code}`).click()

    await expect(page.getByTestId('detail-panel')).toContainText(mostPopulous!.commonName)
    await expect(page.getByTestId('population-exact')).toHaveText(
      mostPopulous!.totalPopulation!.toLocaleString('en-US'),
    )
  })
})
