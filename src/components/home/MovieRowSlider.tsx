import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MovieListItem } from "@/types/movie";
import { MovieCard } from "@/components/ui/MovieCard";
import MovieRowNavButtons from "./MovieRowNavButtons";
interface Props {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  viewAllHref?: string;
  movies: MovieListItem[];
  aspectRatio?: "portrait" | "landscape";
  id: string;
}
export function MovieRowSlider({
  title,
  viewAllHref,
  movies,
  aspectRatio = "portrait",
  id,
}: Props) {
  if (!movies.length) return null;
  const split = title.indexOf(" tập mới");
  return (
    <section aria-labelledby={`${id}-heading`}>
      <div className="section-heading">
        <h2 id={`${id}-heading`}>
          {split > 0 ? (
            <>
              <span className="country-highlight">{title.slice(0, split)}</span>
              {title.slice(split)}
            </>
          ) : (
            title
          )}
        </h2>
        {viewAllHref && (
          <Link
            className="row-more"
            href={viewAllHref}
            aria-label={`Xem tất cả ${title}`}
          >
            <ChevronRight size={19} />
          </Link>
        )}
        <div className="section-actions">
          <MovieRowNavButtons sliderId={id} />
        </div>
      </div>
      <div id={id} className="movie-rail relative">
        {movies.map((movie) => (
          <div key={`${movie.source}:${movie._id}`}>
            <MovieCard movie={movie} aspectRatio={aspectRatio} />
          </div>
        ))}
      </div>
    </section>
  );
}
