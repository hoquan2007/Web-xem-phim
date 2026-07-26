import React from 'react';
import { MovieDetailSkeleton } from '@/components/ui/Skeleton';

export default function MovieDetailLoading() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 sm:px-6 lg:px-10 xl:px-12 pt-24 pb-16">
      <MovieDetailSkeleton />
    </main>
  );
}
