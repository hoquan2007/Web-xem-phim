'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Play, Info, ChevronLeft, ChevronRight, Star, Calendar } from 'lucide-react';
import { MovieListItem } from '@/types/movie';
import { getImageUrl } from '@/lib/api';

interface HeroBannerProps {
  movies: MovieListItem[];
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ movies }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const featuredMovies = movies.slice(0, 6);

  const handleNext = useCallback(() => {
    if (featuredMovies.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
  }, [featuredMovies.length]);

  const handlePrev = useCallback(() => {
    if (featuredMovies.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length);
  }, [featuredMovies.length]);

  // Autoplay timer
  useEffect(() => {
    if (isHovered || featuredMovies.length <= 1) return;

    const timer = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(timer);
  }, [isHovered, handleNext, featuredMovies.length]);

  if (!featuredMovies || featuredMovies.length === 0) {
    return null;
  }

  const currentMovie = featuredMovies[currentIndex];
  const bgImage = getImageUrl(currentMovie.thumb_url || currentMovie.poster_url);
  const voteAverage = currentMovie.tmdb?.vote_average
    ? parseFloat(currentMovie.tmdb.vote_average).toFixed(1)
    : null;

  return (
    <div
      className="relative w-full h-[500px] md:h-[600px] overflow-hidden rounded-3xl bg-zinc-950 border border-white/10 shadow-2xl group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image Banner */}
      <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
        <img
          key={currentMovie._id}
          src={bgImage}
          alt={currentMovie.name}
          className="h-full w-full object-cover object-top animate-fade-in"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/placeholder.webp';
          }}
        />
        {/* Cinema Dark Overlay Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 flex h-full flex-col justify-end p-6 md:p-12 max-w-3xl">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="rounded-full bg-cyan-500/20 border border-cyan-500/40 px-3 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md">
            🔥 Phim Nổi Bật
          </span>
          {currentMovie.year && (
            <span className="flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-zinc-300 backdrop-blur-md border border-white/10">
              <Calendar className="h-3 w-3 text-cyan-400" />
              {currentMovie.year}
            </span>
          )}
          {voteAverage && parseFloat(voteAverage) > 0 && (
            <span className="flex items-center gap-1 rounded-full bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur-md">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              TMDB {voteAverage}
            </span>
          )}
        </div>

        {/* Movie Title */}
        <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
          {currentMovie.name}
        </h1>
        <p className="text-sm md:text-base text-zinc-400 font-medium mt-1 mb-6 line-clamp-1">
          {currentMovie.origin_name}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={`/phim/${currentMovie.slug}`}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-bold text-black shadow-lg shadow-cyan-500/30 transition-all hover:scale-105 hover:shadow-cyan-500/50 active:scale-95"
          >
            <Play className="h-5 w-5 fill-current" />
            Xem Phim Ngay
          </Link>
          <Link
            href={`/phim/${currentMovie.slug}`}
            className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95"
          >
            <Info className="h-5 w-5" />
            Thông Tin Chi Tiết
          </Link>
        </div>
      </div>

      {/* Navigation Controls (Prev/Next) */}
      <button
        onClick={handlePrev}
        aria-label="Previous Slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-110"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        onClick={handleNext}
        aria-label="Next Slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-110"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2">
        {featuredMovies.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              idx === currentIndex
                ? 'w-8 bg-cyan-400 shadow-md shadow-cyan-500/50'
                : 'w-2.5 bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
