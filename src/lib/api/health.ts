export interface ProviderHealth {
  provider: string;
  samples: Array<{ at: number; ok: boolean; latencyMs: number; code?: string }>;
  consecutiveFailures: number;
  blockedUntil?: number;
}

export class HealthRegistry {
  private readonly store = new Map<string, ProviderHealth>();
  record(provider: string, ok: boolean, latencyMs: number, code?: string, retryAfterMs = 0): void {
    // Absence, unsupported filters and page cancellation are not outages.
    if (['not_found', 'unsupported', 'cancelled'].includes(code ?? '')) return;
    const now = Date.now();
    const entry = this.snapshot(provider) ?? { provider, samples: [], consecutiveFailures: 0 };
    entry.samples.push({ at: now, ok, latencyMs, code });
    entry.samples = entry.samples.slice(-100);
    entry.consecutiveFailures = ok ? 0 : entry.consecutiveFailures + 1;
    if (ok) entry.blockedUntil = undefined;
    else if (entry.consecutiveFailures >= 3 || retryAfterMs > 0) entry.blockedUntil = now + Math.max(30000, retryAfterMs);
    this.store.set(provider, entry);
  }
  snapshot(provider: string): ProviderHealth | undefined {
    const entry = this.store.get(provider);
    if (!entry) return undefined;
    entry.samples = entry.samples.filter(sample => Date.now() - sample.at < 300000);
    if (!entry.samples.length) { this.store.delete(provider); return undefined; }
    return entry;
  }
  available(provider: string): boolean { return (this.snapshot(provider)?.blockedUntil ?? 0) <= Date.now(); }
  score(provider: string): number {
    const samples = this.snapshot(provider)?.samples ?? [];
    if (!samples.length) return 50;
    return Math.round(100 * samples.filter(sample => sample.ok).length / samples.length);
  }
  reset(provider?: string): void { if (provider) this.store.delete(provider); else this.store.clear(); }
}
export const providerHealth = new HealthRegistry();
