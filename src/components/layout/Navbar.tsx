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
  Globe,
  Sparkles,
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
          isScrolled
            ? 'bg-slate-950/90 backdrop-blur-md py-3 shadow-2xl border-b border-white/5'
            : 'bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent py-4'
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12 flex items-center justify-between gap-4">
          {/* Left: Logo & Search Box */}
          <div className="flex items-center gap-4 lg:gap-6">
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-400/30 group-hover:scale-105 transition-transform text-slate-950">
                <PlayIcon className="w-5 h-5 fill-current ml-0.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-wider text-white leading-none">
                  RoPhim
                </span>
                <span className="text-[10px] font-semibold text-amber-400/90 tracking-tight">
                  Phim hay cả rổ
                </span>
              </div>
            </Link>

            {/* RoPhim Style Integrated Search Input Box */}
            <form onSubmit={handleSearchSubmit} className="relative hidden md:block w-48 lg:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm phim, diễn viên"
                className="w-full py-2 pl-9 pr-4 text-xs bg-slate-900/80 text-slate-200 placeholder-slate-400 rounded-lg border border-white/10 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all"
              />
            </form>
          </div>

          {/* Center/Desktop Navigation Links matching RoPhim */}
          <div className="hidden lg:flex items-center space-x-1 text-xs font-semibold text-slate-300" ref={dropdownRef}>
            <Link
              href="/"
              className="px-3 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-all"
            >
              Trang Chủ
            </Link>

            {/* Dropdown Thể Loại */}
            <div className="relative">
              <button
                onClick={() =>
                  setActiveDropdown(activeDropdown === 'category' ? null : 'category')
                }
                className={`px-3 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-all flex items-center gap-1 ${
                  activeDropdown === 'category' ? 'text-white bg-white/10' : ''
                }`}
              >
                Thể loại
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === 'category' ? 'rotate-180 text-amber-400' : ''
                  }`}
                />
              </button>

              {activeDropdown === 'category' && (
                <div className="absolute top-full left-0 mt-2 w-[460px] p-4 bg-slate-900/95 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Tất cả thể loại
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 max-h-[300px] overflow-y-auto pr-1">
                    {categories.map((cat) => (
                      <Link
                        key={cat._id}
                        href={`/the-loai/${cat.slug}`}
                        onClick={() => setActiveDropdown(null)}
                        className="px-2.5 py-1.5 text-xs rounded-md text-slate-300 hover:text-white hover:bg-amber-400/20 hover:border-amber-400/40 border border-transparent transition-all truncate"
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
                className={`px-3 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-all flex items-center gap-1 ${
                  activeDropdown === 'country' ? 'text-white bg-white/10' : ''
                }`}
              >
                Quốc Gia
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    activeDropdown === 'country' ? 'rotate-180 text-amber-400' : ''
                  }`}
                />
              </button>

              {activeDropdown === 'country' && (
                <div className="absolute top-full left-0 mt-2 w-[420px] p-4 bg-slate-900/95 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-2 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" /> Chọn quốc gia
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 max-h-[300px] overflow-y-auto pr-1">
                    {countries.map((c) => (
                      <Link
                        key={c._id}
                        href={`/quoc-gia/${c.slug}`}
                        onClick={() => setActiveDropdown(null)}
                        className="px-2.5 py-1.5 text-xs rounded-md text-slate-300 hover:text-white hover:bg-emerald-500/20 hover:border-emerald-400/40 border border-transparent transition-all truncate"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/danh-sach?type=single"
              className="px-3 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-all"
            >
              Phim Lẻ
            </Link>

            <Link
              href="/danh-sach?type=series"
              className="px-3 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-all"
            >
              Phim Bộ
            </Link>

            <Link
              href="/danh-sach"
              className="px-3 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-all"
            >
              Lịch Chiếu
            </Link>

            <Link
              href="/danh-sach"
              className="px-3 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-all"
            >
              Chủ Đề
            </Link>

            <Link
              href="/danh-sach"
              className="px-3 py-2 rounded-lg hover:text-white hover:bg-white/10 transition-all"
            >
              Diễn Viên
            </Link>
          </div>

          {/* Right Actions: Bookmarks & Mobile Menu Toggle */}
          <div className="flex items-center space-x-2">
            <Link
              href="/tu-phim"
              className="p-2 rounded-full text-slate-300 hover:text-amber-400 hover:bg-white/10 transition-all"
              title="Tủ phim đã lưu"
            >
              <Bookmark className="w-5 h-5" />
            </Link>

            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 rounded-lg lg:hidden text-slate-300 hover:text-white hover:bg-white/10"
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

function PlayIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

