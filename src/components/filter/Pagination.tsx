'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  baseUrl = '/danh-sach',
}: PaginationProps) {
  const searchParams = useSearchParams();

  if (totalPages <= 1) return null;

  const createPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    return `${baseUrl}?${params.toString()}`;
  };

  // Helper to generate visible page array
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const delta = 2; // How many pages to show around current page

    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);

    if (start > 2) {
      pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) {
      pages.push('...');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2 my-8 flex-wrap">
      {/* First Page */}
      <Link
        href={createPageUrl(1)}
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
      {pageNumbers.map((p, idx) => {
        if (p === '...') {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="px-3 py-1.5 text-xs text-slate-500 font-semibold"
            >
              ...
            </span>
          );
        }

        const pageNum = Number(p);
        const isActive = pageNum === currentPage;

        return (
          <Link
            key={pageNum}
            href={createPageUrl(pageNum)}
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
        className={`p-2 rounded-xl border border-white/10 flex items-center justify-center transition-all ${
          currentPage === totalPages
            ? 'pointer-events-none opacity-30 bg-slate-900/50 text-slate-500'
            : 'bg-slate-900/80 hover:bg-amber-400 hover:text-slate-950 text-slate-300 border-white/10'
        }`}
        title="Trang cuối"
      >
        <ChevronsRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
