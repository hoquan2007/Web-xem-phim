import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { kkphimAdapter, nguoncAdapter, providerHealth, buildKkphimListUrl, buildOphimListUrl, buildNguoncListUrl } from '../src/lib/api/adapters.ts';
import { orchestrateCatalogue, orchestrateMovieDetail, withTimeout, type ProviderAdapter } from '../src/lib/api/providers.ts';
import { ProviderError } from '../src/lib/api/errors.ts';
import { getImageUrl, getImageFallbackChain, sameMovie, getMovieHref } from '../src/lib/api/helpers.ts';
import { isStoredMovie, isStoredHistory } from '../src/lib/storage.ts';
import { getCategories } from '../src/lib/api.ts';
import { isConfiguredRemoteImage, shouldBypassImageOptimizer } from '../src/lib/image-policy.ts';

const originalFetch = globalThis.fetch;
beforeEach(() => providerHealth.reset());
after(() => { globalThis.fetch = originalFetch; });
const pagination = { totalItems: 1, totalItemsPerPage: 24, currentPage: 1, totalPages: 1 };
const movie = { _id: 'test', name: 'Real Title', origin_name: 'Original', slug: 'primary-slug', poster_url: '', thumb_url: '', year: 2024, type: 'series', content: '', status: 'ongoing', tmdb: { id: '307106', type: 'tv', season: 1 } };
const full = { status: true, items: [movie], pagination };
function adapter(id: string, overrides: Partial<ProviderAdapter> = {}): ProviderAdapter {
  return { id, timeoutMs: 40, list: async () => full, search: async () => full, categories: async () => [], countries: async () => [], detail: async () => ({ status: true, movie, episodes: [] }), ...overrides };
}
test('HTTP 503 falls back even when fallbackOnEmpty is false, preserving diagnostics', async () => {
  globalThis.fetch = async () => new Response('', { status: 503 });
  const r = await orchestrateCatalogue({}, { primary: kkphimAdapter!, fallbacks: [adapter('fallback')], fallbackOnEmpty: false });
  assert.equal(r.result.meta.provider, 'fallback'); assert.equal(r.result.meta.degraded, true);
  assert.equal(r.attempted[0].errorCode, 'http_error');
});
test('network rejection falls back rather than escaping to the page', async () => {
  const r = await orchestrateCatalogue({}, { primary: adapter('down', { list: async () => { throw new TypeError('fetch failed'); } }), fallbacks: [adapter('healthy')] });
  assert.equal(r.result.meta.provider, 'healthy');
});
test('success-empty is not an outage and does not invoke fallback', async () => {
  let calls = 0;
  const r = await orchestrateCatalogue({}, { primary: adapter('empty', { list: async () => ({ ...full, items: [] }) }), fallbacks: [adapter('other', { list: async () => { calls++; return full; } })] });
  assert.equal(r.result.ok, true); assert.equal(calls, 0);
});
test('failure-empty is not treated as success', async () => {
  const r = await orchestrateCatalogue({}, { primary: adapter('failed', { list: async () => ({ ...full, status: false, items: [] }) }), fallbacks: [adapter('healthy')] });
  assert.equal(r.result.meta.provider, 'healthy');
});
test('transport retains HTTP status and rejects invalid JSON/schema', async () => {
  globalThis.fetch = async () => new Response('', { status: 429, headers: { 'Retry-After': '1' } });
  await assert.rejects(() => kkphimAdapter!.list({}), e => e instanceof ProviderError && e.status === 429 && e.retryAfterMs === 1000);
  providerHealth.reset(); globalThis.fetch = async () => new Response('<html>stopped</html>');
  await assert.rejects(() => kkphimAdapter!.list({}), e => e instanceof ProviderError && e.code === 'schema_invalid');
  providerHealth.reset(); globalThis.fetch = async () => Response.json({ status: true, items: 'wrong' });
  await assert.rejects(() => kkphimAdapter!.list({}), e => e instanceof ProviderError && e.code === 'schema_invalid');
});
test('timeout aborts actual fetch and total catalogue deadline is respected', async () => {
  let aborted = false;
  globalThis.fetch = (_url, options) => new Promise((_resolve, reject) => options?.signal?.addEventListener('abort', () => { aborted = true; reject(options.signal!.reason); }, { once: true }));
  const started = Date.now();
  const r = await orchestrateCatalogue({}, { primary: { ...kkphimAdapter!, timeoutMs: 200 }, fallbacks: [adapter('other')], totalTimeoutMs: 20 });
  assert.equal(aborted, true); assert.ok(Date.now() - started < 150); assert.equal(r.result.ok, false);
});
test('page cancellation settles a provider that ignores signals', async () => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 5);
  const r = await orchestrateCatalogue({}, { primary: adapter('stuck', { list: async () => new Promise(() => {}) }), signal: controller.signal });
  assert.equal(r.result.errorCode, 'cancelled');
});
test('timeout cancels a stalled response body as well as connection establishment', async () => {
  let cancelled = false;
  globalThis.fetch = async () => new Response(new ReadableStream({ cancel() { cancelled = true; } }));
  await assert.rejects(() => ({ ...kkphimAdapter!, timeoutMs: 10 }).list({}), e => e instanceof ProviderError && e.code === 'timeout');
  assert.equal(cancelled, true);
});
test('NguonC preserves real metadata, native source and native pagination', async () => {
  globalThis.fetch = async url => String(url).includes('/api/film/') ? Response.json({ status: 'success', movie: { ...movie, slug: 'native-slug', original_name: 'Native Original', origin_name: undefined, episodes: [{ server_name: 'Vietsub', items: [{ name: '1', embed: 'https://embed15.streamc.xyz/embed.php?hash=abc' }] }] } }) : Response.json({ status: 'success', items: [{ ...movie, original_name: 'Native Original', origin_name: undefined }], paginate: { total_items: 31, items_per_page: 10, current_page: 2, total_page: 4 } });
  const detail = await nguoncAdapter!.detail('native-slug');
  assert.equal(detail!.movie.name, 'Real Title'); assert.equal(detail!.movie.year, 2024); assert.equal(detail!.movie.origin_name, 'Native Original'); assert.equal(detail!.movie.source, 'nguonc');
  assert.equal(detail!.episodes[0].server_data.length, 1);
  const list = await nguoncAdapter!.list({ page: 2 });
  assert.equal(list.pagination.totalItemsPerPage, 10); assert.equal(list.pagination.currentPage, 2); assert.equal(list.pagination.totalPages, 4);
});
test('enrichment uses a matched native slug and rejects a different season', async () => {
  let usedSlug;
  const nc = adapter('nguonc', { search: async () => ({ ...full, items: [{ ...movie, slug: 'nc-slug' }, { ...movie, slug: 'wrong-season', tmdb: { ...movie.tmdb, season: 2 } }] }), detail: async slug => { usedSlug = slug; return { status: true, movie: { ...movie, slug, source: 'nguonc' }, episodes: [] }; } });
  const r = await orchestrateMovieDetail('primary-slug', [adapter('kkphim'), nc]);
  assert.equal(r.ok, true); assert.equal(usedSlug, 'nc-slug');
  assert.equal(sameMovie(movie, { ...movie, tmdb: { ...movie.tmdb, season: 2 } }), false);
});
test('a source-qualified slug never resolves to a different provider on failure', async () => {
  let wrongCalls = 0;
  const r = await orchestrateMovieDetail('native', [adapter('kkphim', { detail: async () => { wrongCalls++; return { status: true, movie, episodes: [] }; } }), adapter('nguonc', { detail: async () => { throw new ProviderError('http_error', '503', 503); } })], { source: 'nguonc' });
  assert.equal(r.ok, false); assert.equal(r.errorCode, 'network'); assert.equal(wrongCalls, 0);
});
test('confirmed 404 differs from an upstream outage', async () => {
  const absent = await orchestrateMovieDetail('missing', [adapter('a', { detail: async () => { throw new ProviderError('not_found', '404', 404); } })]);
  assert.equal(absent.errorCode, 'not_found');
  const outage = await orchestrateMovieDetail('missing', [adapter('a', { detail: async () => { throw new Error('offline'); } })]);
  assert.equal(outage.errorCode, 'network');
});
test('validated identity in a link resolves a different native slug during a primary outage', async () => {
  const primary = adapter('kkphim', { detail: async () => { throw new ProviderError('http_error', '503', 503); } });
  let used;
  const fallback = adapter('nguonc', { search: async () => ({ ...full, items: [{ ...movie, slug: 'nc-native' }] }), detail: async slug => { used = slug; return { status: true, movie: { ...movie, slug, source: 'nguonc' }, episodes: [] }; } });
  const result = await orchestrateMovieDetail('kk-native', [primary, fallback], { source: 'kkphim', reference: { identity: 'tv:307106:1', title: 'Original' } });
  assert.equal(result.ok, true); assert.equal(used, 'nc-native'); assert.equal(result.data!.movie.source, 'nguonc');
});
test('year-only uses the verified v1 browse endpoint; OPhim preserves combined filters', () => {
  assert.ok(buildKkphimListUrl({ year: 2024 }).includes('/v1/api/danh-sach/phim-moi-cap-nhat'));
  const query = new URL(buildOphimListUrl({ category: 'hanh-dong', country: 'han-quoc', type: 'series', year: 2024, sort_field: 'year', sort_type: 'asc', limit: 6 })).searchParams;
  for (const key of ['country', 'type', 'year', 'sort_field', 'sort_type', 'limit']) assert.ok(query.has(key));
  assert.throws(() => buildNguoncListUrl({ country: 'han-quoc', year: 2024 }), e => e instanceof ProviderError && e.code === 'unsupported');
});
test('taxonomy outage returns a verified snapshot rather than a blank menu', async () => {
  globalThis.fetch = async () => new Response('', { status: 503 });
  assert.ok((await getCategories()).some(category => category.slug === 'hanh-dong'));
});
test('empty and unrelated image paths do not fabricate CDN URLs', () => {
  assert.equal(getImageUrl(''), '/images/placeholder.svg');
  assert.deepEqual(getImageFallbackChain('https://image.ophim1.com/uploads/movies/only.jpg'), []);
  assert.equal(getMovieHref({ slug: 'native', source: 'nguonc' }), '/phim/native?source=nguonc');
});

