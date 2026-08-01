/**
 * Concrete provider adapters against the public upstream APIs.
 *
 * Each adapter is intentionally thin: it builds the request, performs the
 * fetch with a per-adapter timeout, and maps the response into the
 * shared `MovieListResponse` / `MovieDetailResponse` shapes. The
 * orchestrator (`providers.ts`) is responsible for retries, fallbacks, and
 * merging episode servers.
 *
 * The adapters also export `build*` helpers used by the offline tests and
 * the live probe so the two stay in sync.
 */
import {
  buildPagination,
  type ProviderAdapter,
  withTimeoutSimple,
} from './providers';
import {
  getImageUrl,
  normalizeEmbedUrl,
  normalizeM3u8Url,
  readString,
} from '../api';
import type {
  CategoryItem,
  CountryItem,
  EpisodeItem,
  EpisodeServer,
  FilterParams,
  MovieDetailResponse,
  MovieListItem,
  MovieListResponse,
} from '@/types/movie';

/* ─── Provider kill-switch (API-REDESIGN-8) ───────────────────────────── */

/**
 * Set an env var `API_DISABLE_<PROVIDER>=1` to disable a specific upstream
 * provider at runtime. Read once at module init (Vercel env changes require
 * a redeploy to take effect). Defaults: all providers enabled.
 *
 * Why server-only and not `NEXT_PUBLIC_API_DISABLE_*`? The flag controls
 * upstream fetch behaviour; we don't want to leak the disabled set to the
 * client (a bad actor could probe which upstreams are still wired).
 */
function isProviderDisabled(envKey: string): boolean {
  return process.env[envKey] === '1';
}

export const PROVIDER_ENABLED = {
  kkphim: !isProviderDisabled('API_DISABLE_KKPHIM'),
  ophim: !isProviderDisabled('API_DISABLE_OPHIM'),
  nguonc: !isProviderDisabled('API_DISABLE_NGUONC'),
  vsmov: !isProviderDisabled('API_DISABLE_VSMOV'),
} as const;

export type ProviderId = keyof typeof PROVIDER_ENABLED;

/* ─── Shared fetch helpers ───────────────────────────────────────────── */

interface FetchOpts {
  /** Force `cache: 'no-store'` for non-cacheable operations (search). */
  noStore?: boolean;
  /** Cache TTL in seconds when `noStore` is false. */
  revalidate?: number;
  /** Override the per-adapter timeout. */
  timeoutMs?: number;
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchJson(
  url: string,
  adapter: ProviderAdapter,
  opts: FetchOpts & { signal?: AbortSignal } = {},
): Promise<unknown> {
  const fetchOpts: RequestInit = { ...(opts.signal ? { signal: opts.signal } : {}) };
  if (opts.noStore) {
    fetchOpts.cache = 'no-store';
  } else {
    fetchOpts.next = { revalidate: opts.revalidate ?? 300 };
  }
  const promise = fetch(url, fetchOpts).then(async (res) => {
    if (!res.ok) return { __httpError: res.status };
    return safeJson(res);
  });
  return withTimeoutSimple(promise, opts.timeoutMs ?? adapter.timeoutMs, { __timeout: true });
}

export function isHttpError(payload: unknown): payload is { __httpError: number } {
  return Boolean(payload && typeof payload === 'object' && '__httpError' in (payload as Record<string, unknown>));
}

export function isTimeout(payload: unknown): payload is { __timeout: true } {
  return Boolean(payload && typeof payload === 'object' && '__timeout' in (payload as Record<string, unknown>));
}

/* ─── KKPhim adapter (primary catalogue + primary detail) ───────────── */

/**
 * Base URL override for the mock. When `API_MOCK=1` is set (Playwright
 * E2E), `playwright.config.ts` also sets each provider's base to point
 * at `/api/_mock/<provider>` so the adapters hit the mock dispatcher
 * without any code changes here. Production never sets `API_MOCK=1`,
 * so the default real URL is used.
 *
 * We use server-only env vars (no `NEXT_PUBLIC_` prefix) so Next.js
 * reads them at runtime, not at build time — this lets Playwright flip
 * the mock on with `next start` against the same prebuilt production
 * bundle without rebuilding.
 */
const KKPHIM_BASE = process.env.API_BASE_KKPHIM || 'https://phimapi.com';
const KKPHIM_CDN = process.env.API_CDN_KKPHIM || 'https://phimimg.com';
const KKPHIM_TIMEOUT = 8000;

const TYPE_MAP: Record<string, string> = {
  series: 'phim-bo',
  single: 'phim-le',
  hoathinh: 'hoat-hinh',
  tvshows: 'tv-shows',
};

function buildKkphimListUrl(filter: FilterParams): { url: string; isPrivateSearch: boolean } {
  const page = Number(filter.page) || 1;
  const limit = Number(filter.limit) || 24;
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });

  if (filter.year) query.set('year', String(filter.year));
  if (filter.sort_field) query.set('sort_field', String(filter.sort_field));
  if (filter.sort_type) query.set('sort_type', String(filter.sort_type));

  if (filter.keyword?.trim()) {
    query.set('keyword', filter.keyword.trim());
    return { url: `${KKPHIM_BASE}/v1/api/tim-kiem?${query.toString()}`, isPrivateSearch: true };
  }
  if (filter.category) {
    query.delete('limit');
    if (filter.country) query.set('country', filter.country);
    if (filter.type) query.set('type', filter.type);
    return {
      url: `${KKPHIM_BASE}/v1/api/the-loai/${encodeURIComponent(filter.category)}?${query.toString()}`,
      isPrivateSearch: false,
    };
  }
  if (filter.country) {
    query.delete('limit');
    if (filter.category) query.set('category', filter.category);
    if (filter.type) query.set('type', filter.type);
    return {
      url: `${KKPHIM_BASE}/v1/api/quoc-gia/${encodeURIComponent(filter.country)}?${query.toString()}`,
      isPrivateSearch: false,
    };
  }
  if (filter.type) {
    query.delete('limit');
    return {
      url: `${KKPHIM_BASE}/v1/api/danh-sach/${TYPE_MAP[filter.type] ?? encodeURIComponent(filter.type)}?${query.toString()}`,
      isPrivateSearch: false,
    };
  }
  query.delete('limit');
  return {
    url: `${KKPHIM_BASE}/danh-sach/phim-moi-cap-nhat?${query.toString()}`,
    isPrivateSearch: false,
  };
}

