/**
 * Placeholder for tests that should only run against the live upstream
 * APIs (i.e. NOT under chromium-mock). Currently empty — kept as a
 * future-proof hook so the testIgnore rule in playwright.config.ts has
 * a target.
 *
 * Add live-only tests here when the mock dispatcher cannot reproduce a
 * specific upstream behavior (e.g. real HLS playback, real CDN image
 * headers, etc.).
 */
import { test, expect } from '@playwright/test';

test.describe('Live-only tests (skipped under mock)', () => {
  test('placeholder — currently no live-only tests', async () => {
    expect(true).toBe(true);
  });
});