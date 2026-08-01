'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Play,
  Bookmark,
  Check,
  Share2,
  Star,
  Clock,
  Calendar,
  Film,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { MovieDetail } from '@/types/movie';
import { getImageUrl, getImageFallbackChain } from '@/lib/api';
import { useBookmarks } from '@/hooks/useBookmarks';
import { sanitizeHtml } from '@/lib/sanitize';
import { SafeImage } from '@/components/ui/SafeImage';

interface MovieDetailInfoProps {
  movie: MovieDetail;
  onWatchClick?: () => void;
}

export const MovieDetailInfo: React.FC<MovieDetailInfoProps> = ({ movie, onWatchClick }) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isExpandedContent, setIsExpandedContent] = useState<boolean>(false);
  const { isBookmarked: hasBookmark, toggleBookmark } = useBookmarks();
  const isBookmarked = hasBookmark(movie.slug);

  const posterSrc = getImageUrl(movie.poster_url || movie.thumb_url);
  const backdropSrc = getImageUrl(movie.thumb_url || movie.poster_url);

  // FIX-12: cung cấp fallback chain cho poster trang chi tiết. Nếu
  // poster chính lỗi trên `phimimg.com`, SafeImage tự chuyển qua
  // `phim.nguonc.com` mirror (cùng path, CDN khác).
  const posterFallback = backdropSrc !== posterSrc && !backdropSrc.startsWith('/')
    ? [backdropSrc, ...getImageFallbackChain(posterSrc)]
    : getImageFallbackChain(posterSrc);

  // FIX-9.1a.2: bỏ fake IMDb rating fallback '8.5'/'7.8'. Chỉ hiển thị khi upstream
  // thực sự cung cấp vote_average — tránh đánh lừa người dùng về chất lượng phim.
  const voteAverage = movie.tmdb?.vote_average
    ? parseFloat(movie.tmdb.vote_average).toFixed(1)
    : null;

  // Sanitize once, reuse — avoids running DOMPurify twice per render.
  const safeContent = useMemo(() => sanitizeHtml(movie.content), [movie.content]);
  const safeContentLength = safeContent.length;

  const handleToggleBookmark = () => {
    toggleBookmark({
      _id: movie._id,
      name: movie.name,
      origin_name: movie.origin_name,
      slug: movie.slug,
      poster_url: movie.poster_url,
      thumb_url: movie.thumb_url,
      year: movie.year,
      quality: movie.quality,
      lang: movie.lang,
      episode_current: movie.episode_current,
    });
  };

  // Share link handler
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/80 p-5 sm:p-8 backdrop-blur-xl shadow-2xl">
      {/* Blurred Backdrop Poster Background */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-15 blur-2xl pointer-events-none"
        style={{ backgroundImage: `url(${backdropSrc})` }}
      />

      <div className="relative z-10 flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
        {/* Poster Image */}
        <div className="w-40 sm:w-52 md:w-64 shrink-0 mx-auto md:mx-0 overflow-hidden rounded-2xl border border-white/15 bg-slate-950 shadow-2xl group">
          <div className="relative aspect-[2/3] w-full overflow-hidden">
            <SafeImage
              src={posterSrc}
              fallbackUrls={posterFallback}
              alt={movie.name}
              fill
              sizes="(min-width: 768px) 256px, (min-width: 640px) 208px, 160px"
              priority
              fetchPriority="high"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
              <span className="rounded-md bg-cyan-500/90 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-slate-950 shadow">
                {movie.quality || 'HD'}
              </span>
              <span className="rounded-md bg-slate-900/90 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-slate-200 border border-white/10 shadow">
                {movie.lang || 'Vietsub'}
              </span>
            </div>
          </div>
        </div>

        {/* Details & Info */}
        <div className="flex-1 space-y-4 text-left w-full">
          {/* Title Header */}
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight">
              {movie.name}
            </h1>
            <h2 className="mt-1 text-sm sm:text-base font-medium text-cyan-400/90">
              {movie.origin_name} ({movie.year})
            </h2>
          </div>

          {/* Badges strip */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-medium text-slate-300">
            {voteAverage && (
              <span className="flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-emerald-400 font-bold border border-emerald-500/30">
                <Star className="h-3.5 w-3.5 fill-emerald-400 text-emerald-400" />
                <span>IMDb {voteAverage}</span>
              </span>
            )}

            {movie.time && (
              <span className="flex items-center gap-1 rounded-lg bg-slate-800/80 px-2.5 py-1 text-slate-300 border border-white/5">
                <Clock className="h-3.5 w-3.5 text-cyan-400" />
                <span>{movie.time}</span>
              </span>
            )}

            {movie.year && (
              <span className="flex items-center gap-1 rounded-lg bg-slate-800/80 px-2.5 py-1 text-slate-300 border border-white/5">
                <Calendar className="h-3.5 w-3.5 text-cyan-400" />
                <span>{movie.year}</span>
              </span>
            )}

            {movie.episode_current && (
              <span className="flex items-center gap-1 rounded-lg bg-cyan-500/20 px-2.5 py-1 text-cyan-300 font-bold border border-cyan-500/30">
                <Film className="h-3.5 w-3.5 text-cyan-400" />
                <span>{movie.episode_current}</span>
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {onWatchClick && (
              <button
                onClick={onWatchClick}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/30 hover:scale-105 transition-all duration-200 active:scale-95"
              >
                <Play className="h-4 w-4 fill-slate-950" />
                <span>Xem Phim Ngay</span>
              </button>
            )}

            <button
              onClick={handleToggleBookmark}
              className={`flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all border ${
                isBookmarked
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800/80 text-slate-200 border-white/10 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {isBookmarked ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Đã Lưu Tủ Phim</span>
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4 text-cyan-400" />
                  <span>Thêm Tủ Phim</span>
                </>
              )}
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 rounded-2xl bg-slate-800/80 px-4 py-3 text-sm font-semibold text-slate-200 border border-white/10 hover:bg-slate-700 transition"
              title="Chia sẻ đường dẫn"
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400">Đã chép link</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 text-cyan-400" />
                  <span>Chia sẻ</span>
                </>
              )}
            </button>
          </div>

          {/* Categories & Country Links */}
          <div className="space-y-2 pt-3 border-t border-white/10 text-xs sm:text-sm">
            {movie.category && movie.category.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-400 min-w-[70px]">Thể loại:</span>
                <div className="flex flex-wrap gap-1.5">
                  {movie.category.map((cat) => (
                    <Link
                      key={cat.slug}
                      href={`/the-loai/${cat.slug}`}
                      className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-200 border border-white/5 transition"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {movie.country && movie.country.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-400 min-w-[70px]">Quốc gia:</span>
                <div className="flex flex-wrap gap-1.5">
                  {movie.country.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/quoc-gia/${c.slug}`}
                      className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 hover:text-white border border-white/5 transition"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {movie.director && movie.director.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-400 min-w-[70px]">Đạo diễn:</span>
                <span className="text-slate-200 font-medium">{movie.director.join(', ')}</span>
              </div>
            )}

            {movie.actor && movie.actor.length > 0 && (
              <div className="flex flex-wrap items-start gap-2">
                <span className="font-semibold text-slate-400 min-w-[70px]">Diễn viên:</span>
                <span className="text-slate-300 line-clamp-2 leading-relaxed">
                  {movie.actor.join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Synopsis Content */}
          {movie.content && (
            <div className="pt-3 border-t border-white/10">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Nội dung phim
              </h3>
              <div
                className={`text-xs sm:text-sm text-slate-300 leading-relaxed transition-all [&_a]:text-cyan-400 [&_a]:underline [&_strong]:text-white [&_p]:mb-1.5 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5 ${
                  isExpandedContent ? '' : 'line-clamp-3'
                }`}
                dangerouslySetInnerHTML={{ __html: safeContent }}
              />
              {safeContentLength > 180 && (
                <button
                  onClick={() => setIsExpandedContent(!isExpandedContent)}
                  className="mt-1.5 flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition"
                >
                  <span>{isExpandedContent ? 'Thu gọn' : 'Xem thêm'}</span>
                  {isExpandedContent ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
