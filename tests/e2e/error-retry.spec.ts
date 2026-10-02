import { expect, test } from '@playwright/test'

test.describe('Cross-cutting — load failure and retry', () => {
  test('shows the error state when the snapshot is blocked, then recovers on retry', async ({ page }) => {
    await page.route('**/data/snapshot.json', (route) => route.abort())
    await page.goto('/')

    const errorState = page.getByTestId('error-state')
    await expect(errorState).toBeVisible({ timeout: 20_000 })
    await expect(errorState).toContainText(/could not/i)

    await page.unroute('**/data/snapshot.json')
    await page.getByRole('button', { name: /retry/i }).click()

    await expect(page.getByTestId('legend')).toBeVisible({ timeout: 20_000 })
    await expect(errorState).toHaveCount(0)
  })
})
