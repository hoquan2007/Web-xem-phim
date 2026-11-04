import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

const browser = await chromium.launch();
const observations = [];
try {
  for (const width of [1440, 375]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await context.newPage();
    const row = { width, responses: [], errors: [] };
    page.on('response', response => {
      const url = new URL(response.url());
      if (url.hostname.endsWith('.streamc.xyz')) row.responses.push({ host: url.hostname, status: response.status() });
    });
    page.on('console', message => { if (message.type() === 'error') row.errors.push(message.text().slice(0, 250)); });
    await page.goto('http://localhost:3200/xem-phim/hoang-hau-tai-hon?source=nguonc', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(7000);
    row.recoveryVisible = await page.getByRole('button', { name: 'Thử nguồn cùng tập', exact: true }).isVisible();
    row.overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    row.frames = page.frames().slice(1).map(frame => new URL(frame.url()).hostname);
    await page.screenshot({ path: `docs/player-tooling-2026-11-04/player-${width}.png` });
    observations.push(row);
    await context.close();
  }
} finally {
  await browser.close();
  await writeFile('docs/player-tooling-2026-11-04/browser-results.json', JSON.stringify(observations, null, 2));
}
console.log(JSON.stringify(observations, null, 2));
