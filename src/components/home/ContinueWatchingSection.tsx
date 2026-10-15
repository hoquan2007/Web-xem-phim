"use client";
import Link from "next/link";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { getMovieHref } from "@/lib/api/helpers";
import { MovieCard } from "@/components/ui/MovieCard";
export function ContinueWatchingSection() {
  const { history } = useWatchHistory();
  if (!history.length) return null;
  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>Xem tiếp</h2>
          <p>Trở lại tập phim bạn đã mở gần đây.</p>
        </div>
        <Link className="text-link" href="/tu-phim">
          Lịch sử xem →
        </Link>
      </div>
      <div className="movie-rail">
        {history.slice(0, 8).map((item) => (
          <div key={`${item.source}:${item.slug}`}>
            <MovieCard
              movie={{
                ...item,
                origin_name: item.origin_name || "",
                year: 0,
                episode_current: item.episode_name,
              }}
              href={`${getMovieHref(item)}${getMovieHref(item).includes("?") ? "&" : "?"}${new URLSearchParams({ sv: String(item.active_server_index ?? 0), ep: String(item.active_episode_index ?? 0) })}`}
              aspectRatio="landscape"
            />
            <Link
              className="text-link"
              href={`${getMovieHref(item)}${getMovieHref(item).includes("?") ? "&" : "?"}${new URLSearchParams({ sv: String(item.active_server_index ?? 0), ep: String(item.active_episode_index ?? 0) })}`}
            >
              Xem tiếp {item.episode_name || ""} →
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
