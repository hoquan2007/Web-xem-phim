/**
 * FIX-10.5: Input validation helpers for routes that accept user-provided
 * untrusted params (slug, keyword, page, filter values).
 *
 * Threat model:
 *   - Slugs/keywords come from URLs — anyone can craft a URL with arbitrary
 *     length, characters, or unicode. We pass them to upstream APIs.
 *   - NaN-like values (`page=abc`) → `parseInt` returns NaN. We must clamp to
 *     a safe range to avoid upstream 500s or expensive queries.
 *   - Long strings (>200 chars) make poor UX and strain APIs. We truncate.
 *   - Characters outside the safe charset (control chars, format chars) get
 *     stripped before reaching the upstream.
 *
 * Strategy: **whitelist** approach. Reject anything that doesn't match the
 * expected shape. This is stricter than a blacklist and safer by default.
 */

/**
 * Sanitize a slug-like string (route param for /phim/[slug], /the-loai/[slug], etc.)
 * Allowlist: ASCII letters, digits, and dashes. Length 1..120.
 * Returns the sanitized slug, or `null` if invalid.
 */
export function sanitizeSlug(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 120) return null;
  // Allow letters, digits, dash, dot, underscore (slug chars).
  // Reject control chars, whitespace, path separators, query chars.
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) return null;
  return trimmed;
}

/**
 * Sanitize a search keyword. Less strict than slug — allow Vietnamese diacritics,
 * spaces, common punctuation. Strip control chars, limit to 100 chars.
 */
export function sanitizeKeyword(value: unknown): string {
  if (typeof value !== 'string') return '';
  // Strip control chars (0x00-0x1F, 0x7F) and HTML-sensitive chars.
  // Note: we keep Vietnamese diacritics by NOT restricting to ASCII.
  const cleaned = value
    .replace(/[\x00-\x1f\x7f]/g, '') // control chars
    .replace(/[<>]/g, '') // even though React auto-escapes, defense in depth
    .trim();
  if (cleaned.length > 100) return cleaned.slice(0, 100);
  return cleaned;
}

/**
 * Clamp a numeric value (e.g. `page` query param) to a safe range.
 * Default: 1..999. NaN / negative / non-numeric → fallback.
 */
export function clampPage(value: unknown, fallback: number = 1, max: number = 999): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.min(max, Math.floor(value)));
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return Math.max(1, Math.min(max, parsed));
    }
  }
  return fallback;
}

/**
 * Clamp a `limit` value (e.g. items per page) to a safe range.
 * Default: 1..50. Used by API fetch helpers that accept a `limit` param.
 */
export function clampLimit(value: unknown, fallback: number = 24, max: number = 50): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.min(max, Math.floor(value)));
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return Math.max(1, Math.min(max, parsed));
    }
  }
  return fallback;
}

/**
 * Sanitize a year filter value. Allow 4-digit years 1900..currentYear+1.
 * Returns the year as a string, or `null` if invalid.
 */
export function sanitizeYear(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const year = Math.floor(value);
    if (year >= 1900 && year <= new Date().getFullYear() + 1) {
      return String(year);
    }
    return null;
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed >= 1900 && parsed <= new Date().getFullYear() + 1) {
      return String(parsed);
    }
  }
  return null;
}

/**
 * Whitelist for sort field. KKPhim supports: `modified.time`, `year`, `_id`,
 * `view`. Any other value is rejected → defaults to upstream default.
 */
export function sanitizeSortField(value: unknown): string | undefined {
  const allowed = ['modified.time', 'year', '_id', 'view'];
  if (typeof value === 'string' && allowed.includes(value)) {
    return value;
  }
  return undefined;
}

/**
 * Whitelist for sort type. Only `asc` or `desc`.
 */
export function sanitizeSortType(value: unknown): 'asc' | 'desc' | undefined {
  if (value === 'asc' || value === 'desc') return value;
  return undefined;
}

/**
 * Whitelist for movie type. Only `single`, `series`, `hoat-hinh`, `tv-shows`.
 * Returns the type, or `undefined` if invalid.
 */
export function sanitizeMovieType(value: unknown): string | undefined {
  const allowed = ['single', 'series', 'hoat-hinh', 'tv-shows'];
  if (typeof value === 'string' && allowed.includes(value)) {
    return value;
  }
  return undefined;
}