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
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { EpisodeItem, EpisodeServer } from '@/types/movie';

interface VideoPlayerProps {
  movieTitle: string;
  servers: EpisodeServer[];
  activeServerIndex: number;
  activeEpisodeIndex: number;
  onServerChange: (index: number) => void;
  onEpisodeChange: (index: number) => void;
  isLightOff: boolean;
  onToggleLightOff: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  movieTitle,
  servers,
  activeServerIndex,
  activeEpisodeIndex,
  onServerChange,
  onEpisodeChange,
  isLightOff,
  onToggleLightOff,
  isExpanded,
  onToggleExpanded,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [key, setKey] = useState<number>(0);
  const [srcDocHtml, setSrcDocHtml] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentServer = servers[activeServerIndex];
  const currentEpisode: EpisodeItem | undefined = currentServer?.server_data[activeEpisodeIndex];

  const totalEpisodes = currentServer?.server_data?.length || 0;
  const hasPrev = activeEpisodeIndex > 0;
  const hasNext = activeEpisodeIndex < totalEpisodes - 1;

  // Transform embed HTML to inject modern Dark Cinema CSS skin
  useEffect(() => {
    setIsLoading(true);
    setSrcDocHtml(null);

    const embedUrl = currentEpisode?.link_embed;
    if (!embedUrl) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    fetch(embedUrl)
      .then((res) => {
        if (!res.ok) throw new Error('Fetch failed');
        return res.text();
      })
      .then((html) => {
        if (!isMounted) return;
        try {
          const embedDomain = new URL(embedUrl).origin;
          const customCss = `
            <base href="${embedDomain}/">
            <style>
              /* Modern Dark Cinema Theme Overrides for StreamVSMOV Embed Player */
              :root {
                --primary-color: #06b6d4 !important;
                --primary-text: #ffffff !important;
                --bc-player-ink: #f8fafc !important;
                --bc-player-paper: #0f172a !important;
                --bc-player-surface: rgba(15, 23, 42, 0.85) !important;
                --bc-player-bar: rgba(15, 23, 42, 0.95) !important;
                --bc-player-accent: #06b6d4 !important;
                --bc-player-accent-hover: #0891b2 !important;
                --bc-player-sky: #38bdf8 !important;
                --bc-player-pop: #06b6d4 !important;
                --bc-player-radius: 12px !important;
                --bc-player-radius-sm: 10px !important;
                --bc-player-border: 1px solid rgba(255, 255, 255, 0.15) !important;
                --bc-player-shadow: 0 10px 30px rgba(0, 0, 0, 0.6) !important;
                --bc-player-shadow-sm: 0 4px 15px rgba(0, 0, 0, 0.4) !important;
                --bg-primary: #06b6d4 !important;
              }
              
              /* Remove white square card loading box, replace with glowing circular spinner */
              .jwplayer.jw-skin-pom .jw-display-icon-container {
                border: 1.5px solid rgba(6, 182, 212, 0.5) !important;
                border-radius: 9999px !important;
                background: rgba(15, 23, 42, 0.8) !important;
                backdrop-filter: blur(16px) !important;
                -webkit-backdrop-filter: blur(16px) !important;
                box-shadow: 0 0 25px rgba(6, 182, 212, 0.4) !important;
                color: #38bdf8 !important;
                width: 60px !important;
                height: 60px !important;
              }

              .jwplayer.jw-skin-pom .jw-display-icon-container .jw-svg-icon {
                fill: #38bdf8 !important;
              }

              .jwplayer.jw-skin-pom .jw-display-icon-container:hover {
                background: rgba(6, 182, 212, 0.9) !important;
                box-shadow: 0 0 35px rgba(6, 182, 212, 0.7) !important;
              }

              .jwplayer.jw-skin-pom .jw-display-icon-container:hover .jw-svg-icon {
                fill: #ffffff !important;
              }

              /* Modern sleek translucent buttons for skip 10s, quality, picture-in-picture, fullscreen */
              #rp-player .item-btn .line-center {
                border: 1px solid rgba(255, 255, 255, 0.15) !important;
                border-radius: 12px !important;
                background: rgba(15, 23, 42, 0.8) !important;
                backdrop-filter: blur(12px) !important;
                -webkit-backdrop-filter: blur(12px) !important;
                color: #f1f5f9 !important;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
                padding: 0.4rem 0.65rem !important;
              }

              #rp-player .item-btn.active .line-center,
              #rp-player .item-btn:hover .line-center {
                border-color: rgba(6, 182, 212, 0.6) !important;
                background: rgba(6, 182, 212, 0.25) !important;
                color: #38bdf8 !important;
                box-shadow: 0 0 15px rgba(6, 182, 212, 0.3) !important;
              }

              /* Sleek cyan progress bar & seekbar */
              .bar-line,
              .jwplayer.jw-skin-pom .jw-slider-time .jw-slider-container .jw-rail,
              .jwplayer.jw-skin-pom .b_bar .jw-slider-container .jw-rail {
                height: 5px !important;
                border: none !important;
                border-radius: 9999px !important;
                background-color: rgba(255, 255, 255, 0.2) !important;
                box-shadow: none !important;
              }

              .jwplayer.jw-skin-pom .jw-progress {
                background: linear-gradient(90deg, #06b6d4, #38bdf8) !important;
                border-radius: 9999px !important;
              }

              .jwplayer.jw-skin-pom .jw-knob {
                background: #38bdf8 !important;
                border: 2px solid #ffffff !important;
                box-shadow: 0 0 10px rgba(6, 182, 212, 0.8) !important;
              }

              /* Tooltips time popup */
              .tooltip.custom-tooltip .tooltip-inner {
                background: rgba(15, 23, 42, 0.95) !important;
                color: #38bdf8 !important;
                border: 1px solid rgba(6, 182, 212, 0.3) !important;
                border-radius: 8px !important;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6) !important;
                font-weight: 600 !important;
              }
            </style>
          `;

          const injectedHtml = html.replace('<head>', `<head>${customCss}`);
          setSrcDocHtml(injectedHtml);
        } catch (e) {
          console.error('Error injecting CSS into embed:', e);
        }
      })
      .catch(() => {
        // Fallback to direct src if fetch fails
      });

    return () => {
      isMounted = false;
    };
  }, [activeServerIndex, activeEpisodeIndex, key, currentEpisode?.link_embed]);

