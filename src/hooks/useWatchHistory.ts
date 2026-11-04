'use client';

import { useSyncExternalStore } from 'react';
import { WatchHistoryItem } from '@/types/movie';
import { safeStorageRead, isStoredHistory, sameStoredMovie, type StoredMovieReference } from '@/lib/storage';

export const HISTORY_STORAGE_KEY = 'hnq_watch_history';
export const HISTORY_EVENT = 'hnq_history_updated';

const EMPTY_HISTORY: WatchHistoryItem[] = [];
let cachedRaw: string | null | undefined;
let cachedHistory: WatchHistoryItem[] = EMPTY_HISTORY;

function readHistory(): WatchHistoryItem[] {
  if (typeof window === 'undefined') return EMPTY_HISTORY;

  const raw = safeStorageRead(HISTORY_STORAGE_KEY);
  if (raw === cachedRaw) return cachedHistory;

  cachedRaw = raw;
  if (!raw) {
    cachedHistory = EMPTY_HISTORY;
    return cachedHistory;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    cachedHistory = Array.isArray(parsed) ? parsed.filter(isStoredHistory).slice(0, 30) : EMPTY_HISTORY;
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

let writeFailed = false;
const errorListeners = new Set<() => void>();
function setStorageError(value: boolean) {
  writeFailed = value;
  errorListeners.forEach(listener => listener());
}
const subscribeError = (listener: () => void) => { errorListeners.add(listener); return () => { errorListeners.delete(listener); }; };
export function useWatchHistory() {
  const storageError = useSyncExternalStore(subscribeError, () => writeFailed, () => false);
  const history = useSyncExternalStore(subscribeHistory, readHistory, () => EMPTY_HISTORY);

  const saveWatchHistory = (item: WatchHistoryItem) => {
    try {
      const list = [
        { ...item, watched_at: new Date().toISOString() },
        ...readHistory().filter((historyItem) => !sameStoredMovie(historyItem, item)),
      ].slice(0, 30);
      publishHistory(list);
      setStorageError(false);
      return true;
    } catch (error) {
      console.error('Error saving history:', error);
      setStorageError(true);
      return false;
    }
  };

  const removeHistoryItem = (movie: StoredMovieReference) => {
    try {
      publishHistory(readHistory().filter((item) => !sameStoredMovie(item, movie)));
      setStorageError(false);
      return true;
    } catch (error) {
      console.error('Error removing history item:', error);
      setStorageError(true);
      return false;
    }
  };

  const clearWatchHistory = () => {
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
      setStorageError(false);
      cachedRaw = null;
      cachedHistory = EMPTY_HISTORY;
      window.dispatchEvent(new Event(HISTORY_EVENT));
    } catch (error) {
      console.error('Error clearing history:', error);
      setStorageError(true);
      return false;
    }
  };

  return {
    history,
    storageError,
    saveWatchHistory,
    removeHistoryItem,
    clearWatchHistory,
    count: history.length,
  };
}
