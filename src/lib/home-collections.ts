import "server-only";
import { cache } from "react";
import editorial from "@/data/home-collections.json";
import { getFilteredMovies } from "@/lib/api";
import { getEnabledAdapters } from "@/lib/api/adapters";
import { movieIdentity } from "@/lib/api/helpers";
import { createPageRequestSignal } from "@/lib/api/providers";
import type { MovieListItem } from "@/types/movie";
import type { FeaturedMovie } from "@/components/home/FeaturedCollection";

export type HomeFeed =
  "series" | "single" | "hoathinh" | "tvshows" | "cinema" | "horror";

// Primitive cache keys let separate streamed sections share a single request.
export const getHomeFeed = cache(async (kind: HomeFeed) => {
  const { signal } = createPageRequestSignal();
  const result = await getFilteredMovies(
    {
      ...(kind === "horror"
        ? { category: "kinh-di" }
        : { type: kind === "cinema" ? "phim-chieu-rap" : kind }),
      page: 1,
      limit: 40,
    },
    signal,
  );
  const items = uniqueMovies(result.items);
  return kind === "cinema"
    ? items.filter((movie) => movie.chieurap === true)
    : items;
});

export function uniqueMovies(movies: MovieListItem[]): MovieListItem[] {
  const seen = new Set<string>();
  return movies.filter((movie) => {
    const identity = movieIdentity(movie) || `${movie.source}:${movie.slug}`;
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

type EditorialKey = keyof typeof editorial.collections;
export function curatedMovies(
  key: EditorialKey,
  fresh: MovieListItem[],
  limit: number,
): FeaturedMovie[] {
  const enabled = new Set(getEnabledAdapters().map((adapter) => adapter.id));
  const validFresh = fresh.filter(
    (movie) => movie.source && enabled.has(movie.source),
  );
  const picks = editorial.collections[key].movies.flatMap((entry) => {
    const saved = entry.movie as FeaturedMovie;
    const identity = movieIdentity(saved);
    const current = validFresh.find(
      (movie) =>
        (movie.source === saved.source && movie.slug === saved.slug) ||
        Boolean(identity && movieIdentity(movie) === identity),
    );
    if (!current && (!saved.source || !enabled.has(saved.source))) return [];
    const movie = {
      ...saved,
      ...current,
      content: current?.content || saved.content,
    };
    if (process.env.API_MOCK === "1") {
      movie.poster_url = "/images/placeholder.svg";
      movie.thumb_url = "/images/placeholder.svg";
    }
    return [movie];
  });
  return uniqueMovies([...picks, ...validFresh]).slice(0, limit);
}

export async function getRankedMovies(kind: "series" | "single") {
  const movies = await getHomeFeed(kind);
  return curatedMovies(kind === "series" ? "series" : "movies", movies, 30);
}

export async function getFeaturedMovies(kind: "anime" | "tv") {
  const movies = await getHomeFeed(kind === "anime" ? "hoathinh" : "tvshows");
  return curatedMovies(kind, movies, 8);
}
