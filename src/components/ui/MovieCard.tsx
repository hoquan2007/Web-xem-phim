'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Play, Star } from 'lucide-react';
import { MovieListItem } from '@/types/movie';
import { getImageUrl } from '@/lib/api';

interface MovieCardProps {
  movie: MovieListItem;
  aspectRatio?: 'portrait' | 'landscape';
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, aspectRatio = 'landscape' }) => {
  const [imgSrc, setImgSrc] = useState<string>(
    getImageUrl(aspectRatio === 'landscape' ? movie.thumb_url || movie.poster_url : movie.poster_url || movie.thumb_url)
  );

  const voteAverage = movie.tmdb?.vote_average ? parseFloat(movie.tmdb.vote_average).toFixed(1) : null;

  // Format episode badge (e.g. "PĐ. 12", "PĐ. Full", "HD")
  const episodeBadge = movie.episode_current
    ? movie.episode_current.replace(/Tập\s*/i, 'PĐ. ')
    : movie.quality || 'HD';

  return (
    <Link
      href={`/phim/${movie.slug}`}
      className="group relative block overflow-hidden rounded-2xl bg-slate-900/60 border border-white/5 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-cyan-500/10 hover:border-white/20"
    >
      {/* Image Container */}
      <div
        className={`relative w-full overflow-hidden bg-slate-950 ${
          aspectRatio === 'landscape' ? 'aspect-[16/10]' : 'aspect-[2/3]'
        }`}
      >
        <img
          src={imgSrc}
          alt={movie.name}
          onError={() => setImgSrc('/images/placeholder.webp')}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Dark Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-85" />

        {/* Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 scale-75">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/40 transition-transform duration-300 group-hover:scale-110">
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Badges Overlay (Bottom Left Badge like RoPhim: PĐ. 12 / PĐ. Full) */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 pointer-events-none z-10">
          <span className="rounded-md bg-slate-900/80 px-2 py-0.5 text-[10px] sm:text-[11px] font-bold text-slate-200 backdrop-blur-md border border-white/15 shadow">
            {episodeBadge}
          </span>
          {voteAverage && parseFloat(voteAverage) > 0 && (
            <span className="flex items-center gap-0.5 rounded-md bg-emerald-500/90 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-slate-950 backdrop-blur-md shadow">
              <Star className="h-3 w-3 fill-slate-950 text-slate-950" />
              {voteAverage}
            </span>
          )}
        </div>
      </div>

      {/* Content Info */}
      <div className="p-3">
        <h3
          className="line-clamp-1 text-xs sm:text-sm font-bold text-slate-100 group-hover:text-cyan-400 transition-colors"
          title={movie.name}
        >
          {movie.name}
        </h3>
        <p
          className="line-clamp-1 mt-0.5 text-[11px] sm:text-xs text-slate-400 font-medium"
          title={movie.origin_name}
        >
          {movie.origin_name || movie.name}
        </p>
      </div>
    </Link>
  );
};

