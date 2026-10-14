import 'server-only';
import { cache } from 'react';
import { getEnabledAdapters } from './api/adapters';
import { AllProvidersDisabledError, buildPagination, orchestrateCatalogue, orchestrateMovieDetail, withTimeoutSimple } from './api/providers';
import { ProviderError } from './api/errors';
import { clampPage, clampLimit, sanitizeKeyword } from './validate';
import taxonomy from './api/taxonomy.json' with { type: 'json' };
import type { FilterParams, MovieListResponse, CategoryItem, CountryItem, ProviderId } from '@/types/movie';
export { getImageUrl, getImageFallbackChain, normalizeEmbedUrl, normalizeM3u8Url, readString } from './api/helpers';
export const withTimeout = withTimeoutSimple;

function unavailable(filter: FilterParams): MovieListResponse {
  return { status: false, errorCode: 'network', msg: 'Nguồn phim đang không khả dụng. Vui lòng thử lại sau.', items: [], pagination: buildPagination(0, { page: clampPage(filter.page), limit: clampLimit(filter.limit) }) };
}
async function catalogue(filter: FilterParams, signal?: AbortSignal, fallbackOnEmpty = false): Promise<MovieListResponse> {
  const [primary, ...fallbacks] = getEnabledAdapters();
  if (!primary) return unavailable(filter);
  const { result } = await orchestrateCatalogue(filter, { primary, fallbacks, signal, fallbackOnEmpty });
  return { ...result.data, errorCode: result.errorCode, httpStatus: result.meta.status, provider: result.meta.provider, degraded: result.meta.degraded };
}
export const getLatestMovies = cache((page = 1, signal?: AbortSignal) => catalogue({ page: clampPage(page), limit: 24 }, signal, true));
export const getFilteredMovies = cache((params: FilterParams, signal?: AbortSignal) => catalogue({ ...params, page: clampPage(params.page), limit: clampLimit(params.limit) }, signal));
export const getMoviesByCategory = cache((slug: string, page = 1, signal?: AbortSignal) => getFilteredMovies({ category: slug, page, limit: 24 }, signal));
export const getMoviesByCountry = cache((slug: string, page = 1, signal?: AbortSignal) => getFilteredMovies({ country: slug, page, limit: 24 }, signal));
export const searchMovies = cache((keyword: string, page = 1, limit = 24, signal?: AbortSignal): Promise<MovieListResponse> => {
  const safeKeyword = sanitizeKeyword(keyword);
  return safeKeyword ? catalogue({ keyword: safeKeyword, page: clampPage(page), limit: clampLimit(limit) }, signal) : Promise.resolve({ status: true, items: [], pagination: buildPagination(0, { page: 1, limit: clampLimit(limit) }) });
});

// A verified, dated snapshot is an explicit last-known-good fallback, not
// an invented taxonomy derived from a handful of sample movies.
const lastTaxonomy: { categories: CategoryItem[]; countries: CountryItem[] } = { categories: taxonomy.categories, countries: taxonomy.countries };
async function getTaxonomy(kind: 'categories' | 'countries', signal?: AbortSignal) {
  if (signal?.aborted) return [];
  for (const adapter of getEnabledAdapters()) {
    try { const items = await adapter[kind](signal); if (items.length) { lastTaxonomy[kind] = items; return items; } }
    catch (error) { if (error instanceof ProviderError && error.code === 'cancelled') return []; }
  }
  return lastTaxonomy[kind];
}
export const getCategories = cache((signal?: AbortSignal) => getTaxonomy('categories', signal));
export const getCountries = cache((signal?: AbortSignal) => getTaxonomy('countries', signal));

export const getMovieDetailResult = cache(async (slug: string, source?: ProviderId, identity?: string, title?: string) => {
  const reference = identity && title && /^(movie|tv):\d+:(\d*|unknown)$/.test(identity) ? { identity, title: sanitizeKeyword(title) } : undefined;
  try { return await orchestrateMovieDetail(slug, getEnabledAdapters(), { source, reference }); }
  catch (error) {
    if (!(error instanceof AllProvidersDisabledError)) throw error;
    return { ok: false, data: null, errorCode: 'network' as const, meta: { provider: 'orchestrator', degraded: true, requestId: '', warnings: [] } };
  }
});
export const getMovieDetail = cache(async (slug: string, signal?: AbortSignal, source?: ProviderId) => {
  if (signal?.aborted) return null;
  const result = signal ? await orchestrateMovieDetail(slug, getEnabledAdapters(), { signal, source }) : await getMovieDetailResult(slug, source);
  return result.data;
});
