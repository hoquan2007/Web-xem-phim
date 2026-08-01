/**
 * Local-only mock route for E2E tests.
 *
 * Returns deterministic JSON responses that mimic the 4 upstream providers
 * (KKPhim, Ophim, NguonC, VSMOV) so Playwright can run without depending
 * on `phimapi.com`, `ophim1.com`, `phim.nguonc.com`, or `vsmov.com`.
 *
 * Active ONLY when `process.env.API_MOCK === '1'`. In every other
 * environment this handler returns 404 so the real adapter chain
 * runs. The mock is opt-in by design — production deployments never
 * expose `/api/mock/*`.
 *
 * We use a server-only env var (`API_MOCK`, no `NEXT_PUBLIC_` prefix)
 * because Next.js inlines `NEXT_PUBLIC_*` at build time. A server-only
 * var lets Playwright flip the mock on at runtime against the same
 * prebuilt production bundle without rebuilding.
 *
 * Mounted at `/api/mock/[...path]` so the URL prefix mirrors the real
 * adapter hostnames (e.g. `/api/mock/kkphim/v1/api/danh-sach/phim-moi-cap-nhat`).
 *
 * Scenario control: append `?mock=<scenario>` to drive fallback / error /
 * race tests. See `MOCK_SCENARIOS` in `@/lib/api/mock-handler` for valid
 * values (`ok` | `empty` | `not-found` | `server-error` | `timeout` |
 * `invalid-json` | `rate-limit`).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { dispatchMockRequest } from '@/lib/api/mock-handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isMockEnabled(): boolean {
  return process.env.API_MOCK === '1';
}

async function handle(request: NextRequest): Promise<Response> {
  if (!isMockEnabled()) {
    return NextResponse.json(
      { error: 'mock-disabled', message: 'API_MOCK is not enabled' },
      { status: 404 },
    );
  }

  const url = request.nextUrl;
  const { response } = dispatchMockRequest(url.toString());
  return response;
}

export async function GET(request: NextRequest): Promise<Response> {
  return handle(request);
}

export async function HEAD(request: NextRequest): Promise<Response> {
  return handle(request);
}