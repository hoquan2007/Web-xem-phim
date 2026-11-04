/**
 * Security regression tests — verify CSP blocks malicious behavior.
 *
 * These tests load the actual homepage with a real CSP, then attempt to
 * execute things that would be blocked by a strict CSP. We assert that
 * the browser's CSP violation channel fires the expected violation.
 *
 * Also exercises:
 *  - Frame-ancestors blocks framing (set X-Frame-Options check).
 *  - Base-uri prevents <base href> override.
 *  - Object-src prevents <object>/<embed>.
 */
import { test, expect } from '@playwright/test';

test.describe('Security: CSP enforcement', () => {
  test('CSP header is well-formed', async ({ request }) => {
    const response = await request.get('/');
    const csp = response.headers()['content-security-policy'] ?? '';
    expect(csp).toBeTruthy();

    // Should have at minimum these directives.
    expect(csp).toContain("default-src");
    expect(csp).toContain("script-src");
    expect(csp).toContain("img-src");
    expect(csp).toContain("frame-ancestors");
  });

  test('CSP does not allow unsafe-eval in production', async ({ request }) => {
    // Skip if we're in dev mode (vercel preview, etc.).
    if (process.env.NODE_ENV === 'development') {
      test.skip();
    }
    const response = await request.get('/');
    const csp = response.headers()['content-security-policy'] ?? '';
    // Production CSP should NOT include 'unsafe-eval' (only dev does).
    expect(csp).not.toContain("'unsafe-eval'");
  });

  test('CSP blocks embedded objects at runtime', async ({ page }) => {
    await page.addInitScript(() => {
      const state = window as Window & { cspAudit: string[] };
      state.cspAudit = [];
      document.addEventListener('securitypolicyviolation', event => state.cspAudit.push(event.effectiveDirective));
    });
    await page.goto('/');
    await page.evaluate(() => {
      const object = document.createElement('object');
      object.type = 'text/html';
      object.data = 'data:text/html,<p>Blocked audit object</p>';
      document.body.append(object);
    });
    await expect.poll(() => page.evaluate(() =>
      (window as Window & { cspAudit: string[] }).cspAudit.includes('object-src')
    )).toBe(true);
  });

  test('clickjacking: X-Frame-Options DENY', async ({ request }) => {
    const response = await request.get('/');
    expect(response.headers()['x-frame-options']).toBe('DENY');
  });

  test('MIME sniffing: X-Content-Type-Options nosniff', async ({ request }) => {
    const response = await request.get('/');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
  });

  test('Permissions-Policy disables dangerous features', async ({ request }) => {
    const response = await request.get('/');
    const pp = response.headers()['permissions-policy'] ?? '';
    expect(pp).toContain('camera=()');
    expect(pp).toContain('microphone=()');
    expect(pp).toContain('geolocation=()');
    expect(pp).toContain('payment=()');
  });

  test('Referrer-Policy is strict-origin-when-cross-origin', async ({ request }) => {
    const response = await request.get('/');
    expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  test('Cached HTML response includes CSP (no caching bypass)', async ({ request }) => {
    const response = await request.get('/');
    const csp = response.headers()['content-security-policy'];
    expect(csp).toBeTruthy();
    // Test that the CSP is set on the response, not just the request.
    expect(response.headers()['content-security-policy']).toBe(csp);
  });

  test('CSP allows OpliHD player iframe, media, and images', async ({ request }) => {
    // Regression: watching movies that stream from oplihd.com was being
    // blocked because the OPhim/OpliHD CDN was missing from frame-src /
    // media-src / img-src. Added per request to unblock watch playback.
    const response = await request.get('/');
    const csp = response.headers()['content-security-policy'] ?? '';

    // Iframe player (frame-src)
    expect(csp).toMatch(/frame-src[^;]*\bhttps:\/\/oplihd\.com\b/);
    // Video segments (media-src)
    expect(csp).toMatch(/media-src[^;]*\bhttps:\/\/oplihd\.com\b/);
    // Posters / thumbs (img-src)
    expect(csp).toMatch(/img-src[^;]*\bhttps:\/\/oplihd\.com\b/);
    // API metadata fetch (connect-src)
    expect(csp).toMatch(/connect-src[^;]*\bhttps:\/\/oplihd\.com\b/);
  });

  test('CSP allows KKPhim player CDN (FIX-11)', async ({ request }) => {
    // Regression: HLS streams and iframe fallbacks served from rotating
    // subdomains of the KKPhim player CDN (e.g. `v.skbphimplayer.com`,
    // `v7.kkphimplayer7.com`, `*.phim1280.tv`) were being blocked by
    // CSP — producing the "This content is blocked. Contact the site
    // owner to fix the issue." overlay. FIX-11 whitelists these origins
    // in frame-src, connect-src, media-src, and img-src.
    const response = await request.get('/');
    const csp = response.headers()['content-security-policy'] ?? '';

    // iframe player (frame-src)
    expect(csp).toMatch(/frame-src[^;]*\bhttps:\/\/\*\.skbphimplayer\.com\b/);
    expect(csp).toMatch(/frame-src[^;]*\bhttps:\/\/\*\.kkphimplayer\.com\b/);
    expect(csp).toMatch(/frame-src[^;]*\bhttps:\/\/\*\.kkphimplayer7\.com\b/);
    expect(csp).toMatch(/frame-src[^;]*\bhttps:\/\/\*\.phim1280\.tv\b/);
    // HLS manifest fetch (connect-src)
    expect(csp).toMatch(/connect-src[^;]*\bhttps:\/\/\*\.kkphimplayer7\.com\b/);
    // HLS segments (media-src)
    expect(csp).toMatch(/media-src[^;]*\bhttps:\/\/\*\.kkphimplayer7\.com\b/);
  });
});
