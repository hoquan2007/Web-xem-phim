// Manual, read-only upstream audit. Run: node scripts/audit-live.mjs
// Does not import application modules or modify provider configuration.
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const output = process.argv[2] || 'docs/audit-2026-10-14/live-results.json';
const results = [];
const payloads = new Map();
const timeoutMs = 15000;

async function probe(provider, operation, url, media = false) {
  const started = performance.now();
  const row = { provider, operation, url, method: 'GET', sampledAt: new Date().toISOString() };
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(timeoutMs),
      headers: media ? { Range: 'bytes=0-16383', Origin: 'http://localhost:3100' } : { Accept: 'application/json' },
      redirect: 'follow',
    });
    row.status = response.status;
    row.finalUrl = response.url;
    row.headers = Object.fromEntries(['content-type', 'access-control-allow-origin', 'cross-origin-resource-policy', 'cross-origin-embedder-policy', 'x-frame-options', 'content-security-policy'].map(key => [key, response.headers.get(key)]));
    const reader = response.body?.getReader();
    const chunks = [];
    let size = 0;
    if (reader) {
      while (size < (media ? 16384 : 4000000)) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        size += value.byteLength;
      }
      await reader.cancel();
    }
    const body = Buffer.concat(chunks.map(chunk => Buffer.from(chunk))).toString('utf8');
    row.readBytes = size;
    row.httpOk = response.ok;
    if (!media) {
      try {
        const data = JSON.parse(body);
        payloads.set(url, data);
        row.json = true;
        row.keys = Object.keys(data);
        row.upstreamStatus = data.status;
        const items = Array.isArray(data) ? data : data.data?.items ?? data.items;
        if (Array.isArray(items)) {
          row.itemCount = items.length;
          row.samples = items.slice(0, 3).map(item => ({ slug: item.slug, name: item.name, origin_name: item.origin_name ?? item.original_name, year: item.year, poster_url: item.poster_url, thumb_url: item.thumb_url }));
        }
        row.pagination = data.data?.params?.pagination ?? data.pagination ?? data.paginate;
        const movie = data.movie ?? data.data?.item;
        if (movie) {
          const episodes = data.episodes ?? movie.episodes ?? [];
          row.movie = { slug: movie.slug, name: movie.name, origin_name: movie.origin_name ?? movie.original_name, year: movie.year, tmdb: movie.tmdb, poster_url: movie.poster_url, thumb_url: movie.thumb_url };
          row.servers = episodes.map(server => ({ name: server.server_name, count: (server.server_data ?? server.items ?? []).length, firstEpisode: (server.server_data ?? server.items ?? [])[0] }));
        }
      } catch {
        row.json = false;
        row.bodySample = body.slice(0, 180);
      }
    } else {
      if (/mpegurl|text|html|json/.test(row.headers['content-type'] ?? '') || body.startsWith('#EXTM3U')) row.bodySample = body.slice(0, 350);
      row.hlsSignature = body.startsWith('#EXTM3U');
      if (row.hlsSignature) {
        row.playlistUris = body.split(/\r?\n/).filter(line => line && !line.startsWith('#')).slice(0, 2).map(line => new URL(line, response.url).href);
        row.keyUris = [...body.matchAll(/URI="([^"]+)"/g)].slice(0, 2).map(match => new URL(match[1], response.url).href);
      }
    }
  } catch (error) {
    row.httpOk = false;
    row.error = String(error);
    row.cause = error.cause ? String(error.cause) : undefined;
  }
  row.latencyMs = Math.round(performance.now() - started);
  results.push(row);
  console.log(`${provider} ${operation}: ${row.status ?? row.error} (${row.latencyMs}ms) ${row.itemCount === undefined ? '' : `items=${row.itemCount}`}`);
  return row;
}

async function batch(definitions) {
  for (let i = 0; i < definitions.length; i += 3) {
    await Promise.all(definitions.slice(i, i + 3).map(args => probe(...args)));
  }
}

