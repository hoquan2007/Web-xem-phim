/**
 * Pure HTTP-shape mock handler for the 4 movie providers used by HNQ Film.
 *
 * Goal: let Playwright E2E run deterministically without depending on the
 * real upstream (`phimapi.com`, `ophim1.com`, `phim.nguonc.com`,
 * `vsmov.com/api`). The mock reproduces the JSON shapes the adapters
 * expect so the orchestrator's parser/normalizer code paths get exercised.
 *
 * The handler is intentionally framework-agnostic — it takes a URL path +
 * query string and returns a `Response` so it can be unit-tested with
 * `node:test` and reused by:
 *  - `src/app/api/_mock/[...path]/route.ts` (Next.js route handler)
 *  - `scripts/test-mock.ts` (offline contract tests)
 *
 * Design constraints:
 *  - `fixtureMovie()` from `@/lib/__fixtures__/provider-fixtures` is the
 *    single source of truth for response shapes. Keep this file thin — if
 *    a shape changes, update fixtures first then map here.
 *  - Routes follow the same prefix scheme as the real adapters so the
 *    adapter's URL builder doesn't need to change. Mock base URL is
 *    `http://localhost:3100/api/_mock/<provider>`.
 *  - Errors and edge cases (404, 500, timeout simulation, invalid JSON)
 *    are opt-in via `?mock=<scenario>` query param so E2E can drive
 *    fallback / race / invalid-URL scenarios deterministically.
 */
import {
  fixtureCategories,
  fixtureCountries,
  fixtureKKPhimDetail,
  fixtureMovie,
  fixtureNguoncServers,
  fixtureOphimServers,
  fixtureProviderErrors,
  fixtureVsmovDetail,
} from '@/lib/__fixtures__/provider-fixtures';

type MockScenario =
  | 'ok'
  | 'empty'
  | 'not-found'
  | 'server-error'
  | 'timeout'
  | 'invalid-json'
  | 'rate-limit';

const SCENARIO_SET = new Set<MockScenario>([
  'ok',
  'empty',
  'not-found',
  'server-error',
  'timeout',
  'invalid-json',
  'rate-limit',
]);

function readScenario(url: URL): MockScenario {
  const raw = url.searchParams.get('mock');
  return raw && SCENARIO_SET.has(raw as MockScenario) ? (raw as MockScenario) : 'ok';
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-mock': '1',
    },
  });
}

/* ─── Scenario dispatchers ─────────────────────────────────────────── */

function scenarioErrorResponse(scenario: MockScenario, fallbackStatus: number): Response {
  switch (scenario) {
    case 'not-found':
      return jsonResponse(fixtureProviderErrors.notFound, 404);
    case 'server-error':
      return jsonResponse(fixtureProviderErrors.serverError, 500);
    case 'rate-limit':
      return jsonResponse(fixtureProviderErrors.rateLimit, 429);
    case 'invalid-json':
      return new Response(fixtureProviderErrors.invalidJson, {
        status: 200,
        headers: { 'content-type': 'text/html', 'x-mock': '1' },
      });
    case 'timeout':
      // The orchestrator's `withTimeout` will fire; we just hang forever
      // so the AbortController test path is exercised. Returning 200 here
      // is intentional — the client cancels before reading.
      return new Response('ok', { status: 200, headers: { 'x-mock': '1' } });
    case 'empty':
    case 'ok':
    default:
      return jsonResponse({ status: 200 }, fallbackStatus);
  }
}

/* ─── KKPhim routes ────────────────────────────────────────────────── */

function kkphimListRoute(url: URL, scenario: MockScenario): Response {
  if (scenario !== 'ok' && scenario !== 'empty') return scenarioErrorResponse(scenario, 200);

  const page = Number(url.searchParams.get('page') ?? '1') || 1;
  const limit = Number(url.searchParams.get('limit') ?? '24') || 24;

  // `danh-sach/phim-moi-cap-nhat` returns the legacy shape
  // (`{ status, items, pagination }`).
  if (url.pathname.includes('/danh-sach/phim-moi-cap-nhat')) {
    if (scenario === 'empty') {
      return jsonResponse({
        status: true,
        items: [],
        pagination: { totalItems: 0, totalItemsPerPage: limit, currentPage: page, totalPages: 1 },
      });
    }
    return jsonResponse({
      status: true,
      items: Array.from({ length: limit }).map((_, i) =>
        fixtureMovie({
          _id: `kk-latest-${i}`,
          slug: `kk-latest-${i}`,
          name: `KKPhim Latest #${i + 1}`,
          origin_name: `KKPhim Latest Origin #${i + 1}`,
          year: 2024 - (i % 5),
        }),
      ),
      pagination: {
        totalItems: 200,
        totalItemsPerPage: limit,
        currentPage: page,
        totalPages: Math.ceil(200 / limit),
      },
    });
  }

  // `/v1/api/...` returns the newer `{ status: 'success', data: { items,
  // params: { pagination } } }` shape.
  const items = Array.from({ length: limit }).map((_, i) =>
    fixtureMovie({
      _id: `kk-v1-${page}-${i}`,
      slug: `kk-v1-${page}-${i}`,
      name: `KKPhim V1 Page ${page} #${i + 1}`,
    }),
  );

  if (scenario === 'empty') {
    return jsonResponse({
      status: 'success',
      data: {
        items: [],
        params: { pagination: { totalItems: 0, totalItemsPerPage: limit, currentPage: page, totalPages: 1 } },
      },
    });
  }

  return jsonResponse({
    status: 'success',
    data: {
      items,
      params: {
        pagination: {
          totalItems: 120,
          totalItemsPerPage: limit,
          currentPage: page,
          totalPages: Math.ceil(120 / limit),
        },
      },
    },
  });
}

