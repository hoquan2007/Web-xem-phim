'use client';

import React, { useState } from 'react';
import { Server, Search, Film, Play } from 'lucide-react';
import { EpisodeServer } from '@/types/movie';

interface EpisodeSelectorProps {
  servers: EpisodeServer[];
  activeServerIndex: number;
  activeEpisodeIndex: number;
  onSelectServer: (index: number) => void;
  onSelectEpisode: (index: number) => void;
}

export const EpisodeSelector: React.FC<EpisodeSelectorProps> = ({
  servers,
  activeServerIndex,
  activeEpisodeIndex,
  onSelectServer,
  onSelectEpisode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [rangeIndex, setRangeIndex] = useState(0);

  if (!servers || servers.length === 0) {
    return null;
  }

  const currentServer = servers[activeServerIndex] || servers[0];
  const episodes = currentServer.server_data || [];

  // Episode range grouping (50 episodes per group)
  const groupSize = 50;
  const totalGroups = Math.ceil(episodes.length / groupSize);

  // Filtered episodes based on search
  const filteredEpisodes = episodes.filter((ep) =>
    ep.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // If search is active, show filtered results, otherwise show active group range
  const displayedEpisodes = searchTerm
    ? filteredEpisodes
    : episodes.slice(rangeIndex * groupSize, (rangeIndex + 1) * groupSize);

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 backdrop-blur-md shadow-xl">
      {/* Header: Server selector tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
            Danh sách tập
          </h3>
        </div>

        {/* Server Tabs */}
        {servers.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {servers.map((server, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onSelectServer(idx);
                  setSearchTerm('');
                  setRangeIndex(0);
                }}
                className={`rounded-xl px-3 py-1 text-xs font-semibold transition ${
                  activeServerIndex === idx
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-white/5'
                }`}
              >
                {server.server_name || `Server ${idx + 1}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filter and Range Controls for long series */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {/* Range Tabs (e.g. 1-50, 51-100) */}
        {totalGroups > 1 && !searchTerm && (
          <div className="flex flex-wrap items-center gap-1 overflow-x-auto py-1 max-w-full">
            {Array.from({ length: totalGroups }).map((_, gIdx) => {
              const start = gIdx * groupSize + 1;
              const end = Math.min((gIdx + 1) * groupSize, episodes.length);
              return (
                <button
                  key={gIdx}
                  onClick={() => setRangeIndex(gIdx)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition shrink-0 ${
                    rangeIndex === gIdx
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {start} - {end}
                </button>
              );
            })}
          </div>
        )}

        {/* Search input for > 20 episodes */}
        {episodes.length > 20 && (
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tập phim..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl bg-slate-950/80 border border-white/10 pl-8 pr-3 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-500/50 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Episodes Grid */}
      <div className="mt-4 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
        {displayedEpisodes.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400">
            Không tìm thấy tập nào phù hợp.
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
            {displayedEpisodes.map((ep) => {
              // Find original index in full server_data array
              const originalIndex = episodes.findIndex((e) => e.slug === ep.slug);
              const isActive = originalIndex === activeEpisodeIndex;

              return (
                <button
                  key={ep.slug || ep.name}
                  onClick={() => onSelectEpisode(originalIndex >= 0 ? originalIndex : 0)}
                  className={`group relative flex items-center justify-center rounded-xl p-2.5 text-xs font-semibold transition-all duration-200 border ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold border-cyan-400 shadow-lg shadow-cyan-500/30 scale-[1.03]'
                      : 'bg-slate-800/80 text-slate-300 border-white/5 hover:bg-slate-700 hover:text-white hover:border-white/20'
                  }`}
                >
                  <span className="line-clamp-1 truncate">
                    {ep.name.startsWith('Tập') ? ep.name : `Tập ${ep.name}`}
                  </span>

                  {isActive && (
                    <Play className="ml-1 h-3 w-3 fill-slate-950 text-slate-950 shrink-0 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
