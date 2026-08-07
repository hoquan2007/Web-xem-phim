'use client';

/**
 * SafeImage — drop-in replacement for `next/image` that survives upstream
 * 404s / CDN outages without leaving an empty box on screen.
 *
 * Behavior:
 *   1. Render `next/image` with `src` as usual.
 *   2. If the underlying `<img>` fires `onerror`, swap `src` to the next
 *      candidate in `fallbackUrls` (caller passes poster alternatives,
 *      same image on NguonC CDN, etc.).
 *   3. If every fallback also fails, render `fallbackSrc` (default
 *      `/images/placeholder.svg`) and stop trying.
 *
 * Implementation: We use `useReducer` with the previous state being
 * just the `fallbackIndex`. The reducer carries `src` as part of the
 * action so we can reset the index whenever the caller passes a new
 * src (e.g. carousel slide change). Avoids the
 * `react-hooks/set-state-in-effect` and `react-hooks/refs` rules
 * because no useEffect or ref-in-render is needed.
 */

import React, { useReducer, useCallback } from 'react';
import Image, { ImageProps } from 'next/image';

interface SafeImageProps extends Omit<ImageProps, 'src' | 'onError'> {
  src: string;
  fallbackUrls?: string[];
  fallbackSrc?: string;
}

type State = { src: string; fallbackIndex: number };
type Action =
  | { type: 'src-changed'; src: string }
  | { type: 'load-error' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'src-changed':
      if (action.src === state.src) return state;
      return { src: action.src, fallbackIndex: -1 };
    case 'load-error':
      return { ...state, fallbackIndex: state.fallbackIndex + 1 };
  }
}

// CDN hosts that may return 404 (next/image would cache the 404 for 60s
// and onError would never fire). For these we bypass the optimizer and
// render a raw <img> so the browser fires native onerror immediately.
//
// FIX-17: thêm `img.phimapi.com` (mirror format cũ `/upload/vod/...jpg`)
// và bỏ `phim.nguonc.com` (đã chết cho format mới `/uploads/movies/...webp`).
// Probe 2026-08-07 xác nhận `img.phimapi.com` vẫn serve format cũ 200 OK.
const CDN_BYPASS_OPTIMIZER = [
  'phimimg.com',
  'img.phimapi.com',
  'image.ophim1.com',
  'image.vsmov.com',
  'phimapi.com',
];

function shouldBypassOptimizer(url: string): boolean {
  if (!url || url.startsWith('/')) return true;
  return CDN_BYPASS_OPTIMIZER.some((host) => url.includes(host));
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  fallbackUrls,
  fallbackSrc = '/images/placeholder.svg',
  alt,
  ...rest
}) => {
  // `src` is part of the reducer state so we can detect prop changes
  // without refs. The reducer itself is the single source of truth.
  const [state, dispatch] = useReducer(reducer, {
    src,
    fallbackIndex: -1,
  });

  // If the caller passed a different src than the one we last saw,
  // dispatch `src-changed` to reset the fallback index. This is the
  // "dispatch during render" pattern officially supported by React
  // for derived state (see https://react.dev/reference/react/useReducer).
  if (src !== state.src) {
    dispatch({ type: 'src-changed', src });
  }

  const candidates = [src, ...(fallbackUrls ?? [])].filter(
    (c) => c && c.length > 0,
  );

  const currentSrc =
    state.fallbackIndex < 0
      ? src
      : state.fallbackIndex < candidates.length
        ? candidates[state.fallbackIndex]
        : fallbackSrc;

  const handleError = useCallback(() => {
    dispatch({ type: 'load-error' });
  }, []);

  // Bypass optimizer for local placeholders or known CDN hosts (so the
  // browser fires onerror immediately on 404s). Honour explicit caller
  // override via `rest.unoptimized`.
  const bypassOptimizer =
    shouldBypassOptimizer(currentSrc) ||
    shouldBypassOptimizer(src) ||
    Boolean(rest.unoptimized);

  // key forces fresh <img> when src or fallbackIndex changes so the
  // browser fires fresh onload/onerror events.
  const keyChain = `${state.fallbackIndex}:${currentSrc}`;

  return (
    <Image
      key={keyChain}
      {...rest}
      src={currentSrc || fallbackSrc}
      alt={alt}
      onError={handleError}
      unoptimized={bypassOptimizer}
    />
  );
};
