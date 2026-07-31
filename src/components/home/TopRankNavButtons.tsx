'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TopRankNavButtonsProps {
  sliderId: string;
}

/**
 * Nút prev/next cho TopMoviesRankSection — tách thành Client Component con (FIX-5).
 * TopMoviesRankSection giữ 'use client' vì có tab state; chỉ riêng 2 nút này
 * dùng id để truy vấn container scroll mà không cần ref xuyên boundary.
 */
export const TopRankNavButtons: React.FC<TopRankNavButtonsProps> = ({ sliderId }) => {
  const scroll = (direction: 'left' | 'right') => {
    const el = document.getElementById(sliderId);
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollTo({
      left: direction === 'left' ? el.scrollLeft - scrollAmount : el.scrollLeft + scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <div className="flex items-center gap-1.5 self-end sm:self-auto">
      <button
        onClick={() => scroll('left')}
        aria-label="Scroll left"
        className="w-9 h-9 rounded-full bg-slate-800/90 hover:bg-amber-400 hover:text-slate-950 text-slate-300 flex items-center justify-center transition-all shadow-md border border-slate-700/60 active:scale-95"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => scroll('right')}
        aria-label="Scroll right"
        className="w-9 h-9 rounded-full bg-slate-800/90 hover:bg-amber-400 hover:text-slate-950 text-slate-300 flex items-center justify-center transition-all shadow-md border border-slate-700/60 active:scale-95"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default TopRankNavButtons;