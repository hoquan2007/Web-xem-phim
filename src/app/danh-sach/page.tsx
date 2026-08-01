import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Film, ChevronRight, Sparkles } from 'lucide-react';
import { getCategories, getCountries, getFilteredMovies } from '@/lib/api';
import { createPageRequestSignal } from '@/lib/api/providers';
import FilterBar from '@/components/filter/FilterBar';
import Pagination from '@/components/filter/Pagination';
import { MovieCard } from '@/components/ui/MovieCard';
import { FilterParams } from '@/types/movie';
import {
  sanitizeSlug,
  sanitizeYear,
  sanitizeSortField,
  sanitizeSortType,
  sanitizeMovieType,
  clampPage,
} from '@/lib/validate';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  // FIX-10.5: validate type before using in metadata.
  const type = sanitizeMovieType(resolvedSearchParams?.type);
  const page = clampPage(resolvedSearchParams?.page, 1, 999);

  let title = 'Danh Sách Phim Khổng Lồ';
  if (type === 'single') title = 'Phim Lẻ Chọn Lọc Mới Nhất';
  if (type === 'series') title = 'Phim Bộ Hấp Dẫn Mới Cập Nhật';

  const fullTitle = `${title} - Trang ${page}`;
  const description = `Khám phá danh sách phim mới nhất, phim bộ, phim lẻ, phim chiếu rạp vietsub thuyết minh chất lượng cao 4K trên HNQ. Trang ${page}`;

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: `${fullTitle} | HNQ`,
      description,
      siteName: 'HNQ - Hồ Ngọc Quân',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${fullTitle} | HNQ`,
      description,
    },
  };
}

export default async function FilterListPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;

  // FIX-10.5: validate ALL search params before passing to upstream.
  // Slugs allowlist to ASCII letters/digits/dash/dot/underscore.
  const category = sanitizeSlug(resolvedSearchParams?.category) ?? '';
  const country = sanitizeSlug(resolvedSearchParams?.country) ?? '';
  // Year limited to 1900..currentYear+1.
  const year = sanitizeYear(resolvedSearchParams?.year) ?? '';
  const type = sanitizeMovieType(resolvedSearchParams?.type) ?? '';
  // Sort field whitelisted to upstream-supported values.
  const sortField = sanitizeSortField(resolvedSearchParams?.sort_field) ?? 'modified.time';
  const sortType = sanitizeSortType(resolvedSearchParams?.sort_type) ?? 'desc';
  const page = clampPage(resolvedSearchParams?.page, 1, 999);

  const filterParams: FilterParams = {
    category,
    country,
    year,
    type,
    sort_field: sortField,
    sort_type: sortType,
    page,
    limit: 24,
  };

  // API-REDESIGN-6: single per-page signal threads through categories /
  // countries / filtered-movies so a stuck upstream can't pin a worker.
  const { signal } = createPageRequestSignal();

  // Concurrent fetching
  const [categories, countries, movieData] = await Promise.all([
    getCategories(signal),
    getCountries(signal),
    getFilteredMovies(filterParams, signal),
  ]);

  const movies = movieData.items || [];
  const pagination = movieData.pagination || {
    totalItems: 0,
    totalItemsPerPage: 24,
    currentPage: 1,
    totalPages: 1,
  };

  // Determine section title
  let sectionTitle = 'Tất Cả Phim';
  if (type === 'single') sectionTitle = 'Danh Sách Phim Lẻ';
  if (type === 'series') sectionTitle = 'Danh Sách Phim Bộ';

  return (
    <main className="min-h-screen bg-slate-950 pt-24 pb-16">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
          <Link href="/" className="hover:text-amber-400 transition-colors">
            Trang Chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-200">{sectionTitle}</span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Film className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
                {sectionTitle}
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Hiển thị {pagination.totalItems > 0 ? pagination.totalItems : movies.length} kết quả phù hợp
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <FilterBar
          categories={categories}
          countries={countries}
          currentFilters={filterParams}
          baseUrl="/danh-sach"
        />

        {/* Movie Grid */}
        {movies.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
            {movies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} aspectRatio="portrait" />
            ))}
          </div>
        ) : (
          <div className="w-full py-20 flex flex-col items-center justify-center text-center bg-slate-900/40 rounded-3xl border border-white/5 my-8">
            <Film className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-slate-300 mb-1">
              Không tìm thấy phim nào
            </h3>
            <p className="text-xs text-slate-500 max-w-md">
              Rất tiếc, không tìm thấy phim nào khớp với điều kiện lọc hiện tại. Vui lòng thử lại với các tùy chọn lọc khác.
            </p>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={pagination.currentPage || page}
          totalPages={pagination.totalPages || 1}
          baseUrl="/danh-sach"
        />
      </div>
    </main>
  );
}
