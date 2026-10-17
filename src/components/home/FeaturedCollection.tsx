"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { Check, ChevronRight, Heart, Info, Play } from "lucide-react";
import type { MovieListItem } from "@/types/movie";
import { SafeImage } from "@/components/ui/SafeImage";
import {
  getImageFallbackChain,
  getImageUrl,
  getMovieHref,
} from "@/lib/api/helpers";
import { stripAllHtml } from "@/lib/sanitize";
import { isStoredMovie } from "@/lib/storage";
import { BOOKMARKS_STORAGE_KEY, useBookmarks } from "@/hooks/useBookmarks";
import "./featured-collection.css";

export type FeaturedMovie = MovieListItem & { backdrop_url?: string };

interface FeaturedCollectionProps {
  id: string;
  title: string;
  viewAllHref: string;
  movies: FeaturedMovie[];
}

function imageSource(value: string | undefined): string {
  return value?.startsWith("/") ? value : getImageUrl(value);
}

export function FeaturedCollection({
  id,
  title,
  viewAllHref,
  movies,
}: FeaturedCollectionProps) {
  const [selected, setSelected] = useState(0);
  const [bookmarkError, setBookmarkError] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  if (!movies.length) return null;

  const activeIndex = selected % movies.length;
  const movie = movies[activeIndex];
  const saved = isBookmarked(movie.slug);
  const href = getMovieHref(movie);
  const backdrop = imageSource(
    movie.backdrop_url || movie.thumb_url || movie.poster_url,
  );
  const description = stripAllHtml(movie.content);
  const season = movie.tmdb?.season;

  function selectMovie(index: number, focus = false) {
    setSelected(index);
    setBookmarkError(false);
    const button =
      railRef.current?.querySelectorAll<HTMLButtonElement>("button")[index];
    const rail = railRef.current;
    if (button && rail) {
      const offset = button.getBoundingClientRect().left - rail.getBoundingClientRect().left + rail.scrollLeft;
      const right = offset + button.offsetWidth;
      if (offset < rail.scrollLeft) rail.scrollTo({ left: offset, behavior: "instant" });
      else if (right > rail.scrollLeft + rail.clientWidth) rail.scrollTo({ left: right - rail.clientWidth, behavior: "instant" });
    }
    if (focus) button?.focus({ preventScroll: true });
  }

  function handleKeys(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let target: number;
    switch (event.key) {
      case "ArrowRight":
        target = (index + 1) % movies.length;
        break;
      case "ArrowLeft":
        target = (index - 1 + movies.length) % movies.length;
        break;
      case "Home":
        target = 0;
        break;
      case "End":
        target = movies.length - 1;
        break;
      default:
        return;
    }
    event.preventDefault();
    selectMovie(target, true);
  }

  function saveMovie() {
    toggleBookmark(movie);
    try {
      const raw: unknown = JSON.parse(
        localStorage.getItem(BOOKMARKS_STORAGE_KEY) || "[]",
      );
      const nowSaved =
        Array.isArray(raw) &&
        raw.some((item) => isStoredMovie(item) && item.slug === movie.slug);
      setBookmarkError(nowSaved !== !saved);
    } catch {
      setBookmarkError(true);
    }
  }

  return (
    <section
      id={id}
      className="featured-collection"
      aria-labelledby={`${id}-heading`}
    >
      <div className="section-heading featured-collection-heading">
        <h2 id={`${id}-heading`}>{title}</h2>
        <Link
          className="row-more"
          href={viewAllHref}
          aria-label={`Xem tất cả ${title}`}
        >
          <ChevronRight size={20} />
        </Link>
      </div>
      <div
        className="featured-collection-panel"
        onPointerDown={(event) => {
          if (event.pointerType !== "touch" || (event.target as HTMLElement).closest("a,button")) return;
          swipeStart.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerCancel={() => { swipeStart.current = null; }}
        onPointerUp={(event) => {
          const start = swipeStart.current;
          swipeStart.current = null;
          if (!start) return;
          const x = event.clientX - start.x, y = event.clientY - start.y;
          if (Math.abs(x) > 50 && Math.abs(x) > Math.abs(y) * 1.2) {
            selectMovie((activeIndex + (x < 0 ? 1 : movies.length - 1)) % movies.length);
          }
        }}
      >
        <div className="featured-collection-art" aria-hidden="true">
          <SafeImage
            src={backdrop}
            fallbackUrls={[
              imageSource(movie.thumb_url),
              imageSource(movie.poster_url),
              ...getImageFallbackChain(backdrop),
            ]}
            alt=""
            fill
            sizes="(max-width: 767px) 100vw, 90vw"
          />
        </div>
        <div
          className="featured-collection-copy"
          aria-live="polite"
          aria-atomic="true"
        >
          <h3>
            <Link href={href}>{movie.name}</Link>
          </h3>
          {movie.origin_name && movie.origin_name !== movie.name && (
            <p className="featured-collection-original">{movie.origin_name}</p>
          )}
          <div className="featured-collection-meta">
            {movie.year > 0 && <span>{movie.year}</span>}
            {typeof season === "number" && season > 0 && (
              <span>Phần {season}</span>
            )}
            {movie.episode_current && <span>{movie.episode_current}</span>}
          </div>
          {description && (
            <p className="featured-collection-description">{description}</p>
          )}
          <div className="featured-collection-actions">
            <Link
              className="featured-collection-play"
              href={href}
              aria-label={`Xem phim ${movie.name}`}
            >
              <Play size={28} fill="currentColor" />
            </Link>
            <div className="featured-collection-action-group">
              <button
                type="button"
                aria-label={
                  saved ? `Bỏ lưu ${movie.name}` : `Lưu phim ${movie.name}`
                }
                aria-pressed={saved}
                onClick={saveMovie}
              >
                {saved ? (
                  <Check size={23} />
                ) : (
                  <Heart size={23} fill="currentColor" />
                )}
              </button>
              <Link href={href} aria-label={`Thông tin ${movie.name}`}>
                <Info size={23} />
              </Link>
            </div>
          </div>
          {bookmarkError && (
            <p className="featured-collection-error" role="alert">
              Không thể cập nhật tủ phim. Hãy cho phép trình duyệt lưu dữ liệu
              rồi thử lại.
            </p>
          )}
        </div>
      </div>
      <div
        className="featured-collection-picker"
        ref={railRef}
        role="group"
        aria-label={`Chọn phim trong ${title}`}
      >
        <div className="featured-collection-thumbnails">
          {movies.map((item, index) => {
            const poster = imageSource(item.poster_url || item.thumb_url);
            return (
              <button
                key={`${item.source}:${item._id}:${item.slug}`}
                type="button"
                className="featured-collection-thumbnail"
                aria-label={`Chọn phim ${item.name}`}
                aria-pressed={index === activeIndex}
                onClick={() => selectMovie(index)}
                onKeyDown={(event) => handleKeys(event, index)}
                title={item.name}
              >
                <SafeImage
                  src={poster}
                  fallbackUrls={[
                    imageSource(item.thumb_url),
                    ...getImageFallbackChain(poster),
                  ]}
                  alt={item.name}
                  fill
                  sizes="(max-width: 767px) 80px, (max-width: 1600px) 90px, 138px"
                />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
