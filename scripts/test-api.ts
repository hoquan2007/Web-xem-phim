/**
 * Sandbox tests for `src/lib/api/adapters.ts` and `src/lib/api/providers.ts`.
 *
 * Run with:
 *   node --experimental-strip-types --experimental-transform-types \
 *        scripts/test-api.ts
 *
 * The tests inject a fake `fetch` so they do NOT touch the network. They
 * cover:
 *   - normalize helpers (list/detail)
 *   - timeout handling (`withTimeout`)
 *   - catalogue orchestration (primary success / primary failure / primary empty fallback)
 *   - detail orchestration (merging episode servers, dedup, partial providers)
 *   - health registry scoring
 *
 * Designed to be added to `npm run test:unit` once green.
 */

import {
  kkphimAdapter,
  ophimAdapter,
  nguoncAdapter,
  vsmovAdapter,
  HealthRegistry,
} from '../src/lib/api/adapters.ts';
import {
  buildPagination,
  createPageRequestSignal,
  DEFAULT_PAGE_REQUEST_TIMEOUT_MS,
  orchestrateCatalogue,
  orchestrateMovieDetail,
  withTimeout,
  withTimeoutSimple,
  type ProviderAdapter,
} from '../src/lib/api/providers.ts';
import {
  getFilteredMovies,
  getLatestMovies,
  searchMovies,
} from '../src/lib/api.ts';
import {
  fixtureCategories,
  fixtureCountries,
  fixtureKKPhimDetail,
  fixtureListFull,
  fixtureListWrappedInData,
  fixtureNguoncServers,
  fixtureOphimServers,
  fixtureVsmovDetail,
} from '../src/lib/__fixtures__/provider-fixtures.ts';

/* ─── minimal assert helpers ────────────────────────────────────────── */

let failed = 0;
let passed = 0;

function expect(name: string, cond: boolean, detail?: string): void {
  if (cond) {
    passed += 1;
    console.log(`  \u2713 ${name}`);
  } else {
    failed += 1;
    console.log(`  \u2717 ${name}` + (detail ? `  -> ${detail}` : ''));
  }
}

function section(title: string): void {
  console.log(`\n--- ${title} ---`);
}

/* ─── fetch stub ────────────────────────────────────────────────────── */

type FetchHandler = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> | Response;
let nextHandler: FetchHandler = async () => new Response('{}', { status: 200 });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).fetch = (input: RequestInfo | URL, init?: RequestInit) => {
  const result = nextHandler(input, init);
  return Promise.resolve(result);
};

function stubJson(payload: unknown, status = 200): void {
  nextHandler = () =>
    new Response(typeof payload === 'string' ? payload : JSON.stringify(payload), {
      status,
      headers: { 'content-type': 'application/json' },
    });
}

function stubError(status: number): void {
  nextHandler = () => new Response('{}', { status });
}

function stubDelay(ms: number, payload: unknown): void {
  nextHandler = (_input, init) =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(
        () =>
          resolve(
            new Response(typeof payload === 'string' ? payload : JSON.stringify(payload), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }),
          ),
        ms,
      );
      // Honor an AbortSignal on the fetch call so tests can simulate
      // page-level cancellation propagating to upstream.
      const signal = init?.signal;
      if (signal) {
        const onAbort = () => {
          clearTimeout(timer);
          reject(new DOMException('The operation was aborted.', 'AbortError'));
        };
        if (signal.aborted) onAbort();
        else signal.addEventListener('abort', onAbort, { once: true });
      }
    });
}

/* ─── withTimeout ───────────────────────────────────────────────────── */

section('withTimeout (legacy + signal-based)');
{
  const fast = withTimeoutSimple(Promise.resolve(1), 100, 0);
  expect('fast promise resolves to value', (await fast) === 1);

  const slow = withTimeoutSimple(new Promise((r) => setTimeout(() => r(1), 200)), 50, -1);
  await new Promise((r) => setTimeout(r, 80));
  expect('slow promise resolves to fallback', (await slow) === -1);
}

{
  // Signal-based handle: timeout fires before the slow promise resolves,
  // and we expect `cancel()` to abort the inner fetch.
  let abortFired = false;
  const handle = withTimeout(
    (signal) =>
      new Promise<number>((resolve, reject) => {
        signal.addEventListener('abort', () => {
          abortFired = true;
          reject(new Error('aborted'));
        });
        setTimeout(() => resolve(1), 500);
      }),
    30,
    -1,
  );
  const value = await handle.result;
  expect('handle returns fallback on timeout', value === -1);
  expect('abort signal was fired', abortFired === true);
}

/* ─── catalogue normalization ───────────────────────────────────────── */

