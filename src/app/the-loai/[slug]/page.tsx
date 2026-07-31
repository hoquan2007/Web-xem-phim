import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { Sparkles, ChevronRight, Tag } from 'lucide-react';
import { getCategories, getCountries, getFilteredMovies } from '@/lib/api';
import FilterBar from '@/components/filter/FilterBar';
import Pagination from '@/components/filter/Pagination';
import { MovieCard } from '@/components/ui/MovieCard';
import { FilterParams } from '@/types/movie';

interface CategoryPageProps {
  params: Promise<{ slug: string }> | { slug: string };
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page || 1);

  const categories = await getCategories();
  const cat = categories.find((c) => c.slug === resolvedParams.slug);
  const catName = cat ? cat.name : resolvedParams.slug;

  const fullTitle = `Phim ${catName} Hay Nhất - Trang ${page}`;
  const description = `Xem ngay danh sách phim ${catName} vietsub thuyết minh mới nhất, chất lượng cao 4K trên HNQ. Trang ${page}`;

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

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  const slug = resolvedParams.slug;
  const page = Number(resolvedSearchParams?.page || 1);
  const filterParams: FilterParams = {
    category: slug,
    country: String(resolvedSearchParams?.country || ''),
    year: String(resolvedSearchParams?.year || ''),
    type: String(resolvedSearchParams?.type || ''),
    sort_field: String(resolvedSearchParams?.sort_field || 'modified.time'),
    sort_type: String(resolvedSearchParams?.sort_type || 'desc'),
    page,
    limit: 24,
  };

  const [categories, countries, movieData] = await Promise.all([
    getCategories(),
    getCountries(),
    getFilteredMovies(filterParams),
  ]);

  const catObj = categories.find((c) => c.slug === slug);
  const catName = catObj ? catObj.name : slug;

  const movies = movieData.items || [];
  const pagination = movieData.pagination || {
    totalItems: 0,
    totalItemsPerPage: 24,
    currentPage: 1,
    totalPages: 1,
  };

  const currentFilterParams = filterParams;

  return (
    <main className="min-h-screen bg-slate-950 pt-24 pb-16">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
          <Link href="/" className="hover:text-amber-400 transition-colors">
            Trang Chủ
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <Link href="/danh-sach" className="hover:text-amber-400 transition-colors">
            Thể Loại
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-200">{catName}</span>
        </nav>

        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Tag className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
                Phim {catName}
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Tuyển tập phim {catName} đặc sắc nhất được cập nhật liên tục
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <FilterBar
          categories={categories}
          countries={countries}
          currentFilters={currentFilterParams}
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
            <Tag className="w-12 h-12 text-slate-600 mb-3" />
            <h3 className="text-lg font-bold text-slate-300 mb-1">
              Chưa có phim cho thể loại này
            </h3>
            <p className="text-xs text-slate-500 max-w-md">
              Hệ thống chưa tìm thấy phim thuộc thể loại {catName}. Bạn vui lòng chọn thể loại khác.
            </p>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={pagination.currentPage || page}
          totalPages={pagination.totalPages || 1}
          baseUrl={`/the-loai/${slug}`}
        />
      </div>
    </main>
  );
}
