import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const evidence = { sampledAt: new Date().toISOString(), outages: [], notes: {}, metadata: {}, playback: [], storage: {}, http: [] };
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();
  for (const path of ['/lich-chieu', '/danh-sach', '/', '/api/search?keyword=avengers']) {
    const r = await page.goto(`http://localhost:3202${path}`, { waitUntil: 'domcontentloaded' });
    evidence.outages.push({ path, status: r.status(), text: (await page.locator('main').innerText().catch(() => page.locator('body').innerText())).slice(0, 1500) });
  }
  const noteText = 'AUDIT: note belongs to KKPhim movie only';
  await page.goto('http://localhost:3201/phim/avengers-endgame?source=kkphim');
  await page.getByLabel('Ghi chú về', { exact: false }).fill(noteText);
  await page.getByRole('button', { name: 'Lưu ghi chú', exact: true }).click();
  evidence.notes.savedOnKkphim = await page.getByText(noteText, { exact: true }).isVisible();
  await page.goto('http://localhost:3201/phim/avengers-endgame?source=nguonc');
  evidence.notes.visibleOnNguonc = await page.getByText(noteText, { exact: true }).isVisible();
  evidence.notes.storageKeys = await page.evaluate(() => Object.keys(localStorage));
  await page.screenshot({ path: 'docs/audit-2026-11-03/screenshots/notes-collision.png', fullPage: true });
  await context.close();

  const blockedStorage = await browser.newContext();
  await blockedStorage.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Audit quota', 'QuotaExceededError'); }; });
  const storagePage = await blockedStorage.newPage();
  const consoleErrors = [];
  storagePage.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300)); });
  await storagePage.goto('http://localhost:3201/phim/avengers-endgame?source=kkphim');
  await storagePage.getByRole('link', { name: 'Xem Ngay', exact: true }).click();
  await storagePage.waitForTimeout(1000);
  evidence.storage = { consoleErrors, alerts: await storagePage.locator('[role="alert"]').allTextContents(), history: await storagePage.evaluate(() => localStorage.getItem('hnq_watch_history')) };
  await blockedStorage.close();

  const [kk, nc] = await Promise.all([
    fetch('https://phimapi.com/phim/loi-noi-doi-hoan-hao-2026-kr').then(r => r.json()),
    fetch('https://phim.nguonc.com/api/film/hoang-hau-tai-hon').then(r => r.json()),
  ]);
  evidence.metadata = { kk: { trailer_url: kk.movie.trailer_url, showtimes: kk.movie.showtimes, notify: kk.movie.notify }, nc: { casts: nc.movie.casts, director: nc.movie.director, category: nc.movie.category, created: nc.movie.created, modified: nc.movie.modified, time: nc.movie.time } };
  const live = await browser.newContext();
  const watch = await live.newPage();
  let current;
  watch.on('console', m => { if (['warning', 'error'].includes(m.type())) current?.console.push(m.text().slice(0, 700)); });
  watch.on('response', r => { if (r.status() >= 400) current?.httpErrors.push({ url: r.url(), status: r.status() }); });
  for (const slug of ['loi-noi-doi-hoan-hao-2026-kr', 'truyen-kinh-di-my-phan-13']) {
    current = { slug, console: [], httpErrors: [] };
    await watch.goto(`http://localhost:3200/xem-phim/${slug}?source=kkphim`, { waitUntil: 'domcontentloaded' });
    if (await watch.locator('video').count()) await watch.locator('video').evaluate(v => { v.muted = true; v.play().catch(() => {}); });
    await watch.waitForTimeout(16000);
    current.state = await watch.evaluate(() => ({ text: document.querySelector('main')?.innerText.slice(0, 850), video: [...document.querySelectorAll('video')].map(v => ({ time: v.currentTime, readyState: v.readyState, error: v.error?.code })), frames: [...document.querySelectorAll('iframe')].map(f => f.src) }));
    current.frames = [];
    for (const f of watch.frames().slice(1)) { try { current.frames.push({ url: f.url(), text: (await f.locator('body').innerText({ timeout: 1000 })).slice(0, 900), video: await f.locator('video').evaluateAll(videos => videos.map(v => ({ time: v.currentTime, readyState: v.readyState, error: v.error?.code }))) }); } catch (e) { current.frames.push({ url: f.url(), error: String(e) }); } }
    evidence.playback.push(current);
    console.log(JSON.stringify(current));
  }
  await live.close();
  for (const path of ['/robots.txt', '/sitemap.xml', '/api/search?keyword=avengers', '/api/mock/kkphim/anything', '/c/not-a-collection']) {
    const r = await fetch(`http://localhost:3200${path}`, { signal: AbortSignal.timeout(15000) });
    const body = await r.text();
    evidence.http.push({ path, status: r.status, headers: Object.fromEntries(['cache-control','x-content-type-options','retry-after'].map(k => [k, r.headers.get(k)])), hasNoindex: /name="robots" content="noindex"/.test(body), bodySample: body.slice(0, 180) });
  }
} finally { await browser.close(); await writeFile('docs/audit-2026-11-03/edge.json', JSON.stringify(evidence, null, 2)); }
console.log(JSON.stringify({ outages: evidence.outages, notes: evidence.notes, metadata: evidence.metadata, storage: evidence.storage, http: evidence.http }, null, 2));
