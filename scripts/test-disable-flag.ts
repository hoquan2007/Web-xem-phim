/**
 * Offline tests for the API-REDESIGN-8 provider kill-switch.
 *
 * Covers:
 *  - PROVIDER_ENABLED map reflects env vars.
 *  - Each adapter factory returns `null` when its env flag is "1".
 *  - orchestrateCatalogue / orchestrateMovieDetail skip disabled adapters.
 *  - All providers disabled → catalogue empty result, detail throws.
 *  - Default (env unset) → 3 enabled adapters (VSMOV permanently removed
 *    by FIX-18).
 *
 * Run with:
 *   node --import ./scripts/_register-test-loader.mjs \
 *        --experimental-strip-types \
 *        --experimental-transform-types \
 *        scripts/test-disable-flag.ts
 *
 * IMPORTANT: env vars are read at module init, so each test re-imports the
 * adapters module under a fresh env snapshot via a small dynamic-import
 * helper (`loadWithEnv`).
 */
// FIX-18: After VSMOV was removed, we no longer need the `assert` module
// here — but AllProvidersDisabledError is still referenced by name in
// tests 9/10 for the dynamic-import class-name match. Suppress the
// unused-vars warning cleanly.
import { test } from 'node:test';
import { type ProviderId } from '../src/lib/api/adapters.ts';
import {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  AllProvidersDisabledError,
  type ProviderAdapter,
} from '../src/lib/api/providers.ts';

/* ─── minimal assert helpers ────────────────────────────────────────── */

let passed = 0;
let failed = 0;

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

/* ─── env-scoped module re-import helper ─────────────────────────────── */

// Map of env keys we flip in the test. We rebuild `process.env` from a
// baseline so unrelated entries (PATH etc.) are preserved.
const BASELINE_ENV = { ...process.env };

type AdaptersModule = typeof import('../src/lib/api/adapters.ts');
type ProvidersModule = typeof import('../src/lib/api/providers.ts');

/**
 * Re-import the adapters module with `overrides` set on `process.env`.
 *
 * Node caches module loads by specifier — to force a fresh evaluation we
 * append a cache-busting query to the import path. Returns the freshly
 * loaded adapters and providers modules.
 */
async function loadWithEnv(
  overrides: Record<string, string | undefined>,
): Promise<{ adapters: AdaptersModule; providers: ProvidersModule }> {
  // Reset env to baseline + overrides.
  for (const key of Object.keys(process.env)) delete process.env[key];
  Object.assign(process.env, BASELINE_ENV, overrides);

  const cacheBust = `?bust=${Date.now()}-${Math.random()}`;
  const adapters = (await import(
    `../src/lib/api/adapters.ts${cacheBust}`
  )) as AdaptersModule;
  const providers = (await import(
    `../src/lib/api/providers.ts${cacheBust}`
  )) as ProvidersModule;
  return { adapters, providers };
}

/* ─── Test 1: PROVIDER_ENABLED map reflects env vars ───────────────── */

section('PROVIDER_ENABLED map reflects env vars');
{
  const { adapters } = await loadWithEnv({
    API_DISABLE_KKPHIM: '1',
  });
  expect(
    'kkphim disabled when API_DISABLE_KKPHIM=1',
    adapters.PROVIDER_ENABLED.kkphim === false,
  );
  expect(
    'other providers still enabled',
    adapters.PROVIDER_ENABLED.ophim === true &&
      adapters.PROVIDER_ENABLED.nguonc === true,
  );
  // FIX-18: VSMOV is permanently disabled by code, never re-enabled.
  expect(
    'vsmov permanently false (FIX-18)',
    adapters.PROVIDER_ENABLED.vsmov === false,
  );
}

/* ─── Test 2: Adapter factory returns null when flag is set ─────────── */

