'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Server,
  AlertCircle,
  RefreshCw,
  Play,
  Tv,
  Sparkles,
} from 'lucide-react';
import Hls from 'hls.js';
import { EpisodeItem, EpisodeServer } from '@/types/movie';

interface PlayerBodyProps {
  episodeKey: string;
  movieTitle: string;
  servers: EpisodeServer[];
  activeServerIndex: number;
  activeEpisodeIndex: number;
  onServerChange: (index: number) => void;
  onEpisodeChange: (index: number) => void;
  onReload: () => void;
  isLightOff: boolean;
  onToggleLightOff: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onReportError?: () => void;
  onPlaybackStarted?: () => void;
}

const PlayerBody: React.FC<PlayerBodyProps> = ({
  episodeKey,
  movieTitle,
  servers,
  activeServerIndex,
  activeEpisodeIndex,
  onServerChange,
  onEpisodeChange,
  onReload,
  isLightOff,
  onToggleLightOff,
  isExpanded,
  onToggleExpanded,
  onReportError,
  onPlaybackStarted,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);
  // FIX-12.1: khi HLS fail → iframe fallback (đã có ở FIX-3/FIX-8). Nếu iframe cũng
  // không load được (cross-origin block, upstream 404, CSP reject, network timeout)
  // → user thấy player trắng / banner CSP mà không có cách nào recover. Track
  // iframe load state qua timeout 10s: nếu onLoad không fire trong 10s + URL
  // có sẵn → set `iframeFailed = true` → render CTA "Server không khả dụng".
  const [iframeFailed, setIframeFailed] = useState<boolean>(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentServer = servers[activeServerIndex];
  const currentEpisode: EpisodeItem | undefined = currentServer?.server_data[activeEpisodeIndex];

  const m3u8Url = currentEpisode?.link_m3u8 || null;
  const embedUrl = currentEpisode?.link_embed || null;

  const totalEpisodes = currentServer?.server_data?.length || 0;
  const hasPrev = activeEpisodeIndex > 0;
  const hasNext = activeEpisodeIndex < totalEpisodes - 1;

  // Auto-select mode per episode: HLS nếu có m3u8, ngược lại iframe.
  // `modeOverride` cho phép user chuyển thủ công khi cả hai đều có sẵn.
  // Khởi tạo từ props → state tự reset khi episodeKey remount.
  const autoPlayerMode: 'hls' | 'iframe' = m3u8Url ? 'hls' : 'iframe';
  const [modeOverride, setModeOverride] = useState<'hls' | 'iframe' | null>(null);
  const playerMode = modeOverride ?? autoPlayerMode;

  // FIX-12.1: detect iframe load fail qua timeout 10s. Cross-origin iframe không
  // cho parent read content, nhưng `onLoad` sẽ fire khi iframe navigation
  // hoàn tất (kể cả kết quả là CSP block page vì browser vẫn gọi load event).
  // Nếu 10s không có onLoad → coi như fail (CSP block, network timeout, hoặc
  // upstream server chết). Reset khi PlayerBody remount (episodeKey đổi) hoặc
  // khi `handleIframeLoad` callback fires (allowed under
  // react-hooks/set-state-in-effect rule).
  useEffect(() => {
    if (playerMode !== 'iframe' || !embedUrl) return;
    // Set timeout; sẽ bị clear khi iframe onLoad fires (xem handler bên dưới).
    const failTimer = window.setTimeout(() => {
      setIframeFailed(true);
    }, 10000);
    return () => {
      window.clearTimeout(failTimer);
    };
  }, [playerMode, embedUrl, episodeKey]);

  const handleIframeLoad = () => {
    setIframeFailed(false);
    setIsLoading(false);
  };

  // HLS stream setup & error handling
  useEffect(() => {
    if (playerMode !== 'hls' || !m3u8Url || !videoRef.current) return;

    // Defer loadSource to next tick so any stale instance from the previous
    // effect run is fully torn down before we attach a new one. This avoids
    // race conditions when toggling HLS↔iframe rapidly.
    let cancelled = false;
    let hls: Hls | null = null;
    const video = videoRef.current;

    const fallbackToIframe = (reason: string) => {
      if (cancelled) return;
      setFallbackNotice(reason);
      setIsLoading(false);
      setModeOverride('iframe');
    };

    // 12s guard: nếu MANIFEST_PARSED / loadedmetadata không fire → spinner
    // tắt, đẩy sang iframe fallback để người dùng không kẹt vĩnh viễn.
    const loadTimeout = window.setTimeout(() => {
      fallbackToIframe('HLS stream mất quá nhiều thời gian để nạp. Đã chuyển sang Iframe fallback.');
    }, 12000);

    // Capture handler so we can remove it in cleanup (Safari / iOS branch).
    const onLoadedMetadata = () => {
      if (cancelled) return;
      window.clearTimeout(loadTimeout);
      setIsLoading(false);
      video.play().catch(() => {});
    };

    const setup = () => {
      if (cancelled) return;

      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(m3u8Url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (cancelled) return;
          window.clearTimeout(loadTimeout);
          setIsLoading(false);
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (cancelled) return;
          if (data.fatal) {
            console.warn('HLS fatal error, falling back to iframe embed:', data);
            fallbackToIframe('Nguồn HLS gặp lỗi. Đã chuyển sang Iframe fallback.');
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = m3u8Url;
        video.addEventListener('loadedmetadata', onLoadedMetadata);
      } else {
        fallbackToIframe('Trình duyệt không hỗ trợ HLS. Đã chuyển sang Iframe fallback.');
      }
    };

    // Defer one tick so React has a chance to attach / detach the underlying
    // <video> element if we are racing with a sibling effect.
    const rafId = window.requestAnimationFrame(setup);

    return () => {
      cancelled = true;
      window.clearTimeout(loadTimeout);
      window.cancelAnimationFrame(rafId);
      // Safari / iOS branch listener leak fix: capture was hoisted, now remove.
      // Guard: videoRef.current có thể null lúc cleanup (nếu effect cuối cùng
      // chạy là HLS nhưng element đã bị React unmount ngay trước đó).
      if (video) {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
      }
      if (hls) {
        try {
          hls.destroy();
        } catch {
          // ignore: hls.js có thể throw nếu chưa attach xong khi effect bị huỷ
        }
      }
    };
  }, [playerMode, m3u8Url, episodeKey]);

  const handleReload = () => {
    onReload();
  };

  return (
    <div className="relative w-full group">
      {/* Cinema Light Off Overlay */}
      {isLightOff && (
        <div
          className="fixed inset-0 z-40 bg-black/95 transition-opacity duration-300 pointer-events-auto backdrop-blur-sm"
          onClick={onToggleLightOff}
          title="Bấm vào đây để bật lại đèn"
        />
      )}

      {/* Ambient Glow Backdrop Aura */}
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-cyan-500/20 via-sky-500/15 to-cyan-600/20 blur-xl opacity-70 transition-all duration-500 group-hover:opacity-100 pointer-events-none" />

      {/* Main Player Box */}
      <div
        className={`relative z-40 overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950 shadow-2xl transition-all duration-300 ${
          isLightOff ? 'ring-2 ring-cyan-400/60 shadow-cyan-500/40' : 'shadow-cyan-950/50'
        }`}
      >
        {/* Top Header Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-slate-900/90 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0 shadow-lg shadow-cyan-400/50" />
            <h2 className="line-clamp-1 text-xs sm:text-sm font-bold text-slate-100">
              {movieTitle} -{' '}
              <span className="text-cyan-400 font-extrabold">
                {currentEpisode?.name ? `Tập ${currentEpisode.name}` : 'Đang phát'}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Player Mode Switcher */}
            {m3u8Url && embedUrl && (
              <button
                onClick={() => {
                  setIsLoading(true);
                  setFallbackNotice(null);
                  // FIX-12.1: reset iframeFailed khi user chuyển mode. PlayerBody
                  // không remount (episodeKey không đổi) nên state cần reset tay.
                  setIframeFailed(false);
                  setModeOverride(playerMode === 'hls' ? 'iframe' : 'hls');
                }}
                className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition shadow-sm"
                title="Đổi giữa HLS Direct (Không quảng cáo) và Iframe Embed"
              >
                {playerMode === 'hls' ? <Sparkles className="h-3.5 w-3.5 text-amber-400" /> : <Tv className="h-3.5 w-3.5 text-cyan-400" />}
                <span className="hidden sm:inline">{playerMode === 'hls' ? 'HLS Direct (Sạch ad)' : 'Iframe Embed'}</span>
              </button>
            )}

            {/* Server Quick Selector */}
            {servers.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800/80 rounded-xl px-3 py-1.5 border border-white/10 hover:border-cyan-500/40 transition">
                <Server className="h-3.5 w-3.5 text-cyan-400" />
                <select
                  value={activeServerIndex}
                  onChange={(e) => onServerChange(Number(e.target.value))}
                  className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
                >
                  {servers.map((server, idx) => (
                    <option key={idx} value={idx} className="bg-slate-900 text-slate-200">
                      {server.server_name || `Server ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reload Button */}
            <button
              onClick={handleReload}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800/80 p-2 text-slate-300 hover:bg-slate-700 hover:text-white transition border border-white/5 active:scale-95"
              title="Tải lại trình phát video"
            >
              <RefreshCw className="h-4 w-4 text-cyan-400" />
            </button>
          </div>
        </div>

        {/* Fallback Notice Banner */}
        {fallbackNotice && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-start gap-2 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <span className="leading-snug">{fallbackNotice}</span>
          </div>
        )}

        {/* Video Box (16:9 ratio) */}
        <div className="relative aspect-video w-full bg-black overflow-hidden">
          {/* Modern Translucent Glowing Spinner */}
          {isLoading && !iframeFailed && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md text-cyan-400">
              <div className="relative flex items-center justify-center">
                <div className="h-14 w-14 animate-spin rounded-full border-4 border-cyan-500/20 border-t-cyan-400 shadow-xl shadow-cyan-500/30" />
                <Play className="h-5 w-5 text-cyan-400 absolute inset-0 m-auto fill-cyan-400/30" />
              </div>
              <p className="mt-4 text-xs sm:text-sm font-semibold tracking-wide text-slate-200">
                Đang nạp video {playerMode === 'hls' ? 'HLS Stream' : 'Player'}...
              </p>
            </div>
          )}

          {playerMode === 'hls' && m3u8Url ? (
            <video
              key={`video-${episodeKey}`}
              ref={videoRef}
              controls
              autoPlay
              playsInline
              className="h-full w-full object-contain"
              onCanPlay={() => setIsLoading(false)}
              onPlay={onPlaybackStarted}
            />
          ) : playerMode === 'iframe' && iframeFailed && embedUrl ? (
            // FIX-12.1: CTA "Server không khả dụng" khi cả HLS + iframe đều fail.
            // Trước fix, user thấy player trắng + CSP block banner mà không có
            // cách recover. UI này cho 3 action rõ ràng: reload (thử lại tập hiện
            // tại), báo lỗi (mở ReportModal), chọn server khác (scroll lên
            // EpisodeSelector — đánh dấu nổi bật).
            <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 ring-1 ring-rose-500/30">
                <AlertCircle className="h-7 w-7 text-rose-400 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-slate-100">
                Server không khả dụng
              </h3>
              <p className="max-w-md text-xs leading-relaxed text-slate-400">
                Tập này không thể phát được do máy chủ đang gặp sự cố hoặc bị
                chặn. Vui lòng thử <span className="font-semibold text-cyan-300">chọn server khác</span>{' '}
                ở danh sách bên dưới, hoặc báo lỗi để HNQ Movie khắc phục.
              </p>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={handleReload}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-700 hover:text-white transition border border-white/10"
                >
                  <RefreshCw className="h-4 w-4 text-cyan-400" />
                  <span>Tải lại tập</span>
                </button>
                {onReportError && (
                  <button
                    onClick={onReportError}
                    className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 px-3.5 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span>Báo lỗi</span>
                  </button>
                )}
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Server hiện tại:{' '}
                <span className="font-semibold text-slate-300">
                  {currentServer?.server_name || `Server ${activeServerIndex + 1}`}
                </span>
                {' • '}
                Tập {currentEpisode?.name || '?'}
              </p>
            </div>
          ) : embedUrl ? (
            <iframe
              key={`iframe-${episodeKey}`}
              ref={iframeRef}
              src={embedUrl}
              title={`${movieTitle} - ${currentEpisode?.name || ''}`}
              className="h-full w-full border-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="no-referrer"
              onLoad={handleIframeLoad}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center text-slate-400">
              <AlertCircle className="h-12 w-12 text-rose-500 mb-2 animate-bounce" />
              <p className="text-base font-semibold text-slate-200">Rất tiếc! Không tìm thấy tập phim này</p>
              <p className="text-xs text-slate-400 mt-1">Vui lòng thử chọn Server khác hoặc quay lại sau.</p>
            </div>
          )}
        </div>

        {/* Bottom Utility Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-900/90 px-4 py-3 backdrop-blur-md">
          {/* Prev / Next Episode Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => hasPrev && onEpisodeChange(activeEpisodeIndex - 1)}
              disabled={!hasPrev}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-800/80 disabled:cursor-not-allowed border border-white/5"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Tập trước</span>
            </button>

            <button
              onClick={() => hasNext && onEpisodeChange(activeEpisodeIndex + 1)}
              disabled={!hasNext}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 px-4 py-2 text-xs font-bold text-white transition hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-40 disabled:hover:from-cyan-600 disabled:hover:to-cyan-500 disabled:cursor-not-allowed border border-cyan-400/40 shadow-lg shadow-cyan-500/20"
            >
              <span>Tập tiếp</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Player Controls & Utility Tools */}
          <div className="flex items-center gap-2">
            {/* Cinema Light Off Toggle */}
            <button
              onClick={onToggleLightOff}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition border ${
                isLightOff
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-md shadow-amber-500/10'
                  : 'bg-slate-800/80 text-slate-300 border-white/5 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {isLightOff ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-cyan-400" />}
              <span className="hidden md:inline">{isLightOff ? 'Bật đèn' : 'Tắt đèn'}</span>
            </button>

            {/* Theater Mode Expand */}
            <button
              onClick={onToggleExpanded}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition border ${
                isExpanded
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-md shadow-cyan-500/10'
                  : 'bg-slate-800/80 text-slate-300 border-white/5 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span className="hidden md:inline">{isExpanded ? 'Thu nhỏ' : 'Mở rộng'}</span>
            </button>

            {/* Report Error Button */}
            {onReportError && (
              <button
                onClick={onReportError}
                className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/30 px-3.5 py-2 text-xs font-semibold transition"
                title="Báo lỗi sự cố xem phim"
              >
                <AlertCircle className="h-4 w-4" />
                <span className="hidden md:inline">Báo lỗi</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Outer VideoPlayer: owns the persistent controls (prev/next/episode change) and
// `reloadKey`. Bọc PlayerBody với key thay đổi khi đổi tập/server/reload → React
// reset toàn bộ state bên trong (isLoading, modeOverride, fallbackNotice) thay vì
// phải sync bằng useEffect (bị react-hooks/set-state-in-effect rule cấm).
export const VideoPlayer: React.FC<Omit<PlayerBodyProps, 'episodeKey' | 'onReload'>> = (
  props
) => {
  const { activeServerIndex, activeEpisodeIndex } = props;
  const [reloadKey, setReloadKey] = useState(0);
  const episodeKey = `${activeServerIndex}:${activeEpisodeIndex}:${reloadKey}`;

  return (
    <PlayerBody
      key={episodeKey}
      {...props}
      episodeKey={episodeKey}
      onReload={() => setReloadKey((prev) => prev + 1)}
    />
  );
};