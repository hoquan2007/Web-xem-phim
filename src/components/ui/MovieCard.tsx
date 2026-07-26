'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Play, Calendar, Star } from 'lucide-react';
import { MovieListItem } from '@/types/movie';
import { getImageUrl } from '@/lib/api';

interface MovieCardProps {
  movie: MovieListItem;
  aspectRatio?: 'portrait' | 'landscape';
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, aspectRatio = 'portrait' }) => {
  const [imgSrc, setImgSrc] = useState<string>(
    getImageUrl(aspectRatio === 'landscape' ? movie.thumb_url || movie.poster_url : movie.poster_url || movie.thumb_url)
  );

  const voteAverage = movie.tmdb?.vote_average ? parseFloat(movie.tmdb.vote_average).toFixed(1) : null;

  return (
    <Link
      href={`/phim/${movie.slug}`}
      className="group relative block overflow-hidden rounded-xl bg-zinc-900/80 border border-white/5 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-cyan-500/20 hover:border-cyan-500/30"
    >
      {/* Image Container */}
      <div
        className={`relative w-full overflow-hidden bg-zinc-950 ${
          aspectRatio === 'landscape' ? 'aspect-video' : 'aspect-[2/3]'
        }`}
      >
        <img
          src={imgSrc}
          alt={movie.name}
          onError={() => setImgSrc('/images/placeholder.webp')}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Dark Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-90" />

        {/* Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 scale-75">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500/90 text-black shadow-lg shadow-cyan-500/50 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
            <Play className="h-6 w-6 fill-current ml-0.5" />
          </div>
        </div>

        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
          {/* Year Badge */}
          {movie.year && (
            <span className="flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-zinc-200 backdrop-blur-md border border-white/10">
              <Calendar className="h-3 w-3 text-cyan-400" />
              {movie.year}
            </span>
          )}

          {/* Rating Badge */}
          {voteAverage && parseFloat(voteAverage) > 0 && (
            <span className="flex items-center gap-1 rounded-md bg-amber-500/80 px-1.5 py-0.5 text-[11px] font-bold text-black backdrop-blur-md">
              <Star className="h-3 w-3 fill-current" />
              {voteAverage}
            </span>
          )}
        </div>
      </div>

      {/* Content Info */}
      <div className="p-3">
        <h3
          className="line-clamp-1 text-sm font-semibold text-zinc-100 group-hover:text-cyan-400 transition-colors"
          title={movie.name}
        >
          {movie.name}
        </h3>
        <p
          className="line-clamp-1 mt-0.5 text-xs text-zinc-400 font-normal"
          title={movie.origin_name}
        >
          {movie.origin_name || movie.name}
        </p>
      </div>
    </Link>
  );
};
