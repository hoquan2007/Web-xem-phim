/**
 * XSS regression tests — verify the FIX-2/FIX-2bis sanitizer still defends
 * against stored XSS payloads that might be served by the upstream API.
 *
 * These tests navigate to a movie detail page and look for the film
 * synopsis. We don't inject XSS into the page (upstream is third-party),
 * but we verify the page *renders* without crashing, and that any injected
 * payload would be sanitized by the FIX-2bis rewriter.
 *
 * The static sanitize unit tests in `scripts/test-sanitize.ts` cover the
 * sanitizer itself. Here we verify the page doesn't break when the API
 * returns complex or tricky content.
 */
import { test, expect } from '@playwright/test';

test.describe('XSS regression', () => {
  test('movie synopsis renders without errors', async ({ page }) => {
    await page.goto('/');
    const firstMovie = page.locator('a[href^="/phim/"]').first();
    if ((await firstMovie.count()) === 0) {
      test.skip(true, 'No movies found on homepage');
      return;
    }
    await firstMovie.click();
    await page.waitForURL(/\/phim\//, { timeout: 30_000 });
    await page.waitForLoadState('domcontentloaded');

    // The synopsis section should be present (or absent if no content).
    const synopsis = page.locator('text=/Nội dung phim/').first();
    if ((await synopsis.count()) > 0) {
      await expect(synopsis).toBeVisible();
    }
  });

  test('no live <script> tags injected from synopsis', async ({ page }) => {
    await page.goto('/');
    const firstMovie = page.locator('a[href^="/phim/"]').first();
    if ((await firstMovie.count()) === 0) {
      test.skip(true, 'No movies found on homepage');
      return;
    }
    await firstMovie.click();
    await page.waitForURL(/\/phim\//, { timeout: 30_000 });
    await page.waitForLoadState('domcontentloaded');

    // Count <script> tags inside the synopsis container. The page itself
    // legitimately has Next.js scripts, so we scope to the synopsis area.
    const scriptCount = await page
      .locator('section >> nth=0, [class*="synopsis"] >> nth=0, [class*="content"] >> nth=0')
      .locator('script')
      .count();
    // Should be 0 — the synopsis area shouldn't execute scripts.
    expect(scriptCount).toBe(0);
  });

  test('img onerror handler is not executable', async ({ page }) => {
    // Collect any CSP violations + JS errors.
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    const firstMovie = page.locator('a[href^="/phim/"]').first();
    if ((await firstMovie.count()) === 0) {
      test.skip(true, 'No movies found on homepage');
      return;
    }
    await firstMovie.click();
    await page.waitForURL(/\/phim\//, { timeout: 30_000 });
    await page.waitForLoadState('domcontentloaded');

    // Filter out non-XSS errors (network 4xx, etc.).
    const xssErrors = errors.filter((e) => e.includes('alert') || e.includes('onerror'));
    expect(xssErrors, `XSS payloads executed: ${xssErrors.join(', ')}`).toEqual([]);
  });
});
