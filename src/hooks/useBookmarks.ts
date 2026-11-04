'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { BookmarkItem } from '@/types/movie';
import { safeStorageRead, isStoredMovie, sameStoredMovie, type StoredMovieReference } from '@/lib/storage';

export type BookmarkResult = { ok: true; saved: boolean } | { ok: false };

export const BOOKMARKS_STORAGE_KEY = 'hnq_bookmarks';
export const BOOKMARKS_EVENT = 'hnq_bookmarks_updated';

const EMPTY_BOOKMARKS: BookmarkItem[] = [];
let cachedRaw: string | null | undefined;
let cachedBookmarks: BookmarkItem[] = EMPTY_BOOKMARKS;

function readBookmarks(): BookmarkItem[] {
  if (typeof window === 'undefined') return EMPTY_BOOKMARKS;

  const raw = safeStorageRead(BOOKMARKS_STORAGE_KEY);
  if (raw === cachedRaw) return cachedBookmarks;

  cachedRaw = raw;
  if (!raw) {
    cachedBookmarks = EMPTY_BOOKMARKS;
    return cachedBookmarks;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    cachedBookmarks = Array.isArray(parsed) ? parsed.filter(isStoredMovie).slice(0, 500) : EMPTY_BOOKMARKS;
  } catch (error) {
    console.error('Error loading bookmarks:', error);
    cachedBookmarks = EMPTY_BOOKMARKS;
  }
  return cachedBookmarks;
}

function subscribeBookmarks(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === BOOKMARKS_STORAGE_KEY || event.key === null) onStoreChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(BOOKMARKS_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(BOOKMARKS_EVENT, onStoreChange);
  };
}

function publishBookmarks(list: BookmarkItem[]) {
  const raw = JSON.stringify(list);
  localStorage.setItem(BOOKMARKS_STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedBookmarks = list;
  window.dispatchEvent(new Event(BOOKMARKS_EVENT));
}

export function useBookmarks() {
  const bookmarks = useSyncExternalStore(subscribeBookmarks, readBookmarks, () => EMPTY_BOOKMARKS);

  const isBookmarked = useCallback(
    (movie: StoredMovieReference): boolean => bookmarks.some((item) => sameStoredMovie(item, movie)),
    [bookmarks]
  );

  const toggleBookmark = (item: BookmarkItem): BookmarkResult => {
    try {
      const current = readBookmarks();
      const exists = current.some((bookmark) => sameStoredMovie(bookmark, item));
      const list = exists
        ? current.filter((bookmark) => !sameStoredMovie(bookmark, item))
        : [{ ...item, saved_at: new Date().toISOString() }, ...current].slice(0, 500);
      publishBookmarks(list);
      return { ok: true, saved: !exists };
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      return { ok: false };
    }
  };

  const removeBookmark = (movie: StoredMovieReference) => {
    try {
      publishBookmarks(readBookmarks().filter((bookmark) => !sameStoredMovie(bookmark, movie)));
    } catch (error) {
      console.error('Error removing bookmark:', error);
    }
  };

  const clearBookmarks = () => {
    try {
      localStorage.removeItem(BOOKMARKS_STORAGE_KEY);
      cachedRaw = null;
      cachedBookmarks = EMPTY_BOOKMARKS;
      window.dispatchEvent(new Event(BOOKMARKS_EVENT));
    } catch (error) {
      console.error('Error clearing bookmarks:', error);
    }
  };

  return {
    bookmarks,
    isBookmarked,
    toggleBookmark,
    removeBookmark,
    clearBookmarks,
    count: bookmarks.length,
  };
}
