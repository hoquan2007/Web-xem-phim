import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E test configuration for HNQ Film.
 *
 * FIX-10.3: Regression testing suite — covers homepage, watch flow,
 * filter, search, bookmarks, watch history, security headers.
 * API-REDESIGN-7: Added `mock` project that points every adapter at the
 * local `/api/_mock/[...path]` route so E2E doesn't depend on the real
 * `phimapi.com` / `ophim1.com` / `phim.nguonc.com` / `vsmov.com` APIs.
 *
 * Design choices:
 *  - Tests run against a built production server (`npm start`) instead of
 *    `npm run dev` to catch build-time regressions that dev mode hides.
 *  - `webServer` auto-starts the server if it's not already running.
 *  - We use a single `chromium` project (matches CI budget); expand to
 *    `+ firefox + webkit` when CI budget allows.
 *  - `BASE_URL` env var lets CI override the target (e.g. preview deploys).
 *  - The `mock` project sets `NEXT_PUBLIC_API_MOCK=1` plus per-provider
 *    base URL overrides via `webServer.env` so the same production build
 *    becomes a deterministic fixture-driven server when launched through
 *    this project. Production env (default project) keeps real URLs.
 */
const PORT = process.env.PORT || '3100';
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

/** Local base URL the mock route is mounted under. */
const MOCK_BASE = `${BASE_URL}/api/mock`;

/**
 * Env vars injected into the `next start` process when running the mock
 * project. The adapters read `API_BASE_<PROVIDER>` first (server-only
 * env, no `NEXT_PUBLIC_` prefix), so pointing them at the mock
 * dispatcher is enough — no code changes.
 *
 * Why server-only env vars instead of `NEXT_PUBLIC_*`? Next.js inlines
 * `NEXT_PUBLIC_*` at build time. We want Playwright to flip the mock
 * on at runtime against the same prebuilt production bundle, so we use
 * `API_*` (no public prefix) which Next reads at request time.
 */
const mockEnv = {
  API_MOCK: '1',
  API_BASE_KKPHIM: `${MOCK_BASE}/kkphim`,
  API_BASE_OPHIM: `${MOCK_BASE}/ophim`,
  API_BASE_NGUONC: `${MOCK_BASE}/nguonc`,
  API_BASE_VSMOV: `${MOCK_BASE}/vsmov`,
};

/**
 * API-REDESIGN-8: provider kill-switch E2E. Same mock dispatcher, but
 * KKPhim is disabled via `API_DISABLE_KKPHIM=1`. Exercises the
 * orchestrator fallback path: Ophim / NguonC / VSMOV must still serve
 * data so catalogue / search / detail pages render.
 */
const kkphimOffEnv = {
  ...mockEnv,
  API_DISABLE_KKPHIM: '1',
};

export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: process.env.PW_MOCK === '1'
    ? '**/live-only.spec.ts'
    : process.env.PW_DISABLE_KKPHIM === '1'
      ? '**/live-only.spec.ts|**/mock.spec.ts'
      : '**/mock.spec.ts',
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
      testIgnore: '**/mock.spec.ts',
    },
    {
      name: 'chromium-mock',
      testMatch: '**/mock.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      // API-REDESIGN-8: provider kill-switch E2E. Server boots with
      // API_DISABLE_KKPHIM=1 so we exercise the orchestrator fallback.
      name: 'chromium-disable-kkphim',
      testMatch: '**/disable-flag.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Use `next dev` for the mock / disable-flag projects so server-only
    // env vars (`API_BASE_*` and `API_DISABLE_*`) are read at runtime
    // instead of being inlined at build time. Without this, the
    // production bundle hard-codes the real `https://phimapi.com` URL
    // and the mock route stays unreachable.
    command:
      process.env.PW_MOCK === '1'
        ? `npx next dev -p ${PORT}`
        : process.env.PW_DISABLE_KKPHIM === '1'
          ? `npx next dev -p ${PORT}`
          : `npx next start -p ${PORT}`,
    url: BASE_URL,
    cwd: './',
    timeout: 180_000,
    stdout: 'ignore',
    stderr: 'pipe',
    reuseExistingServer: !process.env.CI,
    env:
      process.env.PW_MOCK === '1'
        ? mockEnv
        : process.env.PW_DISABLE_KKPHIM === '1'
          ? kkphimOffEnv
          : {},
  },
});