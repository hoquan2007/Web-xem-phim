import React from 'react';
import { GridSkeleton } from '@/components/ui/Skeleton';

export default function TuPhimLoading() {
  return (
    <main className="w-full min-h-screen pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-10 xl:px-12 bg-slate-950">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="h-28 rounded-3xl bg-slate-900/60 border border-white/5 animate-pulse" />
        <GridSkeleton count={12} />
      </div>
    </main>
  );
}
