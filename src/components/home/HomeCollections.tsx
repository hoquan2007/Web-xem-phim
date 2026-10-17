import { Suspense } from "react";
import { RankedMovieRow } from "./RankedMovieRow";
import { FeaturedCollection } from "./FeaturedCollection";
import { MovieRowSlider } from "./MovieRowSlider";
import {
  curatedMovies,
  getFeaturedMovies,
  getHomeFeed,
  getRankedMovies,
  type HomeFeed,
} from "@/lib/home-collections";
import type { MovieListItem } from "@/types/movie";

function RowLoading({ title }: { title: string }) {
  return (
    <section
      className="home-collection-loading"
      aria-label={`Đang tải ${title}`}
    >
      <div className="section-heading">
        <h2>{title}</h2>
      </div>
      <div className="h-48 rounded-xl bg-white/5" />
    </section>
  );
}

async function Ranked({ kind }: { kind: "series" | "single" }) {
  const movies = await getRankedMovies(kind);
  if (!movies.length) return null;
  return (
    <RankedMovieRow
      id={`home-ranked-${kind}`}
      title={`${movies.length} Phim ${kind === "series" ? "Bộ" : "Lẻ"} Nổi Bật`}
      movies={movies}
    />
  );
}

async function Featured({ kind }: { kind: "anime" | "tv" }) {
  return (
    <FeaturedCollection
      id={`home-featured-${kind}`}
      title={kind === "anime" ? "Hoạt Hình Anime Hay" : "TV Shows Truyền Hình"}
      viewAllHref={
        kind === "anime"
          ? "/c/phim-hoat-hinh-anime"
          : "/c/tv-shows-chuong-trinh-truyen-hinh"
      }
      movies={await getFeaturedMovies(kind)}
    />
  );
}

async function FeedRow({
  kind,
  title,
  href,
}: {
  kind: HomeFeed;
  title: string;
  href: string;
}) {
  return (
    <MovieRowSlider
      id={`home-feed-${kind}`}
      title={title}
      viewAllHref={href}
      movies={(await getHomeFeed(kind)).slice(0, 14)}
    />
  );
}

export function HomeCollections({ latest }: { latest: MovieListItem[] }) {
  const picks = curatedMovies("recommendations", latest, 12);
  return (
    <>
      <Suspense fallback={<RowLoading title="Phim Bộ Nổi Bật" />}>
        <Ranked kind="series" />
      </Suspense>
      <Suspense fallback={<RowLoading title="Phim Lẻ Nổi Bật" />}>
        <Ranked kind="single" />
      </Suspense>
      <Suspense fallback={<RowLoading title="Phim Chiếu Rạp Mới" />}>
        <FeedRow
          kind="cinema"
          title="Phim Chiếu Rạp Mới"
          href="/c/phim-chieu-rap-moi"
        />
      </Suspense>
      <Suspense fallback={<RowLoading title="Phim Bộ Mới Nhất" />}>
        <FeedRow kind="series" title="Phim Bộ Mới Nhất" href="/phim-bo" />
      </Suspense>
      <MovieRowSlider
        id="home-editorial-picks"
        title="PTQ Đề Cử"
        movies={picks}
      />
      <Suspense fallback={<RowLoading title="Hoạt Hình Anime Hay" />}>
        <Featured kind="anime" />
      </Suspense>
      <Suspense fallback={<RowLoading title="Hoạt Hình Mới Cập Nhật" />}>
        <FeedRow
          kind="hoathinh"
          title="Hoạt Hình Mới Cập Nhật"
          href="/c/phim-hoat-hinh-anime"
        />
      </Suspense>
      <Suspense fallback={<RowLoading title="Phim Kinh Dị" />}>
        <FeedRow kind="horror" title="Phim Kinh Dị" href="/the-loai/kinh-di" />
      </Suspense>
      <Suspense fallback={<RowLoading title="TV Shows Truyền Hình" />}>
        <Featured kind="tv" />
      </Suspense>
    </>
  );
}
