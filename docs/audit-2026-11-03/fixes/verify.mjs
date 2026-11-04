import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const result = { pages: [], playback: [], traffic: [] };
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const path of ['/robots.txt', '/sitemap.xml', '/api/health', '/phimhay', '/lich-chieu']) {
    const response = await page.goto(`http://localhost:3200${path}`);
    result.pages.push({ path, status: response.status(), canonical: await page.locator('link[rel=canonical]').getAttribute('href').catch(() => null) });
  }
  await page.goto('http://localhost:3202/lich-chieu');
  result.outage = await page.locator('main').innerText();
  for (const slug of ['loi-noi-doi-hoan-hao-2026-kr', 'truyen-kinh-di-my-phan-13']) {
    await page.goto(`http://localhost:3200/xem-phim/${slug}?source=kkphim`);
    if (await page.locator('video').count()) await page.locator('video').evaluate(v => { v.muted = true; void v.play().catch(() => {}); });
    await page.waitForTimeout(16000);
    result.playback.push({ slug, video: await page.locator('video').evaluateAll(vs => vs.map(v => ({ time: v.currentTime, readyState: v.readyState }))), text: (await page.locator('main').innerText()).slice(0, 300) });
  }
  for (const blockPrefetch of [false, true]) {
    const context = await browser.newContext({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
    const p = await context.newPage();
    let prefetch = 0, videos = 0;
    p.on('request', r => { if (r.headers()['next-router-prefetch']) prefetch++; if (/\.mp4/.test(r.url())) videos++; });
    if (blockPrefetch) await p.route('**/*', route => route.request().headers()['next-router-prefetch'] ? route.abort() : route.continue());
    await p.goto('http://localhost:3200/phimhay');
    await p.waitForTimeout(2000);
    result.traffic.push({ blockPrefetch, prefetch, videos, timings: await p.evaluate(() => performance.getEntriesByType('resource').reduce((a, r) => ({ count: a.count + 1, transferred: a.transferred + r.transferSize }), { count: 0, transferred: 0 })) });
    await p.screenshot({ path: `docs/audit-2026-11-03/fixes/mobile-${blockPrefetch}.png` });
    await context.close();
  }
} finally { await browser.close(); await writeFile('docs/audit-2026-11-03/fixes/live-verification.json', JSON.stringify(result, null, 2)); }
console.log(JSON.stringify(result, null, 2));
