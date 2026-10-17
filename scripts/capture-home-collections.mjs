import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const output = 'docs/research/rophim/remaining-homepage-2026-10-16';
await mkdir(`${output}/screenshots`, { recursive: true });
const browser = await chromium.launch();
const evidence = [];
try {
  for (const width of [375, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, locale: 'vi-VN', reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://localhost:3000/phimhay');
    for (const [name, selector] of [
      ['ranked-series', '.ranked-section:first-of-type'],
      ['ranked-movies', '.ranked-section'],
      ['featured-anime', '#home-featured-anime'],
      ['featured-tv', '#home-featured-tv'],
    ]) {
      const section = name === 'ranked-series' ? page.locator('.ranked-section').nth(0) : name === 'ranked-movies' ? page.locator('.ranked-section').nth(1) : page.locator(selector);
      await section.scrollIntoViewIfNeeded();
      if (name === 'featured-anime') await section.getByRole('button', { name: /^Chọn phim / }).nth(1).click();
      await section.scrollIntoViewIfNeeded();
      if (name.startsWith('featured-')) {
        const image = section.locator('.featured-collection-art img');
        await image.evaluate(async node => { await node.decode(); });
      }
      await page.waitForFunction(() => [...document.querySelectorAll('main img')].filter(image => {
        const rect = image.getBoundingClientRect(), css = getComputedStyle(image);
        return css.display !== 'none' && rect.width > 0 && rect.height > 0 && rect.top < innerHeight && rect.bottom > 0 && rect.left < innerWidth && rect.right > 0;
      }).every(image => image.complete && image.naturalWidth > 0));
      const file = `${output}/screenshots/${name}-${width}.png`;
      await section.screenshot({ path: file });
      evidence.push({ name, width, file, title: await section.locator('h2').innerText(), selected: await section.locator('h3').first().innerText(), overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), errors: [...errors] });
    }
    await context.close();
  }
} finally {
  await browser.close();
}
await writeFile(`${output}/LIVE-QA.json`, JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify(evidence, null, 2));
