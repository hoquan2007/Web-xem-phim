import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Play, Star } from 'lucide-react';
import { MovieListItem } from '@/types/movie';
import { getImageUrl } from '@/lib/api';

interface MovieCardProps {
  movie: MovieListItem;
  aspectRatio?: 'portrait' | 'landscape';
  priority?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({
  movie,
  aspectRatio = 'portrait',
  priority = false,
}) => {
  const rawSrc = getImageUrl(
    aspectRatio === 'portrait' ? movie.poster_url || movie.thumb_url : movie.thumb_url || movie.poster_url
  );

  // next/image không hỗ trợ onError setState như <img>. Dùng unoptimized cho placeholder
  // local (file SVG trong /public), KHÔNG ép unoptimized cho ảnh remote CDN — để next/image
  // lo resize/WebP. Fallback placeholder do `getImageUrl` đã trả sẵn nếu upstream lỗi.
  const isLocalFallback = rawSrc.startsWith('/');

  const voteAverage = movie.tmdb?.vote_average ? parseFloat(movie.tmdb.vote_average).toFixed(1) : null;

  const epMatch = movie.episode_current ? movie.episode_current.match(/\d+/) : null;
  const epNum = epMatch ? epMatch[0] : '';
  const isVietsub = !movie.lang || movie.lang.toLowerCase().includes('vietsub');
  const isThuyetMinh = movie.lang && movie.lang.toLowerCase().includes('thuyết minh');

  // sizes tối ưu cho grid: mobile 2 cột ~50vw, tablet 3 cột ~33vw,
  // md 4 cột ~25vw, lg 5 cột ~20vw, xl 6 cột ~16vw.
  const sizes =
    '(min-width: 1280px) 240px, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw';

  return (
    <Link
      href={`/phim/${movie.slug}`}
      className="group relative block overflow-hidden rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-cyan-500/10 hover:border-amber-400/40"
    >
      {/* Image Container */}
      <div
        className={`relative w-full overflow-hidden bg-slate-950 ${
          aspectRatio === 'portrait' ? 'aspect-[2/3]' : 'aspect-[16/10]'
        }`}
      >
        <Image
          src={rawSrc}
          alt={movie.name}
          fill
          sizes={sizes}
          priority={priority}
          unoptimized={isLocalFallback}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Dark Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-75 transition-opacity duration-300 group-hover:opacity-90 pointer-events-none" />

        {/* Hover Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 scale-75">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-xl shadow-amber-400/40 transition-transform duration-300 group-hover:scale-110">
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Badges Overlay on Poster Bottom */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex flex-wrap items-center gap-1 pointer-events-none z-10">
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
          {voteAverage && parseFloat(voteAverage) > 0 && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-black bg-amber-400 text-slate-950 rounded-md shadow-md">
              <Star className="h-3 w-3 fill-slate-950 text-slate-950" />
              {voteAverage}
            </span>
          )}
        </div>
      </div>

      {/* Content Info Below Poster */}
      <div className="p-3">
        <h3
          className="line-clamp-1 text-xs sm:text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors"
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