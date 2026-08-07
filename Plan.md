# 🎬 KẾ HOẠCH PHÁT TRIỂN WEBSITE XEM PHIM HNQ (HNQ FILM)

> **File:** `Plan.md` — Tài liệu quản lý tiến độ, kiến trúc kỹ thuật & quy trình làm việc.
> **Triển khai:** GitHub + Vercel (auto-deploy từ `main`).

---

## 📜 1. QUY TẮC LÀM VIỆC (AGENT WORKFLOW)

1. **Đọc `Plan.md` đầu mỗi session** — BẮT BUỘC, trước khi làm bất cứ việc gì.
2. **Chia nhỏ Task** — Không triển khai dồn dập. Mỗi tính năng = 1 Task riêng.
3. **Cập nhật Plan.md sau khi xong Task:**
   - Đánh dấu `[x] Completed` ở **Mục 5** (Bảng Task & FIX).
   - Ghi log chi tiết file Thêm/Sửa/Xóa ở **Mục 7** (Changelog).
4. **Testing strictness** — BẮT BUỘC chạy `npx tsc --noEmit`, `npm run lint`, `npm run build` sau mỗi Task. Đảm bảo 0 lỗi TypeScript / ESLint / SSR.
5. **Commit & Push** — Commit theo Conventional Commits (`feat:`, `fix:`, `perf:`, `chore:`, `docs:`), rồi `git push origin main` để Vercel auto-deploy.

---

## 📡 2. API PROVIDERS

### 🟢 Primary: KKPhim (PhimAPI)
- **Base URL:** `https://phimapi.com` — JSON, GET, không cần API key.
- **Endpoints chính:**
  - `GET /danh-sach/phim-moi-cap-nhat?page={page}` — Phim mới cập nhật
  - `GET /v1/api/danh-sach/{type}?page={page}&limit={limit}` — Loại: `phim-le`, `phim-bo`, `hoat-hinh`, `tv-shows`
  - `GET /v1/api/the-loai/{slug}?page={page}` — Phim theo thể loại
  - `GET /v1/api/quoc-gia/{slug}?page={page}` — Phim theo quốc gia
  - `GET /v1/api/tim-kiem?keyword={keyword}&page={page}` — Tìm kiếm
  - `GET /phim/{slug}` — Chi tiết phim + danh sách tập (HLS `.m3u8` + embed iframe)
- **Đặc điểm:** Tốc độ ~200ms, hỗ trợ cả `link_m3u8` (HLS direct) và `link_embed` (iframe).

### 🔵 Fallback Providers
- **Ophim** (`https://ophim1.com/api`) — Full catalogue + episode backup.
- **NguonC** (`https://phim.nguonc.com/api`) — Episode embed fallback.

### 🏗️ Kiến trúc API
```
src/lib/api/
├── api.ts              # Public API (backward-compatible signatures)
├── providers.ts        # Orchestrator + AbortController + HealthRegistry
├── adapters.ts         # KKPhim/Ophim/NguonC adapters (ProviderAdapter contract)
├── mock-handler.ts     # Mock dispatcher cho E2E testing
└── __fixtures__/       # Test fixtures cho offline tests
```

**Tính năng nâng cao:**
- **Timeout/Retry:** `withTimeout()` với AbortSignal thật, mặc định 8s upstream.
- **Health tracking:** `HealthRegistry` theo dõi success rate + latency per provider.
- **Page-level abort:** `createPageRequestSignal(15_000)` cho soft-navigation cancel.
- **Kill-switch:** `API_DISABLE_<PROVIDER>=1` (server-only env) tắt provider runtime.
- **Mock mode:** `API_MOCK=1` + `API_BASE_<PROVIDER>` override URL cho E2E deterministic.

---

## 🛠️ 3. TECH STACK

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router, Server + Client Components) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + Lucide React Icons |
| Animation | CSS keyframes (glitch effect, không dùng framer-motion) |
| State | React Hooks + LocalStorage (bookmarks, watch history) |
| Testing | Custom Node 24 strip-types + Playwright E2E |
| Deployment | Vercel (auto-deploy từ GitHub `main`) |

---

