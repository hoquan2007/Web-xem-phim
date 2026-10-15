"use client";
import { useId, useRef, useState } from "react";
import Link from "next/link";
import { Trash2, Bookmark, Clock } from "lucide-react";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { MovieCard } from "@/components/ui/MovieCard";
import { Dialog } from "@/components/ui/Dialog";
import { getMovieHref } from "@/lib/api/helpers";
export default function TuPhimContainer() {
  const { bookmarks, removeBookmark, clearBookmarks } = useBookmarks();
  const { history, removeHistoryItem, clearWatchHistory } = useWatchHistory();
  const [tab, setTab] = useState<"bookmarks" | "history">("bookmarks");
  const [confirm, setConfirm] = useState(false);
  const id = useId();
  const savedRef = useRef<HTMLButtonElement>(null);
  const historyRef = useRef<HTMLButtonElement>(null);
  const items = tab === "bookmarks" ? bookmarks : history;
  const clear = () => {
    if (tab === "bookmarks") clearBookmarks();
    else clearWatchHistory();
    setConfirm(false);
    requestAnimationFrame(() =>
      (tab === "bookmarks" ? savedRef : historyRef).current?.focus(),
    );
  };
  return (
    <>
      <div className="page-intro">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <h1>Tủ phim</h1>
            <p>
              Danh sách yêu thích và lịch sử xem trên trình duyệt này.
            </p>
          </div>
          {items.length > 0 && (
            <button
              className="text-link text-rose-300"
              onClick={() => setConfirm(true)}
            >
              <Trash2 size={16} />
              Xóa tất cả
            </button>
          )}
        </div>
        <div
          className="library-tabs"
          role="tablist"
          aria-label="Tủ phim cá nhân"
          onKeyDown={(e) => {
            if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
              e.preventDefault();
              const next =
                e.key === "Home"
                  ? "bookmarks"
                  : e.key === "End"
                    ? "history"
                    : tab === "bookmarks"
                      ? "history"
                      : "bookmarks";
              setTab(next);
              (next === "bookmarks" ? savedRef : historyRef).current?.focus();
            }
          }}
        >
          <button
            ref={savedRef}
            role="tab"
            id={`${id}-saved`}
            aria-controls={`${id}-panel`}
            aria-selected={tab === "bookmarks"}
            tabIndex={tab === "bookmarks" ? 0 : -1}
            onClick={() => setTab("bookmarks")}
          >
            <Bookmark size={16} />
            Đã lưu <span>{bookmarks.length}</span>
          </button>
          <button
            ref={historyRef}
            role="tab"
            id={`${id}-history`}
            aria-controls={`${id}-panel`}
            aria-selected={tab === "history"}
            tabIndex={tab === "history" ? 0 : -1}
            onClick={() => setTab("history")}
          >
            <Clock size={16} />
            Lịch sử <span>{history.length}</span>
          </button>
        </div>
      </div>
      <div
        id={`${id}-panel`}
        role="tabpanel"
        aria-labelledby={`${id}-${tab === "bookmarks" ? "saved" : "history"}`}
        tabIndex={0}
      >
        {tab === "bookmarks" ? (
          bookmarks.length ? (
            <div className="catalogue-grid">
              {bookmarks.map((movie) => (
                <div key={`${movie.source}:${movie.slug}`} className="relative">
                  <MovieCard
                    movie={{
                      ...movie,
                      origin_name: movie.origin_name || "",
                      year: movie.year || 0,
                    }}
                  />
                  <button
                    className="icon-button absolute top-2 right-2"
                    aria-label={`Xóa ${movie.name} khỏi tủ phim`}
                    onClick={() => removeBookmark(movie.slug)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>Tủ phim của bạn đang trống</h2>
              <p>
                Nhấn “Lưu phim” ở bộ phim bạn muốn dành lại cho lần sau. Dữ liệu
                được lưu trên trình duyệt này.
              </p>
              <Link className="film-button primary" href="/danh-sach">
                Khám phá phim
              </Link>
            </div>
          )
        ) : history.length ? (
          <div className="catalogue-grid">
            {history.map((movie) => {
              const base = getMovieHref(movie);
              const href = `${base}${base.includes("?") ? "&" : "?"}${new URLSearchParams({ sv: String(movie.active_server_index ?? 0), ep: String(movie.active_episode_index ?? 0) })}`;
              return (
                <div key={`${movie.source}:${movie.slug}`}>
                  <MovieCard
                    movie={{
                      ...movie,
                      origin_name: movie.origin_name || "",
                      year: 0,
                      episode_current: movie.episode_name,
                    }}
                    href={href}
                    aspectRatio="portrait"
                  />
                  <div className="flex items-center justify-between gap-3 mt-2">
                    <Link className="text-link" href={href}>
                      Xem tiếp →
                    </Link>
                    <button
                      className="icon-button"
                      aria-label={`Xóa ${movie.name} khỏi lịch sử`}
                      onClick={() => removeHistoryItem(movie.slug)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <h2>Chưa có lịch sử xem phim</h2>
            <p>Bộ phim và tập gần nhất bạn mở sẽ xuất hiện ở đây.</p>
            <Link className="film-button" href="/danh-sach">
              Tìm phim để xem
            </Link>
          </div>
        )}
      </div>
      <Dialog
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Xóa toàn bộ danh sách?"
      >
        <p className="text-sm text-muted">
          {tab === "bookmarks" ? "Các phim đã lưu" : "Lịch sử xem"} sẽ bị xóa
          khỏi trình duyệt này. Bạn không thể hoàn tác thao tác này.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button className="film-button" onClick={() => setConfirm(false)}>
            Giữ lại
          </button>
          <button className="film-button text-rose-300" onClick={clear}>
            Xóa tất cả
          </button>
        </div>
      </Dialog>
    </>
  );
}
