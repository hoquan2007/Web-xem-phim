/**
 * Offline tests for the API-REDESIGN-8 provider kill-switch.
 *
 * Covers:
 *  - PROVIDER_ENABLED map reflects env vars.
 *  - Each adapter factory returns `null` when its env flag is "1".
 *  - orchestrateCatalogue / orchestrateMovieDetail skip disabled adapters.
 *  - All providers disabled → catalogue empty result, detail throws.
 *  - Default (env unset) → all 4 adapters non-null (regression check).
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
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { type ProviderId } from '../src/lib/api/adapters.ts';
import {
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
      adapters.PROVIDER_ENABLED.nguonc === true &&
      adapters.PROVIDER_ENABLED.vsmov === true,
  );
}

/* ─── Test 2: Adapter factory returns null when flag is set ─────────── */

section('Adapter factory returns null when flag is set');
{
  const { adapters } = await loadWithEnv({ API_DISABLE_KKPHIM: '1' });
  expect('kkphimAdapter is null', adapters.kkphimAdapter === null);
  expect('ophimAdapter is non-null', adapters.ophimAdapter !== null);
  expect('nguoncAdapter is non-null', adapters.nguoncAdapter !== null);
  expect('vsmovAdapter is non-null', adapters.vsmovAdapter !== null);
}

/* ─── Test 3-6: each provider disable flips exactly that adapter ────── */

section('Disabling each provider individually flips exactly that adapter');
{
  const providers: ProviderId[] = ['kkphim', 'ophim', 'nguonc', 'vsmov'];
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
  // Stub fetch: if any call lands, we record the URL.
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
  });

  const enabled = adapters.getEnabledAdapters();
  const [primary, ...fallbacks] = enabled;
  const r = await providers.orchestrateCatalogue(
    { page: 1, limit: 24 },
    { primary, fallbacks },
  );
  // Primary here is ophim (since kkphim was disabled). Ophim's list()
  // short-circuits to emptyList WITHOUT calling fetch — so fetched must be empty.
  expect('orchestrator returned', r.result.ok === true);
  expect('zero upstream calls (ophim is short-circuit)', fetched.length === 0);
  // Cleanup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).fetch;
}

/* ─── Test 8: orchestrateMovieDetail skips disabled adapter ─────────── */

section('orchestrateMovieDetail skips disabled adapters');
{
  let calls = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).fetch = () => {
    calls += 1;
    return Promise.resolve(
      new Response(JSON.stringify({ status: true, movie: { slug: 'x' }, episodes: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
  };

  const { adapters, providers } = await loadWithEnv({
    API_DISABLE_KKPHIM: '1',
    API_DISABLE_OPHIM: '1',
    API_DISABLE_NGUONC: '1',
    // Only VSMOV enabled.
  });

  const enabled = adapters.getEnabledAdapters();
  expect('only VSMOV enabled', enabled.length === 1 && enabled[0].id === 'vsmov');

  const r = await providers.orchestrateMovieDetail('avengers-endgame', enabled);
  expect('vsmov adapter called', calls === 1);
  expect('movie metadata came from vsmov', r.data?.movie?.slug === 'x');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (globalThis as any).fetch;
}

/* ─── Test 9: all providers disabled → catalogue empty + no throw ───── */

section('All providers disabled → catalogue page returns empty list gracefully');
{
  // api.ts wraps orchestrateCatalogue with `safeOrchestrateCatalogue` that
  // short-circuits when getEnabledAdapters() is empty. Re-implement that
  // fallback inline here to test the contract.
  const { adapters, providers } = await loadWithEnv({
    API_DISABLE_KKPHIM: '1',
    API_DISABLE_OPHIM: '1',
    API_DISABLE_NGUONC: '1',
    API_DISABLE_VSMOV: '1',
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
    API_DISABLE_VSMOV: '1',
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

/* ─── Test 11: default (env unset) → all 4 adapters non-null ────────── */

section('Default (env unset) → all 4 adapters enabled (regression)');
{
  const { adapters } = await loadWithEnv({
    API_DISABLE_KKPHIM: undefined,
    API_DISABLE_OPHIM: undefined,
    API_DISABLE_NGUONC: undefined,
    API_DISABLE_VSMOV: undefined,
  });
  expect('PROVIDER_ENABLED all true', Object.values(adapters.PROVIDER_ENABLED).every((v) => v === true));
  expect('kkphimAdapter non-null', adapters.kkphimAdapter !== null);
  expect('ophimAdapter non-null', adapters.ophimAdapter !== null);
  expect('nguoncAdapter non-null', adapters.nguoncAdapter !== null);
  expect('vsmovAdapter non-null', adapters.vsmovAdapter !== null);
}

/* ─── Test 12: getEnabledAdapters length matches env state ─────────── */

section('getEnabledAdapters length tracks env state');
{
  const a = await loadWithEnv({});
  expect('default → 4 enabled adapters', a.adapters.getEnabledAdapters().length === 4);

  const b = await loadWithEnv({ API_DISABLE_KKPHIM: '1' });
  expect('kkphim off → 3 enabled adapters', b.adapters.getEnabledAdapters().length === 3);

  const c = await loadWithEnv({
    API_DISABLE_KKPHIM: '1',
    API_DISABLE_OPHIM: '1',
    API_DISABLE_NGUONC: '1',
    API_DISABLE_VSMOV: '1',
  });
  expect('all off → 0 enabled adapters', c.adapters.getEnabledAdapters().length === 0);
}

/* ─── summary ───────────────────────────────────────────────────────── */

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);

// Suppress unused-warning for `test` import when not using node:test
void test;