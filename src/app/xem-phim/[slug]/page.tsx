import { generateMovieMetadata, renderMovieRoute, MoviePageProps } from "@/components/watch/MovieRoute";

export async function generateMetadata(props: MoviePageProps) {
  return { ...await generateMovieMetadata(props), robots: { index: false, follow: true } };
}

export default async function WatchPage(props: MoviePageProps) {
  return renderMovieRoute(props, true);
}
