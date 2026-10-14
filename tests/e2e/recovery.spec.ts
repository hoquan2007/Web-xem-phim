import { test, expect } from '@playwright/test';

test('live search opens on the first query and returns source-qualified results', async ({ page }) => {
  await page.goto('/');
  await page.locator('header input').first().fill('avengers');
  await expect(page.locator('header h4').first()).toContainText(/avengers/i);
  const result = await page.request.get('/api/search?keyword=avengers&limit=6');
  expect(result.status()).toBe(200);
  const body = await result.json();
  expect(body.items.length).toBeGreaterThan(0);
  expect(body.items[0].source).toBe('kkphim');
});
test('a loaded iframe remains present beyond the failure timer', async ({ page }) => {
  await page.goto('/phim/iframe-only?source=kkphim');
  await expect(page.frameLocator('iframe').getByText('Mock player ready')).toBeVisible();
  await page.waitForTimeout(11000);
  await expect(page.locator('iframe')).toHaveCount(1);
  await expect(page.getByText('Server không khả dụng', { exact: true })).toHaveCount(0);
});
test('corrupt bookmarks/history do not crash the shelf', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('hnq_bookmarks', '[null,{"slug":"missing"}]');
    localStorage.setItem('hnq_watch_history', '[null]');
  });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tu-phim');
  await expect(page.getByText('Góc Cá Nhân')).toBeVisible();
  expect(errors).toEqual([]);
});

const externalPoster = 'https://i.ex-cdn.com/danviet.vn/files/content/2026/08/13/final--poster-phu-sa-1012.jpg';
const unknownPoster = 'https://unconfigured.example/poster.jpg';
const alternatePoster = 'https://img.nguonc.com/images/alternate.jpg';
const placeholder = '/images/placeholder.svg';

for (const scenario of [
  { name: 'new CDN poster loads under CSP', poster: externalPoster, thumb: externalPoster, fails: false, expected: externalPoster },
  { name: 'unknown hostname falls back without crashing', poster: unknownPoster, thumb: unknownPoster, fails: false, expected: placeholder },
  { name: 'failed poster uses a working alternate image', poster: externalPoster, thumb: alternatePoster, fails: true, expected: alternatePoster },
  { name: 'failed poster and unknown alternate end at the placeholder', poster: externalPoster, thumb: unknownPoster, fails: true, expected: placeholder },
]) {
  test(`image recovery: ${scenario.name}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route(externalPoster, route => route.fulfill(scenario.fails
      ? { status: 404, body: 'missing' }
      : { contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="30"><rect width="20" height="30" fill="green"/></svg>' }));
    await page.route(alternatePoster, route => route.fulfill({
      contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="30"><rect width="20" height="30" fill="blue"/></svg>',
    }));
    await page.addInitScript(({ poster, thumb }) => {
      localStorage.setItem('hnq_bookmarks', JSON.stringify([{
        _id: 'poster-regression', slug: 'poster-regression', name: 'Poster regression', source: 'kkphim',
        poster_url: poster, thumb_url: thumb, saved_at: new Date().toISOString(),
      }]));
    }, scenario);
    const response = await page.goto('/tu-phim');
    expect(response?.headers()['content-security-policy']).toMatch(/img-src[^;]*https:\/\/i\.ex-cdn\.com\/danviet\.vn\/files\/content\//);
    const image = page.getByRole('img', { name: 'Poster regression', exact: true });
    await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).src))
      .toBe(new URL(scenario.expected, page.url()).href);
    await expect.poll(() => image.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
}
test('report downloads a file and clearly states it was not sent to support', async ({ page }) => {
  await page.goto('/phim/iframe-only?source=kkphim');
  await page.getByRole('button', { name: 'Báo lỗi', exact: true }).first().click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải file báo cáo' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('hnq-bao-loi-phim.json');
  await expect(page.getByText('Website hiện chưa có hệ thống gửi báo cáo', { exact: false })).toBeVisible();
});
test('player CSP allows verified playlist and iframe origins; OG asset exists', async ({ request }) => {
  const response = await request.get('/');
  const csp = response.headers()['content-security-policy'];
  expect(csp).toMatch(/connect-src[^;]*https:\/\/a\.kvp726\.com/);
  expect(csp).toMatch(/frame-src[^;]*https:\/\/player\.phimapi\.com/);
  expect((await request.get('/images/og-banner.svg')).status()).toBe(200);
});