function normalizeKkphimList(payload: unknown, fallback: { page: number; limit: number }): MovieListResponse | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = payload as Record<string, unknown>;
  let rawItems: unknown[] = [];
  let rawPagination: { totalItems?: number; totalItemsPerPage?: number; currentPage?: number; totalPages?: number } | undefined;

  const wrapped = data.data as { items?: unknown[]; params?: { pagination?: typeof rawPagination } } | undefined;
  if (wrapped?.items) {
    rawItems = wrapped.items;
    rawPagination = wrapped.params?.pagination;
  } else if (Array.isArray(data.items)) {
    rawItems = data.items;
    rawPagination = data.pagination as typeof rawPagination;
  } else {
    return null;
  }

  const items = rawItems.map(normalizeListItem).filter(Boolean) as MovieListItem[];
  const pagination = rawPagination
    ? {
        totalItems: Number(rawPagination.totalItems) || items.length,
        totalItemsPerPage: Number(rawPagination.totalItemsPerPage) || fallback.limit,
        currentPage: Number(rawPagination.currentPage) || fallback.page,
        totalPages: Number(rawPagination.totalPages) || 1,
      }
    : buildPagination(items.length, fallback);

  return { status: true, items, pagination };
}

function normalizeListItem(item: unknown): MovieListItem | null {
  if (!item || typeof item !== 'object') return null;
  const raw = item as Record<string, unknown>;
  return {
    _id: readString(raw._id) || readString(raw.id),
    name: readString(raw.name),
    origin_name: readString(raw.origin_name, readString(raw.name)),
    slug: readString(raw.slug),
    poster_url: getImageUrl(raw.poster_url),
    thumb_url: getImageUrl(raw.thumb_url || raw.poster_url),
    year: Number(raw.year) || new Date().getFullYear(),
    content: readString(raw.content),
    episode_current: readString(raw.episode_current),
    quality: readString(raw.quality, 'HD'),
    lang: readString(raw.lang, 'Vietsub'),
    type: readString(raw.type, 'single'),
    modified: raw.modified as MovieListItem['modified'],
    tmdb: raw.tmdb as MovieListItem['tmdb'],
    imdb: raw.imdb as MovieListItem['imdb'],
  };
}

function normalizeEpisodeData(ep: Record<string, unknown>): EpisodeItem {
  return {
    name: readString(ep.name),
    slug: readString(ep.slug, readString(ep.name)),
    filename: typeof ep.filename === 'string' ? ep.filename : undefined,
    link_embed: normalizeEmbedUrl(ep.link_embed),
    link_m3u8: normalizeM3u8Url(ep.link_m3u8 ?? ''),
  };
}

