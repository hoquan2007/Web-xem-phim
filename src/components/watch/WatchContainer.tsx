"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { episodeLabel } from "@/lib/movie-presentation";
import { stripAllHtml } from "@/lib/sanitize";
import React, { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MovieDetail, EpisodeServer, MovieListItem } from "@/types/movie";
import { useWatchHistory } from "@/hooks/useWatchHistory";
import { VideoPlayer } from "./VideoPlayer";
import { EpisodeSelector } from "./EpisodeSelector";
import { WatchMovieSummary } from "./WatchMovieSummary";
import { getImageUrl, getMovieHref } from "@/lib/api/helpers";
import { RelatedMovies } from "./RelatedMovies";
import { CommentSection } from "./CommentSection";
import { ReportModal } from "./ReportModal";
import "@/components/sites/rophim/detail.css";
import "./watch.css";

interface WatchContainerProps {
  movie: MovieDetail;
  episodes: EpisodeServer[];
  relatedMovies: MovieListItem[];
}

export const WatchContainer: React.FC<WatchContainerProps> = ({
  movie,
  episodes,
  relatedMovies,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);
  const lastSavedPlaybackRef = useRef<string | null>(null);
  const { saveWatchHistory } = useWatchHistory();

  const initialServer = parseInt(searchParams.get("sv") || "0", 10);
  const initialEp = parseInt(searchParams.get("ep") || "0", 10);

  const activeServerIndex =
    isNaN(initialServer) ||
    initialServer < 0 ||
    initialServer >= episodes.length
      ? 0
      : initialServer;

  const currentServerData = episodes[activeServerIndex]?.server_data || [];
  const activeEpisodeIndex =
    isNaN(initialEp) || initialEp < 0 || initialEp >= currentServerData.length
      ? 0
      : initialEp;

  const [isLightOff, setIsLightOff] = useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [sourceNotice, setSourceNotice] = useState("");
  useEffect(() => {
    if (!isLightOff) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) setIsLightOff(false);
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [isLightOff]);

  // Update URL query params on server/episode selection
  const updateUrlParams = (serverIdx: number, epIdx: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sv", String(serverIdx));
    params.set("ep", String(epIdx));
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleServerChange = (index: number) => {
    const previous = currentServerData[activeEpisodeIndex];
    const target = episodes[index]?.server_data ?? [];
    const key = (name: string) => name.toLocaleLowerCase("vi").trim().replace(/^tập\s*/i, "").replace(/^0+(?=\d)/, "");
    const matching = previous ? target.findIndex((episode) => key(episode.name) === key(previous.name)) : -1;
    if (target.length) handleSaveHistory("click", index, Math.max(0, matching));
    setSourceNotice(matching < 0 && previous && target.length ? "Nguồn này không có tập đang xem. Đã chọn tập đầu tiên có sẵn." : target.length ? "" : "Nguồn này chưa có tập phim.");
    updateUrlParams(index, Math.max(0, matching));
  };

  const handleEpisodeChange = (index: number) => {
    if (index < 0 || index >= currentServerData.length) return;
    setSourceNotice("");
    handleSaveHistory("click", activeServerIndex, index);
    updateUrlParams(activeServerIndex, index);
    scrollToPlayer();
  };

  const scrollToPlayer = () => {
    if (playerRef.current) {
      playerRef.current.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
        block: "start",
      });
    }
  };

  // Explicit episode/source selection also records intent for iframe players,
  // whose cross-origin play events cannot be observed by the parent page.
  const handleSaveHistory = (intent: "click" | "play", serverIndex = activeServerIndex, episodeIndex = activeEpisodeIndex) => {
    const currentEp =
      episodes[serverIndex]?.server_data[episodeIndex];
    if (!currentEp) return;

    const playbackKey = `${movie.slug}:${serverIndex}:${episodeIndex}`;
    if (lastSavedPlaybackRef.current === playbackKey) return;
    lastSavedPlaybackRef.current = playbackKey;

    saveWatchHistory({
      _id: movie._id,
      source: movie.source,
      tmdb: movie.tmdb,
      name: movie.name,
      origin_name: movie.origin_name,
      slug: movie.slug,
      poster_url: movie.poster_url,
      thumb_url: movie.thumb_url,
      episode_name: currentEp.name || "Tập 1",
      server_name: episodes[serverIndex]?.server_name || "Server 1",
      active_server_index: serverIndex,
      active_episode_index: episodeIndex,
      watched_at: new Date().toISOString(),
      started_via: intent,
    });
  };

  const chooseSource = () => {
    if (isLightOff) setIsLightOff(false);
    sourceRef.current?.scrollIntoView({ behavior: "instant", block: "center" });
    const destination = sourceRef.current?.querySelector<HTMLButtonElement>("#watch-source") ?? sourceRef.current?.querySelector<HTMLHeadingElement>("h2");
    destination?.focus({ preventScroll: true });
  };

  return (
    <div className="rp-watch-page">
      <div className="watch-titlebar">
        <div><h1 id="watch-movie-title">{movie.name}</h1><span>{currentServerData.length === 1 ? "Bản đầy đủ" : currentServerData.length ? episodeLabel(currentServerData[activeEpisodeIndex]?.name) : "Chưa có tập"}</span></div>
        <Link href={getMovieHref(movie)} aria-label={"Chi tiết phim " + movie.name}><span>Chi tiết phim</span><ArrowUpRight size={18} /></Link>
      </div>
      <div className="watch-layout" data-testid="watch-layout">
        <div ref={playerRef} className="watch-player">
          <VideoPlayer movieTitle={movie.name} posterUrl={getImageUrl(movie.thumb_url || movie.poster_url)}
            servers={episodes} activeServerIndex={activeServerIndex} activeEpisodeIndex={activeEpisodeIndex}
            onChooseSource={chooseSource} onEpisodeChange={handleEpisodeChange}
            isLightOff={isLightOff} onToggleLightOff={() => setIsLightOff(!isLightOff)}
            onReportError={() => setIsReportOpen(true)} onPlaybackStarted={() => handleSaveHistory("play")} />
        </div>
      </div>
      <div className={"watch-content" + (relatedMovies.length ? " has-recommendations" : "")}>
        <div className="watch-main-column">
          <WatchMovieSummary movie={movie} />
          <div className="watch-episodes" ref={sourceRef}>
            <p className="watch-source-notice" role="status">{sourceNotice}</p>
            <EpisodeSelector key={activeServerIndex + ":" + Math.floor(activeEpisodeIndex / 50)}
              servers={episodes} activeServerIndex={activeServerIndex} activeEpisodeIndex={activeEpisodeIndex}
              onSelectServer={handleServerChange} onSelectEpisode={handleEpisodeChange} />
          </div>
          <details className="watch-info-disclosure">
            <summary>Thông tin phim</summary>
            <p>{stripAllHtml(movie.content) || "Chưa có giới thiệu cho phim này."}</p>
            <dl className="watch-film-facts">
              {!!movie.category?.length && <div><dt>Thể loại</dt><dd>{movie.category.map(item => <Link key={item.slug} href={"/the-loai/" + item.slug}>{item.name}</Link>)}</dd></div>}
              {!!movie.country?.length && <div><dt>Quốc gia</dt><dd>{movie.country.map(item => <Link key={item.slug} href={"/quoc-gia/" + item.slug}>{item.name}</Link>)}</dd></div>}
              {!!movie.director?.length && <div><dt>Đạo diễn</dt><dd>{movie.director.join(", ")}</dd></div>}
              {!!movie.actor?.length && <div><dt>Diễn viên</dt><dd>{movie.actor.join(", ")}</dd></div>}
              {movie.time && <div><dt>Thời lượng</dt><dd>{movie.time}</dd></div>}
            </dl>
          </details>
          <details className="watch-notes-disclosure">
            <summary>Ghi chú cá nhân<span>Chỉ lưu trên thiết bị này</span></summary>
            <CommentSection movieSlug={movie.slug} movieTitle={movie.name} />
          </details>
        </div>
        {relatedMovies.length > 0 && <aside className="watch-recommendations">
          <RelatedMovies movies={relatedMovies} title="Có thể bạn thích" compact />
        </aside>}
      </div>
      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)}
        movieTitle={movie.name} episodeName={currentServerData[activeEpisodeIndex]?.name || "Tập 1"} />
    </div>
  );
};
