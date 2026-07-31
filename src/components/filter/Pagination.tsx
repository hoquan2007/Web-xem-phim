'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
}

// Sentinel "..." markers; dùng số âm để không thể nhầm với page index thật.
const ELLIPSIS_LEFT = -1;
const ELLIPSIS_RIGHT = -2;

// PaginationContent chứa logic dùng useSearchParams — phải nằm trong Suspense ở page cha
// hoặc wrapper Pagination bên dưới (Next 14+: useSearchParams() yêu cầu Suspense boundary).
function PaginationContent({
  currentPage,
  totalPages,
  baseUrl,
}: PaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    return `${baseUrl}?${params.toString()}`;
  };

  // Helper to generate visible page array (loại bỏ duplicate khi totalPages nhỏ)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const delta = 2; // How many pages to show around current page

    const addUnique = (n: number) => {
      if (n >= 1 && n <= totalPages && !pages.includes(n)) pages.push(n);
    };

    addUnique(1);

    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    if (start > 2) {
      pages.push(ELLIPSIS_LEFT);
    }

    for (let i = start; i <= end; i++) {
      addUnique(i);
    }

    if (end < totalPages - 1) {
      pages.push(ELLIPSIS_RIGHT);
    }

    addUnique(totalPages);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav aria-label="Phân trang" className="flex items-center justify-center gap-1.5 sm:gap-2 my-8 flex-wrap">
      {/* First Page */}
      <Link
        href={createPageUrl(1)}
        aria-disabled={currentPage === 1}
        tabIndex={currentPage === 1 ? -1 : undefined}
        className={`p-2 rounded-xl border border-white/10 flex items-center justify-center transition-all ${
          currentPage === 1
            ? 'pointer-events-none opacity-30 bg-slate-900/50 text-slate-500'
            : 'bg-slate-900/80 hover:bg-amber-400 hover:text-slate-950 text-slate-300 border-white/10'
        }`}
        title="Trang đầu"
      >
        <ChevronsLeft className="w-4 h-4" />
      </Link>

      {/* Prev Page */}
      <Link
        href={createPageUrl(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        tabIndex={currentPage === 1 ? -1 : undefined}
        className={`p-2 rounded-xl border border-white/10 flex items-center justify-center transition-all ${
          currentPage === 1
            ? 'pointer-events-none opacity-30 bg-slate-900/50 text-slate-500'
            : 'bg-slate-900/80 hover:bg-amber-400 hover:text-slate-950 text-slate-300 border-white/10'
        }`}
        title="Trang trước"
      >
        <ChevronLeft className="w-4 h-4" />
      </Link>

      {/* Page Numbers */}
      {pageNumbers.map((p) => {
        if (p === ELLIPSIS_LEFT || p === ELLIPSIS_RIGHT) {
          return (
            <span
              key={p === ELLIPSIS_LEFT ? 'ellipsis-left' : 'ellipsis-right'}
              aria-hidden="true"
              className="px-3 py-1.5 text-xs text-slate-500 font-semibold select-none"
            >
              ...
            </span>
          );
        }

        const pageNum = p;
        const isActive = pageNum === currentPage;

        return (
          <Link
            key={pageNum}
            href={createPageUrl(pageNum)}
            aria-current={isActive ? 'page' : undefined}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
              isActive
                ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-lg shadow-amber-400/20'
                : 'bg-slate-900/80 text-slate-300 border-white/10 hover:border-amber-400/50 hover:text-white hover:bg-white/10'
            }`}
          >
            {pageNum}
          </Link>
        );
      })}

      {/* Next Page */}
      <Link
        href={createPageUrl(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        tabIndex={currentPage === totalPages ? -1 : undefined}
        className={`p-2 rounded-xl border border-white/10 flex items-center justify-center transition-all ${
          currentPage === totalPages
            ? 'pointer-events-none opacity-30 bg-slate-900/50 text-slate-500'
            : 'bg-slate-900/80 hover:bg-amber-400 hover:text-slate-950 text-slate-300 border-white/10'
        }`}
        title="Trang tiếp"
      >
        <ChevronRight className="w-4 h-4" />
      </Link>

      {/* Last Page */}
      <Link
        href={createPageUrl(totalPages)}
        aria-disabled={currentPage === totalPages}
        tabIndex={currentPage === totalPages ? -1 : undefined}
        className={`p-2 rounded-xl border border-white/10 flex items-center justify-center transition-all ${
          currentPage === totalPages
            ? 'pointer-events-none opacity-30 bg-slate-900/50 text-slate-500'
            : 'bg-slate-900/80 hover:bg-amber-400 hover:text-slate-950 text-slate-300 border-white/10'
        }`}
        title="Trang cuối"
      >
        <ChevronsRight className="w-4 h-4" />
      </Link>
    </nav>
  );
}

// Default export: bọc PaginationContent trong <Suspense> để an toàn với useSearchParams
// (Next 14+ yêu cầu Suspense boundary khi dùng useSearchParams ở client component).
// Page cha cũng có thể bọc thêm Suspense riêng nếu cần custom fallback.
export default function Pagination(props: PaginationProps) {
  return (
    <Suspense fallback={null}>
      <PaginationContent {...props} />
    </Suspense>
  );
}
