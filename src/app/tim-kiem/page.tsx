import React from 'react';
import { Metadata } from 'next';
import { searchMovies } from '@/lib/api';
import { MovieCard } from '@/components/ui/MovieCard';
import Pagination from '@/components/filter/Pagination';
import SearchBarForm from '@/components/search/SearchBarForm';
import { Search, Film, AlertCircle } from 'lucide-react';

interface SearchPageProps {
  searchParams: {
    keyword?: string;
    page?: string;
  };
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const keyword = searchParams.keyword?.trim() || '';
  const title = keyword
    ? `Kết quả tìm kiếm cho "${keyword}" - RoPhim`
    : 'Tìm kiếm phim - RoPhim';
  const description = keyword
    ? `Danh sách phim phù hợp với từ khóa "${keyword}" trên RoPhim.`
    : 'Tìm kiếm hàng ngàn bộ phim lẻ, phim bộ, phim chiếu rạp mới nhất.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const keyword = searchParams.keyword?.trim() || '';
  const currentPage = parseInt(searchParams.page || '1', 10) || 1;

  const data = await searchMovies(keyword, currentPage, 24);
  const movies = data?.items || [];
  const pagination = data?.pagination || {
    totalItems: 0,
    totalItemsPerPage: 24,
    currentPage: 1,
    totalPages: 1,
  };

  return (
    <main className="w-full min-h-screen pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-10 xl:px-12 bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Search Section */}
        <div className="relative p-6 sm:p-10 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Subtle gradient backdrop glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
                  <Search className="w-7 h-7 text-amber-400" />
                  {keyword ? (
                    <span>
                      Kết quả tìm kiếm: <span className="text-amber-400">&quot;{keyword}&quot;</span>
                    </span>
                  ) : (
                    <span>Tìm kiếm phim</span>
                  )}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  {keyword
                    ? `Tìm thấy ${pagination.totalItems.toLocaleString('vi-VN')} bộ phim phù hợp với từ khóa của bạn.`
                    : 'Nhập tên phim, diễn viên hoặc thể loại để bắt đầu tìm kiếm.'}
                </p>
              </div>

              {pagination.totalItems > 0 && (
                <div className="self-start sm:self-auto bg-amber-400/10 text-amber-400 border border-amber-400/20 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  <span>{pagination.totalItems} Phim</span>
                </div>
              )}
            </div>

            {/* In-page Search Input */}
            <div className="max-w-2xl">
              <SearchBarForm initialKeyword={keyword} />
            </div>
          </div>
        </div>

        {/* Results Grid */}
        {movies.length > 0 ? (
          <div className="space-y-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-5">
              {movies.map((movie) => (
                <MovieCard key={movie._id} movie={movie} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pt-4">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  baseUrl="/tim-kiem"
                />
              </div>
            )}
          </div>
        ) : (
          /* Empty Search Results UI */
          <div className="py-16 px-4 text-center rounded-3xl bg-slate-900/40 border border-white/5 space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">
              Không tìm thấy phim phù hợp
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Rất tiếc, chúng tôi không tìm thấy kết quả nào phù hợp với từ khóa{' '}
              <strong className="text-amber-400">&quot;{keyword}&quot;</strong>.
            </p>
            <div className="pt-4 border-t border-white/5 text-left text-xs text-slate-400 space-y-2">
              <p className="font-semibold text-slate-300">💡 Gợi ý tìm kiếm:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Kiểm tra lại lỗi chính tả của từ khóa.</li>
                <li>Thử tìm kiếm với từ khóa ngắn hơn hoặc tên tiếng Anh của phim.</li>
                <li>Thử tìm kiếm tên diễn viên hoặc đạo diễn.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
