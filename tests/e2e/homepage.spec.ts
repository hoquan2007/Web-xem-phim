/**
 * Smoke tests for the homepage — basic regression coverage.
 *
 * Goals:
 *  - Confirm the production build serves the homepage at HTTP 200.
 *  - Verify the security headers from `proxy.ts` are present on every response.
 *  - Verify the page renders the HNQ brand and shows the navbar.
 *  - Confirm there are no console errors during the initial page load.
 *
 * These tests run against the *production* server (`npm start`), so they
 * also catch build-time regressions that `next dev` would hide.
 */
import { test, expect } from '@playwright/test';

const REQUIRED_SECURITY_HEADERS = [
  'content-security-policy',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
] as const;

test.describe('Homepage (smoke)', () => {
  test('returns HTTP 200', async ({ request }) => {
    const response = await request.get('/');
    expect(response.status()).toBe(200);
  });

  test('sends all required security headers', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();

    for (const header of REQUIRED_SECURITY_HEADERS) {
      const value = headers[header];
      expect(value, `Header ${header} should be present`).toBeTruthy();
      expect(value!.length, `Header ${header} should not be empty`).toBeGreaterThan(0);
    }
  });

  test('CSP includes frame-ancestors none (clickjacking defense)', async ({ request }) => {
    const response = await request.get('/');
    const csp = response.headers()['content-security-policy'] ?? '';
    expect(csp).toContain("frame-ancestors 'none'");
  });

  test('CSP includes object-src none (plugin defense)', async ({ request }) => {
    const response = await request.get('/');
    const csp = response.headers()['content-security-policy'] ?? '';
    expect(csp).toContain("object-src 'none'");
  });

  test('CSP includes base-uri self (defense vs <base href> injection)', async ({ request }) => {
    const response = await request.get('/');
    const csp = response.headers()['content-security-policy'] ?? '';
    expect(csp).toContain("base-uri 'self'");
  });

  test('X-Frame-Options is DENY (legacy clickjacking defense)', async ({ request }) => {
    const response = await request.get('/');
    expect(response.headers()['x-frame-options']).toBe('DENY');
  });

  test('X-Content-Type-Options is nosniff', async ({ request }) => {
    const response = await request.get('/');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
  });

  test('renders the HNQ brand and navbar', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/HNQ/i);

    // The HNQ brand logo is rendered in the navbar.
    const logo = page.locator('header').getByText('HNQ', { exact: false }).first();
    await expect(logo).toBeVisible();
  });

  test('has no critical console errors during load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known no-op warnings (vercel/next.js internal dev chatter).
    const critical = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('Failed to load resource') && // upstream API may 502
        !e.includes('the server responded with a status of')
    );
    expect(critical, `Critical console errors: ${critical.join(', ')}`).toEqual([]);
  });
});
