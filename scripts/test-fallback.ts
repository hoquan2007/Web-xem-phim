import { chromium } from '@playwright/test';

const BASE = 'http://localhost:3000';

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'vi-VN',
  });
  const page = await ctx.newPage();

  const events: string[] = [];
  page.on('response', (resp) => {
    const status = resp.status();
    const url = resp.url();
    if (status === 404 && !url.includes('favicon')) {
      events.push(`[404] ${url}`);
    } else if (status === 200 && (url.includes('phim.nguonc.com') || url.includes('phimimg.com'))) {
      // only log first few
    }
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      events.push(`[ERR] ${msg.text().slice(0, 200)}`);
    }
  });

  console.log('--- TEST: homepage image fallback chain ---');
  const resp = await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 30000 });
  console.log(`HTTP: ${resp?.status()}`);
  await page.waitForTimeout(3000);

  // count broken images
  const imgStats = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    const broken = imgs.filter((i) => i.naturalWidth === 0 && i.complete);
    const uniqueBroken = new Set(
      broken.map((i) => i.currentSrc || i.src),
    );
    return {
      total: imgs.length,
      broken: broken.length,
      brokenUrls: Array.from(uniqueBroken),
    };
  });

  console.log(`Total <img> tags: ${imgStats.total}`);
  console.log(`Broken images: ${imgStats.broken}`);
  if (imgStats.brokenUrls.length > 0) {
    console.log('Broken URLs:');
    for (const u of imgStats.brokenUrls) {
      console.log(`  - ${u}`);
    }
  }
  console.log('---');
  console.log(`404 events: ${events.filter((e) => e.startsWith('[404]')).length}`);
  events.filter((e) => e.startsWith('[404]')).forEach((e) => console.log(`  ${e}`));

  await browser.close();
})();