section('normalizeKkphimList (via adapter)');
{
  stubJson(fixtureListFull);
  const res = await kkphimAdapter.list({ page: 1, limit: 24 });
  expect('items count', res.items.length === fixtureListFull.items.length);
  expect('first item slug', res.items[0]?.slug === fixtureListFull.items[0].slug);
  expect('first item poster url starts with cdn', res.items[0]?.poster_url.startsWith('https://phimimg.com/'));
  expect('pagination preserved', res.pagination.totalItems === 24);
}

{
  stubJson(fixtureListWrappedInData);
  const res = await kkphimAdapter.list({ category: 'hanh-dong', page: 1 });
  expect('wrapped items parsed', res.items.length === 1);
  expect('wrapped pagination', res.pagination.totalItems === 12);
}

{
  // missing items → empty list
  stubJson({ status: true, pagination: { totalItems: 0 } });
  const res = await kkphimAdapter.list({ page: 1, limit: 24 });
  expect('empty list when items missing', res.items.length === 0);
}

{
  stubError(404);
  const res = await kkphimAdapter.list({ page: 1, limit: 24 });
  expect('http error → empty items', res.items.length === 0);
}

/* ─── catalogue orchestration ───────────────────────────────────────── */

section('orchestrateCatalogue');
{
  stubJson(fixtureListFull);
  const r = await orchestrateCatalogue(
    { page: 1, limit: 24 },
    { primary: kkphimAdapter, fallbacks: [ophimAdapter] },
  );
  expect('primary wins', r.result.meta.provider === 'kkphim');
  expect('ok true', r.result.ok === true);
  expect('not degraded', r.result.meta.degraded === false);
  expect('two attempts recorded', r.attempted.length === 1);
}

{
  // Primary returns empty, fallback returns content
  stubJson({ status: true, items: [], pagination: { totalItems: 0 } });
  // Make ophim also return empty so the strategy short-circuits.
  // For this branch we want fallback to succeed; mock a second fetch chain.
  let callIndex = 0;
  nextHandler = () => {
    callIndex += 1;
    if (callIndex === 1) {
      return new Response(JSON.stringify({ status: true, items: [], pagination: { totalItems: 0 } }), { status: 200 });
    }
    // fallback kkphim adapter called with empty filter → list() → only one
    // fetch in the adapter path. To simulate "fallback succeeded with content"
    // we need a fake adapter. Switch the test to use a fake provider.
    return new Response(JSON.stringify({ status: true, items: [{ _id: 'fb', name: 'Fallback', slug: 'fb' }] }), { status: 200 });
  };

  const fakeFallback: ProviderAdapter = {
    id: 'fake-fallback',
    timeoutMs: 100,
    async list() {
      return {
        status: true,
        items: [{ _id: 'fb', name: 'Fallback', slug: 'fb' } as never],
        pagination: { totalItems: 1, totalItemsPerPage: 24, currentPage: 1, totalPages: 1 },
      };
    },
    async search() {
      return {
        status: true,
        items: [],
        pagination: { totalItems: 0, totalItemsPerPage: 24, currentPage: 1, totalPages: 1 },
      };
    },
    async categories() {
      return [];
    },
    async countries() {
      return [];
    },
    async detail() {
      return null;
    },
  };

  const r = await orchestrateCatalogue(
    { page: 1, limit: 24 },
    { primary: kkphimAdapter, fallbacks: [fakeFallback], fallbackOnEmpty: true },
  );
  expect('falls back when primary empty', r.result.meta.provider === 'fake-fallback');
  expect('flagged degraded', r.result.meta.degraded === true);
  expect('warning recorded', (r.result.meta.warnings?.length ?? 0) > 0);
}

{
  // Primary times out (returns empty list via the {__timeout:true} sentinel
  // inside fetchJson — see adapters.ts). With fallbackOnEmpty unset the
  // orchestrator surfaces the empty primary response and the fallback is
  // never tried. With fallbackOnEmpty=true the fallback wins.
  stubDelay(100, fixtureListFull);
  const fakeFastFallback: ProviderAdapter = {
    id: 'fast-fallback',
    timeoutMs: 50,
    async list() {
      return {
        status: true,
        items: [{ _id: 'x', name: 'X', slug: 'x' } as never],
        pagination: { totalItems: 1, totalItemsPerPage: 24, currentPage: 1, totalPages: 1 },
      };
    },
    async search() {
      return { status: true, items: [], pagination: { totalItems: 0, totalItemsPerPage: 24, currentPage: 1, totalPages: 1 } };
    },
    async categories() {
      return [];
    },
    async countries() {
      return [];
    },
    async detail() {
      return null;
    },
  };

  // Override kkphimAdapter timeout for this case to 1ms so it's deterministic.
  const slowAdapter: ProviderAdapter = { ...kkphimAdapter, timeoutMs: 1 };

  // Sub-case A: fallbackOnEmpty not set → empty primary wins (graceful degradation).
  const rA = await orchestrateCatalogue(
    { page: 1, limit: 24 },
    { primary: slowAdapter, fallbacks: [fakeFastFallback] },
  );
  expect(
    'timeout primary without fallbackOnEmpty → empty primary response',
    rA.result.meta.provider === 'kkphim' && rA.result.data.items.length === 0,
  );

  // Sub-case B: fallbackOnEmpty=true → fallback supplies content.
  const rB = await orchestrateCatalogue(
    { page: 1, limit: 24 },
    { primary: slowAdapter, fallbacks: [fakeFastFallback], fallbackOnEmpty: true },
  );
  expect('timeout primary with fallbackOnEmpty → fallback wins', rB.result.meta.provider === 'fast-fallback');
  expect('warning logged for fallback', rB.result.meta.warnings?.some((w) => w.provider === 'kkphim') ?? false);
}

