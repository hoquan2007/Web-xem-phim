import React from 'react';
import { Metadata } from 'next';
import { getLatestMovies, getFilteredMovies } from '@/lib/api';
import { ScheduleView } from '@/components/schedule/ScheduleView';

export const metadata: Metadata = {
  title: 'Lịch Chiếu Phim Hàng Ngày | HNQ Movie',
  description:
    'Theo dõi lịch phát sóng các tập phim mới nhất, phim bộ hot Hàn Quốc, Trung Quốc, Anime mỗi ngày trên HNQ Movie.',
};

export const revalidate = 300;

export default async function SchedulePage() {
  const [latestRes, seriesRes] = await Promise.all([
    getLatestMovies(1),
    getFilteredMovies({ type: 'series', limit: 20 }),
  ]);

  const latestMovies = latestRes.items || [];
  const seriesMovies = seriesRes.items || [];

  return (
    <main className="min-h-screen bg-[#0d0f18] text-slate-100 font-sans pt-24 pb-16">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12">
        <ScheduleView latestMovies={latestMovies} seriesMovies={seriesMovies} />
      </div>
    </main>
  );
}
