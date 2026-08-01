/**
 * Offline contract tests for `src/lib/api/mock-handler.ts`.
 *
 * Verifies the dispatcher:
 *  - Matches the 4 provider prefixes (kkphim / ophim / nguonc / vsmov).
 *  - Returns realistic shapes for happy-path catalogue + detail.
 *  - Honors `?mock=<scenario>` for empty / not-found / server-error /
 *    rate-limit / invalid-json.
 *  - Rejects unknown provider prefixes with 400/404.
 *
 * Run with:
 *   npm run test:mock
 */
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { dispatchMockRequest, MOCK_SCENARIOS } from '@/lib/api/mock-handler';

function buildUrl(provider: string, path: string, scenario?: string): string {
  const base = `http://mock.local/${provider}${path}`;
  return scenario ? `${base}?mock=${scenario}` : base;
}

test('MOCK_SCENARIOS exports the documented scenario set', () => {
  assert.deepEqual(
    [...MOCK_SCENARIOS].sort(),
    ['empty', 'invalid-json', 'not-found', 'ok', 'rate-limit', 'server-error', 'timeout'],
  );
});

test('kkphim catalogue returns legacy shape for /danh-sach/phim-moi-cap-nhat', () => {
  const { response, provider } = dispatchMockRequest(
    buildUrl('kkphim', '/danh-sach/phim-moi-cap-nhat?page=1&limit=24'),
  );
  assert.equal(provider, 'kkphim');
  assert.equal(response.status, 200);
  return response.json().then((body: unknown) => {
    const b = body as { status: boolean; items: unknown[]; pagination: { currentPage: number } };
    assert.equal(b.status, true);
    assert.ok(Array.isArray(b.items));
    assert.ok(b.items.length > 0);
    assert.equal(b.pagination.currentPage, 1);
  });
});

test('kkphim catalogue returns v1 shape for /v1/api/danh-sach/...', () => {
  const { response } = dispatchMockRequest(
    buildUrl('kkphim', '/v1/api/danh-sach/phim-bo?page=2&limit=10'),
  );
  return response.json().then((body: unknown) => {
    const b = body as { status: string; data: { items: unknown[]; params: { pagination: { currentPage: number } } } };
    assert.equal(b.status, 'success');
    assert.ok(Array.isArray(b.data.items));
    assert.equal(b.data.params.pagination.currentPage, 2);
  });
});

test('kkphim search returns wrapped shape with items', () => {
  const { response } = dispatchMockRequest(
    buildUrl('kkphim', '/v1/api/tim-kiem?keyword=avengers'),
  );
  return response.json().then((body: unknown) => {
    const b = body as { data: { items: unknown[] } };
    assert.ok(Array.isArray(b.data.items));
    assert.ok(b.data.items.length > 0);
  });
});

test('kkphim detail returns fixture for known slug', () => {
  const { response } = dispatchMockRequest(buildUrl('kkphim', '/phim/avengers-endgame'));
  return response.json().then((body: unknown) => {
    const b = body as { status: boolean; movie: { slug: string }; episodes: unknown[] };
    assert.equal(b.status, true);
    assert.equal(b.movie.slug, 'avengers-endgame');
    assert.ok(Array.isArray(b.episodes));
    assert.ok(b.episodes.length > 0);
  });
});

test('kkphim categories returns wrapped fixture', () => {
  const { response } = dispatchMockRequest(buildUrl('kkphim', '/v1/api/the-loai'));
  return response.json().then((body: unknown) => {
    const b = body as { status: string; data: { items: unknown[] } };
    assert.equal(b.status, 'success');
    assert.ok(b.data.items.length > 0);
  });
});

test('kkphim countries returns wrapped fixture', () => {
  const { response } = dispatchMockRequest(buildUrl('kkphim', '/v1/api/quoc-gia'));
  return response.json().then((body: unknown) => {
    const b = body as { status: string; data: { items: unknown[] } };
    assert.equal(b.status, 'success');
    assert.ok(b.data.items.length > 0);
  });
});

test('ophim detail returns episodes in data.item.episodes', () => {
  const { response, provider } = dispatchMockRequest(
    buildUrl('ophim', '/v1/api/phim/avengers-endgame'),
  );
  assert.equal(provider, 'ophim');
  return response.json().then((body: unknown) => {
    const b = body as { status: boolean; data: { item: { episodes: unknown[] } } };
    assert.equal(b.status, true);
    assert.ok(Array.isArray(b.data.item.episodes));
    assert.ok(b.data.item.episodes.length > 0);
  });
});

