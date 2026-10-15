"use client";
import { useState, useId } from "react";
import { MovieListItem } from "@/types/movie";
import { MovieCard } from "@/components/ui/MovieCard";
import MovieRowNavButtons from "./MovieRowNavButtons";
export function TopMoviesRankSection({
  title = "Thêm một lựa chọn cho tối nay",
  movies,
  weekMovies = [],
  monthMovies = [],
}: {
  title?: string;
  movies: MovieListItem[];
  weekMovies?: MovieListItem[];
  monthMovies?: MovieListItem[];
}) {
  const [group, setGroup] = useState(0);
  const id = useId();
  const groups = [
    { name: "Mới cập nhật", items: movies },
    { name: "Phim châu Á", items: weekMovies },
    { name: "Điện ảnh", items: monthMovies },
  ];
  if (!movies.length && !weekMovies.length && !monthMovies.length) return null;
  const selected = groups[group];
  const seen = new Set<string>();
  const items = selected.items
    .filter((m) => {
      const key = `${m.source}:${m.slug}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 10);
  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>Khám phá thêm từ kho phim PTQ.</p>
        </div>
        <MovieRowNavButtons sliderId={id} />
      </div>
      <div className="topic-links mb-5" aria-label="Nhóm phim gợi ý">
        {groups.map((g, i) => (
          <button
            key={g.name}
            className={`film-button ${i === group ? "primary" : ""}`}
            aria-pressed={i === group}
            onClick={() => setGroup(i)}
          >
            {g.name}
          </button>
        ))}
      </div>
      <div id={id} className="movie-rail">
        {items.length ? (
          items.map((movie) => (
            <MovieCard key={`${movie.source}:${movie._id}`} movie={movie} />
          ))
        ) : (
          <p className="text-sm text-muted">Nhóm này chưa có phim.</p>
        )}
      </div>
    </section>
  );
}
