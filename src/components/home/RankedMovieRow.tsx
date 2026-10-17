"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MovieListItem } from "@/types/movie";
import {
  getImageFallbackChain,
  getImageUrl,
  getMovieHref,
  movieIdentity,
} from "@/lib/api/helpers";
import { SafeImage } from "@/components/ui/SafeImage";
import "./ranked-movies.css";

interface Props {
  id: string;
  title: string;
  movies: MovieListItem[];
}

function posterUrl(value: string) {
  return value.startsWith("/") && !value.startsWith("//")
    ? value
    : getImageUrl(value);
}

function languageBadges(language?: string) {
  return [...new Set((language || "").split(/\s*[+/|,]\s*/))]
    .filter(Boolean)
    .map((label) => ({
      label: label.replace(/vietsub/gi, "Phụ đề"),
      dubbed: /thuyết minh|lồng tiếng/i.test(label),
    }));
}

export function RankedMovieRow({ id, title, movies }: Props) {
  const railRef = useRef<HTMLOListElement>(null);
  const [bounds, setBounds] = useState({ previous: false, next: false });
  const entries = useMemo(() => {
    const seen = new Set<string>();
    return movies
      .filter((movie) => {
        const identity =
          movieIdentity(movie) || `${movie.source || ""}:${movie.slug}`;
        if (seen.has(identity)) return false;
        seen.add(identity);
        return true;
      })
      .slice(0, 30);
  }, [movies]);

  const updateBounds = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const previous = rail.scrollLeft > 2;
    const next = rail.scrollWidth - rail.clientWidth - rail.scrollLeft > 2;
    setBounds((current) =>
      current.previous === previous && current.next === next
        ? current
        : { previous, next },
    );
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const frame = requestAnimationFrame(updateBounds);
    const observer = new ResizeObserver(updateBounds);
    observer.observe(rail);
    if (rail.firstElementChild) observer.observe(rail.firstElementChild);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [entries.length, updateBounds]);

  function move(direction: number) {
    const rail = railRef.current;
    const first = rail?.firstElementChild as HTMLElement | null;
    if (!rail || !first) return;
    const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
    const step = first.getBoundingClientRect().width + gap;
    const current = rail.scrollLeft / step;
    const index =
      direction > 0
        ? Math.floor(current + 0.05) + 1
        : Math.ceil(current - 0.05) - 1;
    rail.scrollTo({
      left: Math.max(0, index * step),
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  if (!entries.length) return null;

  return (
    <section className="ranked-section" aria-labelledby={`${id}-heading`}>
      <div className="ranked-heading">
        <div>
          <h2 id={`${id}-heading`}>{title}</h2>
          <p>Thứ tự tuyển chọn của PTQ, cập nhật từ kho phim.</p>
        </div>
        <div className="ranked-navigation">
          <button
            type="button"
            aria-controls={id}
            aria-label={`Phim trước trong ${title}`}
            disabled={!bounds.previous}
            onClick={() => move(-1)}
          >
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-controls={id}
            aria-label={`Phim tiếp trong ${title}`}
            disabled={!bounds.next}
            onClick={() => move(1)}
          >
            <ChevronRight size={22} aria-hidden="true" />
          </button>
        </div>
      </div>
      <ol
        ref={railRef}
        id={id}
        className="ranked-rail"
        tabIndex={0}
        aria-label={title}
        onScroll={updateBounds}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            move(event.key === "ArrowLeft" ? -1 : 1);
          } else if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            railRef.current?.scrollTo({
              left: event.key === "Home" ? 0 : railRef.current.scrollWidth,
              behavior: "instant",
            });
          }
        }}
      >
        {entries.map((movie, index) => {
          const src = posterUrl(movie.poster_url || movie.thumb_url);
          const alternate = posterUrl(movie.thumb_url || movie.poster_url);
          const season = movie.tmdb?.season;
          return (
            <li key={`${movie.source}:${movie.slug}`} className="ranked-item">
              <Link className="ranked-card" href={getMovieHref(movie)}>
                <div className="ranked-poster">
                  <SafeImage
                    src={src}
                    fallbackUrls={[
                      ...(alternate !== src ? [alternate] : []),
                      ...getImageFallbackChain(src),
                    ]}
                    alt={movie.name}
                    fill
                    sizes="(min-width:1400px) 16vw,(min-width:1100px) 20vw,(min-width:700px) 25vw,43vw"
                    className="ranked-poster-image"
                  />
                  {movie.lang && (
                    <div className="ranked-language">
                      {languageBadges(movie.lang).map((badge) => (
                        <span key={badge.label} data-dubbed={badge.dubbed}>
                          {badge.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="ranked-caption">
                  <span className="ranked-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div className="ranked-details">
                    <h3>{movie.name}</h3>
                    {movie.origin_name && (
                      <p className="ranked-original">{movie.origin_name}</p>
                    )}
                    {(Boolean(season && season > 0) ||
                      movie.episode_current) && (
                      <p className="ranked-episode">
                        {Boolean(season && season > 0) && (
                          <span>Phần {season}</span>
                        )}
                        {movie.episode_current && (
                          <span>{movie.episode_current}</span>
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
