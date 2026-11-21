# PTQ Film — Motion redesign plan (2026-11-21)

Skills used: `gsap-react`, `gsap-scrolltrigger`, `gsap-performance` (greensock/gsap-skills),
`scroll-craft` (layered hero / scroll score ideas), `hallmark` (floor rules: tokens only,
transform/opacity only, reduced-motion fallback, content visible without JS). `threejs-skills`
were installed but deliberately not used: a WebGL scene would cost bandwidth on a video site
without helping people find a film.

Pattern references (re-implemented, not copied): React Bits — BlurText, SpotlightCard,
TiltedCard, Magnet, ShinyText, Aurora.

`design.md` stays the locked visual system (palette, layout, sizes). This pass adds a motion
layer on top of it; it does not move content or change routes.

## Principles

- Library: `gsap` + `@gsap/react` (`useGSAP`, scoped, auto-cleanup). Client-only.
- Animate only `transform`, `opacity`, `filter`. Never `transition: all`.
- First-paint entrances are CSS keyframes, so there is no flash between SSR paint and
  hydration; GSAP handles scroll-linked and pointer-linked motion.
- Every effect is gated by `prefers-reduced-motion: no-preference`; pointer effects also by
  `(hover: hover) and (pointer: fine)`. With JS off, everything is simply visible.
- Elements already in the first viewport are never hidden by scroll reveals.

## Effects

| # | Where | Effect | Tech |
|---|-------|--------|------|
| 1 | Site entry | Once-per-session brand curtain: PTQ mark scales in, gold sweep, curtain lifts (~1.1s, non-blocking) | inline head script + CSS |
| 2 | Every route | Soft fade on navigation | `app/template.tsx` + CSS |
| 3 | Top of page | Gold scroll-progress hairline | GSAP ScrollTrigger scrub |
| 4 | Hero | Ken Burns on backdrop per slide; title words blur-in (BlurText), meta/description/actions stagger up, replayed on each slide | CSS keyframes keyed by slide |
| 5 | Hero | Scroll parallax: backdrop drifts slower, caption lifts and fades as the hero leaves | GSAP scrub |
| 6 | Hero play | Magnetic button + gold pulse ring | GSAP `quickTo` |
| 7 | Section headings | Slide-in with growing gold rule | ScrollTrigger.batch |
| 8 | Rails, ranked rails, catalog grid, collections | Cards stagger up with slight scale as they enter | ScrollTrigger.batch |
| 9 | Poster cards (all pages) | 3D tilt toward pointer, spotlight glow following cursor, shine sweep, lift | delegated pointer listener + `quickTo` + CSS vars |
| 10 | Home background | Slow gold/slate aurora glow behind the first rails | CSS keyframes |
| 11 | Footer | Fade-up reveal | ScrollTrigger.batch |

## Files

- `src/components/motion/MotionProvider.tsx` — registers plugins, progress bar, scroll reveals
  (re-run per pathname), pointer card FX.
- `src/components/motion/MagneticPlay.tsx` (inline in hero), `HeroParallax` logic in `HeroBanner`.
- `src/app/template.tsx` — route fade.
- `src/app/motion.css` — keyframes, card FX, curtain, aurora, reduced-motion overrides.
- `src/app/layout.tsx` — mounts provider + curtain script.

## Verification

`npm run lint`, `npm run build`, browser check of home, catalog, detail at desktop and mobile
widths, and with reduced motion emulated.