test('new poster CDN is scoped to the HTTPS Dan Viet content path', () => {
  const src = 'https://i.ex-cdn.com/danviet.vn/files/content/2026/08/13/final--poster-phu-sa-1012.jpg';
  assert.equal(isConfiguredRemoteImage(src), true);
  for (const other of [src.replace('https:', 'http:'), src.replace('i.ex-cdn.com', 'i.ex-cdn.com:8443'), src.replace('/danviet.vn/', '/other-site/')]) {
    assert.equal(isConfiguredRemoteImage(other), false);
  }
});

test('unconfigured image hosts, protocols and paths bypass the throwing Next loader', () => {
  for (const src of [
    'https://unconfigured.example/poster.jpg',
    'https://img.nguonc.com/unconfigured/poster.jpg',
    'http://image.ophim1.com/poster.jpg',
    'https://image.ophim1.com.evil.example/poster.jpg',
    '/images/placeholder.svg',
    '',
  ]) assert.equal(shouldBypassImageOptimizer(src), true, src);
  assert.equal(shouldBypassImageOptimizer('https://image.ophim1.com/poster.jpg'), false);
  assert.equal(shouldBypassImageOptimizer('https://cdn.phimapi.com/poster.jpg'), false);
  assert.equal(shouldBypassImageOptimizer('https://phimimg.com/poster.jpg'), true);
});
test('corrupt stored items and invalid timestamps are rejected', () => {
  assert.equal(isStoredMovie(null), false); assert.equal(isStoredMovie({ slug: 'x' }), false);
  assert.equal(isStoredHistory({ ...movie, watched_at: 'broken' }), false);
  assert.equal(isStoredHistory({ ...movie, watched_at: new Date().toISOString() }), true);
});
test('circuit breaker counts only outages for the actual provider operation', () => {
  for (let i = 0; i < 3; i++) providerHealth.record('nc:detail', false, 10, 'not_found');
  assert.equal(providerHealth.available('nc:detail'), true);
  for (let i = 0; i < 3; i++) providerHealth.record('kk:search', false, 10, 'network');
  assert.equal(providerHealth.available('kk:search'), false); assert.equal(providerHealth.available('nc:search'), true);
});
test('timeout helper resolves cancellation immediately', async () => {
  const handle = withTimeout(async () => new Promise(() => {}), 10000, 'cancelled');
  handle.cancel(); assert.equal(await handle.result, 'cancelled');
});
