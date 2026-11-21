"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Poster grids and rails whose items stagger in as they enter the viewport. */
const CARD_TARGETS = [
  ".movie-rail > *",
  ".ranked-item",
  ".catalogue-grid > *",
  ".featured-collection",
  ".footer-inner > *",
].join(",");

/** Headings that slide in from the left. */
const HEADING_TARGETS = ".section-heading, .ranked-heading, .catalog-heading";

/** Poster surfaces that tilt toward the pointer and carry the spotlight. */
const TILT_TARGETS = ".poster-frame, .ranked-poster";

const REDUCED = "(prefers-reduced-motion: reduce)";
const FINE_POINTER = "(hover: hover) and (pointer: fine)";

type Tilt = { rx: gsap.QuickToFunc; ry: gsap.QuickToFunc };

/**
 * Site-wide motion layer: scroll progress hairline, scroll reveals for cards and
 * headings, and the pointer tilt/spotlight on posters. Everything is opt-out under
 * reduced motion, and nothing already in the first viewport is ever hidden, so the
 * server-rendered page stays readable before and without hydration.
 */
export function MotionProvider() {
  const pathname = usePathname();
  const barRef = useRef<HTMLDivElement>(null);

  useGSAP(
    (_context, contextSafe) => {
      if (!contextSafe || window.matchMedia(REDUCED).matches) return;

      gsap.fromTo(
        barRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            start: 0,
            end: "max",
            scrub: 0.3,
          },
        },
      );

      // Reveals never write to the DOM (no attributes, no inline styles): streamed
      // sections can still be awaiting hydration, and React flags any attribute that
      // differs from the server HTML. Web Animations hold and play the states instead,
      // while ScrollTrigger.batch (which does not touch its targets) decides when.
      const seen = new WeakSet<Element>();
      const held = new Map<Element, Animation>();
      const isBelowFold = (el: Element) =>
        el.getBoundingClientRect().top > window.innerHeight * 0.9;

      const group = (selector: string, from: Keyframe, stagger: number) => {
        const targets = gsap.utils.toArray<HTMLElement>(selector).filter((el) => {
          if (seen.has(el)) return false;
          seen.add(el);
          return isBelowFold(el);
        });
        if (!targets.length) return 0;
        for (const el of targets)
          held.set(el, el.animate([from, from], { duration: 1, fill: "forwards" }));
        ScrollTrigger.batch(targets, {
          // clamp(): items near the very bottom still trigger at max scroll.
          start: "clamp(top 94%)",
          once: true,
          interval: 0.08,
          batchMax: 8,
          onEnter: (batch) =>
            batch.forEach((el, i) => {
              held.get(el)?.cancel();
              held.delete(el);
              el.animate([from, { opacity: 1, transform: "none" }], {
                duration: 760,
                delay: i * stagger,
                easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                fill: "backwards",
              });
            }),
        });
        return targets.length;
      };

      const scan = contextSafe(() => {
        const added =
          group(
            CARD_TARGETS,
            { opacity: 0, transform: "translate3d(0, 40px, 0) scale(0.95)" },
            60,
          ) +
          group(
            HEADING_TARGETS,
            { opacity: 0, transform: "translate3d(-28px, 0, 0)" },
            0,
          );
        if (added) ScrollTrigger.refresh();
      });

      // First scan once the document has loaded (and hydration has had its turn).
      let timer = 0;
      const queueScan = () => {
        window.clearTimeout(timer);
        timer = window.setTimeout(scan, 120);
      };
      if (document.readyState === "complete") queueScan();
      else window.addEventListener("load", queueScan, { once: true });

      // Streamed sections (Suspense, client lists) arrive after the first scan.
      const observer = new MutationObserver(queueScan);
      const main = document.getElementById("main-content");
      if (main) observer.observe(main, { childList: true, subtree: true });

      // Pointer tilt + spotlight, delegated so it covers every poster on every page.
      if (!window.matchMedia(FINE_POINTER).matches) {
        return () => {
          held.forEach((animation) => animation.cancel());
          observer.disconnect();
          window.clearTimeout(timer);
          window.removeEventListener("load", queueScan);
        };
      }
      const tilts = new WeakMap<HTMLElement, Tilt>();
      let active: HTMLElement | null = null;

      const release = contextSafe((el: HTMLElement) => {
        el.removeAttribute("data-tilt");
        gsap.to(el, {
          rotationX: 0,
          rotationY: 0,
          duration: 0.6,
          ease: "power3.out",
          overwrite: "auto",
        });
      });

      const getTilt = contextSafe((el: HTMLElement): Tilt => {
        let tilt = tilts.get(el);
        if (!tilt) {
          gsap.set(el, { transformPerspective: 760 });
          tilt = {
            rx: gsap.quickTo(el, "rotationX", { duration: 0.45, ease: "power3" }),
            ry: gsap.quickTo(el, "rotationY", { duration: 0.45, ease: "power3" }),
          };
          tilts.set(el, tilt);
        }
        return tilt;
      });

      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        const target = event.target as Element | null;
        const frame = target?.closest?.<HTMLElement>(TILT_TARGETS) ?? null;
        if (frame !== active) {
          if (active) release(active);
          active = frame;
          frame?.setAttribute("data-tilt", "");
        }
        if (!frame) return;
        const rect = frame.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        frame.style.setProperty("--spot-x", `${(px * 100).toFixed(1)}%`);
        frame.style.setProperty("--spot-y", `${(py * 100).toFixed(1)}%`);
        const tilt = getTilt(frame);
        tilt.ry((px - 0.5) * 12);
        tilt.rx((0.5 - py) * 10);
      };
      const onLeave = () => {
        if (active) release(active);
        active = null;
      };

      document.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      return () => {
        held.forEach((animation) => animation.cancel());
        observer.disconnect();
        window.clearTimeout(timer);
        window.removeEventListener("load", queueScan);
        document.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
      };
    },
    { dependencies: [pathname], revertOnUpdate: true },
  );

  return <div ref={barRef} className="scroll-progress" aria-hidden="true" />;
}
