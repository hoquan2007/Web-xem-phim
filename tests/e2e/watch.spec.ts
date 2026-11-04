import { test, expect } from '@playwright/test';

test('homepage movie card opens its own detail route with matching page metadata', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('.movie-card').first();
  const href = await card.getAttribute('href');
  expect(href).toBeTruthy();
  const destination = new URL(href!, page.url()).href;
  await card.click();
  await expect(page).toHaveURL(destination);
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toBeVisible();
  expect(await page.title()).toContain(await heading.innerText());
});

test('bookmark save and removal persist across reloads', async ({ page }) => {
  await page.goto('/phim/iframe-only?source=kkphim');
  await page.getByRole('button', { name: 'Thêm Tủ Phim', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Đã Lưu Tủ Phim', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await page.getByRole('button', { name: 'Đã Lưu Tủ Phim', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Thêm Tủ Phim', exact: true })).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('hnq_bookmarks') || '[]'))).toEqual([]);
});

test('episode next/previous controls update URL and selection', async ({ page }) => {
  await page.goto('/xem-phim/watch-series?source=kkphim');
  const previous = page.getByRole('button', { name: 'Tập trước', exact: true });
  await expect(previous).toBeDisabled();
  await page.getByRole('button', { name: 'Tập tiếp', exact: true }).click();
  await expect(page).toHaveURL(/ep=1/);
  await expect(page.locator('.episode-grid button[aria-current="true"]')).toHaveText('Tập 02');
  await previous.click();
  await expect(page).toHaveURL(/ep=0/);
  await expect(previous).toBeDisabled();
});
