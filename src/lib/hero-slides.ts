import reference from "@/data/hero-slides.json";
import type { MovieListItem } from "@/types/movie";

export type HeroMovie = MovieListItem & {
  heroVideoSrc?: string;
  heroPosterSrc?: string;
  heroHref?: string;
  heroCountry?: string;
};
const normalizeTitle = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]/g, "");

/** Editorial playlist is independent of the constantly changing latest-movie feed. */
export function buildHeroMovies(
  catalogue: MovieListItem[],
  enabledProviders: ReadonlySet<string>,
): HeroMovie[] {
  return reference.slides.map((entry) => {
    const snapshot = entry.providerMovie as MovieListItem | null;
    const current = catalogue.find(
      (movie) =>
        enabledProviders.has(movie.source || "") &&
        (normalizeTitle(movie.origin_name) ===
          normalizeTitle(entry.originalTitle) ||
          normalizeTitle(movie.name) === normalizeTitle(entry.title)),
    );
    const movie =
      current ||
      (snapshot?.source && enabledProviders.has(snapshot.source)
        ? snapshot
        : null);
    return {
      ...(movie || {
        _id: `hero:${entry.id}`,
        slug: entry.slug,
        poster_url: entry.posterSrc,
        thumb_url: entry.posterSrc,
      }),
      name: entry.title,
      origin_name: entry.originalTitle,
      year: movie?.year || entry.year,
      episode_current: movie?.episode_current || entry.episode,
      content: entry.description,
      heroVideoSrc: entry.videoSrc,
      heroPosterSrc: entry.posterSrc,
      heroCountry: entry.country,
      // A disabled provider must never be resurrected by a saved editorial snapshot.
      heroHref: movie
        ? undefined
        : `/tim-kiem?keyword=${encodeURIComponent(entry.title)}`,
    };
  });
}