export const kkphimAdapter: ProviderAdapter | null = PROVIDER_ENABLED.kkphim
  ? {
      id: 'kkphim',
      timeoutMs: KKPHIM_TIMEOUT,

      async list(filter, signal) {
        const { url, isPrivateSearch } = buildKkphimListUrl(filter);
        const payload = await fetchJson(url, this, {
          noStore: isPrivateSearch,
          revalidate: isPrivateSearch ? undefined : 300,
          signal,
        });
        if (isHttpError(payload) || isTimeout(payload)) return emptyList(filter);
        const normalized = normalizeKkphimList(payload, {
          page: Number(filter.page) || 1,
          limit: Number(filter.limit) || 24,
        });
        return normalized ?? emptyList(filter);
      },

      async search(keyword, page = 1, limit = 24, signal) {
        const query = new URLSearchParams({ keyword, page: String(page), limit: String(limit) });
        const url = `${KKPHIM_BASE}/v1/api/tim-kiem?${query.toString()}`;
        const payload = await fetchJson(url, this, { noStore: true, signal });
        if (isHttpError(payload) || isTimeout(payload)) return emptyList({ page, limit });
        const normalized = normalizeKkphimList(payload, { page, limit });
        return normalized ?? emptyList({ page, limit });
      },

      async categories(signal) {
        const payload = await fetchJson(`${KKPHIM_BASE}/v1/api/the-loai`, this, { revalidate: 3600, signal });
        if (isHttpError(payload) || isTimeout(payload)) return [];
        const data = payload as { data?: { items?: CategoryItem[] } } | null;
        return data?.data?.items ?? [];
      },

      async countries(signal) {
        const payload = await fetchJson(`${KKPHIM_BASE}/v1/api/quoc-gia`, this, { revalidate: 3600, signal });
        if (isHttpError(payload) || isTimeout(payload)) return [];
        const data = payload as { data?: { items?: CountryItem[] } } | null;
        return data?.data?.items ?? [];
      },

      async detail(slug, signal) {
        const payload = await fetchJson(`${KKPHIM_BASE}/phim/${slug}`, this, { revalidate: 300, signal });
        if (isHttpError(payload) || isTimeout(payload) || !payload || typeof payload !== 'object') return null;
        const data = payload as { status?: boolean; movie?: Record<string, unknown>; episodes?: Array<{ server_name?: string; server_data?: Array<Record<string, unknown>> }> };
        if (!data.status || !data.movie) return null;

        // FIX-13: nếu upstream trả absolute URL ở host không whitelist
        // (vd VSMOV mirror), giữ raw URL để SafeImage chain fallback sang
        // phimimg.com / phim.nguonc.com xử lý. getImageUrl chỉ là best-effort.
        const rawPoster = readString(data.movie.poster_url as string | undefined);
        const rawThumb = readString((data.movie.thumb_url as string | undefined) || rawPoster);
        const movie: MovieDetailResponse['movie'] = {
          ...(data.movie as unknown as MovieDetailResponse['movie']),
          poster_url: getImageUrl(rawPoster) || rawPoster,
          thumb_url: getImageUrl(rawThumb) || rawThumb,
        };
        const episodes: EpisodeServer[] = (data.episodes ?? []).map((srv) => ({
          server_name: `Server VIP (KKPhim - ${srv.server_name ?? 'HLS Direct'})`,
          server_type: 'hls',
          server_data: (srv.server_data ?? []).map((ep) => normalizeEpisodeData(ep)),
        }));
        return { status: true, movie, episodes };
      },
    }
  : null;

function emptyList(filter: Partial<FilterParams>): MovieListResponse {
  const page = Number(filter.page) || 1;
  const limit = Number(filter.limit) || 24;
  return {
    status: false,
    msg: 'Không có dữ liệu',
    items: [],
    pagination: { totalItems: 0, totalItemsPerPage: limit, currentPage: page, totalPages: 1 },
  };
}

/* ─── Ophim adapter (episode servers only) ───────────────────────────── */

const OPHIM_BASE = process.env.API_BASE_OPHIM || 'https://ophim1.com';
const OPHIM_TIMEOUT = 8000;

