import React from 'react';
import { Flame, Tv, Film } from 'lucide-react';
import { getLatestMovies, getFilteredMovies } from '@/lib/api';
import { HeroBanner } from '@/components/home/HeroBanner';
import { MovieSection } from '@/components/home/MovieSection';
import { TopMoviesSidebar } from '@/components/home/TopMoviesSidebar';

export const revalidate = 300; // Cache page for 5 minutes

export default async function Home() {
  // Fetch data in parallel
  const [latestRes, seriesRes, singleRes] = await Promise.all([
    getLatestMovies(1),
    getFilteredMovies({ type: 'series', limit: 12 }),
    getFilteredMovies({ type: 'single', limit: 12 }),
  ]);

  const latestMovies = latestRes.items || [];
  const seriesMovies = seriesRes.items || [];
  const singleMovies = singleRes.items || [];

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 space-y-10">
        {/* Hero Slider Banner */}
        {latestMovies.length > 0 && <HeroBanner movies={latestMovies} />}

        {/* Main Content Layout with Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Main Sections */}
          <div className="lg:col-span-3 space-y-10">
            {/* Phim Mới Cập Nhật */}
            <MovieSection
              title="Phim Mới Cập Nhật"
              icon={<Flame className="h-6 w-6 text-amber-500 animate-pulse" />}
              movies={latestMovies}
              viewAllHref="/danh-sach"
              limit={12}
            />

            {/* Phim Bộ Nổi Bật */}
            <MovieSection
              title="Phim Bộ Nổi Bật"
              icon={<Tv className="h-6 w-6 text-cyan-400" />}
              movies={seriesMovies}
              viewAllHref="/danh-sach?type=series"
              limit={12}
            />

            {/* Phim Lẻ Mới Nhất */}
            <MovieSection
              title="Phim Lẻ Mới Nhất"
              icon={<Film className="h-6 w-6 text-purple-400" />}
              movies={singleMovies}
              viewAllHref="/danh-sach?type=single"
              limit={12}
            />
          </div>

          {/* Sidebar Top Movies */}
          <div className="lg:col-span-1 lg:sticky lg:top-24">
            <TopMoviesSidebar movies={latestMovies} title="Top Phim Xem Nhiều" />
          </div>
        </div>
      </div>
    </div>
  );
}
