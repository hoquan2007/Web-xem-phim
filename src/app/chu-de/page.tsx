import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, Film, Flame, Heart, Zap, Shield, Compass, ArrowRight } from 'lucide-react';
import { getFilteredMovies } from '@/lib/api';
import { MovieCard } from '@/components/ui/MovieCard';

export const metadata: Metadata = {
  title: 'Chủ Đề & Bộ Sưu Tập Phim Nổi Bật | HNQ Movie',
  description:
    'Khám phá danh sách các bộ sưu tập phim tuyển chọn đặc sắc: Marvel Universe, Anime Nhật Bản, Cổ Trang Trung Quốc, Phim Chữa Lành...',
};

export const revalidate = 300;

interface TopicItem {
  id: string;
  title: string;
  subtitle: string;
  gradient: string;
  icon: React.ReactNode;
  href: string;
  filterType?: string;
  filterCategory?: string;
  filterCountry?: string;
}

const TOPICS: TopicItem[] = [
  {
    id: 'marvel',
    title: 'Marvel Universe & Siêu Anh Hùng',
    subtitle: 'Vũ trụ điện ảnh Marvel bom tấn hành động đỉnh cao',
    gradient: 'from-red-600 via-rose-600 to-amber-600',
    icon: <Shield className="w-6 h-6 text-white" />,
    href: '/danh-sach?category=hanh-dong',
    filterCategory: 'hanh-dong',
  },
  {
    id: 'anime',
    title: 'Kho Tàng Anime Nhật Bản',
    subtitle: 'Những siêu phẩm Wano, Isekai & Shonen hấp dẫn',
    gradient: 'from-indigo-600 via-purple-600 to-pink-600',
    icon: <Zap className="w-6 h-6 text-white" />,
    href: '/quoc-gia/nhat-ban',
    filterCountry: 'nhat-ban',
  },
  {
    id: 'cotrang',
    title: 'Phim Cổ Trang & Tiên Hiệp',
    subtitle: 'Thế giới kiếm hiệp cổ phong Trung Hoa rực rỡ',
    gradient: 'from-amber-600 via-orange-600 to-red-600',
    icon: <Flame className="w-6 h-6 text-white" />,
    href: '/quoc-gia/trung-quoc',
    filterCountry: 'trung-quoc',
  },
  {
    id: 'chualanh',
    title: 'Phim Chữa Lành & Tình Cảm Hàn Quốc',
    subtitle: 'Những câu chuyện tình yêu ngọt ngào sâu lắng',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    icon: <Heart className="w-6 h-6 text-white" />,
    href: '/quoc-gia/han-quoc',
    filterCountry: 'han-quoc',
  },
  {
    id: 'chieurap',
    title: 'Bom Tấn Chiếu Rạp HD 4K',
    subtitle: 'Tuyển tập phim điện ảnh 1 tập cháy vé rạp chiếu',
    gradient: 'from-blue-600 via-cyan-600 to-teal-600',
    icon: <Film className="w-6 h-6 text-white" />,
    href: '/danh-sach?type=single',
    filterType: 'single',
  },
  {
    id: 'vientuong',
    title: 'Viễn Tưởng & Kỳ Ảo Multiverse',
    subtitle: 'Hành trình du hành vũ trụ và tương lai siêu thực',
    gradient: 'from-purple-600 via-fuchsia-600 to-pink-600',
    icon: <Compass className="w-6 h-6 text-white" />,
    href: '/danh-sach?category=vien-tuong',
    filterCategory: 'vien-tuong',
  },
];

export default async function TopicPage() {
  // Fetch sample movies for topics
  const sampleRes = await getFilteredMovies({ limit: 12 });
  const sampleMovies = sampleRes.items || [];

  return (
    <main className="min-h-screen bg-[#0d0f18] text-slate-100 font-sans pt-24 pb-16">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12 space-y-12">
        {/* Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-950 border border-white/10 p-6 sm:p-10 shadow-2xl">
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-400/20 text-purple-300 rounded-full text-xs font-black uppercase tracking-wider border border-purple-400/30">
              <Sparkles className="w-3.5 h-3.5" /> Chủ Đề Tuyển Chọn
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Bộ Sưu Tập Phim Theo Chủ Đề Hot
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Khám phá không gian điện ảnh phân loại theo vũ trụ siêu anh hùng, anime thế giới mở, cổ trang tiên hiệp và bom tấn chiếu rạp nổi tiếng nhất trên **HNQ Movie**.
            </p>
          </div>
        </div>

        {/* Topic Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOPICS.map((topic) => (
            <Link
              key={topic.id}
              href={topic.href}
              className={`group relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br ${topic.gradient} shadow-2xl border border-white/20 transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between min-h-[180px]`}
            >
              {/* Vignette Shadow */}
              <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors pointer-events-none" />

              <div className="relative z-10 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/20 group-hover:scale-110 transition-transform">
                  {topic.icon}
                </div>
                <h2 className="text-lg font-black text-white tracking-tight leading-snug">
                  {topic.title}
                </h2>
                <p className="text-xs text-white/80 font-medium line-clamp-2">
                  {topic.subtitle}
                </p>
              </div>

              <div className="relative z-10 pt-4 flex items-center gap-1.5 text-xs font-black text-white group-hover:translate-x-1 transition-transform">
                <span>Khám phá ngay</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>

        {/* Preview Movies Showcase */}
        {sampleMovies.length > 0 && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400 fill-amber-400" />
                  Phim Đang Hot Trong Bộ Sưu Tập
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  Cập nhật các tập phim lượt xem nhiều nhất từ các chủ đề
                </p>
              </div>
              <Link
                href="/danh-sach"
                className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
              >
                Xem tất cả &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
              {sampleMovies.map((movie) => (
                <MovieCard key={movie._id} movie={movie} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
