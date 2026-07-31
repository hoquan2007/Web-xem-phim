'use client';

import React, { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * Nút cuộn lên đầu trang — tách ra từ Footer (FIX-5).
 * Footer giờ là Server Component, không cần state/effect;
 * chỉ riêng nút này mới cần listen scroll để ẩn/hiện.
 */
export const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let ticking = false;
    const updateVisibility = () => {
      setIsVisible(window.scrollY > 300);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        // passive + rAF throttle: không block scroll, không re-render quá 60fps
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
      aria-label="Lên đầu trang"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-white/10 hover:border-amber-400 text-gray-300 hover:text-white transition-all group"
    >
      <span>Lên đầu trang</span>
      <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
    </button>
  );
};

export default ScrollToTopButton;