import React from 'react';
import { HeroBannerSkeleton, TopicCardsSkeleton, GridSkeleton } from '@/components/ui/Skeleton';

export default function GlobalLoading() {
  return (
    <div className="min-h-screen bg-[#0d0f18] text-slate-100 font-sans pb-16">
      {/* Hero Banner Skeleton */}
      <HeroBannerSkeleton />

      {/* Main Container */}
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12 pt-6 sm:pt-8 space-y-10">
        <TopicCardsSkeleton />
        <GridSkeleton count={12} title="Đang tải danh sách phim..." />
      </div>
    </div>
  );
}
