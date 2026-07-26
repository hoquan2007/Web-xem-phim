'use client';

import React from 'react';

/**
 * Single Movie Card Skeleton
 */
export const MovieCardSkeleton: React.FC<{ aspectRatio?: 'portrait' | 'landscape' }> = ({
  aspectRatio = 'portrait',
}) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-slate-900/60 border border-white/5 p-0 animate-pulse">
      <div
        className={`w-full bg-slate-800/60 ${
          aspectRatio === 'landscape' ? 'aspect-[16/10]' : 'aspect-[2/3]'
        }`}
      />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-slate-800 rounded-md w-4/5" />
        <div className="h-3 bg-slate-800/60 rounded-md w-3/5" />
      </div>
    </div>
  );
};

/**
 * Grid of Movie Card Skeletons
 */
export const GridSkeleton: React.FC<{ count?: number; title?: string }> = ({
  count = 18,
  title,
}) => {
  return (
    <div className="w-full space-y-6">
      {title && (
        <div className="h-7 w-48 bg-slate-800 rounded-lg animate-pulse" />
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
        {Array.from({ length: count }).map((_, index) => (
          <MovieCardSkeleton key={index} aspectRatio="portrait" />
        ))}
      </div>
    </div>
  );
};

/**
 * Hero Banner Slider Skeleton
 */
export const HeroBannerSkeleton: React.FC = () => {
  return (
    <div className="relative w-full h-[60vh] sm:h-[75vh] lg:h-[85vh] min-h-[480px] max-h-[750px] bg-slate-950 overflow-hidden animate-pulse">
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40 z-10" />
      
      {/* Content Skeleton */}
      <div className="relative z-20 h-full w-full px-4 sm:px-6 lg:px-10 xl:px-12 flex flex-col justify-end pb-12 sm:pb-16 max-w-4xl space-y-4">
        {/* Badge Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="h-6 w-16 bg-slate-800 rounded-md" />
          <div className="h-6 w-12 bg-slate-800/80 rounded-md" />
          <div className="h-6 w-20 bg-slate-800/60 rounded-md" />
        </div>
        
        {/* Title */}
        <div className="space-y-2">
          <div className="h-10 sm:h-14 w-3/4 bg-slate-800 rounded-xl" />
          <div className="h-6 w-1/2 bg-slate-800/70 rounded-lg" />
        </div>
        
        {/* Description */}
        <div className="space-y-2 pt-2">
          <div className="h-4 w-full bg-slate-800/50 rounded" />
          <div className="h-4 w-4/5 bg-slate-800/40 rounded" />
        </div>
        
        {/* Buttons */}
        <div className="flex items-center gap-4 pt-4">
          <div className="h-12 w-36 bg-amber-500/30 rounded-xl" />
          <div className="h-12 w-32 bg-slate-800 rounded-xl" />
        </div>
      </div>
    </div>
  );
};

/**
 * Topic Cards Row Skeleton
 */
export const TopicCardsSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 my-6">
      <div className="h-6 w-44 bg-slate-800 rounded-lg animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-24 sm:h-28 rounded-2xl bg-slate-900/60 border border-white/5 animate-pulse p-4 flex flex-col justify-between"
          >
            <div className="h-4 w-1/2 bg-slate-800 rounded" />
            <div className="h-5 w-3/4 bg-slate-800/70 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Movie Detail & Player Skeleton
 */
export const MovieDetailSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-pulse pt-4">
      {/* Breadcrumb Skeleton */}
      <div className="h-4 w-48 bg-slate-800 rounded" />

      {/* Video Player 16:9 Skeleton */}
      <div className="w-full aspect-video rounded-3xl bg-slate-900/80 border border-white/10 overflow-hidden relative">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-slate-700" />
          </div>
          <div className="h-4 w-32 bg-slate-800 rounded" />
        </div>
      </div>

      {/* Controls & Server selector Skeleton */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-white/5 space-y-4">
        <div className="h-6 w-40 bg-slate-800 rounded" />
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-amber-500/20 rounded-xl" />
          <div className="h-10 w-28 bg-slate-800 rounded-xl" />
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-12 gap-2 pt-4">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="h-10 bg-slate-800/60 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Movie Info Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6 sm:p-8 rounded-3xl bg-slate-900/40 border border-white/5">
        <div className="aspect-[2/3] w-full rounded-2xl bg-slate-800" />
        <div className="md:col-span-2 space-y-4">
          <div className="h-8 w-2/3 bg-slate-800 rounded-lg" />
          <div className="h-5 w-1/3 bg-slate-800/60 rounded" />
          <div className="flex gap-2 pt-2">
            <div className="h-6 w-16 bg-slate-800 rounded" />
            <div className="h-6 w-16 bg-slate-800 rounded" />
            <div className="h-6 w-16 bg-slate-800 rounded" />
          </div>
          <div className="space-y-2 pt-4">
            <div className="h-4 w-full bg-slate-800/50 rounded" />
            <div className="h-4 w-full bg-slate-800/50 rounded" />
            <div className="h-4 w-3/4 bg-slate-800/40 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};