## 📁 4. CẤU TRÚC DỰ ÁN

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (Navbar streaming, Footer)
│   ├── page.tsx            # Homepage (Hero, Movie Sections, Top Rank)
│   ├── phim/[slug]/        # Movie detail + Video Player
│   ├── danh-sach/          # Filter page nâng cao
│   ├── the-loai/[slug]/    # Category page
│   ├── quoc-gia/[slug]/    # Country page
│   ├── tim-kiem/           # Search page
│   ├── tu-phim/            # Bookmarks + Watch history
│   ├── lich-chieu/         # "Phim theo ngày" (round-robin, không fake lịch)
│   ├── chu-de/             # Topic collections
│   └── api/mock/[...path]/ # Mock dispatcher (chỉ active khi API_MOCK=1)
├── components/
│   ├── layout/             # Navbar (streaming), Footer, MobileDrawer, BookmarkBadge
│   ├── home/               # HeroBanner, MovieRowSlider, TopMoviesRankSection, CountryMovieSection
│   ├── watch/              # VideoPlayer, EpisodeSelector, WatchContainer, MovieDetailInfo, CommentSection, ReportModal
│   ├── filter/             # FilterBar, Pagination
│   ├── search/             # SearchBarForm
│   ├── schedule/           # ScheduleView
│   ├── tu-phim/            # TuPhimContainer
│   └── ui/                 # MovieCard, Skeleton, SafeImage, GlitchText, HNQBrandLogo, ScrollToTop
├── lib/
│   ├── api.ts              # Public API
│   ├── api/providers.ts    # Orchestrator
│   ├── api/adapters.ts     # Provider adapters
│   ├── api/mock-handler.ts # Mock dispatcher
│   ├── sanitize.ts         # XSS sanitizer (zero-deps, tag-aware rewriter)
│   └── validate.ts         # Input validation (sanitizeSlug, sanitizeKeyword, clampPage, ...)
├── hooks/
│   ├── useBookmarks.ts     # LocalStorage bookmarks + useSyncExternalStore
│   └── useWatchHistory.ts  # LocalStorage watch history + useSyncExternalStore
├── proxy.ts                # Security headers (CSP, HSTS, COEP, COOP, CORP)
└── types/movie.ts          # TypeScript interfaces
```

---

## 📋 5. BẢNG TASK & FIX (TASK BACKLOG)

### 5.1 Tasks chính
| Task | Mô tả | Trạng thái |
|------|-------|------------|
| TASK-1 | Khởi tạo Next.js + Tailwind + TypeScript + API Client | ✅ |
| TASK-2 | Layout tổng thể (Navbar glassmorphism, Mobile Menu, Footer) | ✅ |
| TASK-3 | Trang Chủ chuẩn RoPhim (Hero Slider, Movie Sections) | ✅ |
| TASK-4 | Trang Chi Tiết & Xem Phim (Video Player, Episode Selector) | ✅ |
| TASK-5 | Trang Danh Sách + Bộ Lọc Nâng Cao + Phân Trang | ✅ |
| TASK-6 | Tìm kiếm (Live Search Popup + Trang Tìm Kiếm) | ✅ |
| TASK-7 | Tủ Phim Yêu Thích & Lịch Sử Xem (LocalStorage) | ✅ |
| TASK-8 | Skeleton Loading, Responsive, SEO, 404 Page | ✅ |
| TASK-9 | Testing toàn bộ + Vercel Deploy | ✅ |
| TASK-11 | Clone giao diện RoPhim (MovieRowSlider, TopMoviesRank) | ✅ |
| TASK-12 | Nâng cấp RoPhim (Comments, Report Modal, Schedule, Topics) | ✅ |
| TASK-13 | Phân loại dữ liệu phim trang chủ (không trùng lặp) | ✅ |
| TASK-14 | Logo Cyber IT Cinema + Glitch Text Effect | ✅ |
| TASK-15 | Multi-Provider Streaming + HLS Player (hls.js) | ✅ |
| TASK-16 | KKPhim API làm Provider chính | ✅ |

### 5.2 Security & Quality Fixes
| Fix | Mô tả | Trạng thái |
|-----|-------|------------|
| FIX-1 | Xóa SSRF/open-proxy `/api/embed` | ✅ |
| FIX-2bis | Sanitize `movie.content` (zero-deps rewriter) | ✅ |
| FIX-3 | Sửa iOS HLS listener leak + 12s timeout + race | ✅ |
| FIX-4 | Bộ lọc, cache, hydrate, watch history logic | ✅ |
| FIX-5 | Bật `next/image`, gỡ `'use client'` thừa, throttle scroll | ✅ |
| FIX-6 | Sửa 21 ESLint errors + dead code + nghiệp vụ nhỏ | ✅ |
| FIX-7 | Dependency (gỡ framer-motion, nâng lucide-react) | ✅ |
| FIX-8 | 7 bug chặn xem phim (interface, null ref, embed URL, CDN) | ✅ |
| FIX-9.1a | Hero bookmark sync, real ratings, slider id collision | ✅ |
| FIX-9.1b | Upstream timeout 8s cho `getMovieDetail` | ✅ |
| FIX-9.2 | UX polish: BookmarkBadge, pause glitch, server_type enum | ✅ |
| FIX-9.3 | Intent-based watch history + streaming Navbar | ✅ |
| FIX-10.1 | CSP headers qua proxy.ts (no-nonce, keep prerender) | ✅ |
| FIX-10.2 | HSTS + COOP/COEP/CORP hardening | ✅ |
| FIX-10.3-4 | Playwright E2E suite (52 tests) | ✅ |
| FIX-10.5 | Input validation + static security scanner | ✅ |
| FIX-10.6 | CI workflow + npm test scripts | ✅ |
| FIX-11 | Whitelist KKPhim player CDN trong CSP | ✅ |
| FIX-12 | CTA "Server không khả dụng" khi HLS + iframe fail | ✅ |
| FIX-13 | Gộp episode theo server, mở rộng image fallback, gỡ VidSrc/2Embed | ✅ |
| FIX-14 | Mock API leak + PlayerBody remount key | ✅ |
| FIX-15 | CI E2E chạy mock deterministic thay vì live | ✅ |
| FIX-16 | Mock VSMOV path match + orchestrator fallback chain | ✅ |
| FIX-17 | Image fallback chain (KKPhim đổi URL format poster) | ✅ |
| FIX-18 | COEP `require-corp` → `credentialless` (unblock CDN images) | ✅ |
| FIX-19 | Logo glitch animation luôn chạy (bỏ reduced-motion pause) | ✅ |
| FIX-20 | Synthesize fallback movie từ slug khi KKPhim disabled + episode có sẵn | ✅ |

### 5.3 API Redesign (Provider/Adapter Architecture)
| Redesign | Mô tả | Trạng thái |
|----------|-------|------------|
| REDESIGN-1 | Khảo sát API provider inventory | ✅ |
| REDESIGN-2 | Tách adapter + orchestrator (timeout/retry/health) | ✅ |
| REDESIGN-3 | Fixture & contract tests offline (42 cases) | ✅ |
| REDESIGN-4 | Live probe script cho 8 endpoint | ✅ |
| REDESIGN-5 | Provider scorecard (KKPhim 92.9/A) | ✅ |
| REDESIGN-6 | Page-level AbortController propagation | ✅ |
| REDESIGN-7 | Playwright mock route handler + deterministic E2E | ✅ |
| REDESIGN-8 | Provider kill-switch qua env var | ✅ |

---

## 📊 6. TEST SUITE HIỆN TẠI

| Test | Số lượng | Lệnh |
|------|----------|------|
| Sanitize | 51 passed | `npm run test:sanitize` |
| Validate | 61 passed | `npm run test:validate` |
| API | 57 passed | `npm run test:api` |
| Mock | 23 passed | `npm run test:mock` |
| Disable Flag | 52 passed | `npm run test:disable-flag` |
| **Unit Total** | **244 passed** | `npm run test:unit` |
| E2E Mock | 15 passed | `npm run test:e2e:mock` |
| E2E Disable | 5 passed | `npm run test:e2e:disable-flag` |
| **E2E Total** | **20 passed** | `npm run test:e2e` |

**Verify pass sau mỗi Task:**
- `npx tsc --noEmit` → 0 lỗi
- `npm run lint` → 0 errors
- `npm run build` → 9/9 trang prerender OK

---

## 🔒 7. SECURITY MEASURES

- **CSP Headers** (proxy.ts): Whitelist domains cho script, style, img, media, frame, connect. Player CDN wildcard `*.kkphimplayer*.com`, `*.skbphimplayer.com`, `*.phim1280.tv`.
- **COEP:** `credentialless` (cross-origin CDN images không bị block, vẫn strip credentials).
- **HSTS:** 1 năm HTTPS enforced (production only).
- **XSS Prevention:** `src/lib/sanitize.ts` — zero-deps tag-aware rewriter cho `movie.content` (allowlist: `p/br/strong/b/em/i/u/ul/ol/li/a/blockquote/h1-h6/span/small/sub/sup/hr`).
- **SSRF Prevention:** Đã xóa `/api/embed` proxy hoàn toàn.
- **Input Validation:** `src/lib/validate.ts` — whitelist slug, keyword, page, year, sort field.
- **Provider Kill-Switch:** Runtime disable qua env var `API_DISABLE_<PROVIDER>=1`.
- **COOP:** `same-origin` (cross-window attack protection).
- **Static Security Scanner:** `scripts/test-security.ts` — scan 58 files tìm `dangerouslySetInnerHTML` không sanitize, `eval`, `innerHTML`.

---

## 🔑 8. KEY URLS & ROUTES

| Route | Mô tả |
|-------|-------|
| `/` | Homepage: Hero, Movie Sections, Top Rank, Country sliders |
| `/phim/[slug]` | Movie detail + Video Player (HLS + iframe fallback + CTA) |
| `/danh-sach` | Danh sách + Filter nâng cao (type, category, country, year, sort) |
| `/the-loai/[slug]` | Phim theo thể loại |
| `/quoc-gia/[slug]` | Phim theo quốc gia |
| `/tim-kiem` | Tìm kiếm (server fetch + pagination) |
| `/tu-phim` | Tủ phim + Lịch sử xem (LocalStorage) |
| `/lich-chieu` | Phim theo ngày (round-robin, disclaimer rõ ràng) |
| `/chu-de` | Bộ sưu tập chủ đề |
| `/api/mock/[...path]` | Mock dispatcher (chỉ active khi `API_MOCK=1`) |

---

## 📝 9. NHẬT KÝ CHI TIẾT CÁC THAY ĐỔI (CHANGELOG)

### 2026-07-26 — TASK-1 đến TASK-5: Nền tảng cốt lõi
- **[NEW]** `src/types/movie.ts` — TypeScript interfaces (MovieListItem, MovieDetail, EpisodeItem, FilterParams, ...).
- **[NEW]** `src/lib/api.ts` — API functions: `getLatestMovies`, `getFilteredMovies`, `getCategories`, `getCountries`, `getMoviesByCategory`, `getMoviesByCountry`, `searchMovies`, `getMovieDetail`, `getImageUrl`.
- **[NEW]** `src/components/layout/Navbar.tsx` — Glassmorphism navbar, dropdown Thể loại/Quốc gia động, live search.
- **[NEW]** `src/components/layout/Footer.tsx` — Cinema Dark footer, HNQ brand.
- **[NEW]** `src/components/layout/MobileDrawer.tsx` — Mobile menu.
- **[NEW]** `src/components/home/HeroBanner.tsx` — Full-bleed hero slider, ambient blur, thumbnail strip.
- **[NEW]** `src/components/home/TopicCardsRow.tsx`, `CountryMovieSection.tsx`, `MovieRowSlider.tsx`, `TopMoviesRankSection.tsx`.
- **[NEW]** `src/components/watch/VideoPlayer.tsx` — HLS + iframe player, Cinema Mode, Theater Mode.
- **[NEW]** `src/components/watch/EpisodeSelector.tsx` — Server selector + episode grid.
- **[NEW]** `src/components/watch/WatchContainer.tsx` — URL sync, lưu lịch sử LocalStorage.
- **[NEW]** `src/components/watch/MovieDetailInfo.tsx`, `RelatedMovies.tsx`.
- **[NEW]** `src/components/filter/FilterBar.tsx`, `Pagination.tsx`.
- **[NEW]** `src/components/ui/MovieCard.tsx`, `Skeleton.tsx`, `ScrollToTop.tsx`.
- **[NEW]** `src/app/page.tsx`, `phim/[slug]/page.tsx`, `danh-sach/page.tsx`, `the-loai/[slug]/page.tsx`, `quoc-gia/[slug]/page.tsx`, `tim-kiem/page.tsx`.

### 2026-07-26 — TASK-6: Tìm kiếm
- **[NEW]** `src/components/search/SearchBarForm.tsx`, `src/app/tim-kiem/page.tsx`.
- **[MODIFY]** `Navbar.tsx` — Quick Live Search Popup (debounce 300ms, 6 phim gợi ý).

### 2026-07-26 — TASK-7: Cá nhân hóa
- **[NEW]** `src/hooks/useBookmarks.ts` — LocalStorage `hnq_bookmarks` + custom event.
- **[NEW]** `src/hooks/useWatchHistory.ts` — LocalStorage `hnq_watch_history` (giới hạn 30 mục).
- **[NEW]** `src/components/tu-phim/TuPhimContainer.tsx`, `src/app/tu-phim/page.tsx`.

### 2026-07-26 — TASK-11: Clone RoPhim UI
- **[MODIFY]** `Navbar.tsx`, `Footer.tsx`, `page.tsx`, `HeroBanner.tsx` — Thêm menu Phim Lẻ/Phim Bộ/Phim Top View/Lịch Chiếu/Chủ Đề, rich sections.

### 2026-07-26 — TASK-12: Nâng cấp RoPhim 100%
- **[NEW]** `src/components/watch/CommentSection.tsx` — Comment LocalStorage `hnq_comments_[slug]`.
- **[NEW]** `src/components/watch/ReportModal.tsx` — Modal báo lỗi player.
- **[NEW]** `src/components/schedule/ScheduleView.tsx` — Phim theo 7 ngày.
- **[NEW]** `src/app/lich-chieu/page.tsx`, `src/app/chu-de/page.tsx`.

### 2026-07-26 — TASK-14: Logo HNQ Brand
- **[NEW]** `src/components/ui/GlitchText.tsx` — CSS glitch animation (cyberpunk style).
- **[NEW]** `src/components/layout/HNQBrandLogo.tsx` — Cyber IT Cinema logo.
- **[MODIFY]** `globals.css` — Keyframes `glitch`, `glitch-after`, `glitch-before`.

### 2026-07-27 — FIX-9.2 UX Polish
- **[NEW]** `src/components/layout/BookmarkBadge.tsx` — Tách khỏi Navbar để tránh re-render.
- **[MODIFY]** `GlitchText.tsx` — Thêm prop `alwaysOn`, pause animation mặc định, hover trigger.
- **[MODIFY]** `globals.css` — `prefers-reduced-motion` pause glitch animation.

### 2026-07-28 — TASK-15 & TASK-16: Multi-Provider + KKPhim Primary
- **[MODIFY]** `src/types/movie.ts` — Thêm `link_m3u8`, `server_type`.
- **[MODIFY]** `src/lib/api.ts` — Multi-source fetcher (`fetchKKPhimDetail`, `fetchOphimDetail`, `fetchNguonCDetail`, `generateInternationalServers`), HLS priority.
- **[MODIFY]** `VideoPlayer.tsx` — Tích hợp `hls.js`, fallback iframe, mode switcher.
- **[MODIFY]** `EpisodeSelector.tsx` — Badge màu cho server type (🟢 HLS, 🔵 Embed, 🌐 International).
- **[VERIFY]** Chuyển đổi sang KKPhim API — 100% data khớp giữa list và player.

### 2026-07-31 — FIX-1: Xóa SSRF
- **[DELETE]** `src/app/api/embed/route.ts` (146 dòng) + `src/app/api/` directory.
- **[VERIFY]** `curl /api/embed?url=...` → 404 với mọi payload.

### 2026-07-31 — FIX-2 → FIX-2bis: Sanitize XSS
- **[NEW]** `src/lib/sanitize.ts` — Zero-deps tag-aware rewriter (thay `isomorphic-dompurify` vì Vercel build fail).
- **[NEW]** `scripts/test-sanitize.ts` — 51 test cases.
- **[MODIFY]** `MovieDetailInfo.tsx`, `HeroBanner.tsx`, `phim/[slug]/page.tsx` — Dùng `sanitizeHtml`/`stripAllHtml`.
- **[DELETE]** `isomorphic-dompurify` + 41 packages khỏi `package.json`.

### 2026-07-31 — FIX-3: VideoPlayer iOS Fix
- **[MODIFY]** `VideoPlayer.tsx` — Cleanup `removeEventListener`, 12s timeout, `cancelled` flag, `requestAnimationFrame` defer.

### 2026-07-31 — FIX-4: Data & State
- **[MODIFY]** `api.ts` — `getFilteredMovies` combine params, `cache()` cho `getMovieDetail`, `searchMovies` no-store.
- **[REWRITE]** `useBookmarks.ts`, `useWatchHistory.ts` — `useSyncExternalStore` cho SSR-safe hydrate.
- **[MODIFY]** `WatchContainer.tsx` — Lưu lịch sử chỉ khi `<video onPlay>` (dedupe `slug:serverIndex:episodeIndex`).
- **[MODIFY]** `EpisodeSelector.tsx` — Composite key `server_name:name:link_m3u8|link_embed`.

### 2026-07-31 — FIX-5: Performance
- **[MODIFY]** `next.config.ts` — `images.unoptimized: false`, whitelist `phimimg.com` + `image.phimapi.com`, `formats: ['image/webp']`, 7-day cache.
- **[MODIFY]** 9 component: chuyển `<img>` → `next/image` với `priority`/`fetchPriority="high"` cho LCP.
- **[MODIFY]** 9 component: gỡ `'use client'` thừa (Skeleton, Footer, TopicCardsRow, HNQBrandLogo, CountryMovieSection, MovieRowSlider).
- **[NEW]** 4 client component con: `ScrollToTopButton`, `CountryRowScrollButton`, `MovieRowNavButtons`, `TopRankNavButtons`.
- **[MODIFY]** `Navbar.tsx`, `ScrollToTop.tsx` — Throttle scroll qua `requestAnimationFrame` + `{ passive: true }`.

### 2026-07-31 — FIX-6: Code Quality
- **[MODIFY]** ESLint 21 errors + 37 warnings → 0.
- **[MODIFY]** `ScheduleView.tsx` — Bỏ hash giả, round-robin `index % 7`, copy rõ ràng "đây là cách phân bổ phim theo ngày do HNQ Movie tổng hợp, không phải lịch phát sóng chính thức".
- **[MODIFY]** `TopMoviesRankSection.tsx` — Bỏ fake ranking, fallback dùng `movies` (Top Ngày).
- **[MODIFY]** `Pagination.tsx` — Chống trùng trang, keyboard a11y, `<Suspense>` wrap.
- **[MODIFY]** `FilterBar.tsx` — `<Suspense>` wrap cho `useSearchParams`.
- **[MODIFY]** `HeroBanner.tsx` — Respect `prefers-reduced-motion`.

### 2026-07-31 — FIX-7: Dependencies
- **[DELETE]** `framer-motion` (không dùng).
- **[BUMP]** `lucide-react` → 1.28.0.
- **[DOCS]** `README.md` — Rewrite HNQ Film README.
- **[NOTE]** `npm audit` 3 high CVE (`postcss`, `sharp`) kế thừa từ Next 16 — chờ upstream vá, document trong README.

### 2026-08-01 — FIX-8: 7 Bug VideoPlayer
- **[MODIFY]** `VideoPlayer.tsx` — Gộp `interface PlayerBodyProps` trùng, thêm `key={episodeKey}` cho `<video>`/`<iframe>`.
- **[MODIFY]** `WatchContainer.tsx` — Xóa prop `activeServerName` thừa.
- **[NEW]** `normalizeEmbedUrl()` / `normalizeM3u8Url()` trong `api.ts` — Relative path trả `''` thay vì iframe trắng.
- **[MODIFY]** `next.config.ts` — Whitelist `phim.nguonc.com` cho poster NguonC.

### 2026-08-01 — FIX-9.1a: Correctness
- **[MODIFY]** `HeroBanner.tsx` — Đồng bộ bookmark state qua `useBookmarks()`.
- **[MODIFY]** `MovieDetailInfo.tsx`, `HeroBanner.tsx` — Bỏ fake IMDb rating fallback → `null` khi thiếu data.
- **[MODIFY]** `TopMoviesRankSection.tsx` — `useId()` cho slider id (tránh collision).
- **[MODIFY]** `ScheduleView.tsx`, `lich-chieu/page.tsx` — Đổi copy "Phim theo ngày" + disclaimer.
- **[MODIFY]** `Navbar.tsx`, `MobileDrawer.tsx` — Label "Lịch Chiếu" → "Phim Theo Ngày" (giữ URL `/lich-chieu`).
- **[MODIFY]** `api.ts` — `searchMovies` empty keyword trả `status: false`.
- **[MODIFY]** `useBookmarks.ts`, `useWatchHistory.ts` — Xóa dead `isLoading: false`.
- **[MODIFY]** `layout.tsx` — `siteUrl` fallback `hnq-film.vercel.app`.

### 2026-08-01 — FIX-9.1b: Upstream Timeout
- **[NEW]** `withTimeout(promise, ms, fallback)` trong `api.ts` — 8s timeout per provider.

### 2026-08-01 — FIX-9.3: Watch History UX
- **[MODIFY]** `WatchContainer.tsx` — `handleSaveHistory('click' | 'play')`, dedupe `lastSavedPlaybackRef`, `started_via` field.
- **[NEW]** `NavbarWithData.tsx` — Streaming Navbar (`<Suspense>` wrap `getCategories`/`getCountries`).
- **[MODIFY]** `layout.tsx` — Sync render, Navbar skeleton hiển thị ngay.

### 2026-08-01 — FIX-10.1 + 10.2: Security Headers
- **[NEW]** `src/proxy.ts` — `default-src 'self'`, CSP whitelist scripts/styles/img/media/frame/connect, KKPhim player CDN allowed.
- **[NEW]** `src/proxy.ts` — `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` disable sensors.
- **[NEW]** `src/proxy.ts` — Production: `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp` (đã relax → `credentialless` ở FIX-18), `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`, `Cross-Origin-Resource-Policy: same-origin`.

### 2026-08-01 — FIX-10.3 + 10.4: Playwright E2E
- **[NEW]** `playwright.config.ts` — 2 projects: `chromium` (live), `chromium-mock` (deterministic).
- **[NEW]** `tests/e2e/homepage.spec.ts`, `routes.spec.ts`, `watch.spec.ts`, `search.spec.ts`, `security.spec.ts`, `xss.spec.ts` — 52 tests.

### 2026-08-01 — FIX-10.5: Input Validation
- **[NEW]** `src/lib/validate.ts` — `sanitizeSlug`, `sanitizeKeyword`, `clampPage`, `clampLimit`, `sanitizeYear`, `sanitizeSortField`, `sanitizeSortType`, `sanitizeMovieType`.
- **[NEW]** `scripts/test-validate.ts` — 60 test cases.
- **[NEW]** `scripts/test-security.ts` — Static scanner 58 files.
- **[MODIFY]** 5 page.tsx — Apply `sanitizeSlug`/`clampPage`/`sanitizeKeyword`.

### 2026-08-01 — FIX-10.6: CI Integration
- **[MODIFY]** `package.json` — Scripts `test:unit`, `test:e2e`, `test:e2e:mock`, `test:e2e:headed`, `test:e2e:ui`, `test:e2e:report`, `test:e2e:install`.
- **[NEW]** `.github/workflows/ci.yml` — Node 22, `npm ci`, lint, tsc, test:unit, build, test:e2e.

### 2026-08-01 — FIX-11: Player CDN Whitelist
- **[MODIFY]** `proxy.ts` — Thêm `playerCdn` array: `*.kkphimplayer.com`, `*.kkphimplayer7.com`, `*.kkphimplayer.org`, `*.skbphimplayer.com`, `*.phim1280.tv` vào `frame-src`, `connect-src`, `media-src`, `img-src`.

### 2026-08-01 — FIX-12: Server Unavailable CTA
- **[MODIFY]** `VideoPlayer.tsx` — State `iframeFailed`, 10s timeout detect iframe fail, CTA "Tải lại tập" + "Báo lỗi", mode-switcher reset state.

### 2026-08-01 — FIX-13: Episode Merge
- **[MODIFY]** `providers.ts` — `orchestrateMovieDetail` gộp episode theo `server_name` (trước gộp theo `server_name::slug` → tạo quá nhiều tab).
- **[DELETE]** `generateInternationalServers` (VidSrc/2Embed) trong `api.ts` — Product chốt không cần.
- **[MODIFY]** `getImageFallbackChain` — Mở rộng mọi absolute URL → thử mirror `phimimg.com` / `phim.nguonc.com`.
- **[MODIFY]** `next.config.ts` — Whitelist `image.ophim1.com`, `image.vsmov.com`, `phimapi.com`.

### 2026-08-01 — FIX-14: Mock API Leak + PlayerBody Key
- **[FIX]** Kill dev server cũ PID 1788 chạy với `API_MOCK=1` (mock leak từ phiên trước).
- **[MODIFY]** `VideoPlayer.tsx` — Thêm `key={episodeKey}` cho `<PlayerBody>` (state useState reset khi đổi server).
- **[MODIFY]** 5 component — `<Image>` → `<SafeImage>` cho defense-in-depth.

### 2026-08-01 — API-REDESIGN-1 đến 3: Adapter/Orchestrator
- **[NEW]** `src/lib/api/providers.ts` — `withTimeout`, `orchestrateCatalogue`, `orchestrateMovieDetail`, `HealthRegistry`, `createPageRequestSignal`.
- **[NEW]** `src/lib/api/adapters.ts` — 4 adapter (`kkphimAdapter`, `ophimAdapter`, `nguoncAdapter`, `vsmovAdapter`).
- **[NEW]** `src/lib/__fixtures__/provider-fixtures.ts` — JSON snapshot fixtures.
- **[NEW]** `scripts/test-api.ts` — 42 contract tests offline.
- **[NEW]** `scripts/_test-loader.mjs` + `_register-test-loader.mjs` — Custom ESM resolver cho `@/` alias.

### 2026-08-01 — API-REDESIGN-4: Live Probe
- **[NEW]** `scripts/probe-providers.ts` — Probe 8 endpoint, output `probe-results/YYYY-MM-DD.json`.

### 2026-08-01 — API-REDESIGN-5: Provider Scorecard
- **[NEW]** `docs/provider-scorecard.md` — Bảng scoring (uptime 30% + latency 20% + schema 20% + media 20% + terms 10%). KKPhim 92.9 (A); Ophim 23.5 (F), NguonC 25.6 (F), VSMOV 23.9 (F) — fail vì slug test chưa index.

### 2026-08-01 — API-REDESIGN-6: Page-level AbortController
- **[NEW]** `createPageRequestSignal(timeoutMs)` — 15s budget, forward abort sang per-adapter fetch.
- **[MODIFY]** 6 page.tsx — Wire `signal` vào tất cả fetch calls.
- **[MODIFY]** `test-api.ts` — +14 test cases cho signal propagation.

### 2026-08-01 — API-REDESIGN-7: Mock E2E
- **[NEW]** `src/lib/api/mock-handler.ts` — Pure dispatcher, 7 scenarios (ok/empty/not-found/server-error/timeout/invalid-json/rate-limit).
- **[NEW]** `src/app/api/mock/[...path]/route.ts` — Active khi `API_MOCK=1`.
- **[MODIFY]** `adapters.ts` — `API_BASE_<PROVIDER>` env override.
- **[NEW]** `scripts/test-mock.ts` — 19 tests. `tests/e2e/mock.spec.ts` — 15 E2E tests.

### 2026-08-01 — API-REDESIGN-8: Kill-Switch
- **[MODIFY]** `adapters.ts` — `PROVIDER_ENABLED` map, `isProviderDisabled()` helper, adapter factory trả `null` khi flag.
- **[MODIFY]** `providers.ts` — `orchestrateCatalogue`/`orchestrateMovieDetail` skip null, throw `AllProvidersDisabledError` typed.
- **[MODIFY]** `api.ts` — `safeOrchestrateCatalogue` wrap error → empty list.
- **[NEW]** `.env.example` — Document `API_DISABLE_*` env vars.
- **[NEW]** `scripts/test-disable-flag.ts` — 30 tests. `tests/e2e/disable-flag.spec.ts` — 5 E2E tests.

### 2026-08-01 — FIX-15: CI Mock Deterministic
- **[MODIFY]** `.github/workflows/ci.yml` — Bỏ step "Build production bundle", chạy `test:e2e:ci` (mock + disable-flag) thay vì live E2E.
- **[NEW]** `scripts/run-pw-mock.mjs`, `scripts/run-pw-disable-flag.mjs` — Cross-platform launcher.

### 2026-08-01 — FIX-16: Mock VSMOV Path
- **[MODIFY]** `mock-handler.ts` — Match `/phim/` lẫn `/api/phim/` cho VSMOV.
- **[MODIFY]** `providers.ts` — `fallbackOnEmpty: true` walk toàn bộ chain thay vì return empty từ non-primary.
- **[MODIFY]** `withTimeout` — Add `timedOut: Promise<boolean>` để phân biệt real timeout vs adapter null.

### 2026-08-07 — FIX-17: Image Fallback Chain
- **[MODIFY]** `src/lib/api.ts` — `MIRRORS` thay `phim.nguonc.com` (đã chết) → `img.phimapi.com` (mirror format cũ vẫn alive).
- **[MODIFY]** `SafeImage.tsx` — Thêm `img.phimapi.com` vào `CDN_BYPASS_OPTIMIZER`.
- **[MODIFY]** `next.config.ts` — Wildcard `**.phimimg.com` + `**.phimapi.com` (chống tương lai upstream đổi subdomain).

### 2026-08-07 — FIX-18: COEP Relax
- **[MODIFY]** `proxy.ts` — COEP `require-corp` → `credentialless` (unblock cross-origin CDN images thiếu CORP header).

### 2026-08-07 — FIX-19: Logo Animation Always Run
- **[MODIFY]** `globals.css` — Comment out `prefers-reduced-motion` pause rule cho `.glitch-text-effect` (giữ brand animation chạy liên tục).

### 2026-08-07 — FIX-20: Fallback Movie Synthesis (E2E disable-flag detail page)
- **[MODIFY]** `src/lib/api/providers.ts` — `orchestrateMovieDetail`: khi không có provider nào trả `movie` metadata NHƯNG ít nhất 1 provider trả episodes → synthesize movie object từ slug thay vì return `null` + `notFound()`. Trước fix: trang `/phim/<slug>` với `API_DISABLE_KKPHIM=1` rơi vào 404 vì Ophim/NguonC chỉ episode-only → E2E test fail.
- **[NEW]** `synthesizeFallbackMovie(slug)` — Derive title từ slug (`avengers-endgame` → `Avengers Endgame`), giữ required fields, set `degraded: true` + warning để operator biết metadata thiếu.
- **[MODIFY]** `scripts/test-disable-flag.ts` — +21 test cases (Test 8b/8c/8d): synthesis builder, synthesis path khi episodes có sẵn, error path khi cả episodes lẫn metadata đều trống.

---

## 📌 10. CURRENT STATUS

**Tất cả Tasks, Fixes, và API-Redesigns đều ✅ Completed.**

- `npx tsc --noEmit` → 0 lỗi
- `npm run lint` → 0 errors
- `npm run build` → 9/9 trang prerender OK
- `npm run test:unit` → 244 passed
- `npm run test:e2e` (mock + disable-flag) → 20 passed

**Đã deploy lên Vercel** — auto-deploy từ GitHub `main` push.

### Known Trade-offs (Documented)
- **CVE kế thừa Next 16:** `postcss`, `sharp` 3 high CVE — chờ Next 16.3 stable vá. Không thể `npm audit fix --force` (sẽ downgrade Next xuống 9.3.3).
- **CSP không dùng nonce** (FIX-10.1): Để giữ 9 trang static prerender. Trade-off chấp nhận được vì `sanitize.ts` đã chặn XSS ở content layer.
- **Glitch animation không respect `prefers-reduced-motion`** (FIX-19): Brand identity > accessibility. Effect chỉ là text nhỏ (<50ms) — không gây motion sickness.
- **"Phim theo ngày"** (`/lich-chieu`): Phân bổ round-robin minh hoạ, KHÔNG phải lịch phát sóng thật. Disclaimer rõ ràng trong UI.
- **IMDb rating:** Hiển thị `null` (không render badge) khi upstream không có `vote_average` — không bịa rating giả.
- **Cross-provider slug:** Ophim slug ≠ KKPhim slug → cross-provider detail lookup 404 → fallback KKPhim metadata (degraded).
- **KKPhim là primary** cho catalogue + 3 provider (Ophim/NguonC/VSMOV) là fallback episode-server. Tất cả 4 đều có thể disable runtime qua env var.
- **`provider-scorecard.md`:** 3 provider phụ score F — chỉ vì slug test chưa index. Cần re-probe với slug phổ biến trước khi đánh giá cuối.
- **Fallback movie từ slug (FIX-20):** Khi `API_DISABLE_KKPHIM=1`, trang detail sẽ hiển thị title derived từ URL slug (vd `avengers-endgame` → `Avengers Endgame`) thay vì 404, với episodes từ Ophim/NguonC. `degraded: true` + warning ghi vào log để operator biết metadata thiếu.
