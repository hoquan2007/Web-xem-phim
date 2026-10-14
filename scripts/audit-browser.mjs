// Production browser audit; requires `next start -p 3200`.
import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';

const live = JSON.parse(await readFile('docs/audit-2026-10-14/live-results.json', 'utf8'));
const slug = live.results.find(row => row.provider === 'kkphim' && row.operation === 'latest').samples[0].slug;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
const evidence = { generatedAt: new Date().toISOString(), slug, console: [], requestFailures: [], errorResponses: [], pages: [] };
page.on('console', message => {
  if (['error', 'warning'].includes(message.type())) evidence.console.push({ type: message.type(), text: message.text().slice(0, 650) });
});
page.on('pageerror', error => evidence.console.push({ type: 'pageerror', text: String(error) }));
page.on('requestfailed', request => evidence.requestFailures.push({ url: request.url(), error: request.failure()?.errorText }));
page.on('response', response => { if (response.status() >= 400) evidence.errorResponses.push({ url: response.url(), status: response.status() }); });
await page.addInitScript(() => {
  window.auditViolations = [];
  document.addEventListener('securitypolicyviolation', event => window.auditViolations.push({ directive: event.violatedDirective, blockedURI: event.blockedURI }));
});
try {
  const home = await page.goto('http://localhost:3200/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  evidence.pages.push({ path: '/', status: home.status(), movieLinks: await page.locator('a[href^="/phim/"]').count(), violations: await page.evaluate(() => window.auditViolations) });
  await page.locator('header input').first().fill('avengers');
  await page.waitForTimeout(3500);
  evidence.liveSearch = { dropdownLinks: await page.locator('header a[href^="/phim/"]').count(), text: (await page.locator('header').innerText()).slice(-650), violations: await page.evaluate(() => window.auditViolations) };
  await page.locator('header input').first().blur();
  await page.locator('header input').first().focus();
  await page.waitForTimeout(1000);
  evidence.liveSearchAfterRefocus = { dropdownLinks: await page.locator('header a[href^="/phim/"]').count(), text: (await page.locator('header').innerText()).slice(-650) };
  const watch = await page.goto(`http://localhost:3200/phim/${slug}`, { waitUntil: 'domcontentloaded' });
  if (await page.locator('video').count()) await page.locator('video').evaluate(video => { video.muted = true; void video.play().catch(() => {}); });
  await page.waitForTimeout(16500);
  evidence.playback = await page.locator('video').count() ? await page.locator('video').evaluate(video => ({ currentTime: video.currentTime, readyState: video.readyState, buffered: video.buffered.length, error: video.error?.code })) : null;
  evidence.pages.push({ path: `/phim/${slug}`, status: watch.status(), title: await page.title(), violations: await page.evaluate(() => window.auditViolations), videoCount: await page.locator('video').count(), iframeCount: await page.locator('iframe').count(), unavailable: await page.getByText('Server không khả dụng', { exact: true }).count(), playerText: (await page.locator('main').last().innerText()).slice(0, 850) });
  evidence.extraRoutes = [];
  for (const path of ['/images/og-banner.svg', '/api/mock/kkphim/danh-sach/phim-moi-cap-nhat']) {
    const response = await context.request.get(`http://localhost:3200${path}`);
    evidence.extraRoutes.push({ path, status: response.status() });
  }
} finally {
  await browser.close();
  await writeFile(process.argv[2] || 'docs/audit-2026-10-14/browser-results.json', JSON.stringify(evidence, null, 2) + '\n');
}
console.log(JSON.stringify({ pages: evidence.pages, liveSearch: evidence.liveSearch, playback: evidence.playback, extraRoutes: evidence.extraRoutes, consoleCount: evidence.console.length, failedRequests: evidence.requestFailures.length }, null, 2));
