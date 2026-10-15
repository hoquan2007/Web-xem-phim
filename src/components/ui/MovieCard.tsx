import Link from "next/link";
import { MovieListItem } from "@/types/movie";
import {
  getImageUrl,
  getImageFallbackChain,
  getMovieHref,
} from "@/lib/api/helpers";
import { SafeImage } from "./SafeImage";
interface Props {
  movie: MovieListItem;
  aspectRatio?: "portrait" | "landscape";
  priority?: boolean;
  href?: string;
}
export function MovieCard({
  movie,
  aspectRatio = "portrait",
  priority = false,
  href,
}: Props) {
  const src = getImageUrl(
    aspectRatio === "portrait"
      ? movie.poster_url || movie.thumb_url
      : movie.thumb_url || movie.poster_url,
  );
  const alternate = getImageUrl(movie.thumb_url || movie.poster_url);
  const fallback = [
    ...(alternate !== src && !alternate.startsWith("/") ? [alternate] : []),
    ...getImageFallbackChain(src),
  ];
  const lang = movie.lang
    ?.replace(/Vietsub/gi, "PĐ")
    .replace(/Thuyết Minh/gi, "TM")
    .replace(/Lồng Tiếng/gi, "LT");
  return (
    <Link
      href={href || getMovieHref(movie)}
      className="movie-card"
      title={movie.name}
    >
      <div
        className={`poster-frame ${aspectRatio === "portrait" ? "aspect-[2/3]" : "aspect-video"}`}
      >
        <SafeImage
          src={src}
          fallbackUrls={fallback}
          alt={movie.name}
          fill
          sizes="(min-width:1600px) 14vw,(min-width:1200px) 16vw,(min-width:768px) 25vw,50vw"
          preload={priority}
          className="object-cover"
        />
        <div className="poster-badges">
          {lang && <span>{lang}</span>}
          {movie.episode_current && (
            <span className="dubbed">{movie.episode_current}</span>
          )}
        </div>
      </div>
      <h3>{movie.name}</h3>
      {movie.origin_name && movie.origin_name !== movie.name ? (
        <p>{movie.origin_name}</p>
      ) : movie.year > 0 ? (
        <p>{movie.year}</p>
      ) : null}
    </Link>
  );
}
