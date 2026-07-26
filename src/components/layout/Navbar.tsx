'use me';
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Film,
  Search,
  Bookmark,
  Menu,
  ChevronDown,
  Sparkles,
  Clapperboard,
  Globe,
  Tv,
} from 'lucide-react';
import { CategoryItem, CountryItem } from '@/types/movie';
import MobileDrawer from './MobileDrawer';

interface NavbarProps {
  categories?: CategoryItem[];
  countries?: CountryItem[];
}

export default function Navbar({ categories = [], countries = [] }: NavbarProps) {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<'category' | 'country' | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Handle scroll header background
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tim-kiem?keyword=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'glass-header py-3 shadow-2xl' : 'bg-gradient-to-b from-black/90 via-black/50 to-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo & Main Nav */}
          <div className="flex items-center space-x-8" ref={dropdownRef}>
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
                <Film className="w-6 h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-wider text-gradient leading-none">
                  VSMOV
                </span>
                <span className="text-[10px] font-semibold tracking-widest text-gray-400 uppercase">
                  Cinema Online
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1 text-sm font-medium text-gray-300">
              <Link
                href="/"
                className="px-3.5 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-red-500" />
                Trang Chủ
              </Link>

              <Link
                href="/danh-sach?type=series"
                className="px-3.5 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
              >
                <Tv className="w-4 h-4 text-amber-500" />
                Phim Bộ
              </Link>

              <Link
                href="/danh-sach?type=single"
                className="px-3.5 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-all flex items-center gap-1.5"
              >
                <Clapperboard className="w-4 h-4 text-blue-500" />
                Phim Lẻ
              </Link>

              {/* Dropdown Thể Loại */}
              <div className="relative">
                <button
                  onClick={() =>
                    setActiveDropdown(activeDropdown === 'category' ? null : 'category')
                  }
                  className={`px-3.5 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-all flex items-center gap-1 ${
                    activeDropdown === 'category' ? 'text-white bg-white/10' : ''
                  }`}
                >
                  Thể Loại
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeDropdown === 'category' ? 'rotate-180 text-red-500' : ''
                    }`}
                  />
                </button>

                {activeDropdown === 'category' && (
                  <div className="absolute top-full left-0 mt-2 w-[480px] p-4 glass-card rounded-2xl shadow-2xl border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-red-500" /> Tất cả thể loại
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 max-h-[320px] overflow-y-auto pr-1">
                      {categories.map((cat) => (
                        <Link
                          key={cat._id}
                          href={`/the-loai/${cat.slug}`}
                          onClick={() => setActiveDropdown(null)}
                          className="px-2.5 py-1.5 text-xs rounded-md text-gray-300 hover:text-white hover:bg-red-600/20 hover:border-red-500/40 border border-transparent transition-all truncate"
                        >
                          {cat.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dropdown Quốc Gia */}
              <div className="relative">
                <button
                  onClick={() =>
                    setActiveDropdown(activeDropdown === 'country' ? null : 'country')
                  }
                  className={`px-3.5 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-all flex items-center gap-1 ${
                    activeDropdown === 'country' ? 'text-white bg-white/10' : ''
                  }`}
                >
                  <Globe className="w-4 h-4 text-emerald-500" />
                  Quốc Gia
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      activeDropdown === 'country' ? 'rotate-180 text-red-500' : ''
                    }`}
                  />
                </button>

                {activeDropdown === 'country' && (
                  <div className="absolute top-full left-0 mt-2 w-[440px] p-4 glass-card rounded-2xl shadow-2xl border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-emerald-500" /> Chọn quốc gia
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 max-h-[300px] overflow-y-auto pr-1">
                      {countries.map((c) => (
                        <Link
                          key={c._id}
                          href={`/quoc-gia/${c.slug}`}
                          onClick={() => setActiveDropdown(null)}
                          className="px-2.5 py-1.5 text-xs rounded-md text-gray-300 hover:text-white hover:bg-emerald-600/20 hover:border-emerald-500/40 border border-transparent transition-all truncate"
                        >
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right Actions: Search & Bookmarks */}
          <div className="flex items-center space-x-3">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tên phim, diễn viên..."
                className="w-48 lg:w-64 py-2 pl-9 pr-4 text-xs bg-slate-900/80 text-gray-200 placeholder-gray-400 rounded-full border border-white/10 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            </form>

            {/* Bookmarks Page Link */}
            <Link
              href="/tu-phim"
              className="p-2 rounded-full text-gray-300 hover:text-white hover:bg-white/10 transition-all relative group"
              title="Tủ phim đã lưu"
            >
              <Bookmark className="w-5 h-5 group-hover:text-amber-400 transition-colors" />
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-lg lg:hidden text-gray-300 hover:text-white hover:bg-white/10"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      <MobileDrawer
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        categories={categories}
        countries={countries}
      />
    </>
  );
}