function kkphimSearchRoute(url: URL, scenario: MockScenario): Response {
  if (scenario !== 'ok' && scenario !== 'empty') return scenarioErrorResponse(scenario, 200);
  const keyword = url.searchParams.get('keyword') ?? '';
  if (scenario === 'empty' || !keyword.trim()) {
    return jsonResponse({
      status: 'success',
      data: {
        items: [],
        params: { pagination: { totalItems: 0, totalItemsPerPage: 24, currentPage: 1, totalPages: 1 } },
      },
    });
  }
  return jsonResponse({
    status: 'success',
    data: {
      items: [
        fixtureMovie({ slug: `${keyword}-result-1`, name: `${keyword} — Kết quả 1` }),
        fixtureMovie({ slug: `${keyword}-result-2`, name: `${keyword} — Kết quả 2`, type: 'series' }),
      ],
      params: {
        pagination: { totalItems: 2, totalItemsPerPage: 24, currentPage: 1, totalPages: 1 },
      },
    },
  });
}

function kkphimDetailRoute(url: URL, scenario: MockScenario): Response {
  if (scenario !== 'ok') return scenarioErrorResponse(scenario, 200);
  // Match the fixture movie for the well-known slug; otherwise echo the
  // generic fixture with a slug-derived name so detail pages have content.
  const slug = url.pathname.split('/').pop() ?? 'avengers-endgame';
  if (slug === 'avengers-endgame') return jsonResponse(fixtureKKPhimDetail);
  return jsonResponse({
    status: true,
    movie: fixtureKKPhimDetail.movie
      ? { ...fixtureKKPhimDetail.movie, slug, name: `Mock Movie (${slug})`, origin_name: `Mock Origin (${slug})` }
      : null,
    episodes: fixtureKKPhimDetail.episodes,
  });
}

function kkphimCategoriesRoute(scenario: MockScenario): Response {
  if (scenario === 'empty') return jsonResponse({ status: 'success', data: { items: [] } });
  if (scenario !== 'ok') return scenarioErrorResponse(scenario, 200);
  return jsonResponse(fixtureCategories);
}

function kkphimCountriesRoute(scenario: MockScenario): Response {
  if (scenario === 'empty') return jsonResponse({ status: 'success', data: { items: [] } });
  if (scenario !== 'ok') return scenarioErrorResponse(scenario, 200);
  return jsonResponse(fixtureCountries);
}

/* ─── Ophim / NguonC / VSMOV detail routes ─────────────────────────── */

function ophimDetailRoute(url: URL, scenario: MockScenario): Response {
  if (scenario !== 'ok' && scenario !== 'empty') return scenarioErrorResponse(scenario, 200);
  if (scenario === 'empty') return jsonResponse({ status: true, data: { item: { episodes: [] } } });
  const slug = url.pathname.split('/').pop() ?? 'mock-slug';
  return jsonResponse({
    status: true,
    data: {
      item: {
        episodes: fixtureOphimServers.map((srv) => ({
          server_name: srv.server_name,
          server_data: srv.server_data.map((ep) => ({
            ...ep,
            slug: ep.slug || slug,
          })),
        })),
      },
    },
  });
}

function nguoncDetailRoute(url: URL, scenario: MockScenario): Response {
  if (scenario !== 'ok' && scenario !== 'empty') return scenarioErrorResponse(scenario, 200);
  if (scenario === 'empty') return jsonResponse({ status: true, movie: { episodes: [] } });
  const slug = url.pathname.split('/').pop() ?? 'mock-slug';
  return jsonResponse({
    status: true,
    movie: {
      episodes: fixtureNguoncServers.map((srv) => ({
        server_name: srv.server_name,
        items: srv.server_data.map((ep) => ({
          ...ep,
          slug: ep.slug || slug,
        })),
      })),
    },
  });
}

