'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  Search,
  Sparkles,
  Tv,
  Clapperboard,
  Bookmark,
  ChevronDown,
  Globe,
  Film,
  Calendar,
  Compass,
} from 'lucide-react';
import { CategoryItem, CountryItem } from '@/types/movie';
import { useBookmarks } from '@/hooks/useBookmarks';
import HNQBrandLogo from './HNQBrandLogo';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  countries: CountryItem[];
}

export default function MobileDrawer({
  isOpen,
  onClose,
  categories,
  countries,
}: MobileDrawerProps) {
  const router = useRouter();
  const { count: bookmarkCount } = useBookmarks();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategories, setShowCategories] = useState(false);
  const [showCountries, setShowCountries] = useState(false);

  if (!isOpen) return null;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tim-kiem?keyword=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Content */}
      <div className="relative w-4/5 max-w-sm bg-slate-950 text-gray-200 h-full p-5 overflow-y-auto flex flex-col justify-between border-r border-white/10 shadow-2xl z-10 animate-in slide-in-from-left duration-300">
        <div>
          {/* Header & Close */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <HNQBrandLogo size="md" onClick={onClose} />
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm phim..."
              className="w-full py-2.5 pl-10 pr-4 text-sm bg-slate-900 text-gray-200 rounded-xl border border-white/10 focus:border-red-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          </form>

          {/* Navigation Links */}
          <div className="space-y-1 font-medium text-sm">
            <Link
              href="/"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10"
            >
              <Sparkles className="w-4 h-4 text-red-500" />
              Trang Chủ
            </Link>

            <Link
              href="/danh-sach?type=series"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10"
            >
              <Tv className="w-4 h-4 text-amber-500" />
              Phim Bộ
            </Link>

            <Link
              href="/danh-sach?type=single"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10"
            >
              <Clapperboard className="w-4 h-4 text-blue-500" />
              Phim Lẻ
            </Link>

            <Link
              href="/lich-chieu"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10"
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              Lịch Chiếu
            </Link>

            <Link
              href="/chu-de"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10"
            >
              <Compass className="w-4 h-4 text-purple-400" />
              Chủ Đề
            </Link>

            <Link
              href="/tu-phim"
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/10"
            >
              <div className="flex items-center gap-3">
                <Bookmark className="w-4 h-4 text-amber-400" />
                <span>Tủ Phim Yêu Thích</span>
              </div>
              {bookmarkCount > 0 && (
                <span className="bg-amber-400 text-slate-950 font-bold text-xs px-2 py-0.5 rounded-full">
                  {bookmarkCount}
                </span>
              )}
            </Link>

            {/* Accordion Thể loại */}
            <div>
              <button
                onClick={() => setShowCategories(!showCategories)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Thể Loại</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showCategories ? 'rotate-180 text-red-500' : ''
                  }`}
                />
              </button>

              {showCategories && (
                <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-900/60 rounded-xl my-1 max-h-48 overflow-y-auto">
                  {categories.map((c) => (
                    <Link
                      key={c._id}
                      href={`/the-loai/${c.slug}`}
                      onClick={onClose}
                      className="px-2 py-1 text-xs text-gray-300 hover:text-white truncate"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Accordion Quốc gia */}
            <div>
              <button
                onClick={() => setShowCountries(!showCountries)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/10"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Quốc Gia</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    showCountries ? 'rotate-180 text-red-500' : ''
                  }`}
                />
              </button>

              {showCountries && (
                <div className="grid grid-cols-2 gap-1.5 p-2 bg-slate-900/60 rounded-xl my-1 max-h-48 overflow-y-auto">
                  {countries.map((c) => (
                    <Link
                      key={c._id}
                      href={`/quoc-gia/${c.slug}`}
                      onClick={onClose}
                      className="px-2 py-1 text-xs text-gray-300 hover:text-white truncate"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 mt-6 border-t border-white/10 text-xs text-gray-500 text-center">
          HNQ Cinema &copy; 2026. All rights reserved.
        </div>
      </div>
    </div>
  );
}
