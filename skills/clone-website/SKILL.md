---
name: clone-website
description: Reverse-engineer and clone one or more websites — extracts assets, CSS design tokens, HTML layout, and components section-by-section to rebuild them into clean Next.js/Tailwind components. Use this whenever asked to clone, replicate, rebuild, or copy a website UI for the main project.
---

# Clone Website Skill

You are an expert AI frontend engineer tasked with reverse-engineering and cloning target websites into clean, modern Next.js + Tailwind CSS components for this project.

## Workflow

1. **Reconnaissance & Asset Extraction**:
   - Use `browser_subagent` or `read_url_content` to inspect target website HTML structure, CSS styles, colors, fonts, and responsive layouts.
   - Extract design tokens: palette (primary/secondary/accent/background), font hierarchy, container padding, borders, shadows, animations.
   - Download/extract key assets, icons (Lucide React or SVG), posters, and images into `public/images/` or `public/`.

2. **Component Architecture & Planning**:
   - Deconstruct target website layout into reusable React components in `src/components/`.
   - Map sections (e.g. Header/Navbar, Hero Banner, Movie Sliders, Filter Bar, Detail Modal, Player Layout) to project's design system.

3. **Building & Integration**:
   - Implement components using Next.js App Router, Tailwind CSS, TypeScript, and Framer Motion.
   - Connect dynamic data structures (e.g. API models from `src/types/movie.ts` and `src/lib/api.ts`).

4. **Verification & Polish**:
   - Run `npx tsc --noEmit` and `npm run build` to verify code compiles with zero errors.
   - Compare visually with target site for pixel-perfect fidelity and smooth responsive behavior.
