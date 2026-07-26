'use me';
'use client';

import React from 'react';
import Link from 'next/link';
import { Film, ArrowUp, Heart, ShieldAlert, Sparkles, Tv, Clapperboard } from 'lucide-react';

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-gray-400 text-sm border-t border-white/10 pt-12 pb-8 mt-20 relative">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/10">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-600/30">
                <Film className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black text-gradient">HNQ</span>
            </Link>
            <p className="text-xs leading-relaxed text-gray-400">
              Trang web xem phim trực tuyến miễn phí chất lượng cao, cập nhật phim mới liên tục mỗi ngày với vietsub, thuyết minh đa dạng.
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-400/90 bg-amber-950/40 p-2.5 rounded-xl border border-amber-500/20">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Dữ liệu được tổng hợp từ nguồn công khai. Chúng tôi không lưu trữ video trên máy chủ.</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-red-500" /> Phim Nổi Bật
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/danh-sach?type=series" className="hover:text-white transition-colors">
                  Phim Bộ Mới Nhất
                </Link>
              </li>
              <li>
                <Link href="/danh-sach?type=single" className="hover:text-white transition-colors">
                  Phim Lẻ Chiếu Rạp
                </Link>
              </li>
              <li>
                <Link href="/danh-sach?sort_field=view&sort_type=desc" className="hover:text-white transition-colors">
                  Top Phim Xem Nhiều
                </Link>
              </li>
              <li>
                <Link href="/tu-phim" className="hover:text-white transition-colors">
                  Tủ Phim Yêu Thích
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Popular Genres */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Clapperboard className="w-4 h-4 text-blue-500" /> Thể Loại Phổ Biến
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/the-loai/hanh-dong" className="hover:text-white transition-colors">
                  Phim Hành Động
                </Link>
              </li>
              <li>
                <Link href="/the-loai/tinh-cam" className="hover:text-white transition-colors">
                  Phim Tình Cảm
                </Link>
              </li>
              <li>
                <Link href="/the-loai/co-trang" className="hover:text-white transition-colors">
                  Phim Cổ Trang
                </Link>
              </li>
              <li>
                <Link href="/the-loai/hoat-hinh" className="hover:text-white transition-colors">
                  Phim Hoạt Hình Anime
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Popular Countries */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Tv className="w-4 h-4 text-emerald-500" /> Phim Theo Quốc Gia
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/quoc-gia/trung-quoc" className="hover:text-white transition-colors">
                  Phim Trung Quốc
                </Link>
              </li>
              <li>
                <Link href="/quoc-gia/han-quoc" className="hover:text-white transition-colors">
                  Phim Hàn Quốc
                </Link>
              </li>
              <li>
                <Link href="/quoc-gia/au-my" className="hover:text-white transition-colors">
                  Phim Âu Mỹ
                </Link>
              </li>
              <li>
                <Link href="/quoc-gia/nhat-ban" className="hover:text-white transition-colors">
                  Phim Nhật Bản
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar & Back to top */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <span>Designed with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>for HNQ Cinema Fans &copy; {new Date().getFullYear()}</span>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 border border-white/10 hover:border-red-500 text-gray-300 hover:text-white transition-all group"
          >
            <span>Lên đầu trang</span>
            <ArrowUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </footer>
  );
}