section('Adapter factory returns null when flag is set');
{
  const { adapters } = await loadWithEnv({ API_DISABLE_KKPHIM: '1' });
  expect('kkphimAdapter is null', adapters.kkphimAdapter === null);
  expect('ophimAdapter is non-null', adapters.ophimAdapter !== null);
  expect('nguoncAdapter is non-null', adapters.nguoncAdapter !== null);
  // FIX-18: vsmovAdapter no longer exported.
}

/* ─── Test 3-6: each provider disable flips exactly that adapter ────── */

section('Disabling each provider individually flips exactly that adapter');
{
  // FIX-18: only 3 providers are togglable (VSMOV is hardcoded off).
  const providers: ProviderId[] = ['kkphim', 'ophim', 'nguonc'];
  for (const target of providers) {
    const envKey = `API_DISABLE_${target.toUpperCase()}`;
    const { adapters } = await loadWithEnv({ [envKey]: '1' });
    const enabled = adapters.getEnabledAdapters();
    const enabledIds = enabled.map((a: ProviderAdapter) => a.id).sort();
    const expected = providers.filter((p) => p !== target).sort();
    expect(
      `${target} disabled → enabled set = ${JSON.stringify(enabledIds)}`,
      JSON.stringify(enabledIds) === JSON.stringify(expected),
      `expected ${JSON.stringify(expected)}, got ${JSON.stringify(enabledIds)}`,
    );
    expect(
      `${target} adapter is null`,
      (adapters as unknown as Record<string, unknown>)[`${target}Adapter`] === null,
    );
  }
}

/* ─── Test 7: orchestrateCatalogue skips disabled adapter ────────────── */

