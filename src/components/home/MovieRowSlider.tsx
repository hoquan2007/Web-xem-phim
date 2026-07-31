import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { MovieCard } from '@/components/ui/MovieCard';
import { MovieListItem } from '@/types/movie';
import MovieRowNavButtons from './MovieRowNavButtons';

interface MovieRowSliderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  viewAllHref?: string;
  movies: MovieListItem[];
  aspectRatio?: 'portrait' | 'landscape';
}

export const MovieRowSlider: React.FC<MovieRowSliderProps> = ({
  title,
  subtitle,
  icon,
  viewAllHref,
  movies,
  aspectRatio = 'portrait',
}) => {
  if (!movies || movies.length === 0) return null;

  // Id ổn định để nút prev/next (Client Component con) truy vấn đúng container
  // mà không cần React ref xuyên qua boundary server/client.
  const sliderId = `movie-row-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;

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

          {/* Navigation Controls — tách thành Client Component con */}
          <MovieRowNavButtons sliderId={sliderId} />
        </div>
      </div>

      {/* Horizontal Scroll Slider với thẻ phim kích thước lớn */}
      <div
        id={sliderId}
        className="flex items-center gap-4 sm:gap-5 overflow-x-auto scrollbar-none py-1.5 scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {movies.map((movie) => (
          <div
            key={movie._id}
            className="flex-shrink-0 w-[170px] sm:w-[200px] md:w-[220px] lg:w-[230px] snap-start"
          >
            <MovieCard movie={movie} aspectRatio={aspectRatio} />
          </div>
        ))}
      </div>
    </div>
  );
};