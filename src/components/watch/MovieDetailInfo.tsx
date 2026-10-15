"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp } from "lucide-react";
import { MovieDetail } from "@/types/movie";
import { movieRating } from "@/lib/movie-presentation";
import { getImageUrl, getImageFallbackChain } from "@/lib/api/helpers";
import { sanitizeHtml } from "@/lib/sanitize";
import { SafeImage } from "@/components/ui/SafeImage";
import { MovieActions } from "./MovieActions";

export function MovieDetailInfo({
  movie,
  sidebar = false,
  detailsOnly = false,
  onWatchClick,
}: {
  movie: MovieDetail;
  sidebar?: boolean;
  detailsOnly?: boolean;
  onWatchClick?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const safeContent = useMemo(
    () => sanitizeHtml(movie.content),
    [movie.content],
  );
  const poster = getImageUrl(movie.poster_url || movie.thumb_url);
  const alternate = getImageUrl(movie.thumb_url || movie.poster_url);
  const rating = movieRating(movie);
  const Heading = sidebar ? "h1" : "h2";
  return (
    <section
      className={`rp-movie-info ${sidebar ? "rp-info-sidebar" : "rp-info-watch"}`}
    >
      {!detailsOnly && (
        <div className="rp-detail-poster">
          <SafeImage
            src={poster}
            fallbackUrls={[alternate, ...getImageFallbackChain(poster)]}
            alt={movie.name}
            fill
            sizes="160px"
            className="object-cover"
          />
        </div>
      )}
      <div className="rp-info-text">
        {!detailsOnly && (
          <>
            <Heading>{movie.name}</Heading>
            <p className="rp-original-title">{movie.origin_name}</p>
            <div className="rp-detail-meta">
              {rating && (
                <span className="rp-rating">
                  TMDB <strong>{rating}</strong>
                </span>
              )}
              {movie.quality && <span>{movie.quality}</span>}
              {movie.year > 0 && <span>{movie.year}</span>}
              {movie.time && <span>{movie.time}</span>}
              {movie.episode_current && <span>{movie.episode_current}</span>}
            </div>
            {!!movie.category?.length && (
              <div className="rp-detail-genres">
                {movie.category.map((category) => (
                  <Link key={category.slug} href={`/the-loai/${category.slug}`}>
                    {category.name}
                  </Link>
                ))}
              </div>
            )}
            {!sidebar && onWatchClick && (
              <MovieActions movie={movie} onWatchClick={onWatchClick} />
            )}
          </>
        )}
        {safeContent && (
          <div className="rp-detail-intro">
            <h3>Giới thiệu:</h3>
            <div
              className={expanded ? "" : "rp-intro-clamped"}
              dangerouslySetInnerHTML={{ __html: safeContent }}
            />
            {safeContent.length > 240 && (
              <button
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
              >
                {expanded ? "Thu gọn" : "Xem thêm"}
                {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </div>
        )}
        <dl className="rp-detail-facts">
          {!!movie.country?.length && (
            <div>
              <dt>Quốc gia:</dt>
              <dd>
                {movie.country.map((country, index) => (
                  <span key={country.slug}>
                    {index > 0 && ", "}
                    <Link href={`/quoc-gia/${country.slug}`}>
                      {country.name}
                    </Link>
                  </span>
                ))}
              </dd>
            </div>
          )}
          {!!movie.director?.length && (
            <div>
              <dt>Đạo diễn:</dt>
              <dd>{movie.director.join(", ")}</dd>
            </div>
          )}
          {!!movie.actor?.length && (
            <div>
              <dt>Diễn viên:</dt>
              <dd>{movie.actor.join(", ")}</dd>
            </div>
          )}
          {movie.lang && (
            <div>
              <dt>Ngôn ngữ:</dt>
              <dd>{movie.lang}</dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  );
}
