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
  test('live catalogue resolves its own movie link with metadata', async ({ page }) => {
    await page.goto('/');
    const card = page.locator('a[href^="/phim/"]').filter({ has: page.locator('h3') }).first();
    const title = await card.locator('h3').innerText();
    await card.click();
    await expect(page).toHaveURL(/\/phim\//);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.getByRole('heading', { name: 'Danh sách tập' })).toBeVisible();
  });
});
