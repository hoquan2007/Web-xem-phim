import { ApiUnavailable } from "@/components/ui/ApiUnavailable";
import React from "react";
import { Metadata } from "next";
import { Film } from "lucide-react";
import { getCategories, getCountries, getFilteredMovies } from "@/lib/api";
import { createPageRequestSignal } from "@/lib/api/providers";
import FilterBar from "@/components/filter/FilterBar";
import Pagination from "@/components/filter/Pagination";
import { MovieCard } from "@/components/ui/MovieCard";
import { FilterParams } from "@/types/movie";
import {
  sanitizeSlug,
  sanitizeYear,
  sanitizeSortField,
  sanitizeSortType,
  sanitizeMovieType,
  clampPage,
} from "@/lib/validate";

export interface FilterListPageProps {
  defaultType?: "single" | "series";
  baseUrl?: string;
  searchParams:
    | Promise<{ [key: string]: string | string[] | undefined }>
    | { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({
  searchParams, defaultType,
}: FilterListPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  // FIX-10.5: validate type before using in metadata.
  const type = sanitizeMovieType(resolvedSearchParams?.type) ?? defaultType;
  const page = clampPage(resolvedSearchParams?.page, 1, 999);

  let title = "Danh Sách Phim Khổng Lồ";
  if (type === "single") title = "Phim Lẻ Chọn Lọc Mới Nhất";
  if (type === "series") title = "Phim Bộ Hấp Dẫn Mới Cập Nhật";
  if (type === "hoat-hinh") title = "Phim Hoạt Hình";
  if (type === "tv-shows") title = "TV Show Thực Tế";

  const fullTitle = `${title} - Trang ${page}`;
  const description = `Khám phá danh sách phim mới nhất, phim bộ, phim lẻ, phim chiếu rạp vietsub thuyết minh chất lượng cao 4K trên PTQ. Trang ${page}`;

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: `${fullTitle} | PTQ`,
      description,
      siteName: "PTQ Film",
    },
    twitter: {
      card: "summary_large_image",
      title: `${fullTitle} | PTQ`,
      description,
    },
  };
}

export default async function FilterListPage({ searchParams, defaultType, baseUrl = "/danh-sach" }: FilterListPageProps) {
  const resolvedSearchParams = await searchParams;

  // FIX-10.5: validate ALL search params before passing to upstream.
  // Slugs allowlist to ASCII letters/digits/dash/dot/underscore.
  const category = sanitizeSlug(resolvedSearchParams?.category) ?? "";
  const country = sanitizeSlug(resolvedSearchParams?.country) ?? "";
  // Year limited to 1900..currentYear+1.
  const year = sanitizeYear(resolvedSearchParams?.year) ?? "";
  const type = sanitizeMovieType(resolvedSearchParams?.type) ?? defaultType ?? "";
  // Sort field whitelisted to upstream-supported values.
  const sortField =
    sanitizeSortField(resolvedSearchParams?.sort_field) ?? "modified.time";
  const sortType = sanitizeSortType(resolvedSearchParams?.sort_type) ?? "desc";
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
  let sectionTitle = "Tất Cả Phim";
  if (type === "single") sectionTitle = "Phim Lẻ";
  if (type === "series") sectionTitle = "Phim Bộ";
  if (type === "hoat-hinh") sectionTitle = "Phim Hoạt Hình";
  if (type === "tv-shows") sectionTitle = "TV Show Thực Tế";

  return (
    <div className="page-shell catalog-page">
      <div className="w-full">
        <h1 className="catalog-heading">{sectionTitle}</h1>
        {/* Filter Controls Bar */}
        <FilterBar
          categories={categories}
          countries={countries}
          currentFilters={filterParams}
          baseUrl={baseUrl}
        />

        {/* Movie Grid */}
        {movieData.status === false ? (
          <ApiUnavailable message={movieData.msg} />
        ) : movies.length > 0 ? (
          <div className="catalogue-grid">
            {movies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} aspectRatio="portrait" />
            ))}
          </div>
        ) : (
          <div className="w-full py-20 flex flex-col items-center justify-center text-center bg-slate-900/40 rounded-lg border border-white/5 my-8">
            <Film className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-slate-300 mb-1">
              Không tìm thấy phim nào
            </h3>
            <p className="text-xs text-slate-500 max-w-md">
              Rất tiếc, không tìm thấy phim nào khớp với điều kiện lọc hiện tại.
              Vui lòng thử lại với các tùy chọn lọc khác.
            </p>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={pagination.currentPage || page}
          totalPages={pagination.totalPages || 1}
          baseUrl={baseUrl}
        />
      </div>
    </div>
  );
}
