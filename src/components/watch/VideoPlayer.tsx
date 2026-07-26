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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentServer = servers[activeServerIndex];
  const currentEpisode: EpisodeItem | undefined = currentServer?.server_data[activeEpisodeIndex];

  const totalEpisodes = currentServer?.server_data?.length || 0;
  const hasPrev = activeEpisodeIndex > 0;
  const hasNext = activeEpisodeIndex < totalEpisodes - 1;

  // Reset loading state on episode or server change
  useEffect(() => {
    setIsLoading(true);
  }, [activeServerIndex, activeEpisodeIndex, key]);

  const handleReload = () => {
    setIsLoading(true);
    setKey((prev) => prev + 1);
  };

  const embedUrl = currentEpisode?.link_embed || null;

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
                Đang phát video...
              </p>
            </div>
          )}

          {embedUrl ? (
            <iframe
              key={key}
              ref={iframeRef}
              src={embedUrl}
              title={`${movieTitle} - ${currentEpisode?.name || ''}`}
              className="h-full w-full border-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="no-referrer"
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
