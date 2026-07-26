'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { Flame, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { MovieListItem } from '@/types/movie';
import { getImageUrl } from '@/lib/api';

interface TopMoviesRankSectionProps {
  movies: MovieListItem[];
}

export const TopMoviesRankSection: React.FC<TopMoviesRankSectionProps> = ({ movies }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const top10 = movies.slice(0, 10);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const scrollAmount = clientWidth * 0.75;
    scrollRef.current.scrollTo({
      left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!top10 || top10.length === 0) return null;

  return (
    <div className="w-full bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-900/90 border border-slate-800/80 rounded-2xl p-4 sm:p-6 backdrop-blur-md shadow-2xl relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl text-slate-950 shadow-lg shadow-orange-500/20">
            <Flame className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              Bảng Xếp Hạng Top View
            </h2>
            <p className="text-xs text-slate-400">Top 10 phim được xem nhiều nhất tuần qua</p>
          </div>
        </div>

        {/* Scroll Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className="w-8 h-8 rounded-full bg-slate-800/90 hover:bg-amber-400 hover:text-slate-950 text-slate-300 flex items-center justify-center transition-all shadow-md border border-slate-700/50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className="w-8 h-8 rounded-full bg-slate-800/90 hover:bg-amber-400 hover:text-slate-950 text-slate-300 flex items-center justify-center transition-all shadow-md border border-slate-700/50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Top 10 Cards Slider */}
      <div
        ref={scrollRef}
        className="flex items-center gap-4 sm:gap-5 overflow-x-auto scrollbar-none py-2 relative z-10 scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {top10.map((movie, index) => {
          const rank = index + 1;
          const posterSrc = getImageUrl(movie.poster_url || movie.thumb_url);

          return (
            <Link
              key={movie._id}
              href={`/phim/${movie.slug}`}
              className="flex-shrink-0 flex items-center group relative w-[250px] sm:w-[290px] snap-start bg-slate-950/70 hover:bg-slate-800/70 p-3 rounded-xl border border-slate-800/80 hover:border-amber-400/50 transition-all duration-300 shadow-lg hover:shadow-amber-500/10 gap-3"
            >
              {/* Giant Rank Number */}
              <div className="w-10 sm:w-12 shrink-0 flex items-center justify-center font-black select-none leading-none">
                <span
                  className={`text-4xl sm:text-5xl font-extrabold tracking-tighter ${
                    rank === 1
                      ? 'text-transparent bg-clip-text bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]'
                      : rank === 2
                      ? 'text-transparent bg-clip-text bg-gradient-to-b from-slate-100 via-slate-300 to-slate-500'
                      : rank === 3
                      ? 'text-transparent bg-clip-text bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900'
                      : 'text-slate-700 group-hover:text-slate-500 transition-colors'
                  }`}
                >
                  {rank}
                </span>
              </div>

              {/* Movie Poster */}
              <div className="relative w-20 h-28 rounded-lg overflow-hidden shrink-0 shadow-md bg-slate-900">
                <img
                  src={posterSrc}
                  alt={movie.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/placeholder.svg';
                  }}
                />
                <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/0 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/40 backdrop-blur-[2px]">
                  <div className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                    <Play className="w-3.5 h-3.5 fill-slate-950 ml-0.5" />
                  </div>
                </div>
              </div>

              {/* Movie Meta */}
              <div className="flex-1 min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                  {movie.name}
                </h3>
                <p className="text-[11px] text-slate-400 truncate mt-1 font-medium">
                  {movie.origin_name}
                </p>
                <div className="flex flex-wrap items-center gap-1 mt-2">
                  {movie.quality && (
                    <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded">
                      {movie.quality}
                    </span>
                  )}
                  {movie.episode_current && (
                    <span className="px-1.5 py-0.5 text-[9px] font-medium bg-slate-800 text-slate-300 rounded truncate max-w-[90px]">
                      {movie.episode_current}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
