import React from 'react';
import { GridSkeleton } from '@/components/ui/Skeleton';

export default function CountryLoading() {
  return (
    <main className="min-h-screen bg-slate-950 pt-24 pb-16">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12">
        <GridSkeleton count={24} title="Đang tải phim theo quốc gia..." />
      </div>
    </main>
  );
}
