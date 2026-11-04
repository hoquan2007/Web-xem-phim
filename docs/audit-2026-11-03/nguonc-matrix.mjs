import { writeFile } from 'node:fs/promises';
import { nguoncAdapter } from '../../src/lib/api/adapters.ts';
import { providerHealth } from '../../src/lib/api/health.ts';
const rows = [];
for (const filter of [{}, { keyword: 'avengers' }, { type: 'series' }, { type: 'single' }, { type: 'hoathinh' }, { type: 'tvshows' }, { type: 'phim-chieu-rap' }, { category: 'hanh-dong' }, { country: 'han-quoc' }, { year: 2026 }, { category: 'hanh-dong', country: 'han-quoc' }]) {
  providerHealth.reset();
  const started = performance.now();
  try { const result = await nguoncAdapter.list({ ...filter, page: 1, limit: 24 }); rows.push({ filter, ok: true, count: result.items.length, pagination: result.pagination, sample: result.items[0], ms: Math.round(performance.now() - started) }); }
  catch (e) { rows.push({ filter, ok: false, code: e.code, status: e.status, error: e.message, ms: Math.round(performance.now() - started) }); }
}
await writeFile('docs/audit-2026-11-03/nguonc-matrix.json', JSON.stringify(rows, null, 2));
console.log(JSON.stringify(rows.map(({ sample: _sample, ...rest }) => rest), null, 2));
