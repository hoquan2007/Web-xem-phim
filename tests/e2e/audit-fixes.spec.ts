import { test, expect } from '@playwright/test';

test('notes stay isolated across providers and legacy notes remain labelled', async ({ page }) => {
  await page.goto('/phim/avengers-endgame?source=kkphim');
  await page.getByLabel('Ghi chú về', { exact: false }).fill('Only KKPhim note');
  await page.getByRole('button', { name: 'Lưu ghi chú', exact: true }).click();
  await expect(page.getByText('Only KKPhim note', { exact: true })).toBeVisible();
  await page.goto('/phim/avengers-endgame?source=nguonc');
  await expect(page.getByText('Only KKPhim note', { exact: true })).toHaveCount(0);
  await page.goto('/phim/avengers-endgame?source=kkphim');
  await expect(page.getByText('Only KKPhim note', { exact: true })).toBeVisible();
});

test('history write failures are visible without preventing watch navigation', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('quota', 'QuotaExceededError'); }; });
  await page.goto('/phim/avengers-endgame?source=kkphim');
  await page.getByRole('link', { name: 'Xem Ngay', exact: true }).click();
  await expect(page).toHaveURL(/xem-phim/);
  await expect(page.getByRole('alert').filter({ hasText: 'Không thể lưu lịch sử' })).toBeVisible();
});

test('SEO and health endpoints expose real local status and scoped player permissions', async ({ request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('/sitemap.xml');
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.status()).toBe(200);
  expect(await sitemap.text()).not.toContain('/api/mock');
  const health = await request.get('/api/health');
  expect((await health.json()).scope).toBe('process');
  const home = await request.get('/phimhay');
  expect(home.headers()['content-security-policy']).toContain('https://embed18.streamc.xyz');
  expect(home.headers()['permissions-policy']).toContain('https://embed18.streamc.xyz');
});
