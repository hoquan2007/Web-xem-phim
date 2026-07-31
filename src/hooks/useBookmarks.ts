'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { BookmarkItem } from '@/types/movie';

export const BOOKMARKS_STORAGE_KEY = 'hnq_bookmarks';
export const BOOKMARKS_EVENT = 'hnq_bookmarks_updated';

const EMPTY_BOOKMARKS: BookmarkItem[] = [];
let cachedRaw: string | null | undefined;
let cachedBookmarks: BookmarkItem[] = EMPTY_BOOKMARKS;

function readBookmarks(): BookmarkItem[] {
  if (typeof window === 'undefined') return EMPTY_BOOKMARKS;

  const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
  if (raw === cachedRaw) return cachedBookmarks;

  cachedRaw = raw;
  if (!raw) {
    cachedBookmarks = EMPTY_BOOKMARKS;
    return cachedBookmarks;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    cachedBookmarks = Array.isArray(parsed) ? (parsed as BookmarkItem[]) : EMPTY_BOOKMARKS;
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
    (slug: string): boolean => bookmarks.some((item) => item.slug === slug),
    [bookmarks]
  );

  const toggleBookmark = (item: BookmarkItem): boolean => {
    try {
      const current = readBookmarks();
      const exists = current.some((bookmark) => bookmark.slug === item.slug);
      const list = exists
        ? current.filter((bookmark) => bookmark.slug !== item.slug)
        : [{ ...item, saved_at: new Date().toISOString() }, ...current];
      publishBookmarks(list);
      return !exists;
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      return false;
    }
  };

  const removeBookmark = (slug: string) => {
    try {
      publishBookmarks(readBookmarks().filter((bookmark) => bookmark.slug !== slug));
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
