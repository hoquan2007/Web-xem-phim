import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { MovieListItem } from '@/types/movie';
import { MovieCard } from '@/components/ui/MovieCard';

interface MovieSectionProps {
  title: string;
  icon?: React.ReactNode;
  movies: MovieListItem[];
  viewAllHref?: string;
  limit?: number;
}

export const MovieSection: React.FC<MovieSectionProps> = ({
  title,
  icon,
  movies,
  viewAllHref,
  limit = 12,
}) => {
  const displayMovies = movies.slice(0, limit);

  if (!displayMovies || displayMovies.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          {icon && <span className="text-cyan-400">{icon}</span>}
          <h2 className="text-xl md:text-2xl font-bold tracking-wide text-white">
            {title}
          </h2>
        </div>

        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="group flex items-center gap-1 text-xs md:text-sm font-semibold text-zinc-400 hover:text-cyan-400 transition-colors"
          >
            Xem tất cả
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-5">
        {displayMovies.map((movie) => (
          <MovieCard key={movie._id} movie={movie} />
        ))}
      </div>
    </section>
  );
};
