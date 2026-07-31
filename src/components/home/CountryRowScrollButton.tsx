'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * Nút cuộn ngang cho CountryMovieSection — tách ra từ component cha (FIX-5).
 * Cha là Server Component (không cần 'use client'), chỉ riêng nút này cần
 * tham chiếu DOM container để scrollBy. Dùng id selector thay vì ref xuyên
 * component để tránh ép cha thành Client.
 */
export const CountryRowScrollButton: React.FC = () => {
  const handleScrollRight = (e: React.MouseEvent<HTMLButtonElement>) => {
    // parent row có lg:col-span-10 chứa slider → sibling div trước nút này
    const row = (e.currentTarget.closest('.lg\\:grid-cols-12') ||
      e.currentTarget.parentElement);
    if (!row) return;
    const slider = row.querySelector<HTMLDivElement>('.overflow-x-auto');
    if (slider) {
      slider.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  return (
    <button
      onClick={handleScrollRight}
      aria-label="Scroll right"
      className="absolute -right-4 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white text-slate-950 shadow-2xl transition-all duration-300 hover:bg-cyan-400 hover:scale-110 active:scale-95 border border-slate-200"
    >
      <ChevronRight className="h-6 w-6 stroke-[2.5]" />
    </button>
  );
};

export default CountryRowScrollButton;