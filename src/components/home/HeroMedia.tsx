"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";

const motionPreference = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const serverMotionPreference = () => true;
const subscribeMotion = (listener: () => void) => {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
};

export function HeroMedia({
  videoSrc,
  image,
  fallbacks,
  preload,
  muted,
  onMutedChange,
}: {
  videoSrc?: string;
  image: string;
  fallbacks: string[];
  preload: boolean;
  muted: boolean;
  onMutedChange: (muted: boolean) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);
  const [allowMotion, setAllowMotion] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [playAttempt, setPlayAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    motionPreference,
    serverMotionPreference,
  );
  const shouldPause = paused || (reducedMotion && !allowMotion);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc) return;
    if (video.getAttribute("src") !== videoSrc) video.src = videoSrc;
    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [videoSrc]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    const play = async () => {
      video.muted = muted;
      try {
        await video.play();
      } catch (error) {
        if (
          cancelled ||
          (error instanceof DOMException && error.name === "AbortError")
        )
          return;
        if (
          !video.muted &&
          error instanceof DOMException &&
          error.name === "NotAllowedError"
        ) {
          video.muted = true;
          onMutedChange(true);
          try {
            await video.play();
          } catch {
            if (!cancelled) setBlocked(true);
          }
        } else setBlocked(true);
      }
    };
    if (shouldPause) video.pause();
    else void play();
    return () => {
      cancelled = true;
      video.pause();
    };
  }, [videoSrc, shouldPause, muted, onMutedChange, playAttempt]);

  return (
    <>
      <div className="hero-image">
        <SafeImage
          src={image}
          fallbackUrls={fallbacks}
          alt=""
          fill
          sizes="100vw"
          preload={preload}
          className="object-cover"
        />
        {videoSrc && !failed && (
          <video
            ref={videoRef}
            src={videoSrc}
            poster={image}
            muted={muted}
            autoPlay={!shouldPause}
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            className={ready ? "hero-video-ready" : undefined}
            onLoadedData={() => setReady(true)}
            onPlaying={() => {
              setReady(true);
              setBlocked(false);
            }}
            onError={() => setFailed(true)}
          />
        )}
      </div>
      {videoSrc && !failed && (
        <div className="hero-media-controls">
          <button
            aria-label={muted ? "Bật âm thanh trailer" : "Tắt âm thanh trailer"}
            onClick={() => onMutedChange(!muted)}
          >
            {muted ? <VolumeX size={21} /> : <Volume2 size={21} />}
          </button>
          <button
            aria-label={
              shouldPause || blocked ? "Phát trailer" : "Tạm dừng trailer"
            }
            onClick={() => {
              setAllowMotion(true);
              setPaused(!(shouldPause || blocked));
              setBlocked(false);
              setPlayAttempt((attempt) => attempt + 1);
            }}
          >
            {shouldPause || blocked ? <Play size={17} /> : <Pause size={17} />}
          </button>
        </div>
      )}
    </>
  );
}
