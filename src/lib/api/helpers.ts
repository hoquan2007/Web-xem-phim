import type { MovieListItem, MovieDetail, ProviderId, TMDBInfo } from '@/types/movie';

export function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : typeof value === 'number' ? String(value) : fallback;
}

export function normalizeEmbedUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const url = new URL(value.trim().startsWith('//') ? `https:${value.trim()}` : value.trim());
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}
export const normalizeM3u8Url = normalizeEmbedUrl;

export function getImageUrl(value: unknown, fallback = '/images/placeholder.svg'): string {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const path = value.trim();
  if (path.startsWith('/images/')) return path;
  if (/^(https?:)?\/\//.test(path)) return normalizeEmbedUrl(path) || fallback;
  if (/^[a-z]+:/i.test(path)) return fallback;
  return `https://phimimg.com/${path.replace(/^\/+/, '')}`;
}

// These CDNs use different storage paths. Only the legacy KKPhim path
// has a verified mirror; do not fabricate URLs on unrelated providers.
export function getImageFallbackChain(value: unknown): string[] {
  const src = getImageUrl(value);
  try {
    const url = new URL(src);
    if (!url.pathname.startsWith('/upload/vod/')) return [];
    if (!['phimimg.com', 'img.phimapi.com'].includes(url.hostname)) return [];
    url.hostname = url.hostname === 'phimimg.com' ? 'img.phimapi.com' : 'phimimg.com';
    return [url.href];
  } catch { return []; }
}

export function getMovieHref(movie: { slug: string; source?: ProviderId; tmdb?: TMDBInfo; name?: string; origin_name?: string }): string {
  const query = new URLSearchParams();
  if (movie.source) query.set('source', movie.source);
  const identity = movieIdentity(movie);
  if (identity && /^(movie|tv):\d+:(\d*|unknown)$/.test(identity) && (movie.origin_name || movie.name)) {
    query.set('identity', identity);
    query.set('title', (movie.origin_name || movie.name || '').slice(0, 100));
  }
  return `/phim/${encodeURIComponent(movie.slug)}${query.size ? `?${query}` : ''}`;
}

export function movieIdentity(movie: Pick<MovieListItem, 'tmdb'>): string | undefined {
  const tmdb = movie.tmdb;
  if (!tmdb?.id || !tmdb.type) return undefined;
  // A missing TV season cannot safely match a specific season.
  return `${tmdb.type}:${tmdb.id}:${tmdb.type === 'tv' ? tmdb.season ?? 'unknown' : ''}`;
}

export function sameMovie(a: MovieDetail, b: MovieListItem): boolean {
  const identity = movieIdentity(a);
  return Boolean(identity && identity === movieIdentity(b));
}
