'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface SearchBarFormProps {
  initialKeyword?: string;
}

export default function SearchBarForm({ initialKeyword = '' }: SearchBarFormProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(initialKeyword);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      router.push(`/tim-kiem?keyword=${encodeURIComponent(keyword.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center">
      <div className="relative flex-1">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Nhập tên phim, từ khóa..."
          className="w-full py-3 pl-12 pr-10 text-sm bg-slate-950/90 text-slate-100 placeholder-slate-500 rounded-2xl border border-white/10 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400 transition-all shadow-inner"
        />
        {keyword && (
          <button
            type="button"
            onClick={() => setKeyword('')}
            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <button
        type="submit"
        className="ml-3 px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-400/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 flex-shrink-0"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:inline">Tìm kiếm</span>
      </button>
    </form>
  );
}