test('nguonc detail returns episodes in movie.episodes', () => {
  const { response, provider } = dispatchMockRequest(
    buildUrl('nguonc', '/api/film/avengers-endgame'),
  );
  assert.equal(provider, 'nguonc');
  return response.json().then((body: unknown) => {
    const b = body as { status: boolean; movie: { episodes: unknown[] } };
    assert.equal(b.status, true);
    assert.ok(Array.isArray(b.movie.episodes));
  });
});

test('vsmov detail returns full movie + episodes', () => {
  // FIX-16: VSMOV adapter builds `${VSMOV_BASE}/phim/${slug}` — there is
  // no `/api/` segment on the path itself; `/api` only appears in the
  // upstream hostname (`vsmov.com/api`). The mock dispatcher must accept
  // both shapes for forward-compat but the primary match is `/phim/`.
  const { response, provider } = dispatchMockRequest(buildUrl('vsmov', '/phim/avengers-endgame'));
  assert.equal(provider, 'vsmov');
  return response.json().then((body: unknown) => {
    const b = body as { status: boolean; movie: { slug: string }; episodes: unknown[] };
    assert.equal(b.status, true);
    assert.equal(b.movie.slug, 'avengers-endgame');
    assert.ok(b.episodes.length > 0);
  });
});

test('vsmov detail works for non-fixture slugs (echoes with slug suffix)', () => {
  // Regression: previously `/phim/<slug>` fell through to the generic
  // `scenarioErrorResponse` for the `ok` scenario, returning `{status:200}`
  // instead of the movie fixture. The adapter then returned `null` for
  // `movie` and the orchestrator logged a misleading "timeout" warning.
  const { response, provider } = dispatchMockRequest(buildUrl('vsmov', '/phim/some-other-movie'));
  assert.equal(provider, 'vsmov');
  assert.equal(response.status, 200);
  return response.json().then((body: unknown) => {
    const b = body as { status: boolean; movie: { slug: string; name: string } };
    assert.equal(b.status, true);
    assert.equal(b.movie.slug, 'some-other-movie');
    assert.match(b.movie.name, /some-other-movie/);
  });
});

test('empty scenario returns empty items + status true', () => {
  const { response } = dispatchMockRequest(
    buildUrl('kkphim', '/v1/api/danh-sach/phim-moi-cap-nhat', 'empty'),
  );
  return response.json().then((body: unknown) => {
    const b = body as { status: boolean; items: unknown[] };
    assert.equal(b.status, true);
    assert.deepEqual(b.items, []);
  });
});

test('not-found scenario returns HTTP 404', () => {
  const { response } = dispatchMockRequest(
    buildUrl('kkphim', '/danh-sach/phim-moi-cap-nhat', 'not-found'),
  );
  assert.equal(response.status, 404);
});

test('server-error scenario returns HTTP 500', () => {
  const { response } = dispatchMockRequest(
    buildUrl('kkphim', '/danh-sach/phim-moi-cap-nhat', 'server-error'),
  );
  assert.equal(response.status, 500);
});

test('rate-limit scenario returns HTTP 429', () => {
  const { response } = dispatchMockRequest(
    buildUrl('kkphim', '/danh-sach/phim-moi-cap-nhat', 'rate-limit'),
  );
  assert.equal(response.status, 429);
});

test('invalid-json scenario returns text/html body', () => {
  const { response } = dispatchMockRequest(
    buildUrl('kkphim', '/danh-sach/phim-moi-cap-nhat', 'invalid-json'),
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /text\/html/);
  return response.text().then((text) => {
    assert.match(text, /Bad gateway/);
  });
});

test('unknown provider prefix returns 404', () => {
  const { response, provider } = dispatchMockRequest('http://mock.local/foo/bar');
  assert.equal(provider, 'unknown');
  assert.equal(response.status, 404);
});

test('invalid URL returns 404', () => {
  // Force `new URL` to fail by passing garbage that can't be parsed.
  const { response, provider } = dispatchMockRequest('not a url with spaces and no scheme');
  assert.equal(provider, 'unknown');
  assert.equal(response.status, 404);
});

test('every response carries x-mock: 1 header', () => {
  const { response } = dispatchMockRequest(buildUrl('kkphim', '/danh-sach/phim-moi-cap-nhat'));
  assert.equal(response.headers.get('x-mock'), '1');
});

test('timeout scenario still returns 200 (client cancels)', () => {
  // Per design: the mock returns a hanging Response so the orchestrator's
  // `withTimeout` fires. Verify the response is well-formed so the test
  // can read headers immediately.
  const { response } = dispatchMockRequest(
    buildUrl('kkphim', '/danh-sach/phim-moi-cap-nhat', 'timeout'),
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-mock'), '1');
});