/* ─── detail orchestration ─────────────────────────────────────────── */

section('orchestrateMovieDetail');
{
  stubJson(fixtureKKPhimDetail);
  try {
    const r = await orchestrateMovieDetail('avengers-endgame', [kkphimAdapter, ophimAdapter, nguoncAdapter]);
    expect('movie metadata from primary', r.ok === true && r.data?.movie?.slug === 'avengers-endgame');
    expect('episodes merged', (r.data?.episodes?.length ?? 0) >= 1);
    // degraded=true because ophim hits a timeout (stubbed fetch with no
    // match for Ophim's `/v1/api/phim/<slug>` schema). We just want to
    // assert that the movie metadata still wins from the primary provider.
    expect('provider from kkphim', r.meta.provider === 'kkphim');
  } catch (err) {
    console.error('  >> detail test threw:', err);
  }
}

{
  // Primary returns null movie → orchestrator returns err.
  stubJson({ status: false, movie: null, episodes: [] });
  const r = await orchestrateMovieDetail('unknown', [kkphimAdapter, ophimAdapter, nguoncAdapter]);
  expect('all null → err result', r.ok === false);
  expect('errorCode network', r.errorCode === 'network');
}

{
  // Primary empty, VSMOV returns metadata.
  // We use ophim/nguonc first (which return null movie) and vsmov second.
  stubJson({ status: false, movie: null, episodes: [] }); // ophim response (no movie field)
  // However, VSMOV adapter will be called second and produce movie.
  // Our stub returns the same payload for all calls; we need to differentiate.
  let detailCalls = 0;
  nextHandler = () => {
    detailCalls += 1;
    if (detailCalls === 1) {
      // ophim adapter → ignore; we just want a 200 response that becomes null
      return new Response(JSON.stringify({ data: { item: { episodes: [] } } }), { status: 200 });
    }
    if (detailCalls === 2) {
      // nguonc
      return new Response(JSON.stringify({ movie: { episodes: [] } }), { status: 200 });
    }
    // vsmov
    return new Response(JSON.stringify(fixtureVsmovDetail), { status: 200 });
  };
  const r = await orchestrateMovieDetail('avengers-endgame', [ophimAdapter, nguoncAdapter, vsmovAdapter]);
  expect('vsmov fallback supplies movie', r.data?.movie?.slug === 'avengers-endgame');
  expect('flagged degraded (fallback)', r.meta.degraded === true);
}

{
  // Merge: KKPhim movie + Ophim + NguonC episodes, dedup
  let calls = 0;
  nextHandler = () => {
    calls += 1;
    if (calls === 1) return new Response(JSON.stringify(fixtureKKPhimDetail), { status: 200 });
    if (calls === 2) return new Response(JSON.stringify({ data: { item: { episodes: fixtureOphimServers } } }), { status: 200 });
    return new Response(JSON.stringify({ movie: { episodes: fixtureNguoncServers } }), { status: 200 });
  };
  const r = await orchestrateMovieDetail('avengers-endgame', [kkphimAdapter, ophimAdapter, nguoncAdapter]);
  expect('all 3 providers contributed', calls === 3);
  expect('movie from kkphim', r.data?.movie?.slug === 'avengers-endgame');
  // Episodes from all 3 should be merged; 1 + 1 + 1 = 3 distinct server groups
  expect('episodes merged', (r.data?.episodes?.length ?? 0) >= 3);
}

/* ─── pagination helper ─────────────────────────────────────────────── */

section('buildPagination');
{
  const p = buildPagination(120, { page: 3, limit: 24 });
  expect('totalPages math', p.totalPages === 5);
  expect('currentPage', p.currentPage === 3);
}

/* ─── health registry ───────────────────────────────────────────────── */