export const ophimAdapter: ProviderAdapter | null = PROVIDER_ENABLED.ophim
  ? {
      id: 'ophim',
      timeoutMs: OPHIM_TIMEOUT,

      async list(_filter, _signal) {
        // Ophim doesn't expose a catalogue list endpoint we use; fall back to empty.
        return emptyList({ page: 1, limit: 24 });
      },

      async search(_keyword, _page, _limit, _signal) {
        return emptyList({ page: 1, limit: 24 });
      },

      async categories(_signal) {
        return [];
      },

      async countries(_signal) {
        return [];
      },

      async detail(slug, signal) {
        const url = `${OPHIM_BASE}/v1/api/phim/${slug}`;
        const payload = await fetchJson(url, this, { revalidate: 300, signal });
        if (isHttpError(payload) || isTimeout(payload) || !payload || typeof payload !== 'object') return null;
        const data = payload as { data?: { item?: { episodes?: Array<{ server_name?: string; server_data?: Array<Record<string, unknown>> }> } } };
        const item = data.data?.item;
        if (!item?.episodes?.length) return null;
        const episodes: EpisodeServer[] = item.episodes.map((srv) => ({
          server_name: `Server (Ophim - ${srv.server_name ?? 'HLS'})`,
          server_type: 'hls',
          server_data: (srv.server_data ?? []).map((ep) => normalizeEpisodeData(ep)),
        }));
        return { status: true, movie: undefined as unknown as MovieDetailResponse['movie'], episodes };
      },
    }
  : null;

/* ─── NguonC adapter (episode servers, embed focus) ──────────────────── */

const NGUONC_BASE = process.env.API_BASE_NGUONC || 'https://phim.nguonc.com';
const NGUONC_TIMEOUT = 8000;

export const nguoncAdapter: ProviderAdapter | null = PROVIDER_ENABLED.nguonc
  ? {
      id: 'nguonc',
      timeoutMs: NGUONC_TIMEOUT,

      async list(_filter, _signal) {
        return emptyList({ page: 1, limit: 24 });
      },

      async search(_keyword, _page, _limit, _signal) {
        return emptyList({ page: 1, limit: 24 });
      },

      async categories(_signal) {
        return [];
      },

      async countries(_signal) {
        return [];
      },

      async detail(slug, signal) {
        const url = `${NGUONC_BASE}/api/film/${slug}`;
        const payload = await fetchJson(url, this, { revalidate: 300, signal });
        if (isHttpError(payload) || isTimeout(payload) || !payload || typeof payload !== 'object') return null;
        const data = payload as {
          movie?: { episodes?: Array<{ server_name?: string; items?: Array<Record<string, unknown>>; server_data?: Array<Record<string, unknown>> }> };
          episodes?: Array<{ server_name?: string; items?: Array<Record<string, unknown>>; server_data?: Array<Record<string, unknown>> }>;
        };
        const eps = data.movie?.episodes ?? data.episodes;
        if (!eps?.length) return null;
        const episodes: EpisodeServer[] = eps.map((srv) => ({
          server_name: `Server (NguonC - ${srv.server_name ?? 'Embed'})`,
          server_type: 'embed',
          server_data: (srv.items ?? srv.server_data ?? []).map((ep) => ({
            name: readString(ep.name),
            slug: readString(ep.slug, readString(ep.name)),
            link_embed: normalizeEmbedUrl((ep.embed as string | undefined) ?? (ep.link_embed as string | undefined)),
            link_m3u8: normalizeM3u8Url((ep.m3u8 as string | undefined) ?? (ep.link_m3u8 as string | undefined) ?? ''),
          })),
        }));
        return { status: true, movie: undefined as unknown as MovieDetailResponse['movie'], episodes };
      },
    }
  : null;

/* ─── VSMOV adapter (fallback for movie metadata) ─────────────────────── */

const VSMOV_BASE = process.env.API_BASE_VSMOV || 'https://vsmov.com/api';
const VSMOV_TIMEOUT = 8000;

export const vsmovAdapter: ProviderAdapter | null = PROVIDER_ENABLED.vsmov
  ? {
      id: 'vsmov',
      timeoutMs: VSMOV_TIMEOUT,

      async list(_filter, _signal) {
        return emptyList({ page: 1, limit: 24 });
      },

      async search(_keyword, _page, _limit, _signal) {
        return emptyList({ page: 1, limit: 24 });
      },

      async categories(_signal) {
        return [];
      },

      async countries(_signal) {
        return [];
      },

      async detail(slug, signal) {
        const url = `${VSMOV_BASE}/phim/${slug}`;
        const payload = await fetchJson(url, this, { revalidate: 300, signal });
        if (isHttpError(payload) || isTimeout(payload) || !payload || typeof payload !== 'object') return null;
        const data = payload as {
          movie?: Record<string, unknown>;
          episodes?: Array<{ server_name: string; server_data?: Array<Record<string, unknown>> }>;
        };
        if (!data.movie) return null;
        // FIX-13: giữ raw URL khi upstream trả absolute path ở CDN ngoài
        // whitelist, để SafeImage chain fallback tự xử lý.
        const rawPoster = readString(data.movie.poster_url as string | undefined);
        const rawThumb = readString((data.movie.thumb_url as string | undefined) || rawPoster);
        const movie: MovieDetailResponse['movie'] = {
          ...(data.movie as unknown as MovieDetailResponse['movie']),
          poster_url: getImageUrl(rawPoster) || rawPoster,
          thumb_url: getImageUrl(rawThumb) || rawThumb,
        };
        const episodes: EpisodeServer[] = (data.episodes ?? []).map((srv, idx) => ({
          server_name: `Server VSMOV ${idx + 1} (${srv.server_name})`,
          server_type: 'embed',
          server_data: (srv.server_data ?? []).map((ep) => ({
            name: readString(ep.name),
            slug: readString(ep.slug, readString(ep.name)),
            filename: typeof ep.filename === 'string' ? ep.filename : undefined,
            link_embed: normalizeEmbedUrl(ep.link_embed),
            link_m3u8: normalizeM3u8Url(ep.link_m3u8 ?? ''),
          })),
        }));
        return { status: true, movie, episodes };
      },
    }
  : null;

