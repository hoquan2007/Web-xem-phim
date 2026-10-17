import "@/components/filter/catalog.css";
import { ApiUnavailable } from "@/components/ui/ApiUnavailable";
import React from "react";
import { Metadata } from "next";
import { searchMovies } from "@/lib/api";
import { createPageRequestSignal } from "@/lib/api/providers";
import { MovieCard } from "@/components/ui/MovieCard";
import Pagination from "@/components/filter/Pagination";
import SearchBarForm from "@/components/search/SearchBarForm";
import { sanitizeKeyword, clampPage } from "@/lib/validate";

interface SearchPageProps {
  searchParams: Promise<{ keyword?: string; page?: string }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  // FIX-10.5: sanitize keyword before using in metadata (defense in depth).
  const keyword = sanitizeKeyword(resolvedSearchParams?.keyword);
  const title = keyword ? `Kết quả tìm kiếm cho "${keyword}"` : "Tìm Kiếm Phim";
  const description = keyword
    ? `Danh sách phim phù hợp với từ khóa "${keyword}" trên PTQ.`
    : "Tìm kiếm hàng ngàn bộ phim lẻ, phim bộ, phim chiếu rạp mới nhất.";

  return {
    title,
    description,
    openGraph: {
      title: `${title} | PTQ`,
      description,
      siteName: "PTQ Film",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | PTQ`,
      description,
    },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedSearchParams = await searchParams;
  // FIX-10.5: sanitize all inputs before passing to upstream.
  const keyword = sanitizeKeyword(resolvedSearchParams?.keyword);
  // FIX-10.5: clamp page to 1..999 to prevent upstream DoS via "page=999999".
  const currentPage = clampPage(resolvedSearchParams?.page, 1, 999);

  // API-REDESIGN-6: per-page AbortSignal — aborts the search request if
  // upstream stalls past the 15s budget so we never pin a worker on a slow
  // /v1/api/tim-kiem response.
  const { signal } = createPageRequestSignal();

  const data = await searchMovies(keyword, currentPage, 24, signal);
  const movies = data?.items || [];
  const pagination = data?.pagination || {
    totalItems: 0,
    totalItemsPerPage: 24,
    currentPage: 1,
    totalPages: 1,
  };

  return (
    <div className="page-shell catalog-page">
      <div className="catalog-search">
        <h1 className="catalog-heading">{keyword ? `Kết quả tìm kiếm “${keyword}”` : "Tìm kiếm phim"}</h1>
        <div className="mt-5"><SearchBarForm initialKeyword={keyword} /></div>
        <p className="catalog-search-note">
          {data.status === false ? "Tìm kiếm đang gián đoạn." : keyword ? `${pagination.totalItems.toLocaleString("vi-VN")} phim được tìm thấy` : "Nhập tên phim để tìm kiếm."}
        </p>
      </div>
      {data.status === false ? (
        <ApiUnavailable message={data.msg} />
      ) : movies.length ? (
        <>
          <div className="catalogue-grid">
            {movies.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            baseUrl="/tim-kiem"
          />
        </>
      ) : (
        <div className="empty-state">
          <h2>
            {keyword ? "Không tìm thấy phim phù hợp" : "Bạn muốn xem phim gì?"}
          </h2>
          <p>
            {keyword
              ? "Thử từ khóa ngắn hơn, kiểm tra chính tả hoặc dùng tên gốc của phim."
              : "Tìm theo tên tiếng Việt hoặc tên gốc của bộ phim."}
          </p>
          <a href="/danh-sach" className="film-button">
            Khám phá kho phim
          </a>
        </div>
      )}
    </div>
  );
}
