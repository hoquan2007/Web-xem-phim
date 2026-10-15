import type { MovieListItem } from "@/types/movie";
export function movieRating(movie: Pick<MovieListItem, "tmdb">): string | null {
  const value = Number(movie.tmdb?.vote_average);
  return Number.isFinite(value) && value > 0 && value <= 10
    ? value.toFixed(1)
    : null;
}
export function episodeLabel(name?: string): string {
  if (!name) return "Chưa có tập";
  return /^tập\s/i.test(name) ? name : `Tập ${name}`;
}
