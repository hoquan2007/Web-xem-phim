import { writeFile } from 'node:fs/promises';
const urls = [
  'https://ophim.live',
  'https://ophim.cc/v1/api/home',
  'https://ophim17.cc/v1/api/home',
  'https://ophim1.cc/v1/api/home',
  'https://vsmov.com/api/danh-sach/phim-moi-cap-nhat?page=1',
  'https://vsmov.com/api/phim/hoang-hau-tai-hon',
  'https://vsmov.com/api/phim/am-muu-gia-toc-yagyu',
  'https://phimapi.com/tmdb/tv/279246',
  'https://phimapi.com/tmdb/tv/307478',
  'https://phimapi.com/tmdb/movie/299534',
];
const rows = [];
for (let offset = 0; offset < urls.length; offset += 3) {
  rows.push(...await Promise.all(urls.slice(offset, offset + 3).map(async url => {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { /* HTML is recorded as invalid JSON. */ }
      return { url, status: response.status, final: response.url, json: Boolean(data), keys: data ? Object.keys(data) : [], title: data?.movie?.name, identity: data?.movie?.tmdb, episodes: data?.episodes?.map(s => ({ name: s.server_name, count: s.server_data?.length, hls: s.server_data?.filter(e => e.link_m3u8).length })), sample: data ? undefined : text.slice(0, 80) };
    } catch (error) { return { url, error: String(error) }; }
  })));
}
await writeFile('docs/hls-expansion-2026-11-04/probe.json', JSON.stringify(rows, null, 2));
console.log(JSON.stringify(rows, null, 2));
