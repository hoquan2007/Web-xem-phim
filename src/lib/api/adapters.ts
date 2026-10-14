import 'server-only';
import type { ProviderAdapter } from './providers';
import { ProviderError } from './errors';
import { providerHealth } from './health';
import { getImageUrl, normalizeEmbedUrl, normalizeM3u8Url, readString } from './helpers';
import { clampPage, clampLimit, sanitizeSlug } from '../validate';
import type { MovieDetail, MovieListItem, MovieListResponse, FilterParams, EpisodeServer, CategoryItem, ProviderId as Source } from '@/types/movie';
export { HealthRegistry, providerHealth } from './health';
export const PROVIDER_ENABLED = {
  kkphim: process.env.API_DISABLE_KKPHIM !== '1',
  // The audited OPhim API/CDN is down: explicit opt-in after verification.
  ophim: process.env.API_ENABLE_OPHIM === '1' && process.env.API_DISABLE_OPHIM !== '1',
  nguonc: process.env.API_DISABLE_NGUONC !== '1', vsmov: false,
} as const;
export type ProviderId = keyof typeof PROVIDER_ENABLED;
const base = (key: string, fallback: string) => (process.env[key] || fallback).replace(/\/$/, '');
export const KKPHIM_BASE = base('API_BASE_KKPHIM', 'https://phimapi.com');
export const KKPHIM_CDN = base('API_CDN_KKPHIM', 'https://phimimg.com');
export const OPHIM_BASE = base('API_BASE_OPHIM', 'https://ophim1.com');
export const OPHIM_CDN = base('API_CDN_OPHIM', 'https://img.ophim.live/uploads/movies');
export const NGUONC_BASE = base('API_BASE_NGUONC', 'https://phim.nguonc.com');
type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value && typeof value === 'object' && !Array.isArray(value) ? value as RecordValue : {};
const array = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
const numeric = (value: unknown, fallback = 0) => Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : fallback;
const TYPE_MAP: Record<string, string> = { series: 'phim-bo', single: 'phim-le', hoathinh: 'hoat-hinh', tvshows: 'tv-shows' };

