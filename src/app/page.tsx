import React from 'react';
import { getLatestMovies, getMoviesByCountry } from '@/lib/api';
import { HeroBanner } from '@/components/home/HeroBanner';
import { TopicCardsRow } from '@/components/home/TopicCardsRow';
import { CountryMovieSection, CountryGroup } from '@/components/home/CountryMovieSection';
import { ScrollToTop } from '@/components/ui/ScrollToTop';

export const revalidate = 300; // Cache page for 5 minutes

export default async function Home() {
  // Fetch data in parallel from VSMOV API
  const [latestRes, koreaRes, chinaRes, usukRes] = await Promise.all([
    getLatestMovies(1),
    getMoviesByCountry('han-quoc', 1),
    getMoviesByCountry('trung-quoc', 1),
    getMoviesByCountry('au-my', 1),
  ]);

  const latestMovies = latestRes.items || [];
  const koreaMovies = koreaRes.items || [];
  const chinaMovies = chinaRes.items || [];
  const usukMovies = usukRes.items || [];

  const countryGroups: CountryGroup[] = [
    {
      id: 'korea',
      title: 'Phim Hàn Quốc mới',
      viewAllHref: '/quoc-gia/han-quoc',
      movies: koreaMovies,
    },
    {
      id: 'china',
      title: 'Phim Trung Quốc mới',
      viewAllHref: '/quoc-gia/trung-quoc',
      movies: chinaMovies,
    },
    {
      id: 'usuk',
      title: 'Phim US-UK mới',
      viewAllHref: '/quoc-gia/au-my',
      movies: usukMovies,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d0f18] text-slate-100 font-sans antialiased pb-16">
      {/* 1. Full-Bleed Edge-to-Edge Hero Banner Slider */}
      {latestMovies.length > 0 && <HeroBanner movies={latestMovies} />}

      {/* 2. Main Sections Container */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-8 sm:space-y-10">
        {/* Section 1: "Bạn đang quan tâm gì?" Topic Cards */}
        <TopicCardsRow />

        {/* Section 2: Country Movie Rows Container (Hàn Quốc, Trung Quốc, US-UK) */}
        <CountryMovieSection groups={countryGroups} />
      </div>

      {/* 3. Scroll To Top Button */}
      <ScrollToTop />
    </div>
  );
}

