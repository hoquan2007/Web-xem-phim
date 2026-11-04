import { getEnabledAdapters } from '@/lib/api/adapters';
import { providerHealth } from '@/lib/api/health';
export const dynamic = 'force-dynamic';
export function GET() {
  const providers = getEnabledAdapters().map(adapter => ({
    provider: adapter.id,
    catalogueAvailable: providerHealth.available(`${adapter.id}:catalogue`),
    // Unknown is deliberate: absence of failures is not a successful probe.
    sampled: Boolean(providerHealth.snapshot(`${adapter.id}:catalogue`)),
  }));
  return Response.json({ status: providers.length ? 'ready' : 'unavailable', providers, scope: 'process', media: 'not-probed' }, { status: providers.length ? 200 : 503, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
