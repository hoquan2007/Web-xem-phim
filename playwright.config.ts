import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration for HNQ Film.
 *
 * FIX-10.3: Regression testing suite — covers homepage, watch flow,
 * filter, search, bookmarks, watch history, security headers.
 *
 * Design choices:
 *  - Tests run against a built production server (`npm start`) instead of
 *    `npm run dev` to catch build-time regressions that dev mode hides.
 *  - `webServer` auto-starts the server if it's not already running.
 *  - We use a single `chromium` project (matches CI budget); expand to
 *    `+ firefox + webkit` when CI budget allows.
 *  - `BASE_URL` env var lets CI override the target (e.g. preview deploys).
 */
const PORT = process.env.PORT || '3100';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'vi-VN',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: BASE_URL,
    cwd: './',
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
    reuseExistingServer: !process.env.CI,
  },
});