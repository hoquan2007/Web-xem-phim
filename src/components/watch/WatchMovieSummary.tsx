"use client";

import Link from "next/link";
import { MovieDetail } from "@/types/movie";
import { getImageUrl, getImageFallbackChain, getMovieHref } from "@/lib/api/helpers";
import { stripAllHtml } from "@/lib/sanitize";
import { movieRating } from "@/lib/movie-presentation";
import { SafeImage } from "@/components/ui/SafeImage";
import { MovieActions } from "./MovieActions";

/** Compact watch summary; detail-page metadata and watch CTA keep their own layout. */
export function WatchMovieSummary({ movie }: { movie: MovieDetail }) {
  const poster = getImageUrl(movie.poster_url || movie.thumb_url);
  const href = getMovieHref(movie);
  const rating = movieRating(movie);
  return <section className="watch-movie-summary" aria-labelledby="watch-movie-title">
    <Link href={href} className="watch-summary-poster" tabIndex={-1} aria-hidden="true">
      <SafeImage src={poster} fallbackUrls={[getImageUrl(movie.thumb_url), ...getImageFallbackChain(poster)]} alt="" fill sizes="80px" className="object-cover" />
    </Link>
    <div className="watch-summary-copy">
      <p className="watch-summary-original">{movie.origin_name}</p>
      <div className="watch-summary-meta">
        {rating && <span>TMDB {rating}</span>}
        {movie.year > 0 && <span>{movie.year}</span>}
        {movie.quality && <span>{movie.quality}</span>}
        {movie.episode_current && <span>{movie.episode_current}</span>}
      </div>
      {movie.content && <div className="watch-summary-description"><p>{stripAllHtml(movie.content)}</p></div>}
      <MovieActions movie={movie} />
    </div>
  </section>;
}
