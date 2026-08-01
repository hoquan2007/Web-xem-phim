import { cache } from 'react';
import type {
  MovieListResponse,
  CategoryItem,
  CountryItem,
  MovieDetailResponse,
  FilterParams,
  MovieListItem,
} from '@/types/movie';
import {
  kkphimAdapter,
  getEnabledAdapters,
  providerHealth,
} from './api/adapters';
import {
  AllProvidersDisabledError,
  buildPagination,
  orchestrateCatalogue,
  orchestrateMovieDetail,
  withTimeoutSimple,
  type ErrorCode,
} from './api/providers';

const API_CDN_IMAGE = 'https://phimimg.com';

/**
 * Image URL helper: converts relative API image paths to full CDN URLs
 */
export function getImageUrl(url: unknown, fallback: string = '/images/placeholder.svg'): string {
  if (typeof url !== 'string') return fallback;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_CDN_IMAGE}/${url.startsWith('/') ? url.slice(1) : url}`;
}

/**
 * FIX-12: Build a fallback chain of image URLs that semantically point
 * to the same picture on alternate CDNs.
 *
 * We try every mirror in `MIRRORS` whose origin differs from the source
 * URL — regardless of which CDN upstream returned the original. This way
 * a poster hosted on `image.vsmov.com` automatically falls back to
 * `phimimg.com` and `phim.nguonc.com` (same path, different origin).
 */
const MIRRORS = [
  'https://phimimg.com',
  'https://phim.nguonc.com',
] as const;

function pathOf(url: string): string | null {
  const m = url.match(/^https?:\/\/[^/]+(\/.+)$/i);
  return m ? m[1] : null;
}

export function getImageFallbackChain(url: unknown): string[] {
  if (typeof url !== 'string') return [];
  const trimmed = url.trim();
  if (!trimmed) return [];

  const path = pathOf(trimmed);
  if (!path) {
    // Relative path (e.g. `/upload/abc.jpg`) — try every mirror origin.
    return MIRRORS.map(
      (cdn) => `${cdn}${trimmed.startsWith('/') ? trimmed : `/${trimmed}`}`,
    );
  }
  // Absolute URL — try mirrors whose origin differs from the source.
  return MIRRORS.filter((cdn) => !trimmed.startsWith(cdn)).map((cdn) => `${cdn}${path}`);
}

/**
 * Embed URL helper: chuẩn hoá link embed thành absolute URL.
 */
export function normalizeEmbedUrl(url: unknown): string {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  return '';
}

/**
 * M3U8 URL helper: tương tự normalizeEmbedUrl.
 */
export function normalizeM3u8Url(url: unknown): string {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  return '';
}

function readString(value: unknown, fallback: string = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export { readString };

/**
 * Normalize raw movie items from KKPhim API into standard MovieListItem
 */
export function normalizeMovieItem(item: unknown): MovieListItem {
  if (!item || typeof item !== 'object') return {} as MovieListItem;
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

/**
 * Time-budget wrapper. If the inner promise takes longer than `ms`, return
 * `fallback` so the caller can degrade gracefully instead of hanging.
 *
 * Note: For real abort propagation (frees the upstream socket), use the
 * signal-based `withTimeout` from `./api/providers`. This helper is kept
 * for back-compat with callers that don't own the fetch lifecycle.
 */
export const withTimeout = withTimeoutSimple;

function emptyList(page: number, limit: number): MovieListResponse {
  return {
    status: false,
    msg: 'Mọi provider đều lỗi. Vui lòng thử lại sau.',
    items: [],
    pagination: buildPagination(0, { page, limit }),
  };
}

/**
 * API-REDESIGN-8: catalogue primary is KKPhim. When `API_DISABLE_KKPHIM=1`
 * the adapter is `null`; treat the page request as "no catalogue data
 * available" and return an empty list. The page already renders an empty
 * state, so we don't need to surface a 404 here.
 */
async function safeOrchestrateCatalogue(
  filter: FilterParams,
  opts: { fallbackOnEmpty?: boolean; signal?: AbortSignal },
): Promise<MovieListResponse> {
  const enabled = getEnabledAdapters();
  if (enabled.length === 0) {
    return emptyList(Number(filter.page) || 1, Number(filter.limit) || 24);
  }
  // Use the first enabled adapter as primary; remaining are fallbacks.
  const [primary, ...fallbacks] = enabled;
  try {
    const result = await orchestrateCatalogue(filter, {
      primary,
      fallbacks,
      fallbackOnEmpty: opts.fallbackOnEmpty,
      signal: opts.signal,
    });
    return result.result.data;
  } catch (err) {
    if (err instanceof AllProvidersDisabledError) {
      return emptyList(Number(filter.page) || 1, Number(filter.limit) || 24);
    }
    throw err;
  }
}

/**
 * Fetch latest updated movies from the primary catalogue provider (KKPhim).
 * Falls back through the catalogue adapter chain when primary is unavailable.
 */
export const getLatestMovies = cache(async function getLatestMovies(
  page: number = 1,
  signal?: AbortSignal,
): Promise<MovieListResponse> {
  const startedAt = Date.now();
  const result = await safeOrchestrateCatalogue(
    { page, limit: 24 },
    { fallbackOnEmpty: true, signal },
  );
  // API-REDESIGN-8: health tracking only when the primary provider is
  // still wired. When KKPhim is disabled, we record against the first
  // enabled provider (the one that actually served the request).
  const enabled = getEnabledAdapters();
  if (enabled.length > 0) {
    providerHealth.record(
      enabled[0].id,
      result.items.length > 0,
      Date.now() - startedAt,
    );
  }
  return result;
});

/**
 * Filter movies using dynamic parameters (category, country, type, keyword, page, limit).
 *
 * `cache()` here dedupes calls with identical args within a single render
 * pass — homepage currently fires 2× getLatestMovies + 2× getFilteredMovies
 * + 4× getMoviesByCountry, so this prevents 8 upstream roundtrips when two
 * sections need the same row.
 */
export const getFilteredMovies = cache(async function getFilteredMovies(
  params: FilterParams,
  signal?: AbortSignal,
): Promise<MovieListResponse> {
  const page = Number(params.page || 1);
  const limit = Number(params.limit || 24);
  if (signal?.aborted) {
    return emptyList(page, limit);
  }
  const startedAt = Date.now();
  const result = await safeOrchestrateCatalogue(
    params,
    {
      // filtering with empty primary is a legit "no match" state
      fallbackOnEmpty: false,
      signal,
    },
  );
  const enabled = getEnabledAdapters();
  if (enabled.length > 0) {
    providerHealth.record(
      enabled[0].id,
      result.items.length > 0,
      Date.now() - startedAt,
    );
  }
  return result;
});

/**
 * Fetch list of all genres from KKPhim
 */
export const getCategories = cache(async function getCategories(
  signal?: AbortSignal,
): Promise<CategoryItem[]> {
  if (signal?.aborted) return [];
  if (!kkphimAdapter) return []; // API-REDESIGN-8: KKPhim disabled
  try {
    return await kkphimAdapter.categories(signal);
  } catch (error) {
    console.error('Error fetching categories from KKPhim:', error);
    return [];
  }
});

/**
 * Fetch list of all countries from KKPhim
 */
export const getCountries = cache(async function getCountries(
  signal?: AbortSignal,
): Promise<CountryItem[]> {
  if (signal?.aborted) return [];
  if (!kkphimAdapter) return []; // API-REDESIGN-8: KKPhim disabled
  try {
    return await kkphimAdapter.countries(signal);
  } catch (error) {
    console.error('Error fetching countries from KKPhim:', error);
    return [];
  }
});

/**
 * Fetch movies by category slug from KKPhim.
 */
export const getMoviesByCategory = cache(async function getMoviesByCategory(
  slug: string,
  page: number = 1,
  signal?: AbortSignal,
): Promise<MovieListResponse> {
  return getFilteredMovies({ category: slug, page, limit: 24 }, signal);
});

/**
 * Fetch movies by country slug from KKPhim.
 */
export const getMoviesByCountry = cache(async function getMoviesByCountry(
  slug: string,
  page: number = 1,
  signal?: AbortSignal,
): Promise<MovieListResponse> {
  return getFilteredMovies({ country: slug, page, limit: 24 }, signal);
});

/**
 * Search movies by keyword from KKPhim.
 */
export const searchMovies = cache(async function searchMovies(
  keyword: string,
  page: number = 1,
  limit: number = 24,
  signal?: AbortSignal,
): Promise<MovieListResponse> {
  if (!keyword.trim()) {
    return {
      status: false,
      msg: 'Vui lòng nhập từ khóa để tìm kiếm',
      items: [],
      pagination: buildPagination(0, { page, limit }),
    };
  }
  if (signal?.aborted) {
    return emptyList(page, limit);
  }
  return getFilteredMovies({ keyword, page, limit }, signal);
});

/**
 * Multi-Provider Fetchers for KKPhim, Ophim, NguonC & International Servers.
 * The orchestration now goes through `orchestrateMovieDetail` so partial
 * failures no longer turn into a 404.
 */
export interface InternationalServerOpts {
  movie: MovieDetailResponse['movie'];
}

/**
 * Fetch movie detail & episodes aggregated from multiple providers.
 *
 * Behaviour changes vs. legacy:
 *   - Returns `null` only when **every** provider failed AND no fallback
 *     supplied metadata. Previously, a single failing provider could turn
 *     the page into a 404 (`notFound()`) which the plan explicitly calls out
 *     as a bug.
 *   - VSMOV runs in parallel with the primary chain (capped at 8s) so the
 *     page doesn't double its latency when the primary is healthy.
 *   - `generateInternationalServers` is appended only after metadata is
 *     available; previously it was appended unconditionally even when every
 *     other provider failed.
 */
export const getMovieDetail = cache(async function getMovieDetail(
  slug: string,
  signal?: AbortSignal,
): Promise<MovieDetailResponse | null> {
  const enabledAdapters = getEnabledAdapters();
  if (enabledAdapters.length === 0) {
    // API-REDESIGN-8: every provider disabled — caller should render
    // notFound() (matches the "no such movie" UX already used for invalid
    // slugs).
    console.warn('[getMovieDetail] all providers disabled (kill-switch)');
    return null;
  }
  const startedAt = Date.now();
  let primaryResult: Awaited<ReturnType<typeof orchestrateMovieDetail>>;
  try {
    primaryResult = await orchestrateMovieDetail(slug, enabledAdapters, { signal });
  } catch (err) {
    if (err instanceof AllProvidersDisabledError) {
      console.warn('[getMovieDetail] all providers disabled (kill-switch)');
      return null;
    }
    throw err;
  }
  providerHealth.record(
    enabledAdapters[0].id,
    primaryResult.ok,
    Date.now() - startedAt,
    primaryResult.errorCode as ErrorCode | undefined,
  );

  if (!primaryResult.ok || !primaryResult.data) {
    console.warn('[getMovieDetail] all providers failed', primaryResult.meta.warnings);
    return null;
  }

  return primaryResult.data;
});
