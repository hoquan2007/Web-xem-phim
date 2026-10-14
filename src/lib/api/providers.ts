/**
 * Provider adapter + orchestration layer.
 *
 * Each provider implements `ProviderAdapter` and exposes the minimum set of
 * operations the site needs:
 *   - list(filter)         → catalogue browse (`/`, `/danh-sach`, `/the-loai`, …)
 *   - search(keyword)      → live + dedicated search
 *   - categories()/countries() → filter dropdowns
 *   - detail(slug)         → single movie + episode servers (KKPhim, Ophim,
 *                            NguonC)
 *
 * FIX-18: VSMOV provider removed (slug-format mismatch + dead
 * `image.vsmov.com` hostname). Adapter chain is now KKPhim + Ophim +
 * NguonC only.
 *
 * The shared `ApiResult` shape keeps the UI contract stable: callers receive
 * `{ data, provider, degraded, errorCode, requestId }` instead of an
 * `unknown | null` blob, so they can show "đang lỗi upstream" vs "không có dữ
 * liệu" distinctly.
 *
 * IMPORTANT: This module exports only the orchestration functions used by
 * pages. Helper utilities (image URL, embed/m3u8 normalization, type
 * mapping, `withTimeout`) stay in `api.ts` to keep the public surface stable
 * for tests/components that import them.
 */
import 'server-only';
import { randomUUID } from 'node:crypto';
import { ProviderError, classifyError } from './errors';
import { sameMovie, movieIdentity } from './helpers';
import type { ProviderId } from '@/types/movie';
import type { ErrorCode } from './errors';
export type { ErrorCode } from './errors';
import type {
  CategoryItem,
  CountryItem,
  EpisodeServer,
  FilterParams,
  MovieDetailResponse,
  MovieListItem,
  MovieListResponse,
} from '@/types/movie';

/* ─── Result types ────────────────────────────────────────────────────── */

/**
 * Thrown when every provider in `adapters` is `null` (i.e. disabled via
 * `API_DISABLE_<PROVIDER>`). Callers should catch this in the page layer
 * and render an appropriate empty/error state.
 *
 * API-REDESIGN-8.
 */
export class AllProvidersDisabledError extends Error {
  constructor(scope: 'catalogue' | 'detail') {
    super(`All providers disabled (kill-switch); scope=${scope}`);
    this.name = 'AllProvidersDisabledError';
  }
}


export interface ApiMeta {
  /** Identifier of the provider that produced `data` (or empty for empty). */
  provider: string;
  /** True when the call succeeded but with degraded data (e.g. only fallback). */
  degraded: boolean;
  /** Numeric HTTP status from the upstream if known. */
  status?: number;
  /** Per-request correlation id — useful for logging/UI debugging. */
  requestId: string;
  /** Non-fatal error codes from providers that did not win. */
  warnings?: Array<{ provider: string; code: ErrorCode; message: string }>;
}

export interface ApiResult<T> {
  ok: boolean;
  data: T;
  errorCode?: ErrorCode;
  errorMessage?: string;
  meta: ApiMeta;
}

/* ─── Helpers ─────────────────────────────────────────────────────────── */

