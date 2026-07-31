import React from 'react';
import Link from 'next/link';
import { Sparkles, Tv, Clapperboard } from 'lucide-react';
import HNQBrandLogo from './HNQBrandLogo';
import ScrollToTopButton from './ScrollToTopButton';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-gray-400 text-sm border-t border-white/10 pt-12 pb-8 mt-20 relative">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/10">
          {/* Col 1: Brand Info */}
          <div className="md:col-span-1 space-y-4">
            <HNQBrandLogo size="lg" />
            <p className="text-xs leading-relaxed text-gray-400">
              Trang web xem phim trực tuyến miễn phí chất lượng cao, cập nhật phim mới liên tục mỗi ngày với vietsub, thuyết minh đa dạng.
            </p>
            <div className="flex items-start gap-2.5 text-xs text-amber-300/95 bg-gradient-to-r from-amber-950/60 via-amber-900/40 to-amber-950/60 p-3 rounded-xl border border-amber-500/30 shadow-inner">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-4 h-4 text-rose-400 shrink-0 mt-0.5"
                aria-hidden="true"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className="leading-relaxed">Cảm ơn bạn đã đồng hành cùng <strong className="text-amber-400 font-bold">HNQ FILM</strong>! Chúc bạn có những phút giây thư giãn tuyệt vời và không gian giải trí đỉnh cao bên gia đình & người thân.</span>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Phim Nổi Bật
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/danh-sach?type=series" className="hover:text-amber-400 transition-colors">
                  Phim Bộ Mới Nhất
                </Link>
              </li>
              <li>
                <Link href="/danh-sach?type=single" className="hover:text-amber-400 transition-colors">
                  Phim Lẻ Chiếu Rạp
                </Link>
              </li>
              <li>
                <Link href="/danh-sach?sort_field=view&sort_type=desc" className="hover:text-amber-400 transition-colors">
                  Top Phim Xem Nhiều
                </Link>
              </li>
              <li>
                <Link href="/tu-phim" className="hover:text-amber-400 transition-colors">
                  Tủ Phim Yêu Thích
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Popular Genres */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Clapperboard className="w-4 h-4 text-cyan-400" /> Thể Loại Phổ Biến
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/the-loai/hanh-dong" className="hover:text-cyan-400 transition-colors">
                  Phim Hành Động
                </Link>
              </li>
              <li>
                <Link href="/the-loai/tinh-cam" className="hover:text-cyan-400 transition-colors">
                  Phim Tình Cảm
                </Link>
              </li>
              <li>
                <Link href="/the-loai/co-trang" className="hover:text-cyan-400 transition-colors">
                  Phim Cổ Trang
                </Link>
              </li>
              <li>
                <Link href="/the-loai/hoat-hinh" className="hover:text-cyan-400 transition-colors">
                  Phim Hoạt Hình Anime
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Popular Countries */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Tv className="w-4 h-4 text-emerald-400" /> Phim Theo Quốc Gia
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/quoc-gia/trung-quoc" className="hover:text-emerald-400 transition-colors">
                  Phim Trung Quốc
                </Link>
              </li>
              <li>
                <Link href="/quoc-gia/han-quoc" className="hover:text-emerald-400 transition-colors">
                  Phim Hàn Quốc
                </Link>
              </li>
              <li>
                <Link href="/quoc-gia/au-my" className="hover:text-emerald-400 transition-colors">
                  Phim Âu Mỹ
                </Link>
              </li>
              <li>
                <Link href="/quoc-gia/nhat-ban" className="hover:text-emerald-400 transition-colors">
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-3.5 h-3.5 text-rose-500"
              aria-hidden="true"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span>for HNQ Cinema Fans &copy; {new Date().getFullYear()}</span>
          </div>

          {/* Client Component con — chỉ nút cuộn cần state & effect */}
          <ScrollToTopButton />
        </div>
      </div>
    </footer>
  );
}
