/**
 * Provider adapter + orchestration layer.
 *
 * Each provider implements `ProviderAdapter` and exposes the minimum set of
 * operations the site needs:
 *   - list(filter)         → catalogue browse (`/`, `/danh-sach`, `/the-loai`, …)
 *   - search(keyword)      → live + dedicated search
 *   - categories()/countries() → filter dropdowns
 *   - detail(slug)         → single movie + episode servers (KKPhim, Ophim,
 *                            NguonC, VSMOV)
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
import { randomUUID } from 'node:crypto';
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

export type ErrorCode =
  | 'timeout'
  | 'http_error'
  | 'schema_invalid'
  | 'empty'
  | 'network'
  | 'cancelled';

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
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      onCancel?.();
      resolve(fallback);
    }, ms);
  });
  const promise = factory(controller.signal).catch((err) => {
    if (controller.signal.aborted) return fallback;
    throw err;
  });
  const result = Promise.race([promise, timeoutPromise]).finally(() => {
    if (timer) clearTimeout(timer);
  });
  return {
    result,
    cancel: () => controller.abort(),
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
  /**
   * Returns partial detail. Providers that don't carry movie metadata
   * (e.g. Ophim only exposes episode servers) return `null` for `movie`.
   */
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
export async function orchestrateCatalogue(
  filter: FilterParams,
  opts: CatalogueStrategyOpts,
): Promise<CatalogueStrategyResult> {
  const requestId = makeRequestId();
  const providers = [opts.primary, ...(opts.fallbacks ?? [])];
  // API-REDESIGN-8: honour provider kill-switch — drop null entries
  // (disabled via `API_DISABLE_<PROVIDER>` env). When every provider is
  // disabled, surface a typed error so the page can render an empty
  // state instead of "Mọi provider đều lỗi" (which would suggest an
  // upstream issue rather than an operator action).
  const enabledProviders = providers.filter((a): a is ProviderAdapter => a !== null);
  if (enabledProviders.length === 0) {
    throw new AllProvidersDisabledError('catalogue');
  }
  const warnings: ApiMeta['warnings'] = [];
  const attempted: CatalogueStrategyResult['attempted'] = [];

  for (const adapter of enabledProviders) {
    if (opts.signal?.aborted) break;
    const callFilter = { ...filter };
    const promise = (() => {
      if (callFilter.keyword?.trim()) {
        return adapter.search(
          callFilter.keyword,
          Number(callFilter.page) || 1,
          Number(callFilter.limit) || 24,
          opts.signal,
        );
      }
      return adapter.list(callFilter, opts.signal);
    })();
    const handle = withTimeout(() => promise, adapter.timeoutMs, null);
    // Forward page-level abort so a soft-nav away tears down the in-flight
    // adapter fetch immediately (don't wait for the per-adapter timeout).
    const onPageAbort = () => handle.cancel();
    opts.signal?.addEventListener('abort', onPageAbort, { once: true });
    const result = await handle.result;
    handle.cancel();
    opts.signal?.removeEventListener('abort', onPageAbort);
    if (!result) {
      attempted.push({ provider: adapter.id, ok: false, errorCode: 'timeout' });
      warnings.push({ provider: adapter.id, code: 'timeout', message: `${adapter.id} timeout` });
      continue;
    }
    const items = result.items ?? [];
    if (!items.length) {
      attempted.push({ provider: adapter.id, ok: true, errorCode: 'empty' });
      if (opts.fallbackOnEmpty && adapter === opts.primary) {
        warnings.push({ provider: adapter.id, code: 'empty', message: `${adapter.id} empty` });
        continue;
      }
      // Either fallbacks are disabled or this fallback also returned empty —
      // return what we have with degraded flag.
      return {
        result: emptyResult(result, {
          provider: adapter.id,
          requestId,
          degraded: adapter !== opts.primary,
          warnings,
        }),
        attempted,
      };
    }
    attempted.push({ provider: adapter.id, ok: true });
    return {
      result: okResult(result, {
        provider: adapter.id,
        requestId,
        degraded: adapter !== opts.primary,
        warnings,
      }),
      attempted,
    };
  }

  // Every provider failed.
  const fallbackResponse: MovieListResponse = {
    status: false,
    msg: 'Mọi provider đều lỗi. Vui lòng thử lại sau.',
    items: [],
    pagination: {
      totalItems: 0,
      totalItemsPerPage: Number(filter.limit) || 24,
      currentPage: Number(filter.page) || 1,
      totalPages: 1,
    },
  };
  return {
    result: errResult(fallbackResponse, 'network', 'All providers failed', {
      provider: 'orchestrator',
      requestId,
      warnings,
    }),
    attempted,
  };
}