export function makeRequestId(): string {
  // Available in Node 18+ and edge runtime. Falls back if not.
  try {
    return randomUUID();
  } catch {
    return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

export interface TimeoutHandle<T> {
  /** Resolved value of the wrapped promise. */
  result: Promise<T>;
  /** Call to cancel the underlying request (no-op if already settled). */
  cancel: () => void;
  /**
   * Resolves to `true` once `result` settles if the timeout fired first
   * (the value is the `fallback`). Lets callers distinguish a real
   * timeout from a `null` returned by the wrapped factory itself.
   * FIX-16.
   */
  timedOut: Promise<boolean>;
}

/**
 * Race a promise against a timeout. If the timeout fires first we
 * 1) call `onCancel` so the caller can abort the underlying fetch (this
 *    actually frees the upstream socket instead of leaking it), and
 * 2) resolve with `fallback` so the caller is never blocked.
 *
 * Usage:
 *   const handle = withTimeout(fetch(url, { signal }), 8000, null);
 *   const data = await handle.result;
 *   // …
 *   handle.cancel();
 */
export function withTimeout<T>(
  factory: (signal: AbortSignal) => Promise<T>,
  ms: number,
  fallback: T,
  onCancel?: () => void,
): TimeoutHandle<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let timerFired = false;
  let resolveCancellation: (value: T) => void = () => {};
  const cancellationPromise = new Promise<T>(resolve => { resolveCancellation = resolve; });
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      timerFired = true;
      controller.abort();
      onCancel?.();
      resolve(fallback);
    }, ms);
  });
  const promise = Promise.resolve().then(() => factory(controller.signal)).catch((err) => {
    if (controller.signal.aborted) return fallback;
    throw err;
  });
  const result = Promise.race([promise, timeoutPromise, cancellationPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
  // `timedOut` resolves to whether the inner timer fired before the
  // factory resolved. We mirror the lifecycle of `result` so callers
  // can `await Promise.all([result, timedOut])`. The rejection branch
  // (`() => false`) keeps the chained promise from re-throwing when
  // the underlying `result` itself rejects — callers always await
  // `timedOut` to distinguish "real timeout" from "adapter returned
  // null", and a rejected `timedOut` would crash the test runner
  // before the `.catch` on `result` even runs.
  const timedOut = result.then(() => timerFired, () => false);
  return {
    result,
    cancel: () => { controller.abort(); resolveCancellation(fallback); },
    timedOut,
  };
}

/**
 * Convenience wrapper for callers that already have a constructed promise
 * (e.g. legacy `fetch(url, init)` callsites). The promise is *not*
 * cancellable in this shape — prefer the signal-based overload when
 * controlling the fetch lifecycle.
 */
export function withTimeoutSimple<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return withTimeout(() => promise, ms, fallback).result;
}

/* ─── Page-level request signal ──────────────────────────────────────── */

/**
 * Default per-page request budget. Pages fire many concurrent fetches via
 * `Promise.all`; without an upper bound a stuck upstream can keep a Node
 * worker tied up for `revalidate` windows. 15s comfortably exceeds the
 * slowest probe endpoint (~830ms for KKPhim detail at p99) while still
 * failing fast on truly broken upstreams.
 */
export const DEFAULT_PAGE_REQUEST_TIMEOUT_MS = 15_000;

export interface PageRequestSignal {
  /** Pass to every `signal`-aware fetcher in the page. */
  signal: AbortSignal;
  /**
   * Call when the page is unmounting (e.g. soft navigation away). Idempotent.
   * Pages don't strictly need to call this — the timeout will fire — but it
   * shaves the latency between navigation and socket cleanup.
   */
  cancel: () => void;
}

/**
 * Create an `AbortController` whose `signal` is wired to a wall-clock timeout.
 *
 * The Next.js App Router does NOT provide a request-scoped `AbortSignal` to
 * server pages, so we build one. Each page-level fetcher in `src/lib/api.ts`
 * already accepts an optional `AbortSignal`; threads this signal through and
 * every concurrent request gets cancelled together when:
 *   - the budget elapses (fails fast on stuck upstream), OR
 *   - the caller explicitly invokes `cancel()` (e.g. soft nav away).
 *
 * Important: passing the returned `signal` to Next's `fetch()` opts the call
 * out of Next's automatic GET memoization for that request URL. React-level
 * `cache()` in `api.ts` still dedupes within the same render pass, but we
 * cannot share results across navigations. That's the correct trade-off here
 * because stale catalogue data is worse than a fast recompute.
 */
export function createPageRequestSignal(
  timeoutMs: number = DEFAULT_PAGE_REQUEST_TIMEOUT_MS,
): PageRequestSignal {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    if (!controller.signal.aborted) {
      controller.abort(new DOMException('Page request budget exceeded', 'TimeoutError'));
    }
  }, timeoutMs);
  // Don't keep the Node event loop alive past the page render.
  if (typeof (timer as { unref?: () => void }).unref === 'function') {
    (timer as { unref: () => void }).unref();
  }
  return {
    signal: controller.signal,
    cancel: () => {
      clearTimeout(timer);
      if (!controller.signal.aborted) {
        controller.abort(new DOMException('Page request cancelled', 'AbortError'));
      }
    },
  };
}

