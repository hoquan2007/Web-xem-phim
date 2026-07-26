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
      className="relative w-full h-[520px] md:h-[640px] lg:h-[700px] overflow-hidden bg-black group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image Banner */}
      <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
        <img
          key={currentMovie._id}
          src={bgImage}
          alt={currentMovie.name}
          className="h-full w-full object-cover object-top opacity-95 transition-transform duration-700 hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/placeholder.webp';
          }}
        />

        {/* Elegant Subtle Overlay Gradients (Ensures high transparency & clear artwork) */}
        {/* Top gradient for navbar contrast */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />

        {/* Left gradient for text readability (fades softly to transparent across middle) */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent/10 md:w-3/4 pointer-events-none" />

        {/* Bottom gradient for smooth transition to content */}
        <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />
      </div>

      {/* Content Container (Constrained width inside full-width banner) */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-10 md:pb-16">
        <div className="max-w-2xl space-y-3">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="rounded-full bg-cyan-500/30 border border-cyan-500/50 px-3.5 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md shadow-sm">
              🔥 Phim Nổi Bật
            </span>
            {currentMovie.year && (
              <span className="flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-zinc-200 backdrop-blur-md border border-white/15">
                <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                {currentMovie.year}
              </span>
            )}
            {voteAverage && parseFloat(voteAverage) > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/30 border border-amber-500/50 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur-md">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                TMDB {voteAverage}
              </span>
            )}
          </div>

          {/* Movie Title */}
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight drop-shadow-lg">
            {currentMovie.name}
          </h1>
          <p className="text-sm md:text-lg text-zinc-300 font-medium line-clamp-1 drop-shadow">
            {currentMovie.origin_name}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 pt-3">
            <Link
              href={`/phim/${currentMovie.slug}`}
              className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3.5 text-sm md:text-base font-bold text-black shadow-xl shadow-cyan-500/30 transition-all hover:scale-105 hover:shadow-cyan-500/50 active:scale-95"
            >
              <Play className="h-5 w-5 fill-current" />
              Xem Phim Ngay
            </Link>
            <Link
              href={`/phim/${currentMovie.slug}`}
              className="flex items-center gap-2.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 px-6 py-3.5 text-sm md:text-base font-semibold text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95"
            >
              <Info className="h-5 w-5" />
              Thông Tin Chi Tiết
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Controls (Prev/Next) */}
      <button
        onClick={handlePrev}
        aria-label="Previous Slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md border border-white/15 opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-110"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        onClick={handleNext}
        aria-label="Next Slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md border border-white/15 opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-110"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 right-6 md:right-12 z-30 flex items-center gap-2">
        {featuredMovies.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            aria-label={`Go to slide ${idx + 1}`}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              idx === currentIndex
                ? 'w-8 bg-cyan-400 shadow-md shadow-cyan-500/50'
                : 'w-2.5 bg-white/40 hover:bg-white/80'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
