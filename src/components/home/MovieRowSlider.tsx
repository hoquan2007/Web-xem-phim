'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieCard } from '@/components/ui/MovieCard';
import { MovieListItem } from '@/types/movie';

interface MovieRowSliderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  viewAllHref?: string;
  movies: MovieListItem[];
}

export const MovieRowSlider: React.FC<MovieRowSliderProps> = ({
  title,
  subtitle,
  icon,
  viewAllHref,
  movies,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    const scrollAmount = clientWidth * 0.75;
    scrollContainerRef.current.scrollTo({
      left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
      behavior: 'smooth',
    });
  };

  if (!movies || movies.length === 0) return null;

  return (
    <div className="w-full space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {icon && <div className="text-cyan-400">{icon}</div>}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="text-xs sm:text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 group"
            >
              Xem tất cả
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}

          {/* Navigation Controls */}
          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-800/80">
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 flex items-center justify-center transition-all duration-200 shadow-md border border-slate-700/50 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 flex items-center justify-center transition-all duration-200 shadow-md border border-slate-700/50 active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Scroll Slider */}
      <div
        ref={scrollContainerRef}
        className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto scrollbar-none py-1.5 scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {movies.map((movie) => (
          <div
            key={movie._id}
            className="flex-shrink-0 w-[145px] sm:w-[170px] md:w-[190px] xl:w-[210px] snap-start"
          >
            <MovieCard movie={movie} />
          </div>
        ))}
      </div>
    </div>
  );
};
