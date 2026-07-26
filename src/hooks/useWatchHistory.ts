'use client';

import { useState, useEffect, useCallback } from 'react';
import { WatchHistoryItem } from '@/types/movie';

export const HISTORY_STORAGE_KEY = 'hnq_watch_history';
export const HISTORY_EVENT = 'hnq_history_updated';

export function useWatchHistory() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(() => {
    try {
      if (typeof window === 'undefined') return;
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      } else {
        setHistory([]);
      }
    } catch (e) {
      console.error('Error loading history:', e);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();

    const handleStorageChange = () => {
      loadHistory();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(HISTORY_EVENT, handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(HISTORY_EVENT, handleStorageChange);
    };
  }, [loadHistory]);

  const notifyChange = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(HISTORY_EVENT));
    }
  };

  const saveWatchHistory = (item: WatchHistoryItem) => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      let list: WatchHistoryItem[] = stored ? JSON.parse(stored) : [];
      list = list.filter((h) => h.slug !== item.slug);
      list.unshift({ ...item, watched_at: new Date().toISOString() });
      if (list.length > 30) list = list.slice(0, 30);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list));
      setHistory(list);
      notifyChange();
    } catch (e) {
      console.error('Error saving history:', e);
    }
  };

  const removeHistoryItem = (slug: string) => {
    try {
      const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
      let list: WatchHistoryItem[] = stored ? JSON.parse(stored) : [];
      list = list.filter((h) => h.slug !== slug);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(list));
      setHistory(list);
      notifyChange();
    } catch (e) {
      console.error('Error removing history item:', e);
    }
  };

  const clearWatchHistory = () => {
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
      setHistory([]);
      notifyChange();
    } catch (e) {
      console.error('Error clearing history:', e);
    }
  };

  return {
    history,
    isLoading,
    saveWatchHistory,
    removeHistoryItem,
    clearWatchHistory,
    count: history.length,
  };
}
