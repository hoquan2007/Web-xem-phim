export type ErrorCode = 'timeout' | 'http_error' | 'schema_invalid' | 'empty' | 'network' | 'cancelled' | 'not_found' | 'unsupported';

export class ProviderError extends Error {
  constructor(public readonly code: ErrorCode, message: string, public readonly status?: number, public readonly retryAfterMs?: number) {
    super(message);
    this.name = 'ProviderError';
  }
}

export function classifyError(error: unknown): ErrorCode {
  if (error instanceof ProviderError) return error.code;
  if (error instanceof Error && error.name === 'TimeoutError') return 'timeout';
  if (error instanceof Error && error.name === 'AbortError') return 'cancelled';
  return 'network';
}