/* ─── Detail orchestration ────────────────────────────────────────────── */

/**
 * Detail needs `movie` metadata (primary) AND `episodes` (multiple). We:
 *   1. Try primary → fallback providers for `movie` metadata.
 *   2. Collect episode servers from ALL providers that responded, dedupe by
 *      server_name+episode_slug so we don't show duplicates to the user.
 *   3. Skip providers that errored/timeout instead of failing the whole call.
 */
export async function orchestrateMovieDetail(
  slug: string,
  adapters: ProviderAdapter[],
  opts: { totalTimeoutMs?: number; signal?: AbortSignal } = {},
): Promise<ApiResult<MovieDetailResponse | null>> {
  // API-REDESIGN-8: honour provider kill-switch. Callers pass the raw
  // `[kkphim, ophim, nguonc, vsmov]` array (which now contains `null`s
  // for disabled providers). Drop those before fan-out so we don't
  // crash on `adapter.detail(...)`.
  const enabledAdapters = adapters.filter((a): a is ProviderAdapter => a !== null);
  if (enabledAdapters.length === 0) {
    throw new AllProvidersDisabledError('detail');
  }

  const requestId = makeRequestId();
  const warnings: ApiMeta['warnings'] = [];
  const perAdapterTimeout = 8000;

  // Fast path: page-level signal already aborted → return empty result.
  // We don't tear down anything because there's nothing in flight yet.
  if (opts.signal?.aborted) {
    return errResult(null, 'cancelled', 'Page request signal already aborted', {
      provider: 'orchestrator',
      requestId,
      warnings: [{ provider: 'orchestrator', code: 'cancelled', message: 'Page signal aborted before detail call' }],
    });
  }

  const calls = await Promise.all(
    enabledAdapters.map((adapter) => {
      const handle = withTimeout(
        (innerSignal) => adapter.detail(slug, innerSignal),
        Math.min(perAdapterTimeout, opts.totalTimeoutMs ?? perAdapterTimeout),
        null,
      );
      // Forward page-level abort to the per-adapter handle so a soft-nav
      // away immediately tears down every concurrent detail fetch (the
      // internal `withTimeout` only fires on its own timer, not on ours).
      const onPageAbort = () => handle.cancel();
      opts.signal?.addEventListener('abort', onPageAbort, { once: true });
      return handle.result
        .then((response: Awaited<ReturnType<typeof adapter.detail>> | null) => {
          handle.cancel();
          opts.signal?.removeEventListener('abort', onPageAbort);
          return { adapter, response };
        })
        .catch((err: unknown) => {
          handle.cancel();
          opts.signal?.removeEventListener('abort', onPageAbort);
          warnings.push({ provider: adapter.id, code: 'network', message: `${adapter.id} detail failed: ${String(err)}` });
          return { adapter, response: null as Awaited<ReturnType<typeof adapter.detail>> | null };
        });
    }),
  );
  let movie: MovieDetailResponse['movie'] | undefined;
  let movieProvider: string | undefined;
  const episodeMap = new Map<string, EpisodeServer>();

  for (const { adapter, response } of calls) {
    if (!response) {
      warnings.push({ provider: adapter.id, code: 'timeout', message: `${adapter.id} detail timeout` });
      continue;
    }
    if (response.movie && !movie) {
      movie = response.movie;
      movieProvider = adapter.id;
    }
    for (const server of response.episodes ?? []) {
      const key = server.server_name || `${adapter.id}:${episodeMap.size}`;
      if (!episodeMap.has(key)) {
        episodeMap.set(key, {
          server_name: server.server_name,
          server_type: server.server_type,
          server_data: [...(server.server_data ?? [])],
        });
      } else {
        const existing = episodeMap.get(key)!;
        existing.server_data = [
          ...(existing.server_data ?? []),
          ...(server.server_data ?? []),
        ];
      }
    }
  }

  // Dedupe episodes within each server by (slug || name) so providers that
  // overlap on the same server_name don't produce duplicate episode buttons.
  for (const server of episodeMap.values()) {
    const seen = new Set<string>();
    server.server_data = (server.server_data ?? []).filter((ep) => {
      const k = ep.slug || ep.name || '';
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  if (!movie) {
    return errResult(null, 'network', 'No provider returned movie metadata', {
      provider: 'orchestrator',
      requestId,
      warnings,
    });
  }

  const episodes = Array.from(episodeMap.values());
  const data: MovieDetailResponse = {
    status: true,
    movie,
    episodes,
  };
  return okResult(data, {
    provider: movieProvider ?? 'orchestrator',
    degraded: movieProvider !== enabledAdapters[0]?.id || warnings.length > 0,
    requestId,
    warnings,
  });
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
