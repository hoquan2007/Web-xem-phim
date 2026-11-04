import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [375, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto('http://localhost:3200/xem-phim/loi-noi-doi-hoan-hao-2026?source=nguonc', { waitUntil: 'domcontentloaded' });
    await page.locator('video').waitFor({ timeout: 15000 });
    await page.locator('video').evaluate(video => { video.muted = true; void video.play().catch(() => {}); });
    await page.waitForTimeout(13000);
    const video = await page.locator('video').evaluate(video => ({ time: video.currentTime, readyState: video.readyState, error: video.error?.code }));
    results.push({ width, video, frames: await page.locator('iframe').count() });
    await page.screenshot({ path: `docs/upstream-resolution-2026-11-04/playback-${width}.png` });
    await page.goto('http://localhost:3200/phim/hoang-hau-tai-hon?source=nguonc', { waitUntil: 'domcontentloaded' });
    await page.getByText('Hiện chưa có nguồn phát khả dụng cho phim này. Vui lòng quay lại sau.', { exact: true }).waitFor({ state: 'visible', timeout: 15000 });
    results.push({ width, unavailableMessage: await page.getByText('Hiện chưa có nguồn phát khả dụng cho phim này. Vui lòng quay lại sau.', { exact: true }).isVisible(), frames: await page.locator('iframe').count() });
    await page.close();
  }
} finally {
  await browser.close();
  await writeFile('docs/upstream-resolution-2026-11-04/browser.json', JSON.stringify(results, null, 2));
}
console.log(JSON.stringify(results, null, 2));
