'use client';

import Link from 'next/link';
import { Bookmark } from 'lucide-react';
import { useBookmarks } from '@/hooks/useBookmarks';

/**
 * FIX-9.2.1: tách BookmarkBadge từ Navbar để giảm re-render cả thanh nav.
 * Trước fix, Navbar subscribe `useBookmarks()` → mỗi lần user thêm/xoá
 * bookmark ở bất kỳ đâu (Hero, MovieDetailInfo, MovieCard) đều kéo cả
 * Navbar re-render lại: search input, dropdown state, scroll handler, v.v.
 * Sau fix, chỉ riêng badge này re-render, Navbar giữ nguyên state.
 */
export const BookmarkBadge: React.FC = () => {
  const { count: bookmarkCount } = useBookmarks();

  return (
    <Link
      href="/tu-phim"
      className="relative p-2 rounded-full text-slate-300 hover:text-amber-400 hover:bg-white/10 transition-all"
      title="Tủ phim đã lưu"
      aria-label={`Tủ phim đã lưu (${bookmarkCount} phim)`}
    >
      <Bookmark className="w-5 h-5" />
      {bookmarkCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full flex items-center justify-center shadow-lg animate-in zoom-in">
          {bookmarkCount > 99 ? '99+' : bookmarkCount}
        </span>
      )}
    </Link>
  );
};

export default BookmarkBadge;
