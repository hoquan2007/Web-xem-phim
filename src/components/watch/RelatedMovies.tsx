'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';
import { MovieListItem } from '@/types/movie';
import { MovieCard } from '@/components/ui/MovieCard';

interface RelatedMoviesProps {
  movies: MovieListItem[];
  title?: string;
}

export const RelatedMovies: React.FC<RelatedMoviesProps> = ({
  movies,
  title = 'Có thể bạn thích',
}) => {
  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 pt-6">
      <div className="flex items-center gap-2 border-l-4 border-cyan-400 pl-3">
        <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />
        <h2 className="text-lg sm:text-xl font-bold text-white uppercase tracking-wide">
          {title}
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {movies.slice(0, 12).map((movie) => (
          <MovieCard key={movie._id || movie.slug} movie={movie} aspectRatio="portrait" />
        ))}
      </div>
    </section>
  );
};
