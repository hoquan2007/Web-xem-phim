"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { MovieListItem } from "@/types/movie";
import {
  getImageUrl,
  getImageFallbackChain,
  getMovieHref,
} from "@/lib/api/helpers";
import { SafeImage } from "@/components/ui/SafeImage";
import "./movie-train.css";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export interface TrainLane {
  id: string;
  label: string;
  movies: MovieListItem[];
  /** -1 runs right-to-left, 1 runs left-to-right. */
  direction: -1 | 1;
}

/** Seconds one poster takes to pass a point at cruising speed. */
const SECONDS_PER_CAR = 3.4;

function TrainCar({ movie, clone }: { movie: MovieListItem; clone: boolean }) {
  const src = getImageUrl(movie.poster_url || movie.thumb_url);
  return (
    <li className="train-car" aria-hidden={clone || undefined}>
      <Link
        href={getMovieHref(movie)}
        tabIndex={clone ? -1 : undefined}
        title={movie.name}
      >
        <span className="train-window">
          <SafeImage
            src={src}
            fallbackUrls={getImageFallbackChain(src)}
            alt={clone ? "" : movie.name}
            fill
            sizes="(min-width:768px) 160px, 116px"
            className="object-cover"
          />
          {movie.episode_current && (
            <span className="train-ticket">{movie.episode_current}</span>
          )}
        </span>
        <span className="train-name">{movie.name}</span>
      </Link>
    </li>
  );
}

/**
 * "Đoàn tàu phim": each lane is an endless train of posters coupled together on a
 * rail. Scrolling makes the trains speed up in their direction of travel; hovering
 * or focusing a lane brings it to a stop. Under reduced motion (or before JS) the
 * lane is a plain horizontally scrollable list without the cloned cars.
 */
export function MovieTrain({ lanes }: { lanes: TrainLane[] }) {
  const rootRef = useRef<HTMLElement>(null);
  const [running, setRunning] = useState(false);
  const usable = lanes.filter((lane) => lane.movies.length >= 4);

  useGSAP(
    (_context, contextSafe) => {
      const root = rootRef.current;
      if (
        !root ||
        !contextSafe ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;
      setRunning(true);

      const trains = gsap.utils
        .toArray<HTMLElement>(".train-track", root)
        .map((track) => {
          const direction = Number(track.dataset.direction) || -1;
          const cars = Number(track.dataset.cars) || 1;
          const tween = gsap.fromTo(
            track,
            { xPercent: direction < 0 ? 0 : -50 },
            {
              xPercent: direction < 0 ? -50 : 0,
              duration: cars * SECONDS_PER_CAR,
              ease: "none",
              repeat: -1,
            },
          );
          return { lane: track.parentElement as HTMLElement, tween, held: false };
        });

      // Scroll velocity becomes extra speed, then eases back to cruising.
      ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        onUpdate: contextSafe((self: ScrollTrigger) => {
          const boost = gsap.utils.clamp(1, 6, 1 + Math.abs(self.getVelocity()) / 350);
          for (const train of trains) {
            if (train.held) continue;
            gsap
              .timeline()
              .to(train.tween, {
                timeScale: boost,
                duration: 0.2,
                ease: "power2.out",
                overwrite: true,
              })
              .to(train.tween, { timeScale: 1, duration: 1.2, ease: "power2.inOut" });
          }
        }),
      });

      const listeners: Array<() => void> = [];
      for (const train of trains) {
        const stop = contextSafe(() => {
          train.held = true;
          gsap.to(train.tween, { timeScale: 0, duration: 0.6, ease: "power2.out", overwrite: true });
        });
        const go = contextSafe(() => {
          if (train.lane.matches(":hover, :focus-within")) return;
          train.held = false;
          gsap.to(train.tween, { timeScale: 1, duration: 0.8, ease: "power2.in", overwrite: true });
        });
        train.lane.addEventListener("pointerenter", stop);
        train.lane.addEventListener("focusin", stop);
        train.lane.addEventListener("pointerleave", go);
        train.lane.addEventListener("focusout", go);
        listeners.push(() => {
          train.lane.removeEventListener("pointerenter", stop);
          train.lane.removeEventListener("focusin", stop);
          train.lane.removeEventListener("pointerleave", go);
          train.lane.removeEventListener("focusout", go);
        });
      }

      // Off-screen trains do not need to run.
      const visibility = ScrollTrigger.create({
        trigger: root,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) =>
          trains.forEach((train) =>
            self.isActive ? train.tween.resume() : train.tween.pause(),
          ),
      });

      return () => {
        listeners.forEach((remove) => remove());
        visibility.kill();
        setRunning(false);
      };
    },
    { scope: rootRef },
  );

  if (!usable.length) return null;

  return (
    <section
      ref={rootRef}
      className={`movie-train${running ? " is-running" : ""}`}
      aria-labelledby="movie-train-heading"
    >
      <div className="section-heading">
        <h2 id="movie-train-heading">
          Chuyến tàu <span className="country-highlight">phim mới</span>
        </h2>
      </div>
      {usable.map((lane) => (
        <div
          key={lane.id}
          className="train-lane"
          role="region"
          aria-label={lane.label}
        >
          <ul
            className="train-track"
            data-direction={lane.direction}
            data-cars={lane.movies.length}
          >
            {[...lane.movies, ...lane.movies].map((movie, i) => (
              <TrainCar
                key={`${movie.source}:${movie._id}:${i}`}
                movie={movie}
                clone={i >= lane.movies.length}
              />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
