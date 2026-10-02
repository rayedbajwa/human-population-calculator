import { defineConfig } from '@playwright/test'

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 3454)
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    browserName: 'chromium',
    headless: true,
    trace: 'on-first-retry',
    launchOptions: {
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'],
    },
  },
  webServer: {
    command: `bun run build && bun run preview --port ${PORT} --strictPort --host 127.0.0.1`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
