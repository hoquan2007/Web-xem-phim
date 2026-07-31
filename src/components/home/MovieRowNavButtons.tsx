'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MovieRowNavButtonsProps {
  sliderId: string;
}

/**
 * Nút prev/next cho MovieRowSlider — tách thành Client Component con (FIX-5).
 * Cha là Server Component, không cần 'use client'; chỉ riêng 2 nút này cần
 * truy cập DOM qua id để gọi scrollTo.
 */
export const MovieRowNavButtons: React.FC<MovieRowNavButtonsProps> = ({ sliderId }) => {
  const scroll = (direction: 'left' | 'right') => {
    const el = document.getElementById(sliderId);
    if (!el) return;

    // FIX-9.2.4: snap-to-card. Trước fix, scroll một lượng cố định
    // (clientWidth * 0.75) — kết quả scroll ngẫu nhiên vào giữa card, dù CSS
    // container có `snap-mandatory` nhưng scroll ngầm (không qua scroll-snap-stop)
    // không trigger snap. Sau fix, tìm card hiện tại dựa vào scrollLeft, tính
    // card target kế tiếp, snap chính xác vào `card.offsetLeft` của nó.
    // Lợi: a11y — user keyboard tab vào card, Enter → card active rõ ràng.
    const cards = el.querySelectorAll<HTMLElement>(':scope > [class*="snap-start"]');
    if (cards.length === 0) {
      // Fallback khi không tìm thấy card (vd SSR mismatch): dùng behavior cũ.
      const scrollAmount = el.clientWidth * 0.75;
      el.scrollTo({
        left: direction === 'left' ? el.scrollLeft - scrollAmount : el.scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
      return;
    }

    const currentScrollLeft = el.scrollLeft;
    let currentIndex = 0;
    let minDistance = Infinity;
    cards.forEach((card, idx) => {
      const distance = Math.abs(card.offsetLeft - currentScrollLeft);
      if (distance < minDistance) {
        minDistance = distance;
        currentIndex = idx;
      }
    });

    const targetIndex =
      direction === 'left'
        ? Math.max(0, currentIndex - 1)
        : Math.min(cards.length - 1, currentIndex + 1);
    const targetCard = cards[targetIndex];
    if (!targetCard) return;

    el.scrollTo({
      left: targetCard.offsetLeft - el.offsetLeft,
      behavior: 'smooth',
    });
  };

  return (
    <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-800/80">
      <button
        onClick={() => scroll('left')}
        aria-label="Scroll left"
        className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-amber-400 hover:text-slate-950 text-slate-300 flex items-center justify-center transition-all duration-200 shadow-md border border-slate-700/50 active:scale-95"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={() => scroll('right')}
        aria-label="Scroll right"
        className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-amber-400 hover:text-slate-950 text-slate-300 flex items-center justify-center transition-all duration-200 shadow-md border border-slate-700/50 active:scale-95"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default MovieRowNavButtons;