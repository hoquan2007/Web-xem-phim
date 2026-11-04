import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [375, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto('http://localhost:3200/xem-phim/loi-noi-doi-hoan-hao-2026?source=nguonc', { waitUntil: 'domcontentloaded' });
    await page.locator('video').waitFor();
    await page.locator('video').evaluate(video => { video.muted = true; void video.play().catch(() => {}); });
    await page.waitForTimeout(12000);
    const video = await page.locator('video').evaluate(video => ({ time: video.currentTime, readyState: video.readyState }));
    results.push({ width, video, coverage: await page.getByRole('status', { name: 'Tình trạng nguồn phát' }).innerText(), frames: await page.locator('iframe').count() });
    await page.goto('http://localhost:3200/xem-phim/hoang-hau-tai-hon?source=nguonc&sv=0&ep=1', { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'Tập này đang chờ nguồn phát', exact: true }).waitFor();
    results.push({ width, coverage: await page.getByRole('status', { name: 'Tình trạng nguồn phát' }).innerText(), selected: await page.locator('[aria-pressed="true"]').allTextContents(), video: await page.locator('video').count(), frames: await page.locator('iframe').count(), overflow: await page.evaluate(() => document.documentElement.scrollWidth - innerWidth) });
    await page.screenshot({ path: `docs/hls-expansion-2026-11-04/missing-${width}.png` });
    await page.close();
  }
} finally { await browser.close(); await writeFile('docs/hls-expansion-2026-11-04/browser.json', JSON.stringify(results, null, 2)); }
console.log(JSON.stringify(results, null, 2));
