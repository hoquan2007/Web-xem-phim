'use client';

import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

/**
 * Floating Scroll-to-Top button dùng riêng cho Trang Chủ
 * (Footer đã có 1 nút cuộn riêng — `ScrollToTopButton`).
 * Listener scroll đã được throttle qua rAF + passive để không block main thread.
 */
export const ScrollToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const updateVisibility = () => {
      setIsVisible(window.scrollY > 300);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateVisibility);
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    updateVisibility();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Scroll to top"
      className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-950 shadow-2xl transition-all duration-300 hover:scale-110 hover:bg-slate-100 active:scale-95 border border-slate-200"
    >
      <ChevronUp className="h-6 w-6 stroke-[3]" />
    </button>
  );
};