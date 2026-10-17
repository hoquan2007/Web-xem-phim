"use client";

import { useId, useState } from "react";
import { MovieListItem } from "@/types/movie";
import { MovieCard } from "@/components/ui/MovieCard";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { getImageUrl, getImageFallbackChain, getMovieHref } from "@/lib/api/helpers";
export function RelatedMovies({
  movies,
  title = "Có thể bạn thích",
  compact = false,
}: {
  movies: MovieListItem[];
  title?: string;
  compact?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  if (!movies.length) return null;
  if (compact) return <section className={"watch-related-list" + (expanded ? " is-expanded" : "")} aria-labelledby="watch-related-heading">
    <h2 id="watch-related-heading">{title}</h2>
    <div id={listId} className="watch-related-items">{movies.slice(0, 6).map((movie) => {
      const poster = getImageUrl(movie.poster_url || movie.thumb_url);
      return <Link key={`${movie.source}:${movie._id}`} href={getMovieHref(movie)} className="watch-related-item">
        <span className="watch-related-poster"><SafeImage src={poster} fallbackUrls={[getImageUrl(movie.thumb_url), ...getImageFallbackChain(poster)]} alt="" fill sizes="52px" className="object-cover" /></span>
        <span className="watch-related-copy"><strong>{movie.name}</strong><span>{movie.origin_name}</span><small>{[movie.year > 0 ? movie.year : undefined, movie.episode_current].filter(Boolean).join(" · ")}</small></span>
      </Link>;
    })}</div>
    {movies.length > 3 && <button type="button" className="watch-related-more" aria-expanded={expanded} aria-controls={listId} onClick={() => setExpanded(!expanded)}>{expanded ? "Thu gọn" : "Xem thêm"}</button>}
  </section>;
  return (
    <section className="pt-6">
      <div className="section-heading">
        <h2>{title}</h2>
      </div>
      <div className="catalogue-grid">
        {movies.slice(0, 12).map((movie) => (
          <MovieCard key={`${movie.source}:${movie._id}`} movie={movie} />
        ))}
      </div>
    </section>
  );
}
