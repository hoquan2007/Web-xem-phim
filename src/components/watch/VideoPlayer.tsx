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
  }, [activeServerIndex, activeEpisodeIndex]);

  const handleReload = () => {
    setIsLoading(true);
    setKey((prev) => prev + 1);
  };

  return (
    <div className="relative w-full">
      {/* Light Off Overlay */}
      {isLightOff && (
        <div
          className="fixed inset-0 z-40 bg-black/95 transition-opacity duration-300 pointer-events-auto"
          onClick={onToggleLightOff}
          title="Bấm để bật lại đèn"
        />
      )}

      {/* Main Player Container */}
      <div
        className={`relative z-40 overflow-hidden rounded-2xl border border-white/10 bg-slate-950 shadow-2xl transition-all duration-300 ${
          isLightOff ? 'ring-2 ring-cyan-500/50 shadow-cyan-500/20' : ''
        }`}
      >
        {/* Top Control Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-slate-900/90 px-4 py-2.5 backdrop-blur-md">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <h2 className="line-clamp-1 text-xs sm:text-sm font-semibold text-slate-200">
              {movieTitle} -{' '}
              <span className="text-cyan-400">
                {currentEpisode?.name ? `Tập ${currentEpisode.name}` : 'Đang xem'}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Server Quick Dropdown */}
            {servers.length > 1 && (
              <div className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800/80 rounded-lg px-2.5 py-1 border border-white/5">
                <Server className="h-3.5 w-3.5 text-cyan-400" />
                <select
                  value={activeServerIndex}
                  onChange={(e) => onServerChange(Number(e.target.value))}
                  className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer"
                >
                  {servers.map((server, idx) => (
                    <option key={idx} value={idx} className="bg-slate-900 text-slate-200">
                      {server.server_name || `Server ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Reload button */}
            <button
              onClick={handleReload}
              className="flex items-center gap-1 rounded-lg bg-slate-800/80 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white transition"
              title="Tải lại trình phát"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Video Iframe Box (16:9 ratio) */}
        <div className="relative aspect-video w-full bg-black">
          {/* Loading Spinner */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/90 text-cyan-400">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent shadow-lg shadow-cyan-500/20" />
              <p className="mt-3 text-xs sm:text-sm font-medium text-slate-300">
                Đang tải video...
              </p>
            </div>
          )}

          {currentEpisode?.link_embed ? (
            <iframe
              key={key}
              ref={iframeRef}
              src={currentEpisode.link_embed}
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

        {/* Bottom Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-slate-900/90 px-4 py-3 backdrop-blur-md">
          {/* Prev / Next Episode Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => hasPrev && onEpisodeChange(activeEpisodeIndex - 1)}
              disabled={!hasPrev}
              className="flex items-center gap-1.5 rounded-xl bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-800/80 disabled:cursor-not-allowed border border-white/5"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Tập trước</span>
            </button>

            <button
              onClick={() => hasNext && onEpisodeChange(activeEpisodeIndex + 1)}
              disabled={!hasNext}
              className="flex items-center gap-1.5 rounded-xl bg-cyan-500/20 px-3.5 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/30 hover:text-cyan-200 disabled:opacity-40 disabled:hover:bg-cyan-500/20 disabled:cursor-not-allowed border border-cyan-500/30 shadow-md shadow-cyan-500/10"
            >
              <span>Tập tiếp</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Player Utility Tools */}
          <div className="flex items-center gap-2">
            {/* Cinema Light Off Toggle */}
            <button
              onClick={onToggleLightOff}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition border ${
                isLightOff
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800/80 text-slate-300 border-white/5 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {isLightOff ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-cyan-400" />}
              <span className="hidden md:inline">{isLightOff ? 'Bật đèn' : 'Tắt đèn'}</span>
            </button>

            {/* Theater Mode Expand */}
            <button
              onClick={onToggleExpanded}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition border ${
                isExpanded
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800/80 text-slate-300 border-white/5 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span className="hidden md:inline">{isExpanded ? 'Thu nhỏ' : 'Mở rộng'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
