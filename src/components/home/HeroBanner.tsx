'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Play, Info, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { MovieListItem } from '@/types/movie';
import { getImageUrl } from '@/lib/api';

interface HeroBannerProps {
  movies: MovieListItem[];
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ movies }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

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
    : '7.0';

  return (
    <div
      className="relative w-full h-[540px] sm:h-[620px] lg:h-[720px] overflow-hidden bg-slate-950 group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Image Banner */}
      <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
        <img
          key={currentMovie._id}
          src={bgImage}
          alt={currentMovie.name}
          className="h-full w-full object-cover object-center opacity-90 transition-transform duration-700 hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/images/placeholder.webp';
          }}
        />

        {/* Top gradient for Navbar contrast */}
        <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent pointer-events-none" />

        {/* Left gradient for content text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-transparent/10 md:w-3/4 pointer-events-none" />

        {/* Bottom gradient for smooth transition */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none" />
      </div>

      {/* Hero Main Content Container */}
      <div className="relative z-20 w-full px-4 sm:px-6 lg:px-10 xl:px-12 h-full flex flex-col justify-end pb-12 sm:pb-16 lg:pb-20">
        <div className="max-w-2xl space-y-4">
          {/* Movie Title & Logo Text */}
          <div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow-2xl uppercase">
              {currentMovie.name}
            </h1>
            <p className="text-sm sm:text-base text-amber-400/90 font-medium mt-1 drop-shadow">
              {currentMovie.origin_name}
            </p>
          </div>

          {/* RoPhim Style Badges Row: IMDb 7.0 | 4K | T12 | 2022 | Phần 1 | Tập 8 | Category */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* IMDb Rating Badge */}
            <span className="rounded-md bg-amber-400 px-2.5 py-0.5 text-xs font-black text-slate-950 shadow-md">
              IMDb {voteAverage}
            </span>

            {/* 4K Badge */}
            <span className="rounded-md bg-amber-400 px-2 py-0.5 text-xs font-black text-slate-950 shadow-md">
              4K
            </span>

            {/* Age Badge */}
            <span className="rounded-md bg-slate-900/80 border border-white/20 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-md">
              T12
            </span>

            {/* Year Badge */}
            {currentMovie.year && (
              <span className="rounded-md bg-slate-900/80 border border-white/20 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-md">
                {currentMovie.year}
              </span>
            )}

            {/* Season/Part Badge */}
            <span className="rounded-md bg-slate-900/80 border border-white/20 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-md">
              Phần 1
            </span>

            {/* Episode Badge */}
            <span className="rounded-md bg-slate-900/80 border border-white/20 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-md">
              {currentMovie.episode_current || 'Tập Full'}
            </span>

            {/* Category Tag */}
            <span className="rounded-md bg-slate-800/90 border border-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-300 backdrop-blur-md">
              Phim Nổi Bật
            </span>
          </div>

          {/* Description snippet */}
          <p className="text-xs sm:text-sm text-slate-300/90 font-normal line-clamp-2 sm:line-clamp-3 leading-relaxed max-w-xl">
            {currentMovie.content
              ? currentMovie.content.replace(/<[^>]*>?/gm, '')
              : `Khám phá ngay bộ phim ${currentMovie.name} (${currentMovie.origin_name}) vietsub chất lượng cao HD 4K trên HNQ!`}
          </p>

          {/* RoPhim Style Action Buttons Row: Big Round Yellow Play | Heart | Info */}
          <div className="flex items-center gap-3.5 pt-2">
            {/* Big Round Yellow Play Button */}
            <Link
              href={`/phim/${currentMovie.slug}`}
              aria-label="Play Movie"
              className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-xl shadow-amber-400/40 transition-all hover:scale-110 hover:bg-amber-300 active:scale-95"
            >
              <Play className="h-6 w-6 sm:h-7 sm:w-7 fill-current ml-0.5" />
            </Link>

            {/* Heart / Bookmark Button */}
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              aria-label="Bookmark Movie"
              className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-md border transition-all hover:scale-105 active:scale-95 ${
                isBookmarked
                  ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30'
                  : 'bg-slate-900/80 text-white border-white/20 hover:bg-slate-800'
              }`}
            >
              <Heart className={`h-5 w-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            {/* Info Button */}
            <Link
              href={`/phim/${currentMovie.slug}`}
              aria-label="Movie Details"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900/80 text-white border border-white/20 backdrop-blur-md transition-all hover:bg-slate-800 hover:scale-105 active:scale-95"
            >
              <Info className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Right Scene/Movie Thumbnail Strip (RoPhim Preview Strip) */}
      <div className="absolute bottom-6 right-4 sm:right-8 lg:right-12 z-30 hidden sm:flex items-center gap-2.5 bg-slate-950/60 p-2 rounded-2xl border border-white/10 backdrop-blur-md shadow-2xl">
        {featuredMovies.map((movie, idx) => {
          const thumb = getImageUrl(movie.thumb_url || movie.poster_url);
          const isActive = idx === currentIndex;
          return (
            <button
              key={movie._id}
              onClick={() => setCurrentIndex(idx)}
              className={`relative h-12 w-20 sm:h-14 sm:w-24 rounded-xl overflow-hidden transition-all duration-300 border-2 ${
                isActive
                  ? 'border-amber-400 scale-105 shadow-lg shadow-amber-400/30 ring-2 ring-amber-400/50'
                  : 'border-transparent opacity-60 hover:opacity-100 hover:scale-100'
              }`}
            >
              <img
                src={thumb}
                alt={movie.name}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/placeholder.webp';
                }}
              />
              {isActive && (
                <div className="absolute inset-0 bg-amber-400/10 pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      {/* Navigation Controls (Prev/Next Arrows on hover) */}
      <button
        onClick={handlePrev}
        aria-label="Previous Slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-slate-950/70 text-white backdrop-blur-md border border-white/15 opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-950 hover:scale-110"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <button
        onClick={handleNext}
        aria-label="Next Slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-slate-950/70 text-white backdrop-blur-md border border-white/15 opacity-0 group-hover:opacity-100 transition-all hover:bg-slate-950 hover:scale-110"
      >
        <ChevronRight className="h-6 w-6" />
      </button>
    </div>
  );
};

