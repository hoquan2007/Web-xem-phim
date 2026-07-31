'use client';

import { useSyncExternalStore } from 'react';
import { WatchHistoryItem } from '@/types/movie';

export const HISTORY_STORAGE_KEY = 'hnq_watch_history';
export const HISTORY_EVENT = 'hnq_history_updated';

const EMPTY_HISTORY: WatchHistoryItem[] = [];
let cachedRaw: string | null | undefined;
let cachedHistory: WatchHistoryItem[] = EMPTY_HISTORY;

function readHistory(): WatchHistoryItem[] {
  if (typeof window === 'undefined') return EMPTY_HISTORY;

  const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
  if (raw === cachedRaw) return cachedHistory;

  cachedRaw = raw;
  if (!raw) {
    cachedHistory = EMPTY_HISTORY;
    return cachedHistory;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    cachedHistory = Array.isArray(parsed) ? (parsed as WatchHistoryItem[]) : EMPTY_HISTORY;
  } catch (error) {
    console.error('Error loading history:', error);
    cachedHistory = EMPTY_HISTORY;
  }
  return cachedHistory;
}

function subscribeHistory(onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === HISTORY_STORAGE_KEY || event.key === null) onStoreChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(HISTORY_EVENT, onStoreChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(HISTORY_EVENT, onStoreChange);
  };
}

function publishHistory(list: WatchHistoryItem[]) {
  const raw = JSON.stringify(list);
  localStorage.setItem(HISTORY_STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedHistory = list;
  window.dispatchEvent(new Event(HISTORY_EVENT));
}

export function useWatchHistory() {
  const history = useSyncExternalStore(subscribeHistory, readHistory, () => EMPTY_HISTORY);

  const saveWatchHistory = (item: WatchHistoryItem) => {
    try {
      const list = [
        { ...item, watched_at: new Date().toISOString() },
        ...readHistory().filter((historyItem) => historyItem.slug !== item.slug),
      ].slice(0, 30);
      publishHistory(list);
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const removeHistoryItem = (slug: string) => {
    try {
      publishHistory(readHistory().filter((item) => item.slug !== slug));
    } catch (error) {
      console.error('Error removing history item:', error);
    }
  };

  const clearWatchHistory = () => {
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
      cachedRaw = null;
      cachedHistory = EMPTY_HISTORY;
      window.dispatchEvent(new Event(HISTORY_EVENT));
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  return {
    history,
    saveWatchHistory,
    removeHistoryItem,
    clearWatchHistory,
    count: history.length,
  };
}
