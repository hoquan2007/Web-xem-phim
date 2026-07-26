'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, RotateCcw, ChevronDown } from 'lucide-react';
import { CategoryItem, CountryItem, FilterParams } from '@/types/movie';

interface FilterBarProps {
  categories: CategoryItem[];
  countries: CountryItem[];
  currentFilters?: FilterParams;
  baseUrl?: string;
}

export default function FilterBar({
  categories = [],
  countries = [],
  currentFilters = {},
  baseUrl = '/danh-sach',
}: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Current states from props/URL
  const currentCategory = currentFilters.category || searchParams.get('category') || '';
  const currentCountry = currentFilters.country || searchParams.get('country') || '';
  const currentYear = currentFilters.year || searchParams.get('year') || '';
  const currentType = currentFilters.type || searchParams.get('type') || '';
  const currentSortField = currentFilters.sort_field || searchParams.get('sort_field') || 'modified.time';
  const currentSortType = currentFilters.sort_type || searchParams.get('sort_type') || 'desc';

  const sortValue = `${currentSortField}_${currentSortType}`;

  // Years option range 2026 to 2010
  const currentYearNum = new Date().getFullYear();
  const years = Array.from({ length: 17 }, (_, i) => currentYearNum - i);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // Reset page to 1 on filter change
    params.delete('page');

    router.push(`${baseUrl}?${params.toString()}`);
  };

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      const [field, type] = value.split('_');
      params.set('sort_field', field);
      params.set('sort_type', type);
    } else {
      params.delete('sort_field');
      params.delete('sort_type');
    }

    params.delete('page');
    router.push(`${baseUrl}?${params.toString()}`);
  };

  const handleReset = () => {
    router.push(baseUrl);
  };

  const hasActiveFilters = Boolean(
    currentCategory || currentCountry || currentYear || currentType || (currentSortField !== 'modified.time')
  );

  return (
    <div className="w-full bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 lg:p-5 shadow-2xl mb-8">
      <div className="flex flex-col gap-4">
        {/* Filter Title Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm tracking-wide">
            <Filter className="w-4 h-4" />
            <span>BỘ LỌC PHIM NÂNG CAO</span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-amber-400 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa bộ lọc</span>
            </button>
          )}
        </div>

        {/* Filter Select Controls Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Loại phim */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-400">Loại Phim</label>
            <div className="relative">
              <select
                value={currentType}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full appearance-none bg-slate-950/80 text-slate-200 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 transition-all cursor-pointer pr-8"
              >
                <option value="">- Tất cả loại -</option>
                <option value="single">Phim Lẻ</option>
                <option value="series">Phim Bộ</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Thể loại */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-400">Thể Loại</label>
            <div className="relative">
              <select
                value={currentCategory}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full appearance-none bg-slate-950/80 text-slate-200 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 transition-all cursor-pointer pr-8"
              >
                <option value="">- Tất cả thể loại -</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Quốc gia */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-400">Quốc Gia</label>
            <div className="relative">
              <select
                value={currentCountry}
                onChange={(e) => handleFilterChange('country', e.target.value)}
                className="w-full appearance-none bg-slate-950/80 text-slate-200 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 transition-all cursor-pointer pr-8"
              >
                <option value="">- Tất cả quốc gia -</option>
                {countries.map((c) => (
                  <option key={c._id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Năm phát hành */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-400">Năm Phát Hành</label>
            <div className="relative">
              <select
                value={currentYear}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                className="w-full appearance-none bg-slate-950/80 text-slate-200 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 transition-all cursor-pointer pr-8"
              >
                <option value="">- Tất cả năm -</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    Năm {y}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Sắp xếp */}
          <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
            <label className="text-[11px] font-semibold text-slate-400">Sắp Xếp Theo</label>
            <div className="relative">
              <select
                value={sortValue}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full appearance-none bg-slate-950/80 text-slate-200 border border-white/10 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 transition-all cursor-pointer pr-8"
              >
                <option value="modified.time_desc">Mới cập nhật</option>
                <option value="year_desc">Năm giảm dần</option>
                <option value="year_asc">Năm tăng dần</option>
                <option value="view_desc">Lượt xem nhiều nhất</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
