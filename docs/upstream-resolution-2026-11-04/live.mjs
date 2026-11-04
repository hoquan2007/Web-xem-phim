import { nguoncAdapter, getEnabledAdapters } from '../../src/lib/api/adapters.ts';
import { orchestrateMovieDetail } from '../../src/lib/api/providers.ts';
import { writeFile } from 'node:fs/promises';

const candidates = await nguoncAdapter.search('The Perfect Lie');
const slugs = ['hoang-hau-tai-hon', candidates.items.find(movie => movie.tmdb?.id === '307478')?.slug].filter(Boolean);
const results = [];
for (const slug of slugs) {
  const result = await orchestrateMovieDetail(slug, getEnabledAdapters(), { source: 'nguonc' });
  results.push({ slug, ok: result.ok, source: result.data?.movie.source, title: result.data?.movie.name,
    servers: result.data?.episodes.map(server => ({ name: server.server_name, episodes: server.server_data.length,
      hls: server.server_data.filter(episode => episode.link_m3u8).length,
      firstName: server.server_data[0]?.name,
    })),
  });
}
await writeFile('docs/upstream-resolution-2026-11-04/live.json', JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