function vsmovDetailRoute(url: URL, scenario: MockScenario): Response {
  if (scenario !== 'ok') return scenarioErrorResponse(scenario, 200);
  const slug = url.pathname.split('/').pop() ?? 'avengers-endgame';
  if (slug === 'avengers-endgame') return jsonResponse(fixtureVsmovDetail);
  return jsonResponse({
    ...fixtureVsmovDetail,
    movie: fixtureVsmovDetail.movie
      ? { ...fixtureVsmovDetail.movie, slug, name: `Mock (${slug})`, origin_name: `Mock (${slug})` }
      : null,
  });
}

/* ─── Top-level dispatcher ─────────────────────────────────────────── */

export interface MockDispatchResult {
  response: Response;
  /** Provider identified from the URL prefix (for logs / assertions). */
  provider: 'kkphim' | 'ophim' | 'nguonc' | 'vsmov' | 'unknown';
}

/**
 * Match a request path to one of the 4 provider adapters and return a
 * realistic mock JSON response.
 *
 * Path scheme: `/<provider>/<endpoint>` where `provider` is one of
 * `kkphim`/`ophim`/`nguonc`/`vsmov`. The provider prefix mirrors the
 * real adapter's hostname so adapter URL builders can be pointed at the
 * mock with a one-line env override.
 *
 * Accepts both absolute (`http://localhost:3100/api/mock/kkphim/...`)
 * and path-only (`/api/mock/kkphim/...`) inputs so the Next.js route
 * handler can pass `request.nextUrl.toString()` directly.
 */
export function dispatchMockRequest(rawUrl: string): MockDispatchResult {
  let url: URL;
  try {
    // Try absolute first.
    url = new URL(rawUrl);
  } catch {
    try {
      url = new URL(rawUrl, 'http://mock.local');
    } catch {
      return {
        response: jsonResponse({ error: 'invalid-url' }, 404),
        provider: 'unknown',
      };
    }
  }

  const scenario = readScenario(url);
  const segments = url.pathname.split('/').filter(Boolean);
  // Strip the API mock mount prefix (`api/mock`) so the provider segment
  // is always at index 0 regardless of how the caller passed the URL.
  const stripped =
    segments[0] === 'api' && segments[1] === 'mock'
      ? segments.slice(2)
      : segments;
  const provider = (stripped[0] as MockDispatchResult['provider']) ?? 'unknown';

  switch (provider) {
    case 'kkphim': {
      const rest = '/' + stripped.slice(1).join('/');
      // Catalogue (`/danh-sach/...`, `/v1/api/danh-sach/...`,
      // `/v1/api/the-loai/...`, `/v1/api/quoc-gia/...`).
      if (
        rest.startsWith('/danh-sach/') ||
        rest.startsWith('/v1/api/danh-sach/') ||
        rest.startsWith('/v1/api/the-loai/') ||
        rest.startsWith('/v1/api/quoc-gia/')
      ) {
        return { response: kkphimListRoute(url, scenario), provider };
      }
      if (rest.startsWith('/v1/api/tim-kiem')) {
        return { response: kkphimSearchRoute(url, scenario), provider };
      }
      if (rest.startsWith('/v1/api/the-loai') || rest === '/v1/api/the-loai') {
        return { response: kkphimCategoriesRoute(scenario), provider };
      }
      if (rest.startsWith('/v1/api/quoc-gia') || rest === '/v1/api/quoc-gia') {
        return { response: kkphimCountriesRoute(scenario), provider };
      }
      if (rest.startsWith('/phim/') || rest.startsWith('/v1/api/phim/')) {
        return { response: kkphimDetailRoute(url, scenario), provider };
      }
      return { response: scenarioErrorResponse(scenario, 200), provider };
    }
    case 'ophim': {
      const rest = '/' + stripped.slice(1).join('/');
      if (rest.startsWith('/v1/api/phim/')) return { response: ophimDetailRoute(url, scenario), provider };
      return { response: scenarioErrorResponse(scenario, 200), provider };
    }
    case 'nguonc': {
      const rest = '/' + stripped.slice(1).join('/');
      if (rest.startsWith('/api/film/')) return { response: nguoncDetailRoute(url, scenario), provider };
      return { response: scenarioErrorResponse(scenario, 200), provider };
    }
    case 'vsmov': {
      const rest = '/' + stripped.slice(1).join('/');
      if (rest.startsWith('/api/phim/')) return { response: vsmovDetailRoute(url, scenario), provider };
      return { response: scenarioErrorResponse(scenario, 200), provider };
    }
    default:
      return {
        response: jsonResponse({ error: `unknown-mock-route: ${url.pathname}` }, 404),
        provider: 'unknown',
      };
  }
}

/** Re-export the scenario set so the E2E test can list valid values. */
export const MOCK_SCENARIOS = SCENARIO_SET;