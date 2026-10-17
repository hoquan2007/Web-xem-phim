"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import {
  Play,
  Heart,
  Check,
  Info,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { HeroMovie } from "@/lib/hero-slides";
import {
  getImageUrl,
  getImageFallbackChain,
  getMovieHref,
} from "@/lib/api/helpers";
import { stripAllHtml } from "@/lib/sanitize";
import { useBookmarks } from "@/hooks/useBookmarks";
import { HeroMedia } from "./HeroMedia";
export function HeroBanner({ movies }: { movies: HeroMovie[] }) {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const featured = movies;
  if (!featured.length) return null;
  const movie = featured[index % featured.length],
    saved = isBookmarked(movie.slug);
  const image =
    movie.heroPosterSrc || getImageUrl(movie.thumb_url || movie.poster_url);
  const href = movie.heroHref || getMovieHref(movie);
  const move = (direction: number) => setIndex((current) => (current + direction + featured.length) % featured.length);
  return (
    <section
      className="film-hero"
      aria-label="Phim tiêu điểm"
      aria-roledescription="bộ sưu tập phim"
    >
      <div className="hero-frame"
        onPointerDown={(event) => {
          if (event.pointerType === "touch" && !(event.target as Element).closest("button, a")) touch.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerCancel={() => { touch.current = null; }}
        onPointerUp={(event) => {
          const start = touch.current;
          touch.current = null;
          if (!start) return;
          const dx = event.clientX - start.x, dy = event.clientY - start.y;
          if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx < 0 ? 1 : -1);
        }}>
        <HeroMedia
          key={movie.heroVideoSrc || movie.slug}
          image={image}
          fallbacks={[
            getImageUrl(movie.poster_url),
            ...getImageFallbackChain(image),
          ].filter((s) => s !== image)}
          videoSrc={movie.heroVideoSrc}
          preload={index === 0}
          muted={muted}
          onMutedChange={setMuted}
        />
        <div className="hero-caption">
          <h1
            className={
              movie.name.split(" / ")[0].length > 50 ? "long-title" : undefined
            }
          >
            <Link href={href}>{movie.name.split(" / ")[0]}</Link>
          </h1>
          {movie.origin_name !== movie.name && (
            <p className="hero-original">{movie.origin_name}</p>
          )}
          <div className="movie-meta">
            {movie.year > 0 && <span>{movie.year}</span>}
            {movie.heroCountry ? (
              <span>{movie.heroCountry}</span>
            ) : (
              movie.quality && <span>{movie.quality}</span>
            )}
            {movie.episode_current && <span>{movie.episode_current}</span>}
          </div>
          {movie.content && (
            <p className="hero-description line-clamp-3">
              {stripAllHtml(movie.content)}
            </p>
          )}
          <div className="hero-actions">
            <Link
              className="hero-play"
              href={href}
              aria-label={`Xem phim ${movie.name}`}
            >
              <Play size={27} fill="currentColor" />
              <span className="hero-play-label">Xem phim</span>
            </Link>
            <div className="hero-action-group">
              <button
                aria-label={saved ? "Bỏ lưu phim" : "Lưu phim"}
                aria-pressed={saved}
                disabled={Boolean(movie.heroHref)}
                title={
                  movie.heroHref ? "Tìm nguồn phim trước khi lưu" : undefined
                }
                onClick={() => toggleBookmark(movie)}
              >
                {saved ? (
                  <Check size={23} />
                ) : (
                  <Heart size={23} fill="currentColor" />
                )}
              </button>
              <Link aria-label={`Thông tin ${movie.name}`} href={href}>
                <Info size={23} />
              </Link>
            </div>
          </div>
        </div>
        <div className="hero-controls">
          <div className="hero-dots" aria-label="Chọn phim tiêu điểm">
            {featured.map((item, i) => (
              <button
                key={`${item.source}:${item._id}`}
                aria-label={`Phim tiêu điểm ${i + 1}: ${item.name}`}
                aria-current={index === i ? "true" : undefined}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <span className="hero-position" aria-live="polite" aria-atomic="true">{index + 1}<span aria-hidden="true"> / </span><span className="sr-only">trên</span>{featured.length}</span>
          <button
            className="icon-button"
            aria-label="Phim tiêu điểm trước"
            onClick={() =>
              setIndex(
                (current) => (current - 1 + featured.length) % featured.length,
              )
            }
          >
            <ChevronLeft size={23} />
          </button>
          <button
            className="icon-button"
            aria-label="Phim tiêu điểm tiếp theo"
            onClick={() =>
              setIndex((current) => (current + 1) % featured.length)
            }
          >
            <ChevronRight size={23} />
          </button>
        </div>
      </div>
    </section>
  );
}
