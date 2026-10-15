"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Play, Server } from "lucide-react";
import { EpisodeServer, MovieDetail, MovieListItem } from "@/types/movie";
import { getImageUrl, getImageFallbackChain } from "@/lib/api/helpers";
import { episodeLabel } from "@/lib/movie-presentation";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { SafeImage } from "@/components/ui/SafeImage";
import { MovieDetailInfo } from "./MovieDetailInfo";
import { MovieActions } from "./MovieActions";
import { CommentSection } from "./CommentSection";
import { RelatedMovies } from "./RelatedMovies";
import "@/components/sites/rophim/detail.css";

const tabs = ["Tập Phim", "Trailer & Photos", "Diễn Viên", "Phim tương tự"];

export function MovieDetailPage({
  movie,
  episodes,
  relatedMovies,
}: {
  movie: MovieDetail;
  episodes: EpisodeServer[];
  relatedMovies: MovieListItem[];
}) {
  const [tab, setTab] = useState(0);
  const [serverIndex, setServerIndex] = useState(0);
  const notes = useRef<HTMLDivElement>(null);
  const search = useSearchParams();
  const { saveWatchHistory } = useWatchHistory();
  const watchHref = (server: number, episode: number) => {
    const query = new URLSearchParams(search.toString());
    query.set("sv", String(server));
    query.set("ep", String(episode));
    return `/xem-phim/${encodeURIComponent(movie.slug)}?${query}`;
  };
  const saveIntent = (server: number, episode: number) => {
    const selected = episodes[server]?.server_data[episode];
    if (!selected) return;
    saveWatchHistory({
      ...movie,
      episode_name: selected.name,
      server_name: episodes[server].server_name,
      active_server_index: server,
      active_episode_index: episode,
      watched_at: new Date().toISOString(),
      started_via: "click",
    });
  };
  const backdrop = getImageUrl(movie.thumb_url || movie.poster_url);
  const trailer =
    movie.trailer_url && /^https?:\/\//i.test(movie.trailer_url)
      ? movie.trailer_url
      : null;
  return (
    <div className="rp-detail-page">
      <div className="rp-detail-backdrop">
        <SafeImage
          src={backdrop}
          fallbackUrls={getImageFallbackChain(backdrop)}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div />
      </div>
      <div className="rp-detail-body">
        <aside className="rp-detail-sidebar">
          <MovieDetailInfo movie={movie} sidebar />
        </aside>
        <div className="rp-detail-main">
          <MovieActions
            movie={movie}
            watchHref={episodes.length ? watchHref(0, 0) : undefined}
            onWatchClick={episodes.length ? () => saveIntent(0, 0) : undefined}
            onNotesClick={() =>
              notes.current?.scrollIntoView({
                behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches
                  ? "instant"
                  : "smooth",
                block: "start",
              })
            }
          />
          <div
            className="rp-detail-tabs"
            role="tablist"
            aria-label="Thông tin phim"
          >
            {tabs.map((label, index) => (
              <button
                id={`movie-tab-${index}`}
                aria-controls={`movie-panel-${index}`}
                key={label}
                role="tab"
                aria-selected={tab === index}
                tabIndex={tab === index ? 0 : -1}
                onClick={() => setTab(index)}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
                    return;
                  event.preventDefault();
                  const next =
                    (index +
                      (event.key === "ArrowRight" ? 1 : -1) +
                      tabs.length) %
                    tabs.length;
                  setTab(next);
                  document.getElementById(`movie-tab-${next}`)?.focus();
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div
            className="rp-detail-panel"
            role="tabpanel"
            id={`movie-panel-${tab}`}
            aria-labelledby={`movie-tab-${tab}`}
          >
            {tab === 0 && (
              <>
                <h2 className="rp-panel-heading">Danh sách tập</h2>
                {!episodes.length ? (
                  <p className="rp-empty-state">
                    Phim chưa có tập phát. Vui lòng quay lại sau.
                  </p>
                ) : (
                  <>
                    <div className="rp-source-cards">
                      {episodes.map((server, index) => (
                        <button
                          key={`${server.server_name}:${index}`}
                          aria-pressed={serverIndex === index}
                          onClick={() => setServerIndex(index)}
                        >
                          <SafeImage
                            src={backdrop}
                            fallbackUrls={getImageFallbackChain(backdrop)}
                            alt=""
                            fill
                            sizes="294px"
                            className="object-cover"
                          />
                          <span className="rp-source-caption">
                            <strong>
                              <Server size={20} />
                              {server.server_name || `Nguồn ${index + 1}`}
                            </strong>
                            <small>
                              {movie.lang ||
                                (server.server_type === "hls"
                                  ? "Phát trực tiếp"
                                  : "Phát nhúng")}
                            </small>
                            <small>
                              Chọn nguồn
                              {serverIndex === index ? " · Đang chọn" : ""}
                            </small>
                          </span>
                        </button>
                      ))}
                    </div>
                    <div className="rp-detail-episodes">
                      {episodes[serverIndex]?.server_data.map(
                        (episode, index) => (
                          <Link
                            key={`${episode.slug}:${index}`}
                            href={watchHref(serverIndex, index)}
                            onClick={() => saveIntent(serverIndex, index)}
                          >
                            <Play size={15} fill="currentColor" />
                            {episodeLabel(episode.name)}
                          </Link>
                        ),
                      )}
                    </div>
                  </>
                )}
              </>
            )}
            {tab === 1 && (
              <div className="rp-trailer-panel">
                <h2 className="rp-panel-heading">Trailer & Photos</h2>
                {trailer ? (
                  <a
                    href={trailer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rp-trailer-link"
                  >
                    <Play size={18} />
                    Xem trailer
                    <ArrowUpRight size={16} />
                  </a>
                ) : (
                  <p className="rp-empty-state">
                    Phim chưa có trailer từ nguồn cung cấp.
                  </p>
                )}
                <div className="rp-detail-photo">
                  <SafeImage
                    src={backdrop}
                    fallbackUrls={getImageFallbackChain(backdrop)}
                    alt={`Hình ảnh ${movie.name}`}
                    fill
                    sizes="(min-width: 1024px) 70vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </div>
            )}
            {tab === 2 && (
              <>
                <h2 className="rp-panel-heading">Diễn viên</h2>
                {movie.actor?.length ? (
                  <ul className="rp-actor-list">
                    {movie.actor.map((actor) => (
                      <li key={actor}>{actor}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="rp-empty-state">Chưa có thông tin diễn viên.</p>
                )}
              </>
            )}
            {tab === 3 && (
              <RelatedMovies movies={relatedMovies} title="Phim tương tự" />
            )}
          </div>
          <details className="rp-mobile-summary">
            <summary>Giới thiệu phim</summary>
            <MovieDetailInfo movie={movie} detailsOnly />
          </details>
          <div ref={notes} className="rp-detail-notes">
            <CommentSection movieSlug={movie.slug} movieTitle={movie.name} />
          </div>
          {tab !== 3 && <RelatedMovies movies={relatedMovies} />}
        </div>
      </div>
    </div>
  );
}
