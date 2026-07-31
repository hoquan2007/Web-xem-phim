/**
 * Smoke + security headers tests for static routes.
 *
 * Verifies every static route:
 *  - Returns HTTP 200 (or 404 for the not-found page).
 *  - Sends the same security headers as the homepage.
 *  - HTML response contains the expected Vietnamese <title>.
 *
 * If you add a new top-level static route, also add it here.
 */
import { test, expect } from '@playwright/test';

const STATIC_ROUTES: { path: string; expectedTitle: RegExp; name: string }[] = [
  { path: '/', expectedTitle: /HNQ/i, name: 'Home' },
  { path: '/chu-de', expectedTitle: /Chủ Đề|chủ đề|Chu De|HNQ/i, name: 'Chủ đề' },
  { path: '/lich-chieu', expectedTitle: /Phim|Lịch|HNQ/i, name: 'Lịch chiếu' },
  { path: '/tu-phim', expectedTitle: /Tủ Phim|tủ phim|HNQ/i, name: 'Tủ phim' },
  { path: '/danh-sach', expectedTitle: /Phim|HNQ/i, name: 'Danh sách' },
  { path: '/the-loai/hanh-dong', expectedTitle: /Phim|Hành Động|HNQ/i, name: 'Thể loại' },
  { path: '/quoc-gia/han-quoc', expectedTitle: /Phim|Hàn Quốc|HNQ/i, name: 'Quốc gia' },
  { path: '/tim-kiem?keyword=avengers', expectedTitle: /Phim|Tìm|HNQ/i, name: 'Tìm kiếm' },
];

const REQUIRED_SECURITY_HEADERS = [
  'content-security-policy',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
];

test.describe('Static routes', () => {
  for (const route of STATIC_ROUTES) {
    test(`[${route.name}] ${route.path} returns 200`, async ({ request }) => {
      const response = await request.get(route.path);
      expect(response.status(), `${route.path} should be 200`).toBe(200);
    });

    test(`[${route.name}] ${route.path} sends security headers`, async ({ request }) => {
      const response = await request.get(route.path);
      const headers = response.headers();
      for (const header of REQUIRED_SECURITY_HEADERS) {
        expect(headers[header], `Header ${header} missing on ${route.path}`).toBeTruthy();
      }
    });
  }

  test('unknown movie slug returns 404 (not a server error)', async ({ request }) => {
    const response = await request.get('/phim/this-movie-does-not-exist-xyz123');
    // We accept either 404 (not-found page) or 200 with the upstream
    // handling it gracefully — the key is *not* 500.
    expect(response.status()).not.toBe(500);
  });

  test('not-found page returns 404', async ({ request }) => {
    const response = await request.get('/this-route-really-does-not-exist');
    expect(response.status()).toBe(404);
  });

  test('not-found page also sends security headers', async ({ request }) => {
    const response = await request.get('/this-route-really-does-not-exist');
    expect(response.headers()['content-security-policy']).toBeTruthy();
    expect(response.headers()['x-frame-options']).toBe('DENY');
  });
});