  const handleReload = () => {
    setIsLoading(true);
    setKey((prev) => prev + 1);
  };

  return (
    <div className="relative w-full">
      {/* Cinema Light Off Overlay */}
      {isLightOff && (
        <div
          className="fixed inset-0 z-40 bg-black/95 transition-opacity duration-300 pointer-events-auto"
          onClick={onToggleLightOff}
          title="Bấm vào đây để bật lại đèn"
        />
      )}

      {/* Main Player Box */}
      <div
        className={`relative z-40 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl transition-all duration-300 ${
          isLightOff ? 'ring-2 ring-cyan-500/50 shadow-cyan-500/30' : ''
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

        {/* Video Box (16:9 ratio) */}
        <div className="relative aspect-video w-full bg-black overflow-hidden">
          {/* Modern Translucent Glowing Spinner */}
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md text-cyan-400">
              <div className="relative flex items-center justify-center">
                <div className="h-14 w-14 animate-spin rounded-full border-4 border-cyan-500/20 border-t-cyan-400 shadow-xl shadow-cyan-500/30" />
                <Play className="h-5 w-5 text-cyan-400 absolute inset-0 m-auto fill-cyan-400/30" />
              </div>
              <p className="mt-4 text-xs sm:text-sm font-semibold tracking-wide text-slate-200">
                Đang chuẩn bị video...
              </p>
            </div>
          )}

          {currentEpisode?.link_embed ? (
            <iframe
              key={key}
              ref={iframeRef}
              src={srcDocHtml ? undefined : currentEpisode.link_embed}
              srcDoc={srcDocHtml || undefined}
              title={`${movieTitle} - ${currentEpisode.name}`}
              className="h-full w-full border-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              onLoad={() => setIsLoading(false)}
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
          </div>
        </div>
      </div>
    </div>
  );
};
