import { connection } from "next/server";
import { getLatestMovies, getMoviesByCountry } from "@/lib/api";
import { getEnabledAdapters } from "@/lib/api/adapters";
import { buildHeroMovies } from "@/lib/hero-slides";
import { createPageRequestSignal } from "@/lib/api/providers";
import { HeroBanner } from "@/components/home/HeroBanner";
import { MovieRowSlider } from "@/components/home/MovieRowSlider";
import { ContinueWatchingSection } from "@/components/home/ContinueWatchingSection";
import { ApiUnavailable } from "@/components/ui/ApiUnavailable";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { HomeCollections } from "@/components/home/HomeCollections";
export const revalidate = 300;
export default async function Home() {
  await connection();
  const { signal } = createPageRequestSignal();
  const [latest, korea, china, usuk, thai] = await Promise.all([
    getLatestMovies(1, signal),
    getMoviesByCountry("han-quoc", 1, signal),
    getMoviesByCountry("trung-quoc", 1, signal),
    getMoviesByCountry("au-my", 1, signal),
    getMoviesByCountry("thai-lan", 1, signal),
  ]);
  const pool = [...korea.items, ...china.items, ...latest.items];
  const heroMovies = buildHeroMovies(
    pool,
    new Set(getEnabledAdapters().map((adapter) => adapter.id)),
  );
  const rows = [
    {
      id: "korea",
      title: "Phim Hàn Quốc tập mới",
      href: "/quoc-gia/han-quoc",
      data: korea,
    },
    {
      id: "china",
      title: "Phim Trung Quốc tập mới",
      href: "/quoc-gia/trung-quoc",
      data: china,
    },
    {
      id: "usuk",
      title: "Phim US-UK tập mới",
      href: "/quoc-gia/au-my",
      data: usuk,
    },
    {
      id: "thai",
      title: "Phim Thái Lan tập mới",
      href: "/quoc-gia/thai-lan",
      data: thai,
    },
  ];
  return (
    <div className="min-h-screen">
      {heroMovies.length ? (
        <HeroBanner movies={heroMovies} />
      ) : (
        <div className="page-shell pb-0">
          <h1 className="text-2xl font-semibold">Thế giới phim của bạn</h1>
          {latest.status === false && <ApiUnavailable message={latest.msg} />}
        </div>
      )}
      <div className="home-content">
        <ContinueWatchingSection />
        {rows.map((row) =>
          row.data.items.length ? (
            <MovieRowSlider
              key={row.id}
              id={`home-${row.id}`}
              title={row.title}
              viewAllHref={row.href}
              movies={row.data.items.slice(0, 14)}
            />
          ) : (
            <section key={row.id}>
              <div className="section-heading">
                <h2>{row.title}</h2>
              </div>
              {row.data.status === false ? (
                <ApiUnavailable message={row.data.msg} />
              ) : (
                <p className="text-muted">Chưa có phim trong nhóm này.</p>
              )}
            </section>
          ),
        )}
        <HomeCollections latest={latest.items} />
      </div>
      <ScrollToTop />
    </div>
  );
}
