import { generateMovieMetadata, renderMovieRoute, MoviePageProps } from "@/components/watch/MovieRoute";

export const generateMetadata = generateMovieMetadata;

export default async function WatchPage(props: MoviePageProps) {
  return renderMovieRoute(props, true);
}
