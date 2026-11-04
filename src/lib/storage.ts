import type { BookmarkItem, WatchHistoryItem } from '@/types/movie';
import { sanitizeSlug } from './validate';

export type StoredMovieReference = Pick<BookmarkItem, '_id' | 'slug' | 'source' | 'tmdb'>;

/** Native slugs identify a movie only within their provider. Legacy records
 * keep their original keys and match through an ID rather than slug alone. */
export function sameStoredMovie(a: StoredMovieReference, b: StoredMovieReference): boolean {
  if (a === b) return true;
  if (a.slug !== b.slug) return false;
  if (a.source && b.source) return a.source === b.source;
  const first = a.tmdb, second = b.tmdb;
  if (first?.id && second?.id && first.type && second.type &&
    (first.id !== second.id || first.type !== second.type ||
      (first.type === 'tv' && typeof first.season === 'number' && typeof second.season === 'number' && first.season !== second.season))) return false;
  if (String(a._id) && String(a._id) === String(b._id)) return true;
  if (!first?.id || !first.type || first.id !== second?.id || first.type !== second.type) return false;
  return first.type === 'movie' ||
    (first.type === 'tv' && typeof first.season === 'number' && first.season === second.season);
}

export function storedMovieKey(movie: StoredMovieReference): string {
  return JSON.stringify([movie.source ?? 'legacy', movie.slug, movie.source ? null : movie._id]);
}

export function safeStorageRead(key: string): string | null {
  try { return typeof window === 'undefined' ? null : window.localStorage.getItem(key); }
  catch { return null; }
}
export function safeStorageWrite(key: string, value: string): boolean {
  try { window.localStorage.setItem(key, value); return true; } catch { return false; }
}
export function isStoredMovie(value: unknown): value is BookmarkItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Record<string, unknown>;
  return Boolean(sanitizeSlug(item.slug)) && typeof item.name === 'string' &&
    (typeof item._id === 'string' || typeof item._id === 'number') &&
    typeof item.poster_url === 'string' && typeof item.thumb_url === 'string' &&
    (item.source === undefined || ['kkphim', 'ophim', 'nguonc'].includes(String(item.source))) &&
    ['origin_name', 'quality', 'lang', 'episode_current'].every(key => item[key] === undefined || typeof item[key] === 'string') &&
    (item.year === undefined || (typeof item.year === 'number' && Number.isFinite(item.year))) &&
    (item.tmdb === undefined || (item.tmdb !== null && typeof item.tmdb === 'object' &&
      ['id', 'type', 'vote_average'].every(key => {
        const field = (item.tmdb as Record<string, unknown>)[key];
        return field === undefined || typeof field === 'string';
      })));
}
export function isStoredHistory(value: unknown): value is WatchHistoryItem {
  return isStoredMovie(value) && typeof (value as unknown as Record<string, unknown>).watched_at === 'string' &&
    Number.isFinite(Date.parse((value as WatchHistoryItem).watched_at));
}
