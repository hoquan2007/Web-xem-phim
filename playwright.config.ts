import { defineConfig, devices } from "@playwright/test";

/**
 * PTQ Film production-server browser tests.
 * CI runs all deterministic specs in chromium-mock, then the KKPhim kill switch.
 * The live project is opt-in because it depends on external providers.
 * Mock data is enabled at server runtime through API_MOCK and API_BASE_*.
 * BASE_URL/PORT override the target; PW_DEV=1 opts into development checks.
 */
const PORT = process.env.PORT || "3100";
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
  API_MOCK: "1",
  API_MOCK_ORIGIN: BASE_URL,
  API_BASE_KKPHIM: `${MOCK_BASE}/kkphim`,
  API_BASE_OPHIM: `${MOCK_BASE}/ophim`,
  API_BASE_NGUONC: `${MOCK_BASE}/nguonc`,
};

/**
 * API-REDESIGN-8: provider kill-switch E2E. Same mock dispatcher, but
 * KKPhim is disabled via `API_DISABLE_KKPHIM=1`. Exercises the
 * orchestrator fallback path: Ophim / NguonC must still serve data so
 * catalogue / search / detail pages render.
 */
const kkphimOffEnv = {
  ...mockEnv,
  API_DISABLE_KKPHIM: "1",
};

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore:
    process.env.PW_MOCK === "1" || process.env.PW_DISABLE_KKPHIM === "1"
      ? "**/live-only.spec.ts"
      : "**/mock.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "vi-VN",
  },
  projects: [
    {
      name: "chromium",
      testMatch: "**/live-only.spec.ts",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: "**/mock.spec.ts",
    },
    {
      name: "chromium-mock",
      // New specs join CI automatically; live and kill-switch tests run separately.
      testMatch: "**/*.spec.ts",
      testIgnore: ["**/live-only.spec.ts", "**/disable-flag.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // API-REDESIGN-8: provider kill-switch E2E. Server boots with
      // API_DISABLE_KKPHIM=1 so we exercise the orchestrator fallback.
      name: "chromium-disable-kkphim",
      testMatch: "**/disable-flag.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // PW_DEV=1 also exercises development-only validation, such as
    // next/image throwing for URLs outside remotePatterns during render.
    command: `npx next ${process.env.PW_DEV === "1" ? "dev" : "start"} -p ${PORT}`,
    url: BASE_URL,
    cwd: "./",
    timeout: 180_000,
    stdout: "ignore",
    stderr: "pipe",
    reuseExistingServer: process.env.PW_REUSE_SERVER === "1",
    env:
      process.env.PW_MOCK === "1"
        ? mockEnv
        : process.env.PW_DISABLE_KKPHIM === "1"
          ? kkphimOffEnv
          : {},
  },
});
