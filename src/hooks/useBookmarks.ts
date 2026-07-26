'use client';

import { useState, useEffect, useCallback } from 'react';
import { BookmarkItem } from '@/types/movie';

export const BOOKMARKS_STORAGE_KEY = 'hnq_bookmarks';
export const BOOKMARKS_EVENT = 'hnq_bookmarks_updated';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBookmarks = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;
      const stored = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (stored) {
        setBookmarks(JSON.parse(stored));
      } else {
        setBookmarks([]);
      }
    } catch (e) {
      console.error('Error loading bookmarks:', e);
      setBookmarks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookmarks();

    const handleStorageChange = () => {
      loadBookmarks();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(BOOKMARKS_EVENT, handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(BOOKMARKS_EVENT, handleStorageChange);
    };
  }, [loadBookmarks]);

  const notifyChange = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(BOOKMARKS_EVENT));
    }
  };

  const isBookmarked = useCallback(
    (slug: string): boolean => {
      return bookmarks.some((item) => item.slug === slug);
    },
    [bookmarks]
  );

  const toggleBookmark = (item: BookmarkItem): boolean => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      let list: BookmarkItem[] = stored ? JSON.parse(stored) : [];
      const exists = list.some((b) => b.slug === item.slug);

      if (exists) {
        list = list.filter((b) => b.slug !== item.slug);
      } else {
        list.unshift({ ...item, saved_at: new Date().toISOString() });
      }

      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(list));
      setBookmarks(list);
      notifyChange();
      return !exists;
    } catch (e) {
      console.error('Error toggling bookmark:', e);
      return false;
    }
  };

  const removeBookmark = (slug: string) => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      let list: BookmarkItem[] = stored ? JSON.parse(stored) : [];
      list = list.filter((b) => b.slug !== slug);
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(list));
      setBookmarks(list);
      notifyChange();
    } catch (e) {
      console.error('Error removing bookmark:', e);
    }
  };

  const clearBookmarks = () => {
    try {
      localStorage.removeItem(BOOKMARKS_STORAGE_KEY);
      setBookmarks([]);
      notifyChange();
    } catch (e) {
      console.error('Error clearing bookmarks:', e);
    }
  };

  return {
    bookmarks,
    isLoading,
    isBookmarked,
    toggleBookmark,
    removeBookmark,
    clearBookmarks,
    count: bookmarks.length,
  };
}
