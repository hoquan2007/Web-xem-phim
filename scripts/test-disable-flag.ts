import { test } from 'node:test';
import assert from 'node:assert/strict';
import { orchestrateCatalogue, orchestrateMovieDetail, AllProvidersDisabledError } from '../src/lib/api/providers.ts';
const baseline = { ...process.env };
async function adapters(overrides: Record<string, string | undefined> = {}) {
  for (const key of ['API_DISABLE_KKPHIM', 'API_DISABLE_OPHIM', 'API_DISABLE_NGUONC', 'API_ENABLE_OPHIM']) delete process.env[key];
  Object.assign(process.env, overrides);
  return import(`../src/lib/api/adapters.ts?case=${Math.random()}`);
}
test('production default enables KKPhim and NguonC, OPhim requires explicit opt-in', async () => {
  const a = await adapters();
  assert.deepEqual(a.getEnabledAdapters().map(adapter => adapter.id), ['kkphim', 'nguonc']);
  assert.equal(a.ophimAdapter, null); assert.equal(a.PROVIDER_ENABLED.vsmov, false);
});
test('kill switch overrides OPhim opt-in', async () => {
  const a = await adapters({ API_ENABLE_OPHIM: '1', API_DISABLE_OPHIM: '1' });
  assert.equal(a.ophimAdapter, null);
});
test('explicit OPhim opt-in enables the adapter for validated deployments', async () => {
  const a = await adapters({ API_ENABLE_OPHIM: '1' });
  assert.equal(a.getEnabledAdapters().length, 3);
});
test('disabling KKPhim leaves a real NguonC catalogue adapter', async () => {
  const a = await adapters({ API_DISABLE_KKPHIM: '1' });
  assert.deepEqual(a.getEnabledAdapters().map(adapter => adapter.id), ['nguonc']);
  const before = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ status: 'success', items: [{ slug: 'native', name: 'NC', year: '2024' }], paginate: { items_per_page: 10, total_items: 1, current_page: 1, total_page: 1 } });
  try { const list = await a.nguoncAdapter!.list({}); assert.equal(list.items[0].source, 'nguonc'); assert.equal(list.pagination.totalItemsPerPage, 10); }
  finally { globalThis.fetch = before; }
});
test('all disabled is an explicit operator state', async () => {
  const a = await adapters({ API_DISABLE_KKPHIM: '1', API_DISABLE_NGUONC: '1' });
  assert.equal(a.getEnabledAdapters().length, 0);
  await assert.rejects(() => orchestrateCatalogue({}, { primary: null as never }), AllProvidersDisabledError);
  await assert.rejects(() => orchestrateMovieDetail('test', []), AllProvidersDisabledError);
  Object.assign(process.env, baseline);
});