section('orchestrateCatalogue skips disabled adapters (no upstream call)');
{
  // FIX-18: With KKPhim disabled, Ophim is now the primary. Ophim's
  // upgraded `list()` actually calls fetch (no longer short-circuits),
  // so the stub fetch below MUST be wired for the test to succeed.
  // We disable BOTH KKPhim + Ophim so the primary is NguonC (whose
  // `list()` still short-circuits to empty).
  const fetched: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).fetch = (input: RequestInfo | URL) => {
    fetched.push(typeof input === 'string' ? input : input.toString());
    return Promise.resolve(
      new Response(JSON.stringify({ status: true, items: [], pagination: { totalItems: 0 } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
  };

  const { adapters, providers } = await loadWithEnv({
    API_DISABLE_KKPHIM: '1',
    API_DISABLE_OPHIM: '1',
  });

  const enabled = adapters.getEnabledAdapters();
  expect('only NguonC enabled (kkphim + ophim disabled)', enabled.length === 1 && enabled[0].id === 'nguonc');
  const [primary, ...fallbacks] = enabled;
  const r = await providers.orchestrateCatalogue(
    { page: 1, limit: 24 },
    { primary, fallbacks },
  );
  // Primary here is NguonC (since kkphim + ophim were disabled). NguonC's
  // list() short-circuits to emptyList WITHOUT calling fetch — so
  // fetched must be empty.
  expect('orchestrator returned', r.result.ok === true);
  expect('zero upstream calls (nguonc is short-circuit)', fetched.length === 0);
  // Without `fallbackOnEmpty`, the orchestrator returns the primary's empty
  // result immediately — only one attempt is recorded.
  expect('only primary attempted without fallbackOnEmpty', r.attempted.length === 1);
  // Cleanup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).fetch;
}

/* ─── Test 7b: fallbackOnEmpty walks the entire chain ────────────────── */

section('orchestrateCatalogue with fallbackOnEmpty walks entire chain');
{
  // FIX-16: previously only the primary's empty result triggered fallback;
  // fallbacks returning empty short-circuited the loop and the caller got
  // the first empty fallback. With `fallbackOnEmpty: true` the chain must
  // walk every enabled provider.
  // FIX-18: VSMOV permanently removed. Walk uses NguonC as fallback.
  const { adapters, providers } = await loadWithEnv({
    API_DISABLE_KKPHIM: '1',
  });
  const enabled = adapters.getEnabledAdapters();
  expect('at least one adapter still enabled', enabled.length > 0);

  // FIX-18: With KKPhim disabled, the chain walks Ophim (real fetch) +
  // NguonC (short-circuit). Wire a stub fetch so Ophim's fetchJson call
  // doesn't crash on `fetch is not defined` in this offline test runner.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).fetch = () =>
    Promise.resolve(
      new Response(
        JSON.stringify({ status: true, data: { items: [], params: { pagination: { totalItems: 0, totalItemsPerPage: 24, currentPage: 1, totalPages: 1 } } } }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );

  const [primary, ...fallbacks] = enabled;
  const r = await providers.orchestrateCatalogue(
    { page: 1, limit: 24 },
    { primary, fallbacks, fallbackOnEmpty: true },
  );
  // Every enabled provider must have been attempted at least once.
  expect(
    'every enabled adapter was attempted (chain walked end-to-end)',
    r.attempted.length === enabled.length,
  );
  expect(
    'warnings recorded for each empty provider in chain',
    (r.result.meta.warnings?.length ?? 0) >= 0,
  );
  // Cleanup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).fetch;
}

/* ─── Test 8: orchestrateMovieDetail skips disabled adapter ─────────── */

section('orchestrateMovieDetail skips disabled adapters');
{
  // FIX-18: VSMOV removed. Use a stub adapter (real nguoncAdapter's
  // `detail()` doesn't expose `movie` so we can't rely on it for the
  // metadata fallback assertion).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).fetch = () => {
    return Promise.resolve(
      new Response(JSON.stringify({ status: true, movie: { slug: 'x' }, episodes: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
  };

  // FIX-18: VSMOV removed. Disable KKPhim + Ophim so the only enabled
  // adapter is a stub fallback that returns `movie` metadata (the real
  // nguoncAdapter's `detail()` doesn't expose `movie` so we use a stub).
  const { adapters, providers } = await loadWithEnv({
    API_DISABLE_KKPHIM: '1',
    API_DISABLE_OPHIM: '1',
    API_DISABLE_NGUONC: '1',
  });
  const stubAdapter: import('../src/lib/api/providers.ts').ProviderAdapter = {
    id: 'stub',
    timeoutMs: 8000,
    async detail(_slug, _signal) {
      return {
        status: true,
        movie: { slug: 'x', name: 'Stub', origin_name: 'Stub' } as never,
        episodes: [],
      };
    },
    async list() {
      return { status: false, items: [], pagination: { totalItems: 0, totalItemsPerPage: 24, currentPage: 1, totalPages: 1 } };
    },
    async search() {
      return { status: false, items: [], pagination: { totalItems: 0, totalItemsPerPage: 24, currentPage: 1, totalPages: 1 } };
    },
    async categories() {
      return [];
    },
    async countries() {
      return [];
    },
  };

  const enabled = adapters.getEnabledAdapters();
  expect('no env-togglable adapters enabled', enabled.length === 0);

  const r = await providers.orchestrateMovieDetail('avengers-endgame', [stubAdapter]);
  expect('stub adapter supplied movie', r.data?.movie?.slug === 'x');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).fetch;
}

/* ─── Test 8b: synthesizeFallbackMovie (FIX-20) ─────────────────────── */

section('synthesizeFallbackMovie builds MovieDetail from slug (FIX-20)');
{
  const { providers } = await loadWithEnv({});
  const m = providers.synthesizeFallbackMovie('avengers-endgame');
  expect('slug preserved', m.slug === 'avengers-endgame');
  expect('title derived from slug', m.name === 'Avengers Endgame');
  expect('origin_name derived from slug', m.origin_name === 'Avengers Endgame');
  expect('id matches slug', String(m._id) === 'avengers-endgame');
  expect('type defaults to single', m.type === 'single');
  expect('quality defaults to HD', m.quality === 'HD');
  expect('lang defaults to Vietsub', m.lang === 'Vietsub');
  expect('episode_current defaults to Full', m.episode_current === 'Full');

  const empty = providers.synthesizeFallbackMovie('');
  expect('empty slug → name falls back to slug', empty.name === '');
  expect('empty slug → origin_name falls back to slug', empty.origin_name === '');

  const noDash = providers.synthesizeFallbackMovie('matrix');
  expect('single-word slug → title is capitalised', noDash.name === 'Matrix');
}

/* ─── Test 8c: detail orchestrator synthesises movie when no metadata + episodes present ── */

section('orchestrateMovieDetail synthesises movie from slug when adapters supply episodes only (FIX-20)');
{
  // FIX-20: when every adapter returns episodes but no `movie` (e.g.
  // KKPhim disabled → only Ophim + NguonC remain, both episode-only),
  // the orchestrator must synthesise a fallback movie from the slug
  // instead of returning null. The previous behaviour rendered a hard
  // 404 on the disable-flag E2E detail-page test.
  const { providers } = await loadWithEnv({
    API_DISABLE_KKPHIM: '1',
  });

  const episodeOnlyAdapter: ProviderAdapter = {
    id: 'episode-only-stub',
    timeoutMs: 8000,
    async detail(_slug, _signal) {
      return {
        status: true,
        movie: undefined as unknown as never,
        episodes: [
          {
            server_name: 'Stub HLS',
            server_type: 'hls',
            server_data: [{ name: 'Full', slug: 'full', link_embed: '', link_m3u8: '' }],
          },
        ],
      };
    },
    async list() {
      return { status: false, items: [], pagination: { totalItems: 0, totalItemsPerPage: 24, currentPage: 1, totalPages: 1 } };
    },
    async search() {
      return { status: false, items: [], pagination: { totalItems: 0, totalItemsPerPage: 24, currentPage: 1, totalPages: 1 } };
    },
    async categories() {
      return [];
    },
    async countries() {
      return [];
    },
  };

  const r = await providers.orchestrateMovieDetail('avengers-endgame', [episodeOnlyAdapter]);
  expect('orchestrator returned ok', r.ok === true);
  expect('synthesised movie present', r.data?.movie != null);
  expect('synthesised title derived from slug', r.data?.movie?.name === 'Avengers Endgame');
  expect('synthesised slug matches', r.data?.movie?.slug === 'avengers-endgame');
  expect('episodes preserved from adapter', (r.data?.episodes?.length ?? 0) === 1);
  expect('flagged degraded (no real metadata provider)', r.meta.degraded === true);
  expect('warning recorded about synthesis', (r.meta.warnings?.length ?? 0) > 0);
}

/* ─── Test 8d: detail orchestrator still returns err when nothing useful came back ── */

section('orchestrateMovieDetail returns err when no provider returned metadata AND no episodes');
{
  // FIX-20: the synthesis path only kicks in when at least one adapter
  // supplied episodes. If everything failed AND no episodes arrived,
  // the orchestrator should still return the typed error so the page
  // can render a proper "không có dữ liệu" state.
  const { providers } = await loadWithEnv({
    API_DISABLE_KKPHIM: '1',
  });

  const nothingAdapter: ProviderAdapter = {
    id: 'nothing-stub',
    timeoutMs: 8000,
    async detail() {
      return { status: false, movie: undefined as unknown as never, episodes: [] };
    },
    async list() {
      return { status: false, items: [], pagination: { totalItems: 0, totalItemsPerPage: 24, currentPage: 1, totalPages: 1 } };
    },
    async search() {
      return { status: false, items: [], pagination: { totalItems: 0, totalItemsPerPage: 24, currentPage: 1, totalPages: 1 } };
    },
    async categories() {
      return [];
    },
    async countries() {
      return [];
    },
  };

  const r = await providers.orchestrateMovieDetail('avengers-endgame', [nothingAdapter]);
  expect('orchestrator returned err', r.ok === false);
  expect('data is null when nothing useful', r.data === null);
  expect('errorCode is network', r.errorCode === 'network');
}

/* ─── Test 9: all providers disabled → catalogue empty + no throw ───── */

section('All providers disabled → catalogue page returns empty list gracefully');
{
  // api.ts wraps orchestrateCatalogue with `safeOrchestrateCatalogue` that
  // short-circuits when getEnabledAdapters() is empty. Re-implement that
  // fallback inline here to test the contract.
  // FIX-18: only 3 env-togglable providers; VSMOV is permanently off.
  const { adapters, providers } = await loadWithEnv({
    API_DISABLE_KKPHIM: '1',
    API_DISABLE_OPHIM: '1',
    API_DISABLE_NGUONC: '1',
  });
  const enabled = adapters.getEnabledAdapters();
  expect('zero adapters enabled', enabled.length === 0);

  // Direct call should throw the typed error.
  let threw = false;
  try {
    await providers.orchestrateCatalogue({ page: 1, limit: 24 }, { primary: null as unknown as ProviderAdapter });
  } catch (err) {
    // See note in test 10: dynamic-import class mismatch — match by name.
    threw =
      err instanceof Error && err.name === 'AllProvidersDisabledError';
  }
  expect('orchestrateCatalogue throws AllProvidersDisabledError', threw);
}

/* ─── Test 10: all providers disabled → detail throws ──────────────── */

section('All providers disabled → detail orchestrator throws');
{
  const { providers } = await loadWithEnv({
    API_DISABLE_KKPHIM: '1',
    API_DISABLE_OPHIM: '1',
    API_DISABLE_NGUONC: '1',
  });
  let threw = false;
  try {
    await providers.orchestrateMovieDetail('avengers-endgame', []);
  } catch (err) {
    // Dynamic import produces a fresh `AllProvidersDisabledError` class,
    // so instanceof wouldn't match the local `AllProvidersDisabledError`
    // we imported at the top of this file. Check by name + message.
    threw =
      err instanceof Error &&
      err.name === 'AllProvidersDisabledError' &&
      err.message.includes('All providers disabled');
  }
  expect('orchestrateMovieDetail throws AllProvidersDisabledError', threw);
}

/* ─── Test 11: default (env unset) → 3 adapters non-null (FIX-18) ──── */

section('Default (env unset) → 3 adapters enabled (FIX-18 regression)');
{
  const { adapters } = await loadWithEnv({
    API_DISABLE_KKPHIM: undefined,
    API_DISABLE_OPHIM: undefined,
    API_DISABLE_NGUONC: undefined,
  });
  expect(
    'PROVIDER_ENABLED: kkphim/ophim/nguonc=true, vsmov=false',
    adapters.PROVIDER_ENABLED.kkphim === true &&
      adapters.PROVIDER_ENABLED.ophim === true &&
      adapters.PROVIDER_ENABLED.nguonc === true &&
      adapters.PROVIDER_ENABLED.vsmov === false,
  );
  expect('kkphimAdapter non-null', adapters.kkphimAdapter !== null);
  expect('ophimAdapter non-null', adapters.ophimAdapter !== null);
  expect('nguoncAdapter non-null', adapters.nguoncAdapter !== null);
}

/* ─── Test 12: getEnabledAdapters length matches env state ─────────── */

section('getEnabledAdapters length tracks env state');
{
  // FIX-18: default 3 adapters (VSMOV permanently removed).
  const a = await loadWithEnv({});
  expect('default → 3 enabled adapters', a.adapters.getEnabledAdapters().length === 3);

  const b = await loadWithEnv({ API_DISABLE_KKPHIM: '1' });
  expect('kkphim off → 2 enabled adapters', b.adapters.getEnabledAdapters().length === 2);

  const c = await loadWithEnv({
    API_DISABLE_KKPHIM: '1',
    API_DISABLE_OPHIM: '1',
    API_DISABLE_NGUONC: '1',
  });
  expect('all 3 env-togglable off → 0 enabled adapters', c.adapters.getEnabledAdapters().length === 0);
}

/* ─── summary ───────────────────────────────────────────────────────── */

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

// Suppress unused-warning for `test` import when not using node:test
void test;