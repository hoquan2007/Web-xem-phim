"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import Hls from "hls.js";
import { EpisodeItem, EpisodeServer } from "@/types/movie";
import { SafeImage } from "@/components/ui/SafeImage";
import { WatchToolbar } from "./WatchToolbar";

const subscribeHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

interface PlayerBodyProps {
  episodeKey: string;
  movieTitle: string;
  servers: EpisodeServer[];
  activeServerIndex: number;
  activeEpisodeIndex: number;
  posterUrl?: string;
  onChooseSource: () => void;
  onTryAlternative: () => void;
  onEpisodeChange: (index: number) => void;
  onReload: () => void;
  isLightOff: boolean;
  onToggleLightOff: () => void;
  onReportError?: () => void;
  onPlaybackStarted?: () => void;
}

const PlayerBody: React.FC<PlayerBodyProps> = ({
  episodeKey,
  movieTitle,
  servers,
  activeServerIndex,
  activeEpisodeIndex,
  posterUrl,
  onChooseSource,
  onTryAlternative,
  onEpisodeChange,
  onReload,
  isLightOff,
  onToggleLightOff,
  onReportError,
  onPlaybackStarted,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    clientReady,
    serverReady,
  );
  // FIX-12.1: khi HLS fail → iframe fallback (đã có ở FIX-3/FIX-8). Nếu iframe cũng
  // không load được (cross-origin block, upstream 404, CSP reject, network timeout)
  // → user thấy player trắng / banner CSP mà không có cách nào recover. Track
  // iframe load state qua timeout 10s: nếu onLoad không fire trong 10s + URL
  // có sẵn → set `iframeFailed = true` → render CTA "Server không khả dụng".
  const [iframeFailed, setIframeFailed] = useState<boolean>(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeTimer = useRef<number | null>(null);
  const iframeBlocked = useRef(false);
  const iframeLoaded = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentServer = servers[activeServerIndex];
  const currentEpisode: EpisodeItem | undefined =
    currentServer?.server_data[activeEpisodeIndex];

  const m3u8Url = currentEpisode?.link_m3u8 || null;
  const embedUrl = currentEpisode?.link_embed || null;

  const totalEpisodes = currentServer?.server_data?.length || 0;

  // Auto-select mode per episode: HLS nếu có m3u8, ngược lại iframe.
  // `modeOverride` cho phép user chuyển thủ công khi cả hai đều có sẵn.
  // Khởi tạo từ props → state tự reset khi episodeKey remount.
  const autoPlayerMode: "hls" | "iframe" = m3u8Url ? "hls" : "iframe";
  const [modeOverride, setModeOverride] = useState<"hls" | "iframe" | null>(
    null,
  );
  const playerMode = modeOverride ?? autoPlayerMode;

  // FIX-12.1: detect iframe load fail qua timeout 10s. Cross-origin iframe không
  // cho parent read content, nhưng `onLoad` sẽ fire khi iframe navigation
  // hoàn tất (kể cả kết quả là CSP block page vì browser vẫn gọi load event).
  // Nếu 10s không có onLoad → coi như fail (CSP block, network timeout, hoặc
  // upstream server chết). Reset khi PlayerBody remount (episodeKey đổi) hoặc
  // khi `handleIframeLoad` callback fires (allowed under
  // react-hooks/set-state-in-effect rule).
  useEffect(() => {
    if (playerMode !== "iframe" || !embedUrl || !hydrated) return;
    // Set timeout; sẽ bị clear khi iframe onLoad fires (xem handler bên dưới).
    const failTimer = window.setTimeout(() => {
      if (!iframeLoaded.current) setIframeFailed(true);
    }, 10000);
    iframeTimer.current = failTimer;
    const onViolation = (event: SecurityPolicyViolationEvent) => {
      if (
        event.violatedDirective === "frame-src" &&
        embedUrl.startsWith(event.blockedURI)
      ) {
        iframeBlocked.current = true;
        setIframeFailed(true);
        setIsLoading(false);
      }
    };
    document.addEventListener("securitypolicyviolation", onViolation);
    return () => {
      document.removeEventListener("securitypolicyviolation", onViolation);
      window.clearTimeout(failTimer);
    };
  }, [playerMode, embedUrl, episodeKey, hydrated]);

  const handleIframeLoad = () => {
    iframeLoaded.current = true;
    if (iframeTimer.current !== null) window.clearTimeout(iframeTimer.current);
    setIframeFailed(iframeBlocked.current);
    setIsLoading(false);
  };

  // HLS stream setup & error handling
  useEffect(() => {
    if (playerMode !== "hls" || !m3u8Url || !videoRef.current) return;

    // Defer loadSource to next tick so any stale instance from the previous
    // effect run is fully torn down before we attach a new one. This avoids
    // race conditions when toggling HLS↔iframe rapidly.
    let cancelled = false;
    let hls: Hls | null = null;
    const video = videoRef.current;

    const fallbackToIframe = () => {
      if (cancelled) return;
      setIsLoading(false);
      setModeOverride("iframe");
      if (!embedUrl) setIframeFailed(true);
    };

    // Metadata alone is not playable media; keep the guard until canplay.
    const loadTimeout = window.setTimeout(() => {
      fallbackToIframe();
    }, 12000);

    // Capture handler so we can remove it in cleanup (Safari / iOS branch).
    const onLoadedMetadata = () => {
      if (cancelled) return;
      video.play().catch(() => { /* Autoplay denial is not a source failure. */ });
    };
    const onCanPlay = () => {
      if (cancelled) return;
      window.clearTimeout(loadTimeout);
      setIsLoading(false);
    };
    video.addEventListener("canplay", onCanPlay);
    const onNativeError = () => fallbackToIframe();

    const setup = () => {
      if (cancelled) return;

      if (Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(m3u8Url);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (cancelled) return;
          video.play().catch(() => { /* Native controls remain available. */ });
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (cancelled) return;
          if (data.fatal) {
            console.warn(
              "HLS fatal error, falling back to iframe embed:",
              data,
            );
            fallbackToIframe();
          }
        });
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = m3u8Url;
        video.addEventListener("loadedmetadata", onLoadedMetadata);
        video.addEventListener("error", onNativeError);
      } else {
        fallbackToIframe();
      }
    };

    // Defer one tick so React has a chance to attach / detach the underlying
    // <video> element if we are racing with a sibling effect.
    const rafId = window.requestAnimationFrame(setup);

    return () => {
      cancelled = true;
      window.clearTimeout(loadTimeout);
      window.cancelAnimationFrame(rafId);
      // Safari / iOS branch listener leak fix: capture was hoisted, now remove.
      // Guard: videoRef.current có thể null lúc cleanup (nếu effect cuối cùng
      // chạy là HLS nhưng element đã bị React unmount ngay trước đó).
      if (video) {
        video.removeEventListener("canplay", onCanPlay);
        video.removeEventListener("loadedmetadata", onLoadedMetadata);
        video.removeEventListener("error", onNativeError);
      }
      if (hls) {
        try {
          hls.destroy();
        } catch {
          // ignore: hls.js có thể throw nếu chưa attach xong khi effect bị huỷ
        }
      }
    };
  }, [playerMode, m3u8Url, embedUrl, episodeKey]);

  const handleReload = () => { onReload(); };
  const switchPlayer = () => {
    setIsLoading(true);
    setIframeFailed(false);
    iframeLoaded.current = false;
    iframeBlocked.current = false;
    setModeOverride(playerMode === "hls" ? "iframe" : "hls");
  };

  return (
    <div className={"watch-player-shell" + (isLightOff ? " is-lights-off" : "")}>
      {isLightOff && <button type="button" aria-label="Bật lại đèn" className="watch-dimmer" onClick={onToggleLightOff} />}
      <div className="rp-player-frame">
        <div className="watch-video-stage">
          {isLoading && !iframeFailed && (m3u8Url || embedUrl) && (
            <div className="watch-loading" role="status">
              {posterUrl && <SafeImage src={posterUrl} alt="" fill loading="eager" sizes="(min-width: 1504px) 1440px, 100vw" className="watch-loading-poster" />}
              <div className="watch-loading-copy"><span className="watch-loading-spinner" /><span>Đang tải phim…</span></div>
            </div>
          )}
          {playerMode === "hls" && m3u8Url ? (
            <video key={"video-" + episodeKey} ref={videoRef} controls autoPlay playsInline poster={posterUrl}
              className="watch-video" onCanPlay={() => setIsLoading(false)} onPlaying={onPlaybackStarted} />
          ) : playerMode === "iframe" && iframeFailed ? (
            <div className="watch-player-message" role="alert">
              <AlertCircle size={32} />
              <h2>Không thể phát video</h2>
              <p>Vui lòng thử lại hoặc chọn nguồn khác.</p>
              <div className="watch-recovery-actions">
                <button type="button" className="watch-tool-button" onClick={handleReload}><RefreshCw size={17} />Thử lại</button>
                <button type="button" className="watch-tool-button" onClick={onChooseSource}>Chọn nguồn khác</button>
                <button type="button" className="watch-tool-button" onClick={onTryAlternative}>Thử nguồn cùng tập</button>
                {onReportError && <button type="button" className="watch-tool-button" onClick={onReportError}>Tạo báo cáo sự cố</button>}
              </div>
            </div>
          ) : embedUrl ? (
            <iframe key={"iframe-" + episodeKey} ref={iframeRef} src={hydrated ? embedUrl : undefined}
              title={movieTitle + " - " + (currentEpisode?.name || "")} className="watch-video" allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="no-referrer" onLoad={hydrated ? handleIframeLoad : undefined} />
          ) : (
            <div className="watch-player-message">
              <AlertCircle size={32} /><h2>{currentEpisode ? 'Tập này đang chờ nguồn phát' : 'Chưa có tập phim để phát'}</h2>
              <p>Vui lòng chọn nguồn khác hoặc quay lại sau.</p>
              <button type="button" className="watch-tool-button" onClick={onChooseSource}>Xem danh sách tập</button>
            </div>
          )}
        </div>
        {playerMode === "iframe" && embedUrl && !iframeFailed && (
          <div className="watch-frame-recovery">
            <button type="button" className="watch-tool-button" onClick={onTryAlternative}>Thử nguồn cùng tập</button>
          </div>
        )}
        <WatchToolbar episodeName={currentEpisode?.name} episodeIndex={activeEpisodeIndex} episodeCount={totalEpisodes}
          onEpisodeChange={onEpisodeChange} isLightOff={isLightOff} onToggleLightOff={onToggleLightOff}
          onChooseSource={onChooseSource} onReload={handleReload}
          onSwitchPlayer={m3u8Url && embedUrl ? switchPlayer : undefined} playerMode={playerMode} onReportError={onReportError} />
      </div>
    </div>
  );
};
// Outer VideoPlayer: owns the persistent controls (prev/next/episode change) and
// `reloadKey`. Bọc PlayerBody với key thay đổi khi đổi tập/server/reload → React
// reset toàn bộ state bên trong (isLoading, modeOverride) thay vì
// phải sync bằng useEffect (bị react-hooks/set-state-in-effect rule cấm).
export const VideoPlayer: React.FC<
  Omit<PlayerBodyProps, "episodeKey" | "onReload">
> = (props) => {
  const { activeServerIndex, activeEpisodeIndex } = props;
  const [reloadKey, setReloadKey] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (reloadKey) root.current?.querySelector<HTMLButtonElement>("[data-watch-reload]")?.focus({ preventScroll: true });
  }, [reloadKey]);
  const episodeKey = `${activeServerIndex}:${activeEpisodeIndex}:${reloadKey}`;

  return (
    <div ref={root}><PlayerBody
      key={episodeKey}
      {...props}
      episodeKey={episodeKey}
      onReload={() => setReloadKey((prev) => prev + 1)}
    /></div>
  );
};
