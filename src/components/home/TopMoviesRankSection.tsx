'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Play, Flame } from 'lucide-react';
import { MovieListItem } from '@/types/movie';
import { getImageUrl } from '@/lib/api';

interface TopMoviesRankSectionProps {
  title?: string;
  movies: MovieListItem[];
}

export const TopMoviesRankSection: React.FC<TopMoviesRankSectionProps> = ({
  title = 'Top Phim Bộ & Phim Hot Hôm Nay',
  movies,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'day' | 'week' | 'month'>('day');

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    const scrollAmount = clientWidth * 0.75;
    scrollRef.current.scrollTo({
      left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
      behavior: 'smooth',
    });
  };

  // Filter or slice movies according to active tab
  const getRankedMovies = () => {
    if (activeTab === 'week') {
      return [...movies].reverse().slice(0, 10);
    }
    if (activeTab === 'month') {
      return [...movies].sort((a, b) => (b.year || 0) - (a.year || 0)).slice(0, 10);
    }
    return movies.slice(0, 10);
  };

  const top10 = getRankedMovies();

  if (!movies || movies.length === 0) return null;

  return (
    <div className="w-full space-y-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl text-slate-950 shadow-lg shadow-orange-500/20">
              <Flame className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {title}
              </h2>
            </div>
          </div>

          {/* Time Filter Tabs (Top Ngày, Top Tuần, Top Tháng) */}
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('day')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'day'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Top Ngày
            </button>
            <button
              onClick={() => setActiveTab('week')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'week'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Top Tuần
            </button>
            <button
              onClick={() => setActiveTab('month')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeTab === 'month'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Top Tháng
            </button>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={() => scroll('left')}
            aria-label="Scroll left"
            className="w-9 h-9 rounded-full bg-slate-800/90 hover:bg-amber-400 hover:text-slate-950 text-slate-300 flex items-center justify-center transition-all shadow-md border border-slate-700/60 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            aria-label="Scroll right"
            className="w-9 h-9 rounded-full bg-slate-800/90 hover:bg-amber-400 hover:text-slate-950 text-slate-300 flex items-center justify-center transition-all shadow-md border border-slate-700/60 active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Horizontal Cards Slider */}
      <div
        ref={scrollRef}
        className="flex items-start gap-4 sm:gap-5 overflow-x-auto scrollbar-none py-2 scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {top10.map((movie, index) => {
          const rank = index + 1;
          const posterSrc = getImageUrl(movie.poster_url || movie.thumb_url);

          // Format episode badge (e.g. PĐ. 10, TM. 10)
          const epMatch = movie.episode_current ? movie.episode_current.match(/\d+/) : null;
          const epNum = epMatch ? epMatch[0] : '';
          const isVietsub = !movie.lang || movie.lang.toLowerCase().includes('vietsub');
          const isThuyetMinh = movie.lang && movie.lang.toLowerCase().includes('thuyết minh');

          return (
            <Link
              key={movie._id}
              href={`/phim/${movie.slug}`}
              className="flex-shrink-0 w-[170px] sm:w-[200px] md:w-[220px] lg:w-[230px] snap-start group flex flex-col gap-3"
            >
              {/* Large Poster Container */}
              <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl bg-slate-900 border border-slate-800 group-hover:border-amber-400/40 transition-all duration-300">
                <img
                  src={posterSrc}
                  alt={movie.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/placeholder.svg';
                  }}
                />

                {/* Subtle vignette shadow overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                {/* Hover Play Button Overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/40 backdrop-blur-[2px]">
                  <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                  </div>
                </div>

                {/* Badges on Bottom of Poster (Matching RoPhim style: PĐ. 10 | TM. 10) */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-wrap items-center gap-1 z-10">
                  {isVietsub && (
                    <span className="px-2 py-0.5 text-[10px] font-black bg-sky-600 text-white rounded-md shadow-md uppercase tracking-wider">
                      PĐ.{epNum ? ` ${epNum}` : ''}
                    </span>
                  )}
                  {isThuyetMinh && (
                    <span className="px-2 py-0.5 text-[10px] font-black bg-emerald-600 text-white rounded-md shadow-md uppercase tracking-wider">
                      TM.{epNum ? ` ${epNum}` : ''}
                    </span>
                  )}
                  {!isVietsub && !isThuyetMinh && (
                    <span className="px-2 py-0.5 text-[10px] font-black bg-amber-500 text-slate-950 rounded-md shadow-md uppercase tracking-wider">
                      {movie.quality || 'HD'}
                    </span>
                  )}
                </div>
              </div>

              {/* Rank Number + Meta Info below Poster */}
              <div className="flex items-start gap-3 px-1">
                {/* Giant Bold Italic Gold Rank Number */}
                <span className="text-4xl sm:text-5xl font-black italic tracking-tighter text-amber-400 shrink-0 font-serif leading-none select-none drop-shadow-[0_2px_8px_rgba(245,158,11,0.4)]">
                  {rank}
                </span>

                {/* Title & Meta Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors truncate leading-snug">
                    {movie.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                    {movie.origin_name}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 truncate">
                    Phần 1 • {movie.episode_current || 'Tập mới'}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