async function readJson(response: Response, signal: AbortSignal): Promise<unknown> {
  const reader = response.body?.getReader();
  if (!reader) throw new ProviderError('schema_invalid', 'Nguồn trả nội dung rỗng');
  let rejectAbort: (reason: unknown) => void = () => {};
  const cancelled = new Promise<never>((_resolve, reject) => { rejectAbort = reject; });
  const abort = () => { rejectAbort(signal.reason); void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', abort, { once: true });
  const decoder = new TextDecoder();
  let body = ''; let size = 0;
  try {
    if (signal.aborted) throw signal.reason;
    for (;;) {
      const chunk = await Promise.race([reader.read(), cancelled]);
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 4 * 1024 * 1024) throw new ProviderError('schema_invalid', 'Payload vượt giới hạn');
      body += decoder.decode(chunk.value, { stream: true });
    }
    body += decoder.decode();
    try { return JSON.parse(body) as unknown; } catch { throw new ProviderError('schema_invalid', 'Nguồn trả JSON không hợp lệ'); }
  } finally { signal.removeEventListener('abort', abort); await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

async function fetchJson(url: string, adapter: ProviderAdapter, signal?: AbortSignal, noStore = false, ttl = 300): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException('Provider deadline exceeded', 'TimeoutError')), adapter.timeoutMs);
  const combined = signal ? AbortSignal.any([signal, controller.signal]) : controller.signal;
  try {
    if (combined.aborted) throw combined.reason;
    let response: Response;
    if (process.env.API_MOCK === '1') {
      const { dispatchMockRequest } = await import('./mock-handler');
      response = dispatchMockRequest(url).response;
    } else {
      const init: RequestInit & { next?: { revalidate: number } } = { signal: combined };
      if (noStore) init.cache = 'no-store'; else init.next = { revalidate: ttl };
      response = await fetch(url, init);
    }
    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      const retry = response.headers.get('retry-after');
      const retryMs = retry ? /^\d+$/.test(retry) ? Number(retry) * 1000 : Math.max(0, Date.parse(retry) - Date.now()) : undefined;
      throw new ProviderError(response.status === 404 ? 'not_found' : 'http_error', `HTTP ${response.status}`, response.status, retryMs);
    }
    const payload = await readJson(response, combined);
    const status = record(payload).status;
    if (status === false || status === 'error') throw new ProviderError('schema_invalid', 'Nguồn trả trạng thái lỗi');
    return payload;
  } catch (error) {
    const failure = error instanceof ProviderError ? error : combined.aborted
      ? new ProviderError(combined.reason?.name === 'TimeoutError' ? 'timeout' : 'cancelled', 'Yêu cầu đã hết thời gian hoặc bị hủy')
      : new ProviderError('network', 'Không kết nối được nguồn phim');
    throw failure;
  } finally { clearTimeout(timer); }
}
function image(value: unknown, source: Source): string {
  const path = readString(value).trim();
  if (!path) return '/images/placeholder.svg';
  if (/^(https?:)?\/\//.test(path)) return getImageUrl(path);
  return source === 'ophim' ? `${OPHIM_CDN}/${path.replace(/^\/+/, '')}` : getImageUrl(path);
}
function normalizeItem(value: unknown, source: Source): MovieListItem | null {
  const raw = record(value); const slug = sanitizeSlug(raw.slug); const name = readString(raw.name);
  if (!slug || !name) return null;
  const tmdb = record(raw.tmdb);
  return {
    source, _id: readString(raw._id ?? raw.id, `${source}:${slug}`), slug, name,
    origin_name: readString(raw.origin_name ?? raw.original_name, name),
    poster_url: image(raw.poster_url, source), thumb_url: image(raw.thumb_url ?? raw.poster_url, source),
    year: numeric(raw.year), content: readString(raw.content ?? raw.description),
    type: readString(raw.type, 'unknown'), quality: readString(raw.quality), lang: readString(raw.lang ?? raw.language),
    episode_current: readString(raw.episode_current ?? raw.current_episode), modified: record(raw.modified),
    tmdb: tmdb.id ? { id: readString(tmdb.id), type: readString(tmdb.type), season: tmdb.season == null ? null : numeric(tmdb.season), vote_average: readString(tmdb.vote_average), vote_count: numeric(tmdb.vote_count) } : undefined,
    imdb: raw.imdb ? { id: readString(record(raw.imdb).id) } : undefined,
  };
}
function normalizeList(payload: unknown, source: Source, filter: FilterParams): MovieListResponse {
  const root = record(payload); const data = record(root.data); const rawItems = data.items ?? root.items;
  if (!Array.isArray(rawItems)) throw new ProviderError('schema_invalid', 'Danh sách phim thiếu items');
  const items = rawItems.map(item => normalizeItem(item, source)).filter((item): item is MovieListItem => item !== null);
  if (rawItems.length && !items.length) throw new ProviderError('schema_invalid', 'Danh sách phim không có item hợp lệ');
  const pagination = record(record(data.params).pagination ?? root.pagination ?? root.paginate);
  const size = numeric(pagination.totalItemsPerPage ?? pagination.items_per_page, source === 'nguonc' ? 10 : clampLimit(filter.limit));
  const total = numeric(pagination.totalItems ?? pagination.total_items, items.length);
  return { status: true, provider: source, items, pagination: { totalItems: total, totalItemsPerPage: size || 24,
    currentPage: numeric(pagination.currentPage ?? pagination.current_page, clampPage(filter.page)) || 1,
    totalPages: numeric(pagination.totalPages ?? pagination.total_page, Math.max(1, Math.ceil(total / (size || 24)))) || 1,
  } };
}
function normalizeTaxonomy(value: unknown): CategoryItem[] {
  return array(value).flatMap(item => {
    const raw = record(item); const slug = sanitizeSlug(raw.slug); const name = readString(raw.name);
    return slug && name ? [{ _id: readString(raw._id ?? raw.id, slug), slug, name }] : [];
  });
}
function normalizeDetail(payload: unknown, source: Source) {
  const root = record(payload); const raw = record(root.movie ?? record(root.data).item); const item = normalizeItem(raw, source);
  if (!item) throw new ProviderError('schema_invalid', 'Nguồn thiếu metadata phim');
  const movie: MovieDetail = { ...item, content: readString(raw.content ?? raw.description), type: item.type ?? 'unknown',
    status: readString(raw.status, 'unknown'), time: readString(raw.time), episode_total: readString(raw.episode_total ?? raw.total_episodes),
    actor: array(raw.actor).filter((v): v is string => typeof v === 'string'), director: array(raw.director).filter((v): v is string => typeof v === 'string'),
    category: normalizeTaxonomy(raw.category), country: normalizeTaxonomy(raw.country),
  };
  if (source === 'nguonc') for (const group of Object.values(record(raw.category))) {
    const category = record(group); const values = normalizeTaxonomy(category.list); const label = readString(record(category.group).name).toLowerCase();
    if (label.includes('quốc gia')) movie.country = values; else if (label.includes('thể loại')) movie.category = values;
  }
  const episodes: EpisodeServer[] = array(root.episodes ?? raw.episodes).flatMap(server => {
    const srv = record(server);
    const server_data = array(srv.server_data ?? srv.items).flatMap((value, index) => {
      const ep = record(value); const link_embed = normalizeEmbedUrl(ep.link_embed ?? ep.embed); const link_m3u8 = normalizeM3u8Url(ep.link_m3u8 ?? ep.m3u8);
      return link_embed || link_m3u8 ? [{ name: readString(ep.name, String(index + 1)), slug: readString(ep.slug, String(index + 1)), link_embed, link_m3u8 }] : [];
    });
    return server_data.length ? [{ server_name: `${source === 'kkphim' ? 'Server VIP' : 'Server'} (${source === 'kkphim' ? 'KKPhim' : source === 'nguonc' ? 'NguonC' : 'Ophim'} - ${readString(srv.server_name, 'Video')})`, server_type: server_data.some(ep => ep.link_m3u8) ? 'hls' : 'embed', server_data }] : [];
  });
  return { status: true, movie, episodes };
}
export function buildKkphimListUrl(filter: FilterParams): string {
  const query = new URLSearchParams({ page: String(clampPage(filter.page)), limit: String(clampLimit(filter.limit)) });
  for (const key of ['year', 'sort_field', 'sort_type', 'country', 'category', 'type'] as const) if (filter[key]) query.set(key, String(filter[key]));
  if (filter.keyword?.trim()) { query.set('keyword', filter.keyword.trim()); return `${KKPHIM_BASE}/v1/api/tim-kiem?${query}`; }
  if (filter.category) return `${KKPHIM_BASE}/v1/api/the-loai/${encodeURIComponent(filter.category)}?${query}`;
  if (filter.country) return `${KKPHIM_BASE}/v1/api/quoc-gia/${encodeURIComponent(filter.country)}?${query}`;
  if (filter.type) return `${KKPHIM_BASE}/v1/api/danh-sach/${TYPE_MAP[filter.type] ?? encodeURIComponent(filter.type)}?${query}`;
  const path = filter.year || filter.sort_field || filter.sort_type ? '/v1/api/danh-sach/phim-moi-cap-nhat' : '/danh-sach/phim-moi-cap-nhat';
  return `${KKPHIM_BASE}${path}?${query}`;
}
export function buildOphimListUrl(filter: FilterParams): string {
  const query = new URLSearchParams({ page: String(clampPage(filter.page)), limit: String(clampLimit(filter.limit)) });
  for (const key of ['year', 'sort_field', 'sort_type', 'country', 'category', 'type'] as const) if (filter[key]) query.set(key, String(filter[key]));
  if (filter.keyword?.trim()) { query.set('keyword', filter.keyword.trim()); return `${OPHIM_BASE}/v1/api/tim-kiem?${query}`; }
  const path = filter.category ? `the-loai/${encodeURIComponent(filter.category)}` : filter.country ? `quoc-gia/${encodeURIComponent(filter.country)}` : `danh-sach/${filter.type ? TYPE_MAP[filter.type] ?? encodeURIComponent(filter.type) : 'phim-moi'}`;
  return `${OPHIM_BASE}/v1/api/${path}?${query}`;
}
export function buildNguoncListUrl(filter: FilterParams): string {
  const query = new URLSearchParams({ page: String(clampPage(filter.page)) });
  if (filter.keyword?.trim()) { query.set('keyword', filter.keyword.trim()); return `${NGUONC_BASE}/api/films/search?${query}`; }
  const dimensions = ['category', 'country', 'year', 'type'] as const;
  if (dimensions.filter(key => Boolean(filter[key])).length > 1 || (filter.sort_field && filter.sort_field !== 'modified.time') || filter.sort_type === 'asc') throw new ProviderError('unsupported', 'NguonC chưa hỗ trợ kết hợp bộ lọc hoặc cách sắp xếp này. Hãy chọn một bộ lọc.');
  const path = filter.category ? `the-loai/${encodeURIComponent(filter.category)}` : filter.country ? `quoc-gia/${encodeURIComponent(filter.country)}` : filter.year ? `nam-phat-hanh/${encodeURIComponent(String(filter.year))}` : filter.type ? `danh-sach/${TYPE_MAP[filter.type] ?? encodeURIComponent(filter.type)}` : 'phim-moi-cap-nhat';
  return `${NGUONC_BASE}/api/films/${path}?${query}`;
}
function createAdapter(id: Source, baseUrl: string, listUrl: (filter: FilterParams) => string): ProviderAdapter {
  return { id, timeoutMs: 6000,
    async list(filter, signal) { return runOperation(this, filter.keyword ? 'search' : 'catalogue', async () => normalizeList(await fetchJson(listUrl(filter), this, signal, Boolean(filter.keyword)), id, filter)); },
    async search(keyword, page = 1, limit = 24, signal) { return this.list({ keyword, page, limit }, signal); },
    async categories(signal) {
      if (id === 'nguonc') throw new ProviderError('unsupported', 'NguonC không có taxonomy endpoint đã kiểm chứng');
      return runOperation(this, 'categories', async () => {
        const items = record(record(await fetchJson(`${baseUrl}/v1/api/the-loai`, this, signal, false, 3600)).data).items;
        if (!Array.isArray(items)) throw new ProviderError('schema_invalid', 'Taxonomy thiếu items');
        return normalizeTaxonomy(items);
      });
    },
    async countries(signal) {
      if (id === 'nguonc') throw new ProviderError('unsupported', 'NguonC không có taxonomy endpoint đã kiểm chứng');
      return runOperation(this, 'countries', async () => {
        const items = record(record(await fetchJson(`${baseUrl}/v1/api/quoc-gia`, this, signal, false, 3600)).data).items;
        if (!Array.isArray(items)) throw new ProviderError('schema_invalid', 'Taxonomy thiếu items');
        return normalizeTaxonomy(items);
      });
    },
    async detail(slug, signal) {
      if (!sanitizeSlug(slug)) throw new ProviderError('not_found', 'Slug không hợp lệ', 404);
      const path = id === 'kkphim' ? '/phim/' : id === 'ophim' ? '/v1/api/phim/' : '/api/film/';
      return runOperation(this, 'detail', async () => normalizeDetail(await fetchJson(`${baseUrl}${path}${encodeURIComponent(slug)}`, this, signal), id));
    },
  };
}
async function runOperation<T>(adapter: ProviderAdapter, operation: string, run: () => Promise<T>): Promise<T> {
  const key = `${adapter.id}:${operation}`;
  if (!providerHealth.available(key)) throw new ProviderError('network', 'Nguồn đang tạm nghỉ sau nhiều lỗi');
  const started = Date.now();
  try {
    const result = await run();
    providerHealth.record(key, true, Date.now() - started);
    return result;
  } catch (error) {
    const failure = error instanceof ProviderError ? error : new ProviderError('network', 'Không kết nối được nguồn');
    providerHealth.record(key, false, Date.now() - started, failure.code, failure.retryAfterMs);
    throw failure;
  }
}
export const kkphimAdapter = PROVIDER_ENABLED.kkphim ? createAdapter('kkphim', KKPHIM_BASE, buildKkphimListUrl) : null;
export const ophimAdapter = PROVIDER_ENABLED.ophim ? createAdapter('ophim', OPHIM_BASE, buildOphimListUrl) : null;
export const nguoncAdapter = PROVIDER_ENABLED.nguonc ? createAdapter('nguonc', NGUONC_BASE, buildNguoncListUrl) : null;
export function getEnabledAdapters(): ProviderAdapter[] { return [kkphimAdapter, ophimAdapter, nguoncAdapter].filter((adapter): adapter is ProviderAdapter => adapter !== null); }
export function isHttpError(value: unknown): boolean { return value instanceof ProviderError && Boolean(value.status); }
export function isTimeout(value: unknown): boolean { return value instanceof ProviderError && value.code === 'timeout'; }