const kk = 'https://phimapi.com';
const op = 'https://ophim1.com';
const nc = 'https://phim.nguonc.com';
await batch([
  ['kkphim', 'latest', `${kk}/danh-sach/phim-moi-cap-nhat?page=1`],
  ['kkphim', 'search', `${kk}/v1/api/tim-kiem?keyword=avengers&page=1&limit=6`],
  ['kkphim', 'categories', `${kk}/v1/api/the-loai`],
  ['kkphim', 'countries', `${kk}/v1/api/quoc-gia`],
  ...['phim-bo', 'phim-le', 'hoat-hinh', 'tv-shows'].map(type => ['kkphim', `type:${type}`, `${kk}/v1/api/danh-sach/${type}?page=1`]),
  ['kkphim', 'category:hanh-dong', `${kk}/v1/api/the-loai/hanh-dong?page=1`],
  ['kkphim', 'country:han-quoc', `${kk}/v1/api/quoc-gia/han-quoc?page=1`],
  ['ophim', 'latest-configured', `${op}/v1/api/danh-sach/phim-moi-cap-nhat?page=1`],
  ['ophim', 'latest-legacy-candidate', `${op}/danh-sach/phim-moi-cap-nhat?page=1`],
  ['ophim', 'home-candidate', `${op}/v1/api/home`],
  ['ophim', 'latest-phim-moi-candidate', `${op}/v1/api/danh-sach/phim-moi?page=1`],
  ['ophim', 'legacy-detail-candidate', `${op}/phim/ke-danh-cap-giac-mo`],
  ['ophim1cc-candidate', 'home', 'https://ophim1.cc/v1/api/home'],
  ['ophim19-candidate', 'home', 'https://ophim19.cc/v1/api/home'],
  ['ophim', 'search', `${op}/v1/api/tim-kiem?keyword=avengers&page=1&limit=6`],
  ['ophim', 'categories', `${op}/v1/api/the-loai`],
  ['ophim', 'countries', `${op}/v1/api/quoc-gia`],
  ...['phim-bo', 'phim-le', 'hoat-hinh', 'tv-shows'].map(type => ['ophim', `type:${type}`, `${op}/v1/api/danh-sach/${type}?page=1`]),
  ['ophim', 'category:hanh-dong', `${op}/v1/api/the-loai/hanh-dong?page=1`],
  ['ophim', 'country:han-quoc', `${op}/v1/api/quoc-gia/han-quoc?page=1`],
  ['nguonc', 'latest-candidate', `${nc}/api/films/phim-moi-cap-nhat?page=1`],
  ['nguonc', 'search-candidate', `${nc}/api/films/search?keyword=avengers`],
]);

// Check every genre/country slug currently advertised by the primary,
// rather than testing only a single representative filter route.
for (const [operation, path] of [['category', 'the-loai'], ['country', 'quoc-gia']]) {
  const taxonomy = payloads.get(`${kk}/v1/api/${path}`)?.data?.items ?? [];
  await batch(taxonomy.map(item => ['kkphim', `taxonomy-${operation}:${item.slug}`, `${kk}/v1/api/${path}/${encodeURIComponent(item.slug)}?page=1`]));
}

const ownLists = { kkphim: `${kk}/danh-sach/phim-moi-cap-nhat?page=1`, ophim: `${op}/danh-sach/phim-moi-cap-nhat?page=1`, nguonc: `${nc}/api/films/phim-moi-cap-nhat?page=1` };
const detailUrl = (provider, slug) => provider === 'kkphim' ? `${kk}/phim/${encodeURIComponent(slug)}` : provider === 'ophim' ? `${op}/v1/api/phim/${encodeURIComponent(slug)}` : `${nc}/api/film/${encodeURIComponent(slug)}`;
for (const [provider, listUrl] of Object.entries(ownLists)) {
  const data = payloads.get(listUrl);
  const items = data?.data?.items ?? data?.items ?? [];
  await batch(items.slice(0, 2).map(item => [provider, 'detail-own-catalogue', detailUrl(provider, item.slug)]));
}
const kkLatest = payloads.get(ownLists.kkphim)?.items?.[0]?.slug;
await batch(['avengers-endgame', kkLatest].filter(Boolean).flatMap(slug => ['kkphim', 'ophim', 'nguonc'].map(provider => [provider, `detail-shared:${slug}`, detailUrl(provider, slug)])));

for (const provider of ['kkphim', 'ophim', 'nguonc']) {
  const ownData = payloads.get(ownLists[provider]);
  const firstSlug = (ownData?.data?.items ?? ownData?.items ?? [])[0]?.slug;
  const detail = results.find(row => row.provider === provider && row.operation === 'detail-own-catalogue' && row.movie?.slug === firstSlug);
  if (!detail) continue;
  const cdn = provider === 'ophim' ? 'https://image.ophim1.com/' : 'https://phimimg.com/';
  const media = ['poster_url', 'thumb_url'].map(key => detail.movie[key]).filter(Boolean).map(url => [provider, 'image-sample', new URL(url, cdn).href, true]);
  const firstEpisode = detail.servers?.[0]?.firstEpisode;
  const hls = firstEpisode?.link_m3u8 ?? firstEpisode?.m3u8;
  const embed = firstEpisode?.link_embed ?? firstEpisode?.embed;
  if (hls) media.push([provider, 'hls-sample', hls, true]);
  if (embed) media.push([provider, 'embed-sample', embed, true]);
  await batch(media);
  const playlist = results.find(row => row.provider === provider && row.operation === 'hls-sample' && row.hlsSignature);
  for (const url of [...(playlist?.playlistUris ?? []), ...(playlist?.keyUris ?? [])].slice(0, 2)) await probe(provider, 'hls-child-sample', url, true);
}

await mkdir(dirname(resolve(output)), { recursive: true });
await writeFile(output, JSON.stringify({ generatedAt: new Date().toISOString(), timeoutMs, note: 'Point-in-time samples; HTTP success does not prove browser playback. Latest slugs discovered independently per provider.', results }, null, 2) + '\n');
console.log(`Saved ${results.length} observations to ${output}`);
