"use client";

import type { RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Hero depth: as the hero scrolls away the backdrop drifts slower than the page and
 * the caption lifts and fades (driven through `--hero-p`, so it survives slide
 * remounts). The primary play button is magnetic for a fine pointer.
 */
export function useHeroMotion(sectionRef: RefObject<HTMLElement | null>) {
  useGSAP(
    (_context, contextSafe) => {
      const section = sectionRef.current;
      if (
        !section ||
        !contextSafe ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      )
        return;

      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom top",
        onUpdate: (self) =>
          section.style.setProperty("--hero-p", self.progress.toFixed(4)),
        onLeaveBack: () => section.style.setProperty("--hero-p", "0"),
      });

      if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches)
        return;

      const magnets = new WeakMap<
        HTMLElement,
        { x: gsap.QuickToFunc; y: gsap.QuickToFunc }
      >();
      const getMagnet = contextSafe((el: HTMLElement) => {
        let magnet = magnets.get(el);
        if (!magnet) {
          magnet = {
            x: gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" }),
            y: gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" }),
          };
          magnets.set(el, magnet);
        }
        return magnet;
      });

      const onMove = (event: PointerEvent) => {
        const play = section.querySelector<HTMLElement>(".hero-play");
        if (!play) return;
        const rect = play.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        const reach = Math.max(rect.width, rect.height) * 1.1;
        const near = Math.hypot(dx, dy) < reach;
        const magnet = getMagnet(play);
        magnet.x(near ? dx * 0.32 : 0);
        magnet.y(near ? dy * 0.32 : 0);
      };
      const onLeave = () => {
        const play = section.querySelector<HTMLElement>(".hero-play");
        if (!play) return;
        const magnet = getMagnet(play);
        magnet.x(0);
        magnet.y(0);
      };

      section.addEventListener("pointermove", onMove, { passive: true });
      section.addEventListener("pointerleave", onLeave);
      return () => {
        section.removeEventListener("pointermove", onMove);
        section.removeEventListener("pointerleave", onLeave);
      };
    },
    { scope: sectionRef },
  );
}
