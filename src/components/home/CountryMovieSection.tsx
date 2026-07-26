'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { MovieListItem } from '@/types/movie';
import { MovieCard } from '@/components/ui/MovieCard';

export interface CountryGroup {
  id: string;
  title: string;
  viewAllHref: string;
  movies: MovieListItem[];
}

interface CountryMovieSectionProps {
  groups: CountryGroup[];
}

export const CountryMovieSection: React.FC<CountryMovieSectionProps> = ({ groups }) => {
  return (
    <div className="w-full rounded-3xl bg-[#171925]/90 border border-white/5 p-4 sm:p-6 lg:p-8 space-y-8 sm:space-y-10 shadow-2xl backdrop-blur-md">
      {groups.map((group) => (
        <CountryMovieRow key={group.id} group={group} />
      ))}
    </div>
  );
};

interface CountryMovieRowProps {
  group: CountryGroup;
}

const CountryMovieRow: React.FC<CountryMovieRowProps> = ({ group }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({
        left: 400,
        behavior: 'smooth',
      });
    }
  };

  if (!group.movies || group.movies.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center border-b border-white/5 last:border-b-0 pb-8 last:pb-0">
      {/* Left Sidebar Title Block */}
      <div className="lg:col-span-3 flex lg:flex-col justify-between items-start space-y-1 lg:space-y-3">
        <div>
          <h3 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-rose-300 to-purple-300 leading-snug">
            {group.title}
          </h3>
        </div>
        <Link
          href={group.viewAllHref}
          className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-slate-400 hover:text-cyan-400 transition-colors group mt-1"
        >
          <span>Xem toàn bộ</span>
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Right Horizontal Movie Slider Block */}
      <div className="lg:col-span-9 relative group/slider">
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-3.5 sm:gap-4 overflow-x-auto scrollbar-none py-1 scroll-smooth"
        >
          {group.movies.slice(0, 10).map((movie) => (
            <div
              key={movie._id}
              className="flex-none w-[170px] sm:w-[200px] lg:w-[215px]"
            >
              <MovieCard movie={movie} aspectRatio="landscape" />
            </div>
          ))}
        </div>

        {/* Scroll Right Navigation Arrow Button */}
        <button
          onClick={handleScrollRight}
          aria-label="Scroll right"
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white text-slate-950 shadow-2xl transition-all duration-300 hover:bg-cyan-400 hover:scale-110 active:scale-95 border border-slate-200"
        >
          <ChevronRight className="h-6 w-6 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
