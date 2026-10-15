"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Heart, MessageCircle, Play, Share2 } from "lucide-react";
import { MovieDetail } from "@/types/movie";
import { useBookmarks } from "@/hooks/useBookmarks";

export function MovieActions({
  movie,
  watchHref,
  onWatchClick,
  onNotesClick,
}: {
  movie: MovieDetail;
  watchHref?: string;
  onWatchClick?: () => void;
  onNotesClick?: () => void;
}) {
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const saved = isBookmarked(movie.slug);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(false);
  const share = async () => {
    setShareError(false);
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
      setShareError(true);
    }
  };
  const watchLabel = (
    <>
      <Play size={24} fill="currentColor" />
      <span>Xem Ngay</span>
    </>
  );
  return (
    <>
      <div className="rp-movie-actions">
        {watchHref ? (
          <Link
            className="rp-watch-now"
            href={watchHref}
            onClick={onWatchClick}
          >
            {watchLabel}
          </Link>
        ) : (
          onWatchClick && (
            <button className="rp-watch-now" onClick={onWatchClick}>
              {watchLabel}
            </button>
          )
        )}
        <button
          className="rp-detail-action"
          aria-pressed={saved}
          onClick={() => toggleBookmark(movie)}
        >
          {saved ? <Check size={22} /> : <Heart size={22} />}
          <span>{saved ? "Đã Lưu Tủ Phim" : "Thêm Tủ Phim"}</span>
        </button>
        <button className="rp-detail-action" onClick={share}>
          <Share2 size={22} />
          <span>{copied ? "Đã chép link" : "Chia sẻ"}</span>
        </button>
        {onNotesClick && (
          <button className="rp-detail-action" onClick={onNotesClick}>
            <MessageCircle size={22} />
            <span>Ghi chú</span>
          </button>
        )}
      </div>
      <span role="status" className="sr-only">
        {copied ? "Đã chép đường dẫn." : ""}
      </span>
      {shareError && (
        <div role="alert" className="rp-share-error">
          <p>
            Chưa chép được đường dẫn. Hãy chọn và sao chép liên kết bên dưới.
          </p>
          <label htmlFor="share-fallback" className="sr-only">
            Đường dẫn phim
          </label>
          <input
            id="share-fallback"
            readOnly
            value={typeof window !== "undefined" ? window.location.href : ""}
            onFocus={(event) => event.currentTarget.select()}
          />
        </div>
      )}
    </>
  );
}
