import { MovieListItem } from "@/types/movie";
import { MovieCard } from "@/components/ui/MovieCard";
export function RelatedMovies({
  movies,
  title = "Có thể bạn thích",
}: {
  movies: MovieListItem[];
  title?: string;
}) {
  if (!movies.length) return null;
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
