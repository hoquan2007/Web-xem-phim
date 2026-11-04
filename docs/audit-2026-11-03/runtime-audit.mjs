import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';

const base = 'http://localhost:3200';
const out = 'docs/audit-2026-11-03';
await mkdir(`${out}/screenshots`, { recursive: true });
const evidence = { sampledAt: new Date().toISOString(), pages: [], playback: [], production: [], notes: [] };
const get = async url => { const r = await fetch(url, { signal: AbortSignal.timeout(18000) }); return r.json(); };
const [kkList, ncList] = await Promise.all([
  get('https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1'),
  get('https://phim.nguonc.com/api/films/phim-moi-cap-nhat?page=1'),
]);
const kkSlug = kkList.items[0].slug, ncSlug = ncList.items[0].slug;
const paths = ['/', '/phimhay', '/danh-sach', '/danh-sach?page=2', '/danh-sach?category=hanh-dong&country=han-quoc&year=2026', '/phim-le', '/phim-bo', '/chu-de',
  ...['phim-han-quoc-moi', 'phim-trung-quoc-moi', 'phim-hoat-hinh-anime', 'tv-shows-chuong-trinh-truyen-hinh', 'phim-chieu-rap-moi', 'phim-us-uk-moi', 'phim-thai-lan'].map(s => `/c/${s}`),
  '/the-loai/hanh-dong', '/quoc-gia/han-quoc', '/tim-kiem', '/tim-kiem?keyword=avengers', '/tim-kiem?keyword=zzzznonexistent987654321', '/lich-chieu', '/tu-phim',
  `/phim/${kkSlug}?source=kkphim`, `/phim/${ncSlug}?source=nguonc`, '/not-a-real-route', '/c/not-a-collection'];
const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [{ width: 1440, height: 960 }, { width: 375, height: 812 }]) {
    const context = await browser.newContext({ viewport, locale: 'vi-VN', reducedMotion: 'reduce' });
    await context.addInitScript(() => { window.auditCsp = []; document.addEventListener('securitypolicyviolation', e => window.auditCsp.push({ directive: e.violatedDirective, blockedURI: e.blockedURI })); });
    const page = await context.newPage();
    let current;
    page.on('pageerror', e => current?.errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error') current?.console.push(m.text().slice(0, 400)); });
    page.on('response', r => { if (r.status() >= 400) current?.httpErrors.push({ url: r.url(), status: r.status() }); });
    for (const path of paths) {
      current = { path, width: viewport.width, errors: [], console: [], httpErrors: [] };
      const start = performance.now();
      try {
        const response = await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded', timeout: 35000 });
        await page.waitForTimeout(650);
        current.status = response.status(); current.title = await page.title();
        Object.assign(current, await page.evaluate(() => ({
          h1: [...document.querySelectorAll('h1')].map(n => n.textContent),
          movieLinks: document.querySelectorAll('a[href^="/phim/"]').length,
          text: document.querySelector('main')?.innerText?.slice(0, 1300),
          overflow: document.documentElement.scrollWidth - innerWidth,
          brokenImages: [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.currentSrc).map(i => i.currentSrc).slice(0, 12),
          csp: window.auditCsp,
          canonical: document.querySelector('link[rel="canonical"]')?.href,
          ogUrl: document.querySelector('meta[property="og:url"]')?.content,
        })));
        if (['/', '/danh-sach', '/lich-chieu', '/tu-phim'].includes(path)) {
          const file = `${out}/screenshots/${path === '/' ? 'home' : path.slice(1)}-${viewport.width}.png`;
          await page.screenshot({ path: file, fullPage: false }); current.screenshot = file;
        }
      } catch (e) { current.error = String(e); }
      current.elapsedMs = Math.round(performance.now() - start);
      evidence.pages.push(current);
      console.log(`${viewport.width} ${path}: ${current.status ?? current.error}; links=${current.movieLinks}; overflow=${current.overflow}`);
    }
    if (viewport.width === 1440) {
      for (const [source, slug] of [['kkphim', kkSlug], ['nguonc', ncSlug]]) {
        current = { path: `/xem-phim/${slug}?source=${source}`, width: viewport.width, errors: [], console: [], httpErrors: [] };
        const response = await page.goto(`${base}${current.path}`, { waitUntil: 'domcontentloaded', timeout: 35000 });
        current.status = response.status();
        await page.waitForTimeout(14000);
        current.state = await page.evaluate(() => ({ csp: window.auditCsp, video: [...document.querySelectorAll('video')].map(v => ({ time: v.currentTime, readyState: v.readyState, error: v.error?.code })), frames: [...document.querySelectorAll('iframe')].map(f => f.src), text: document.querySelector('main')?.innerText.slice(0, 1500) }));
        current.frameBodies = [];
        for (const frame of page.frames().slice(1)) { try { current.frameBodies.push({ url: frame.url(), text: (await frame.locator('body').innerText({ timeout: 1500 })).slice(0, 1000) }); } catch (e) { current.frameBodies.push({ url: frame.url(), error: String(e) }); } }
        await page.screenshot({ path: `${out}/screenshots/watch-${source}.png`, fullPage: false });
        evidence.playback.push(current);
        console.log(`playback ${source}: ${JSON.stringify(current.state)}`);
      }
    }
    await context.close();
    await writeFile(`${out}/runtime.json`, JSON.stringify(evidence, null, 2));
  }
  for (const path of ['/', '/phimhay', '/danh-sach', '/tim-kiem?keyword=avengers', '/lich-chieu', '/robots.txt', '/sitemap.xml', '/api/mock/kkphim/danh-sach/phim-moi-cap-nhat']) {
    const started = performance.now();
    try {
      const r = await fetch(`https://hnqfilm.vercel.app${path}`, { signal: AbortSignal.timeout(20000) });
      const body = await r.text();
      evidence.production.push({ path, status: r.status, url: r.url, ms: Math.round(performance.now() - started), title: body.match(/<title>(.*?)<\/title>/)?.[1], csp: r.headers.get('content-security-policy'), vercelId: r.headers.get('x-vercel-id'), bodySample: body.slice(0, 120) });
    } catch (e) { evidence.production.push({ path, error: String(e) }); }
  }
} finally { await browser.close(); await writeFile(`${out}/runtime.json`, JSON.stringify(evidence, null, 2)); }
console.log(`Saved ${evidence.pages.length} page observations and ${evidence.playback.length} playback observations.`);
