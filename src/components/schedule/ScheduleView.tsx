'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, Play, Tv } from 'lucide-react';
import { MovieListItem } from '@/types/movie';
import { getImageUrl, getImageFallbackChain } from '@/lib/api';
import { SafeImage } from '@/components/ui/SafeImage';

interface ScheduleViewProps {
  latestMovies: MovieListItem[];
  seriesMovies: MovieListItem[];
}

const DAYS_OF_WEEK = [
  { id: 'mon', label: 'Thứ Hai', short: 'T2' },
  { id: 'tue', label: 'Thứ Ba', short: 'T3' },
  { id: 'wed', label: 'Thứ Tư', short: 'T4' },
  { id: 'thu', label: 'Thứ Năm', short: 'T5' },
  { id: 'fri', label: 'Thứ Sáu', short: 'T6' },
  { id: 'sat', label: 'Thứ Bảy', short: 'T7' },
  { id: 'sun', label: 'Chủ Nhật', short: 'CN' },
];

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  latestMovies,
  seriesMovies,
}) => {
  // Default active tab to current day of the week
  const currentDayIndex = new Date().getDay(); // 0 = Sun, 1 = Mon...
  const initialDayId = DAYS_OF_WEEK[(currentDayIndex + 6) % 7].id; // Map to mon..sun
  const [activeDay, setActiveDay] = useState(initialDayId);

  // Phân bổ phim vào 7 ngày theo chỉ số (round-robin) — không phải lịch chiếu thật
  // từ API. Phục vụ UX "có cảm giác lịch" trên trang `/lich-chieu`; người dùng
  // nên xem đây là danh sách phim theo ngày, không phải lịch phát sóng chính thức.
  const allMovies = [...seriesMovies, ...latestMovies];

  const getDayMovies = (dayId: string) => {
    const dayIndex = DAYS_OF_WEEK.findIndex((d) => d.id === dayId);
    return allMovies.filter((_, idx) => idx % 7 === dayIndex);
  };

  const currentMovies = getDayMovies(activeDay);

  return (
    <div className="w-full space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-white/10 p-6 sm:p-10 shadow-2xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full text-xs font-black uppercase tracking-wider border border-amber-400/30">
            <Calendar className="w-3.5 h-3.5" /> Phim Mới Theo Ngày
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Phim Mới Cập Nhật Theo Ngày Trong Tuần
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            HNQ Movie gom các phim bộ, anime và series dài tập mới cập nhật theo từng ngày trong tuần để bạn tiện theo dõi. Chọn ngày để xem danh sách phim mới nhất của ngày đó.
          </p>
          {/* FIX-9.1a.4: Disclaimer — dữ liệu không phải lịch phát sóng chính thức
              từ nhà cung cấp, mà là round-robin theo vị trí trong danh sách. */}
          <p className="text-[11px] sm:text-xs text-amber-200/70 italic">
            Lưu ý: đây là cách phân bổ phim theo ngày do HNQ Movie tổng hợp, không phải lịch phát sóng chính thức của nhà sản xuất.
          </p>
        </div>
      </div>

      {/* Days Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
        {DAYS_OF_WEEK.map((day) => {
          const isActive = activeDay === day.id;
          const count = getDayMovies(day.id).length;

          return (
            <button
              key={day.id}
              onClick={() => setActiveDay(day.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black transition-all shrink-0 border ${
                isActive
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-400/20 scale-105'
                  : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{day.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-slate-950/30 text-slate-950' : 'bg-slate-800 text-amber-400'
                }`}
              >
                {count} phim
              </span>
            </button>
          );
        })}
      </div>

      {/* Scheduled Movies Grid */}
      {currentMovies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {currentMovies.map((movie) => {
            const posterSrc = getImageUrl(movie.poster_url || movie.thumb_url);
            const posterFallback = getImageFallbackChain(posterSrc);
            return (
              <Link
                key={movie._id}
                href={`/phim/${movie.slug}`}
                className="group relative bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl hover:border-amber-400/40 transition-all duration-300 flex flex-col"
              >
                {/* Poster */}
                <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-950">
                  <SafeImage
                    src={posterSrc}
                    fallbackUrls={posterFallback}
                    alt={movie.name}
                    fill
                    sizes="(min-width: 1280px) 16vw, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Hover Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950/40 backdrop-blur-[2px]">
                    <div className="w-10 h-10 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl">
                      <Play className="w-4 h-4 fill-slate-950 ml-0.5" />
                    </div>
                  </div>

                  {/* Episode Badge Bottom */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-emerald-500 text-slate-950 text-[10px] font-black rounded-md uppercase tracking-wider shadow-md">
                      {movie.episode_current || 'Tập Mới'}
                    </span>
                  </div>
                </div>

                {/* Meta Details */}
                <div className="p-3 space-y-1">
                  <h3 className="text-xs font-bold text-slate-100 group-hover:text-amber-400 transition-colors line-clamp-1">
                    {movie.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    {movie.origin_name}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
          <Tv className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-300">Chưa có phim mới cho ngày này</h3>
          <p className="text-xs text-slate-500">Vui lòng chọn ngày khác trong tuần hoặc xem danh sách tổng hợp</p>
        </div>
      )}
    </div>
  );
};