export function okResult<T>(data: T, meta: Partial<ApiMeta> = {}): ApiResult<T> {
  return {
    ok: true,
    data,
    meta: {
      provider: meta.provider ?? 'unknown',
      degraded: meta.degraded ?? false,
      requestId: meta.requestId ?? makeRequestId(),
      status: meta.status,
      warnings: meta.warnings ?? [],
    },
  };
}

export function emptyResult<T>(fallback: T, meta: Partial<ApiMeta> = {}): ApiResult<T> {
  return {
    ok: true,
    data: fallback,
    meta: {
      provider: meta.provider ?? 'unknown',
      degraded: meta.degraded ?? false,
      requestId: meta.requestId ?? makeRequestId(),
      warnings: meta.warnings ?? [],
    },
  };
}

export function errResult<T>(
  fallback: T,
  code: ErrorCode,
  message: string,
  meta: Partial<ApiMeta> = {},
): ApiResult<T> {
  return {
    ok: false,
    data: fallback,
    errorCode: code,
    errorMessage: message,
    meta: {
      provider: meta.provider ?? 'unknown',
      degraded: meta.degraded ?? false,
      requestId: meta.requestId ?? makeRequestId(),
      status: meta.status,
      warnings: meta.warnings ?? [],
    },
  };
}

/* ─── Adapter contract ────────────────────────────────────────────────── */

/**
 * Common operations a provider must implement to be wired into the
 * orchestration layer. Any operation is optional — providers that don't
 * support, e.g., search, just throw `NOT_SUPPORTED` and the orchestrator
 * skips them.
 */
export interface ProviderAdapter {
  /** Stable identifier used in logs and `ApiMeta.provider`. */
  readonly id: string;

  /** Per-request timeout in milliseconds. */
  readonly timeoutMs: number;

  list(filter: FilterParams, signal?: AbortSignal): Promise<MovieListResponse>;
  search(keyword: string, page?: number, limit?: number, signal?: AbortSignal): Promise<MovieListResponse>;
  categories(signal?: AbortSignal): Promise<CategoryItem[]>;
  countries(signal?: AbortSignal): Promise<CountryItem[]>;
  /** Returns validated metadata and playable episode URLs. */
  detail(slug: string, signal?: AbortSignal): Promise<MovieDetailResponse | null>;
}

/* ─── Catalogue orchestration ─────────────────────────────────────────── */

export interface CatalogueStrategyOpts {
  primary: ProviderAdapter;
  /** Providers tried in order if `primary` fails / returns empty. */
  fallbacks?: ProviderAdapter[];
  /** When true, an empty primary result still triggers fallback. */
  fallbackOnEmpty?: boolean;
  /** Maximum wall-clock budget for the entire orchestration call. */
  totalTimeoutMs?: number;
  /** Forward to every provider call so external code can abort the whole strategy. */
  signal?: AbortSignal;
}

export interface CatalogueStrategyResult {
  result: ApiResult<MovieListResponse>;
  attempted: Array<{ provider: string; ok: boolean; errorCode?: ErrorCode }>;
}

/**
 * Try `primary` then `fallbacks` in order, returning the first successful,
 * non-empty result. Warnings accumulate so the UI can surface "we showed you
 * the fallback because the primary was down".
 */

async function attempt<T>(factory: (signal: AbortSignal) => Promise<T>, timeoutMs: number, signal?: AbortSignal): Promise<T> {
  const handle = withTimeout(inner => factory(signal ? AbortSignal.any([inner, signal]) : inner), Math.max(1, timeoutMs), null);
  const abort = () => handle.cancel();
  if (signal?.aborted) { handle.cancel(); }
  else signal?.addEventListener('abort', abort, { once: true });
  try {
    const result = await handle.result;
    if (result === null) throw new ProviderError(signal?.aborted ? 'cancelled' : 'timeout', 'Provider request did not complete');
    return result;
  } finally { handle.cancel(); signal?.removeEventListener('abort', abort); }
}