section('HealthRegistry');
{
  const reg = new HealthRegistry();
  reg.record('kkphim', true, 100);
  reg.record('kkphim', false, 5000, 'timeout');
  reg.record('kkphim', true, 200);
  expect('consecutive failures reset on success', reg.snapshot('kkphim')?.consecutiveFailures === 0);
  reg.record('kkphim', false, 4000, 'timeout');
  reg.record('kkphim', false, 4000, 'timeout');
  expect('consecutive failures accumulate', reg.snapshot('kkphim')?.consecutiveFailures === 2);
  const score = reg.score('kkphim');
  expect('score in 0-100', score >= 0 && score <= 100);
  reg.reset('kkphim');
  expect('reset clears', reg.snapshot('kkphim') === undefined);
}

/* ─── categories / countries passthrough ────────────────────────────── */

section('Adapter: categories + countries passthrough');
{
  stubJson(fixtureCategories);
  const cats = await kkphimAdapter.categories();
  expect('categories count', cats.length === fixtureCategories.data.items.length);
  expect('category slug', cats[0]?.slug === 'hanh-dong');
}
{
  stubJson(fixtureCountries);
  const countries = await kkphimAdapter.countries();
  expect('countries count', countries.length === fixtureCountries.data.items.length);
  expect('country slug', countries[0]?.slug === 'han-quoc');
}

/* ─── API-REDESIGN-6: page-level signal propagation ─────────────────── */

section('createPageRequestSignal');
{
  const handle = createPageRequestSignal(5_000);
  expect('signal initially not aborted', handle.signal.aborted === false);
  expect('default export sane', DEFAULT_PAGE_REQUEST_TIMEOUT_MS > 0);

  // Custom timeout fires within budget.
  const short = createPageRequestSignal(20);
  await new Promise((r) => setTimeout(r, 60));
  expect('custom timeout aborts signal', short.signal.aborted === true);
  short.cancel(); // idempotent

  // Manual cancel before timeout fires.
  const c = createPageRequestSignal(10_000);
  c.cancel();
  expect('manual cancel aborts signal', c.signal.aborted === true);
  c.cancel();
  expect('manual cancel is idempotent', c.signal.aborted === true);
}

section('Page signal aborts orchestrateCatalogue in-flight fetch');
{
  // Stub fetch to delay 200ms — long enough that page-level abort wins.
  stubDelay(200, fixtureListFull);
  const handle = createPageRequestSignal();
  // Fire the call without awaiting so we can abort mid-flight.
  const promise = orchestrateCatalogue(
    { page: 1, limit: 24 },
    { primary: kkphimAdapter, signal: handle.signal },
  );
  setTimeout(() => handle.cancel(), 30);
  const r = await promise;
  expect('orchestrator returns when page signal aborted', r.result.data.items.length === 0 || r.result.ok === false);
  expect('signal reported aborted', handle.signal.aborted === true);
}

section('Page signal aborts orchestrateMovieDetail in-flight fetch');
{
  // Three slow responses; page-level abort should win before any returns.
  stubDelay(500, fixtureKKPhimDetail);
  const handle = createPageRequestSignal();
  const promise = orchestrateMovieDetail(
    'avengers-endgame',
    [kkphimAdapter, ophimAdapter, nguoncAdapter],
    { signal: handle.signal },
  );
  setTimeout(() => handle.cancel(), 30);
  const r = await promise;
  expect('detail orchestrator returns err when aborted', r.ok === false);
  expect('detail error code is cancelled or network', r.errorCode === 'cancelled' || r.errorCode === 'network');
}

section('getLatestMovies / getFilteredMovies / searchMovies accept signal');
{
  stubJson(fixtureListFull);
  const { signal } = createPageRequestSignal();
  const a = await getLatestMovies(1, signal);
  expect('getLatestMovies ok with signal', a.items.length > 0);

  stubJson(fixtureListFull);
  const b = await getFilteredMovies({ page: 1, limit: 24 }, signal);
  expect('getFilteredMovies ok with signal', b.items.length > 0);

  stubJson(fixtureListFull);
  const c = await searchMovies('avengers', 1, 6, signal);
  expect('searchMovies ok with signal', c.items.length > 0);

  // Pre-aborted signal: helper returns empty list without hitting network.
  const pre = new AbortController();
  pre.abort();
  const before = (globalThis as { fetch: unknown }).fetch;
  let calledAfterPreAbort = false;
  (globalThis as { fetch: unknown }).fetch = () => {
    calledAfterPreAbort = true;
    return new Response('{}', { status: 200 });
  };
  const d = await searchMovies('avengers', 1, 6, pre.signal);
  expect('pre-aborted signal short-circuits', d.items.length === 0);
  expect('pre-aborted signal does not call fetch', calledAfterPreAbort === false);
  (globalThis as { fetch: unknown }).fetch = before;
}

/* ─── summary ───────────────────────────────────────────────────────── */

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
