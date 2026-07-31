'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Bookmark,
  Clock,
  Trash2,
  Play,
  Sparkles,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { getImageUrl } from '@/lib/api';
import { MovieCard } from '@/components/ui/MovieCard';

export default function TuPhimContainer() {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'history'>('bookmarks');
  const { bookmarks, removeBookmark, clearBookmarks, count: bookmarkCount } = useBookmarks();
  const { history, removeHistoryItem, clearWatchHistory, count: historyCount } = useWatchHistory();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearAll = () => {
    if (activeTab === 'bookmarks') {
      clearBookmarks();
    } else {
      clearWatchHistory();
    }
    setShowClearConfirm(false);
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffInSeconds < 60) return 'Vừa xong';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
      return date.toLocaleDateString('vi-VN');
    } catch {
      return 'Gần đây';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Tabs Navigation */}
      <div className="relative p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <Sparkles className="w-7 h-7 text-amber-400" />
              <span>Góc Cá Nhân</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Quản lý tủ phim yêu thích và xem tiếp các bộ phim bạn đang theo dõi.
            </p>
          </div>

          {/* Action: Clear All Button */}
          {((activeTab === 'bookmarks' && bookmarkCount > 0) ||
            (activeTab === 'history' && historyCount > 0)) && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="self-start md:self-auto px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa tất cả {activeTab === 'bookmarks' ? 'tủ phim' : 'lịch sử'}</span>
            </button>
          )}
        </div>

        {/* Tab Buttons Bar */}
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-white/5">
          <button
            onClick={() => setActiveTab('bookmarks')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all ${
              activeTab === 'bookmarks'
                ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20 scale-102'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Bookmark className="w-4 h-4 fill-current" />
            <span>Tủ Phim Yêu Thích</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'bookmarks'
                  ? 'bg-slate-950 text-amber-400'
                  : 'bg-white/10 text-slate-300'
              }`}
            >
              {bookmarkCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-all ${
              activeTab === 'history'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-102'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Lịch Sử Xem</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'history'
                  ? 'bg-slate-950 text-emerald-400'
                  : 'bg-white/10 text-slate-300'
              }`}
            >
              {historyCount}
            </span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal for Clear All */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md p-6 bg-slate-900 border border-white/10 rounded-3xl shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-lg font-bold">Xác nhận xóa</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-300">
              Bạn có chắc chắn muốn xóa toàn bộ{' '}
              <strong className="text-white">
                {activeTab === 'bookmarks' ? 'danh sách phim yêu thích' : 'lịch sử xem phim'}
              </strong>{' '}
              không? Hành động này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-all shadow-lg shadow-red-600/30"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 1: BOOKMARKS */}
      {activeTab === 'bookmarks' && (
        <>
          {bookmarks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-5">
              {bookmarks.map((item) => (
                <div key={item.slug} className="relative group">
                  <MovieCard
                    movie={{
                      _id: item._id,
                      name: item.name,
                      origin_name: item.origin_name || '',
                      slug: item.slug,
                      poster_url: item.poster_url,
                      thumb_url: item.thumb_url,
                      year: item.year || 2024,
                      quality: item.quality,
                      lang: item.lang,
                      episode_current: item.episode_current,
                    }}
                  />
                  {/* Remove Button Overlay */}
                  <button
                    onClick={() => removeBookmark(item.slug)}
                    className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-slate-950/80 hover:bg-red-600 text-slate-300 hover:text-white flex items-center justify-center border border-white/10 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                    title="Xóa khỏi tủ phim"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 px-4 text-center rounded-3xl bg-slate-900/40 border border-white/5 space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto">
                <Bookmark className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">Tủ phim của bạn đang trống</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hãy nhấn vào nút <strong className="text-amber-400">&quot;Lưu Phim&quot;</strong>{' '}
                trên trang chi tiết bộ phim bất kỳ để bổ sung vào tủ phim cá nhân của bạn.
              </p>
              <Link
                href="/danh-sach"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-2xl transition-all shadow-lg shadow-amber-400/20 mt-2"
              >
                <span>Khám phá phim ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </>
      )}

      {/* TAB CONTENT 2: WATCH HISTORY */}
      {activeTab === 'history' && (
        <>
          {history.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {history.map((item) => {
                const watchUrl = `/phim/${item.slug}?sv=${item.active_server_index ?? 0}&ep=${item.active_episode_index ?? 0}`;
                return (
                  <div
                    key={item.slug}
                    className="relative flex gap-4 p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-white/10 hover:border-emerald-500/40 transition-all duration-300 group hover:shadow-xl hover:shadow-emerald-500/5 backdrop-blur-xl"
                  >
                    {/* Poster Image */}
                    <Link
                      href={watchUrl}
                      className="relative w-24 sm:w-28 h-32 sm:h-36 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800"
                    >
                      <Image
                        src={getImageUrl(item.thumb_url || item.poster_url)}
                        alt={item.name}
                        fill
                        sizes="120px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </div>
                      </div>
                    </Link>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div className="space-y-1">
                        <Link href={watchUrl}>
                          <h4 className="text-sm sm:text-base font-bold text-slate-100 hover:text-emerald-400 transition-colors line-clamp-1">
                            {item.name}
                          </h4>
                        </Link>
                        {item.origin_name && (
                          <p className="text-xs text-slate-400 line-clamp-1">
                            {item.origin_name}
                          </p>
                        )}
                        <div className="pt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                          <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-semibold">
                            {item.episode_name || 'Tập 1'}
                          </span>
                          {item.server_name && (
                            <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-medium">
                              {item.server_name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-white/5 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {formatTimeAgo(item.watched_at)}
                        </span>

                        <div className="flex items-center gap-2">
                          <Link
                            href={watchUrl}
                            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-all text-[11px] flex items-center gap-1"
                          >
                            <span>Xem tiếp</span>
                            <Play className="w-3 h-3 fill-current" />
                          </Link>

                          <button
                            onClick={() => removeHistoryItem(item.slug)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/10 transition-colors"
                            title="Xóa khỏi lịch sử"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 px-4 text-center rounded-3xl bg-slate-900/40 border border-white/5 space-y-4 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">Chưa có lịch sử xem phim</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Các bộ phim và tập phim bạn thưởng thức sẽ tự động lưu ở đây để bạn tiện theo dõi
                tiếp bất cứ lúc nào.
              </p>
              <Link
                href="/danh-sach"
                className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-2xl transition-all shadow-lg shadow-emerald-500/20 mt-2"
              >
                <span>Thưởng thức phim ngay</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