export async function orchestrateCatalogue(filter: FilterParams, opts: CatalogueStrategyOpts): Promise<CatalogueStrategyResult> {
  const adapters = [opts.primary, ...(opts.fallbacks ?? [])].filter((adapter): adapter is ProviderAdapter => adapter != null);
  if (!adapters.length) throw new AllProvidersDisabledError('catalogue');
  const requestId = makeRequestId();
  const warnings: NonNullable<ApiMeta['warnings']> = [];
  const attempted: CatalogueStrategyResult['attempted'] = [];
  const deadline = Date.now() + (opts.totalTimeoutMs ?? 10000);
  let lastError: unknown;
  for (const adapter of adapters) {
    if (opts.signal?.aborted || Date.now() >= deadline) { lastError = new ProviderError(opts.signal?.aborted ? 'cancelled' : 'timeout', 'Request budget exceeded'); break; }
    try {
      const data = await attempt(signal => filter.keyword?.trim()
        ? adapter.search(filter.keyword.trim(), Number(filter.page) || 1, Number(filter.limit) || 24, signal)
        : adapter.list(filter, signal), Math.min(adapter.timeoutMs, deadline - Date.now()), opts.signal);
      if (data.status === false || data.status === 'error') throw new ProviderError('http_error', data.msg ?? 'Provider returned failure', data.httpStatus);
      if (!Array.isArray(data.items)) throw new ProviderError('schema_invalid', 'items must be an array');
      attempted.push({ provider: adapter.id, ok: true });
      if (!data.items.length && opts.fallbackOnEmpty) { warnings.push({ provider: adapter.id, code: 'empty', message: 'No matching movies' }); continue; }
      return { result: okResult({ ...data, provider: adapter.id, degraded: adapter !== opts.primary }, { provider: adapter.id, degraded: adapter !== opts.primary, requestId, warnings }), attempted };
    } catch (error) {
      lastError = error;
      const code = classifyError(error);
      attempted.push({ provider: adapter.id, ok: false, errorCode: code });
      warnings.push({ provider: adapter.id, code, message: error instanceof Error ? error.message : String(error) });
    }
  }
  const code = lastError ? classifyError(lastError) : 'empty';
  const message = code === 'unsupported' && lastError instanceof Error ? lastError.message : 'Nguồn dữ liệu đang không khả dụng. Vui lòng thử lại sau.';
  const data: MovieListResponse = { status: code === 'empty', errorCode: code === 'empty' ? undefined : code, msg: message, items: [], pagination: buildPagination(0, { page: Number(filter.page) || 1, limit: Number(filter.limit) || 24 }) };
  return { result: code === 'empty' ? emptyResult(data, { requestId, warnings }) : errResult(data, code, message, { requestId, warnings, status: lastError instanceof ProviderError ? lastError.status : undefined }), attempted };
}

