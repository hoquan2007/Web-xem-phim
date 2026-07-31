import React from 'react';
import {
  getLatestMovies,
  getFilteredMovies,
  getMoviesByCountry,
} from '@/lib/api';
import { HeroBanner } from '@/components/home/HeroBanner';
import { TopicCardsRow } from '@/components/home/TopicCardsRow';
import { MovieRowSlider } from '@/components/home/MovieRowSlider';
import { TopMoviesRankSection } from '@/components/home/TopMoviesRankSection';
import { CountryMovieSection, CountryGroup } from '@/components/home/CountryMovieSection';
import { ScrollToTop } from '@/components/ui/ScrollToTop';
import { Sparkles, Tv, Film } from 'lucide-react';

export const revalidate = 300; // Cache page for 5 minutes

export default async function Home() {
  // Parallel fetch distinct data subsets from VSMOV API
  const [
    latestRes,
    latestPage2Res,
    seriesRes,
    singleRes,
    koreaRes,
    chinaRes,
    usukRes,
    japanRes,
  ] = await Promise.all([
    getLatestMovies(1),
    getLatestMovies(2),
    getFilteredMovies({ type: 'series', page: 2, limit: 14 }),
    getFilteredMovies({ type: 'single', limit: 14 }),
    getMoviesByCountry('han-quoc', 1),
    getMoviesByCountry('trung-quoc', 1),
    getMoviesByCountry('au-my', 1),
    getMoviesByCountry('nhat-ban', 1),
  ]);

  const latestMovies = latestRes.items || [];
  const latestPage2Movies = latestPage2Res.items || [];
  const seriesMovies = seriesRes.items || [];
  const singleMovies = singleRes.items || [];
  const koreaMovies = koreaRes.items || [];
  const chinaMovies = chinaRes.items || [];
  const usukMovies = usukRes.items || [];
  const japanMovies = japanRes.items || [];

  // Deduplicate against the first 5 latest movies to avoid repeated items in series row
  const firstLatestSlugs = new Set(latestMovies.slice(0, 5).map((m) => m.slug));
  const distinctSeriesMovies = seriesMovies.filter((m) => !firstLatestSlugs.has(m.slug));

  // Build unique pools for Top 10 Rank tabs (Day, Week, Month)
  const topDayMovies = latestPage2Movies.length > 0 ? latestPage2Movies : latestMovies.slice(5);
  const topWeekMovies = [...chinaMovies, ...koreaMovies];
  const topMonthMovies = [...singleMovies, ...usukMovies];

  const countryGroups: CountryGroup[] = [
    {
      id: 'korea',
      title: 'Phim Hàn Quốc Quốc Dân',
      viewAllHref: '/quoc-gia/han-quoc',
      movies: koreaMovies,
    },
    {
      id: 'china',
      title: 'Phim Trung Quốc Cổ Trang',
      viewAllHref: '/quoc-gia/trung-quoc',
      movies: chinaMovies,
    },
    {
      id: 'usuk',
      title: 'Phim US-UK Bom Tấn',
      viewAllHref: '/quoc-gia/au-my',
      movies: usukMovies,
    },
    {
      id: 'japan',
      title: 'Anime & Phim Nhật Bản',
      viewAllHref: '/quoc-gia/nhat-ban',
      movies: japanMovies,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d0f18] text-slate-100 font-sans antialiased pb-16">
      {/* 1. Full-Bleed Edge-to-Edge Hero Banner Slider */}
      {latestMovies.length > 0 && <HeroBanner movies={latestMovies} />}

      {/* 2. Main Container tràn 100% viền màn hình */}
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12 pt-6 sm:pt-8 space-y-10 sm:space-y-12">
        {/* Section 1: "Bạn đang quan tâm gì?" Topic Cards */}
        <TopicCardsRow />

        {/* Section 2: "Phim Mới Cập Nhật" Slider (Trang 1 mới cập nhật) */}
        <MovieRowSlider
          id="home-latest-updates"
          title="Phim Mới Cập Nhật"
          subtitle="Danh sách các tập phim và siêu phẩm vừa ra mắt"
          icon={<Sparkles className="w-6 h-6 text-amber-400" />}
          viewAllHref="/danh-sach"
          movies={latestMovies}
        />

        {/* Section 3: "Bảng Xếp Hạng Top View" (Danh sách phim hot riêng biệt cho Ngày, Tuần, Tháng) */}
        <TopMoviesRankSection
          movies={topDayMovies}
          weekMovies={topWeekMovies}
          monthMovies={topMonthMovies}
        />

        {/* Section 4: "Phim Bộ Hot Đang Chiếu" Slider (Phim bộ lọc trang 2, không lặp lại phim đầu trang) */}
        <MovieRowSlider
          id="home-series-hot"
          title="Phim Bộ Hot Đang Chiếu"
          subtitle="Các series phim truyền hình nhiều tập ăn khách nhất"
          icon={<Tv className="w-6 h-6 text-cyan-400" />}
          viewAllHref="/danh-sach?type=series"
          movies={distinctSeriesMovies.length > 0 ? distinctSeriesMovies : seriesMovies}
        />

        {/* Section 5: "Phim Lẻ Chiếu Rạp Bom Tấn" Slider (Phim điện ảnh 1 tập) */}
        <MovieRowSlider
          id="home-single-movies"
          title="Phim Lẻ Chiếu Rạp Bom Tấn"
          subtitle="Phim điện ảnh 1 tập chất lượng cao HD 4K"
          icon={<Film className="w-6 h-6 text-emerald-400" />}
          viewAllHref="/danh-sach?type=single"
          movies={singleMovies}
        />

        {/* Section 6: Country Movie Rows Container (Hàn Quốc, Trung Quốc, US-UK, Nhật Bản) */}
        <CountryMovieSection groups={countryGroups} />
      </div>

      {/* 3. Scroll To Top Button */}
      <ScrollToTop />
    </div>
  );
}
