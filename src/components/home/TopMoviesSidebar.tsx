'use client';

import React from 'react';
import Link from 'next/link';
import { Trophy, Star, Eye } from 'lucide-react';
import { MovieListItem } from '@/types/movie';
import { getImageUrl } from '@/lib/api';

interface TopMoviesSidebarProps {
  movies: MovieListItem[];
  title?: string;
}

export const TopMoviesSidebar: React.FC<TopMoviesSidebarProps> = ({
  movies,
  title = 'Bảng Xếp Hạng Top Phim',
}) => {
  const topMovies = movies.slice(0, 10);

  if (!topMovies || topMovies.length === 0) {
    return null;
  }

  const getRankBadgeStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-extrabold shadow-amber-500/50';
      case 2:
        return 'bg-gradient-to-r from-slate-300 to-zinc-400 text-black font-bold shadow-zinc-400/50';
      case 3:
        return 'bg-gradient-to-r from-amber-600 to-orange-700 text-white font-bold shadow-orange-600/50';
      default:
        return 'bg-white/10 text-zinc-300 font-semibold border border-white/10';
    }
  };

  return (
    <div className="rounded-2xl bg-zinc-900/70 border border-white/10 p-5 backdrop-blur-md shadow-xl space-y-4">
      {/* Title Header */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <Trophy className="h-5 w-5 text-amber-400" />
        <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
      </div>

      {/* Movie List */}
      <div className="space-y-3">
        {topMovies.map((movie, index) => {
          const rank = index + 1;
          const thumbUrl = getImageUrl(movie.thumb_url || movie.poster_url);
          const voteAverage = movie.tmdb?.vote_average
            ? parseFloat(movie.tmdb.vote_average).toFixed(1)
            : null;

          return (
            <Link
              key={movie._id}
              href={`/phim/${movie.slug}`}
              className="group flex items-center gap-3.5 p-2 rounded-xl hover:bg-white/5 transition-all duration-200"
            >
              {/* Rank Badge */}
              <div
                className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg shadow-md ${getRankBadgeStyle(
                  rank
                )}`}
              >
                {rank}
              </div>

              {/* Thumbnail */}
              <div className="relative h-14 w-10 flex-shrink-0 overflow-hidden rounded-md bg-zinc-950">
                <img
                  src={thumbUrl}
                  alt={movie.name}
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/placeholder.webp';
                  }}
                  loading="lazy"
                />
              </div>

              {/* Movie Info */}
              <div className="flex-1 min-w-0">
                <h3 className="line-clamp-1 text-sm font-semibold text-zinc-200 group-hover:text-cyan-400 transition-colors">
                  {movie.name}
                </h3>
                <p className="line-clamp-1 text-xs text-zinc-400 mt-0.5">
                  {movie.origin_name}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                  {movie.year && <span>{movie.year}</span>}
                  {voteAverage && parseFloat(voteAverage) > 0 && (
                    <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                      <Star className="h-3 w-3 fill-current" />
                      {voteAverage}
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