/* ─── Provider health tracking (in-memory) ──────────────────────────── */

export interface ProviderHealth {
  provider: string;
  /** Recent samples — last call timestamp + success/timeout/error */
  samples: Array<{ at: number; ok: boolean; latencyMs: number; code?: string }>;
  consecutiveFailures: number;
}

const HEALTH_TTL_MS = 1000 * 60 * 5; // 5 minutes

export class HealthRegistry {
  private readonly store = new Map<string, ProviderHealth>();

  record(provider: string, ok: boolean, latencyMs: number, code?: string): void {
    const existing: ProviderHealth = this.store.get(provider) ?? {
      provider,
      samples: [],
      consecutiveFailures: 0,
    };
    const now = Date.now();
    existing.samples = existing.samples.filter((s) => now - s.at < HEALTH_TTL_MS);
    existing.samples.push({ at: now, ok, latencyMs, code });
    existing.consecutiveFailures = ok ? 0 : existing.consecutiveFailures + 1;
    this.store.set(provider, existing);
  }

  snapshot(provider: string): ProviderHealth | undefined {
    const entry = this.store.get(provider);
    if (!entry) return undefined;
    const now = Date.now();
    entry.samples = entry.samples.filter((s) => now - s.at < HEALTH_TTL_MS);
    return entry;
  }

  /** Score 0-100 (higher is healthier). Used by orchestrator to pick primary. */
  score(provider: string): number {
    const entry = this.snapshot(provider);
    if (!entry || entry.samples.length === 0) return 50;
    const successRate = entry.samples.filter((s) => s.ok).length / entry.samples.length;
    const avgLatency =
      entry.samples.reduce((sum, s) => sum + s.latencyMs, 0) / entry.samples.length;
    const latencyScore = Math.max(0, 1 - avgLatency / 5000); // 5s → 0
    return Math.round(100 * (0.7 * successRate + 0.3 * latencyScore));
  }

  reset(provider?: string): void {
    if (provider) this.store.delete(provider);
    else this.store.clear();
  }
}

export const providerHealth = new HealthRegistry();

/* ─── Provider kill-switch helpers ────────────────────────────────────── */

/**
 * Filter out disabled adapters (null) and return the enabled set. Use this
 * at every call site that previously iterated `[kkphim, ophim, nguonc,
 * vsmov]`. `api.ts` uses this helper to keep its public surface unchanged.
 */
export function getEnabledAdapters(): ProviderAdapter[] {
  return [kkphimAdapter, ophimAdapter, nguoncAdapter, vsmovAdapter].filter(
    (a): a is ProviderAdapter => a !== null,
  );
}

/**
 * Log the active `PROVIDER_ENABLED` map once at module init so operators
 * can verify env-var typos (e.g. `API_DISABLE_KKHIM` would NOT match and
 * KKPhim would still be enabled — but this log line makes the actual
 * state visible in Vercel runtime logs).
 */
{
  const disabled = (Object.entries(PROVIDER_ENABLED) as Array<[ProviderId, boolean]>)
    .filter(([, enabled]) => !enabled)
    .map(([id]) => id);
  if (disabled.length > 0) {
    console.warn(
      `[api] PROVIDER_ENABLED: disabled providers = ${disabled.join(', ')} ` +
        `(set by API_DISABLE_${disabled.map((id) => id.toUpperCase())} env var)`,
    );
  }
}

export { KKPHIM_BASE, KKPHIM_CDN, OPHIM_BASE, NGUONC_BASE, VSMOV_BASE };
