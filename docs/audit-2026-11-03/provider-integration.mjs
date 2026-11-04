import { writeFile } from 'node:fs/promises';
import { getEnabledAdapters } from '../../src/lib/api/adapters.ts';
import { orchestrateCatalogue, orchestrateMovieDetail } from '../../src/lib/api/providers.ts';
import { providerHealth } from '../../src/lib/api/health.ts';
const results = [];
for (const filter of [{}, { category: 'hanh-dong', sort_field: 'modified.time', sort_type: 'desc' }, { country: 'han-quoc', sort_field: 'modified.time', sort_type: 'desc' }, { keyword: 'avengers' }, { type: 'phim-chieu-rap' }, { type: 'series' }]) {
  providerHealth.reset();
  const start = performance.now();
  const [primary, ...fallbacks] = getEnabledAdapters();
  const response = await orchestrateCatalogue({ ...filter, page: 1, limit: 24 }, { primary, fallbacks });
  const { items, ...data } = response.result.data;
  results.push({ filter, ms: Math.round(performance.now() - start), ...response, result: { ...response.result, data: { ...data, count: items.length, samples: items.slice(0, 2) } } });
  console.log(JSON.stringify(results.at(-1)));
}
for (const adapter of getEnabledAdapters()) {
  providerHealth.reset();
  const list = await adapter.list({ page: 1 });
  const slug = list.items[0].slug;
  const response = await orchestrateMovieDetail(slug, getEnabledAdapters(), { source: adapter.id });
  results.push({ detail: { source: adapter.id, slug }, ok: response.ok, errorCode: response.errorCode, meta: response.meta, movie: response.data?.movie, servers: response.data?.episodes.map(s => ({ name: s.server_name, count: s.server_data.length, first: s.server_data[0] })) });
  console.log(JSON.stringify(results.at(-1)));
}
await writeFile('docs/audit-2026-11-03/provider-integration.json', JSON.stringify(results, null, 2));