export async function orchestrateMovieDetail(slug: string, adapters: ProviderAdapter[], opts: { totalTimeoutMs?: number; signal?: AbortSignal; source?: ProviderId; reference?: { identity: string; title: string } } = {}): Promise<ApiResult<MovieDetailResponse | null>> {
  const enabled = adapters.filter((adapter): adapter is ProviderAdapter => adapter != null);
  if (!enabled.length) throw new AllProvidersDisabledError('detail');
  const requestId = makeRequestId();
  const warnings: NonNullable<ApiMeta['warnings']> = [];
  const deadline = Date.now() + (opts.totalTimeoutMs ?? 10000);
  const ordered = opts.source ? [...enabled].sort((a, b) => Number(b.id === opts.source) - Number(a.id === opts.source)) : enabled;
  let selected: MovieDetailResponse | undefined;
  let selectedAdapter: ProviderAdapter | undefined;
  for (const adapter of ordered) {
    if (opts.signal?.aborted || Date.now() >= deadline) { warnings.push({ provider: adapter.id, code: opts.signal?.aborted ? 'cancelled' : 'timeout', message: 'Request budget exceeded' }); break; }
    // A source-qualified URL belongs to that provider. Never interpret a
    // native slug from it as a different provider's movie during an outage.
    if (opts.source && adapter.id !== opts.source) continue;
    try {
      const detail = await attempt(signal => adapter.detail(slug, signal), Math.min(adapter.timeoutMs, deadline - Date.now()), opts.signal);
      if (!detail?.movie?.name || !detail.movie.slug) throw new ProviderError('schema_invalid', 'Missing movie metadata');
      selected = detail; selectedAdapter = adapter; break;
    } catch (error) { warnings.push({ provider: adapter.id, code: classifyError(error), message: error instanceof Error ? error.message : String(error) }); }
  }
  if (!selected && opts.reference && /^(movie|tv):\d+:(\d*|unknown)$/.test(opts.reference.identity) && !opts.signal?.aborted) {
    const reference = opts.reference;
    for (const adapter of ordered.filter(adapter => adapter.id !== opts.source)) {
      if (Date.now() >= deadline) break;
      try {
        const matched = await attempt(async signal => {
          const results = await adapter.search(reference.title.slice(0, 100), 1, 24, signal);
          const candidate = results.items.find(item => movieIdentity(item) === reference.identity);
          if (!candidate) throw new ProviderError('not_found', 'No matching identity');
          const detail = await adapter.detail(candidate.slug, signal);
          if (!detail?.movie || movieIdentity(detail.movie) !== reference.identity) throw new ProviderError('schema_invalid', 'Movie identity changed');
          return detail;
        }, Math.min(adapter.timeoutMs, deadline - Date.now()), opts.signal);
        selected = matched; selectedAdapter = adapter; break;
      } catch (error) { warnings.push({ provider: adapter.id, code: classifyError(error), message: 'Identity fallback unavailable' }); }
    }
  }
  if (!selected || !selectedAdapter) {
    const absent = warnings.length > 0 && warnings.every(warning => warning.code === 'not_found');
    return errResult(null, absent ? 'not_found' : opts.signal?.aborted ? 'cancelled' : 'network', absent ? 'Movie not found' : 'Movie providers unavailable', { requestId, warnings, status: absent ? 404 : 503 });
  }
  const movie = selected.movie;
  const secondary = enabled.filter(adapter => adapter !== selectedAdapter);
  // Only enrich by verified identity; never fan out a primary slug blindly.
  const enrichBudget = Math.min(1800, Math.max(1, deadline - Date.now()));
  const additional = movie.tmdb?.id ? await Promise.all(secondary.map(async adapter => {
    try {
      return await attempt(async signal => {
        const candidates = await adapter.search(movie.origin_name || movie.name, 1, 24, signal);
        const match = candidates.items.find(candidate => sameMovie(movie, candidate));
        if (!match) return null;
        const detail = await adapter.detail(match.slug, signal);
        return detail?.movie && sameMovie(movie, detail.movie) ? detail : null;
      }, enrichBudget, opts.signal);
    } catch { return null; }
  })) : [];
  const episodes = [...selected.episodes, ...additional.flatMap(detail => detail?.episodes ?? [])].map(server => {
    const seen = new Set<string>();
    return { ...server, server_data: server.server_data.filter(episode => {
      const key = episode.slug || episode.name;
      if (seen.has(key)) return false; seen.add(key); return Boolean(episode.link_embed || episode.link_m3u8);
    }) };
  }).filter(server => server.server_data.length > 0);
  return okResult({ ...selected, episodes }, { requestId, provider: selectedAdapter.id, degraded: selectedAdapter !== ordered[0] || warnings.length > 0, warnings });
}

/* ─── Type mappers (shared between providers and tests) ──────────────── */

const TYPE_SLUG_TO_API: Record<string, string> = {
  series: 'phim-bo',
  single: 'phim-le',
  hoathinh: 'hoat-hinh',
  tvshows: 'tv-shows',
};

export function typeSlugToApi(type: string | undefined): string | undefined {
  if (!type) return undefined;
  return TYPE_SLUG_TO_API[type] ?? type;
}

/** Compute a stable pagination from a raw response payload. */
export function buildPagination(
  raw: unknown,
  fallback: { page: number; limit: number; totalItems?: number },
): MovieListResponse['pagination'] {
  const total = typeof raw === 'number' ? raw : fallback.totalItems ?? 0;
  const totalPages = total === 0 ? 1 : Math.max(1, Math.ceil(total / fallback.limit));
  return {
    totalItems: total,
    totalItemsPerPage: fallback.limit,
    currentPage: fallback.page,
    totalPages,
  };
}


export type { MovieListItem, MovieListResponse, MovieDetailResponse, EpisodeServer, CategoryItem, CountryItem, FilterParams };
