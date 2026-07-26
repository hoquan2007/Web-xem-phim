'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Film, Home, Search, ArrowLeft, Sparkles, Compass } from 'lucide-react';

export default function NotFound() {
  const [keyword, setKeyword] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      router.push(`/tim-kiem?keyword=${encodeURIComponent(keyword.trim())}`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center pt-20 pb-16 px-4 relative overflow-hidden">
      {/* Dynamic Background Spotlights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full text-center space-y-8 p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-2xl shadow-2xl">
        {/* Cinema Film Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold uppercase tracking-widest shadow-inner">
          <Film className="w-4 h-4 animate-bounce" />
          <span>Error 404 • Page Not Found</span>
        </div>

        {/* 404 Big Glowing Number */}
        <div className="relative">
          <h1 className="text-8xl sm:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-600 drop-shadow-2xl">
            404
          </h1>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 text-slate-400 text-sm font-medium whitespace-nowrap bg-slate-950/80 px-4 py-1 rounded-full border border-white/10">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Hình như cuộn phim bạn tìm đã bị đứt!</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm sm:text-base text-slate-400 max-w-lg mx-auto leading-relaxed">
          Trang bạn đang truy cập không tồn tại, đã bị di chuyển hoặc địa chỉ URL không đúng. Hãy thử tìm kiếm phim khác hoặc quay lại trang chủ.
        </p>

        {/* Search Bar Shortcut */}
        <form onSubmit={handleSearch} className="relative max-w-md mx-auto">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm tên phim, diễn viên..."
            className="w-full bg-slate-950/90 border border-white/15 focus:border-amber-400 text-slate-100 placeholder-slate-500 rounded-2xl py-3.5 pl-11 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all shadow-inner"
          />
          <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-extrabold hover:brightness-110 transition-all shadow-md shadow-amber-500/20"
          >
            Tìm Phim
          </button>
        </form>

        {/* Actions & Navigation */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 font-extrabold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-amber-500/25"
          >
            <Home className="w-4 h-4" />
            <span>Về Trang Chủ</span>
          </Link>

          <Link
            href="/danh-sach"
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold text-sm border border-white/10 hover:border-white/20 transition-all"
          >
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Khám Phá Phim</span>
          </Link>
        </div>

        {/* Popular Categories Links */}
        <div className="pt-6 border-t border-white/5 space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Gợi ý thể loại hot
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            {[
              { name: 'Hành Động', href: '/the-loai/hanh-dong' },
              { name: 'Tình Cảm', href: '/the-loai/tinh-cam' },
              { name: 'Cổ Trang', href: '/the-loai/co-trang' },
              { name: 'Hoạt Hình', href: '/the-loai/hoat-hinh' },
              { name: 'Phim Hàn Quốc', href: '/quoc-gia/han-quoc' },
              { name: 'Phim Trung Quốc', href: '/quoc-gia/trung-quoc' },
            ].map((tag) => (
              <Link
                key={tag.href}
                href={tag.href}
                className="px-3 py-1.5 rounded-lg bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-white/5 hover:border-amber-400/30 transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
