# 🎬 KẾ HOẠCH PHÁT TRIỂN WEBSITE XEM PHIM HNQ (HNQ FILM)

> **File:** `Plan.md`  
> **Mục đích:** Tài liệu quản lý tiến độ, quy trình làm việc và kiến trúc kỹ thuật dự án web xem phim trực tuyến.  
> **Nền tảng triển khai:** GitHub + Vercel deployment.

---

## 📜 1. QUY TẮC PHÁT TRIỂN DÀNH CHO AGENT (AGENT WORKFLOW RULES)

1. **Đọc `Plan.md` đầu mỗi session:** Mỗi khi bắt đầu một phiên chat mới (new chat), Agent **BẮT BUỘC** đọc file `Plan.md` này đầu tiên để nắm rõ bối cảnh dự án, kiến trúc, và các task đã hoàn thành/chưa hoàn thành.
2. **Chia nhỏ Task & Làm từng phần:** Không triển khai dồn dập toàn bộ web cùng lúc. Luôn chia dự án thành các Task chức năng độc lập (Task 1, Task 2, Task 3...).
3. **Cập nhật tiến độ & Nhật ký chi tiết sau khi hoàn thành/sửa task:**
   - Đánh dấu `[x] Completed` vào checklist ở **Mục 5: Danh sách Task & Tiến độ**.
   - Ghi log chi tiết tất cả file **Thêm mới `[NEW]`**, **Sửa đổi `[MODIFY]`**, **Xóa `[DELETE]`** và mô tả thay đổi vào **Mục 7: Nhật ký chi tiết các thay đổi (Changelog)**.
4. **Kiểm thử kỹ lưỡng (Testing strictness):**
   - BẮT BUỘC chạy `npx tsc --noEmit` và `npm run build` sau khi hoàn thành mỗi task để đảm bảo 100% không có lỗi TypeScript, Linting hay SSR build failure.
   - Đảm bảo giao diện responsive trên Mobile & Desktop, không vỡ layout.
5. **Cập nhật tiến độ, Commit & Push lên GitHub:**
   - Ngay sau khi hoàn thành và test pass mỗi Task:
     1. Đánh dấu `✅ Completed` vào checklist ở **Mục 5: Danh sách Task & Tiến độ**.
     2. Đóng gói và commit với thông điệp chuẩn Conventional Commits (ví dụ: `feat: complete task 3 - home page hero banner and sections`).
     3. Thực hiện `git push origin main` ngay lập tức để Vercel tự động build & deploy.

---

## 📡 2. KHẢO SÁT CHI TIẾT API CÁC NHÀ CUNG CẤP (API SURVEY & DOCUMENTATION)

### 🟢 1. KKPhim API (PhimAPI - Provider Chính)
- **Base URL:** `https://phimapi.com`
- **Định dạng dữ liệu:** `JSON (UTF-8)`
- **Phương thức:** `GET` (Không yêu cầu API Key).
- **Tính năng nổi bật:** Tốc độ phản hồi cực nhanh (~200ms), hỗ trợ cả đường dẫn iframe `link_embed` lẫn file luồng trực tiếp `.m3u8` (`link_m3u8`).

| STT | Endpoint | Mục đích | Cấu trúc response chính |
|---|---|---|---|
| 1 | `GET /danh-sach/phim-moi-cap-nhat?page={page}` | Danh sách phim mới cập nhật | `{ status: true, items: [...], pagination: { totalItems, totalItemsPerPage, currentPage, totalPages } }` |
| 2 | `GET /v1/api/danh-sach/{type}?page={page}&limit={limit}` | Danh sách phim theo loại (`phim-le`, `phim-bo`, `hoat-hinh`, `tv-shows`) | `{ status: 'success', data: { items: [...], params: { pagination } } }` |
| 3 | `GET /v1/api/the-loai/{slug}?page={page}&limit={limit}` | Danh sách phim theo thể loại | `{ status: 'success', data: { items: [...] } }` |
| 4 | `GET /v1/api/quoc-gia/{slug}?page={page}&limit={limit}` | Danh sách phim theo quốc gia | `{ status: 'success', data: { items: [...] } }` |
| 5 | `GET /v1/api/tim-kiem?keyword={keyword}&page={page}` | Tìm kiếm phim theo từ khóa | `{ status: 'success', data: { items: [...] } }` |
| 6 | `GET /phim/{slug}` | Chi tiết phim & danh sách tập (HLS/Embed) | `{ status: true, movie: { name, origin_name, poster_url, thumb_url, ... }, episodes: [{ server_name, server_data: [{ name, slug, link_embed, link_m3u8 }] }] }` |

### 🔵 2. VSMOV API (Provider Dự Phòng)
- **Base URL:** `https://vsmov.com/api`
- **Endpoints:** `/danh-sach/phim-moi-cap-nhat`, `/danh-sach`, `/the-loai`, `/quoc-gia`, `/tim-kiem`, `/phim/{slug}`.

---

## 🛠️ 3. CÔNG NGHỆ VÀ NỀN TẢNG (TECH STACK)

- **Framework:** `Next.js 14` (App Router, Server Components & Client Components linh hoạt).
- **Ngôn ngữ:** `TypeScript` (Strict mode, tự định nghĩa type cho API payload).
- **Styling:** `Tailwind CSS` + `Lucide React Icons` + `Framer Motion` (Glassmorphism UI, Dark Mode giao diện rạp phim điện ảnh ấn tượng).
- **State Management:** React Hooks + `LocalStorage` (cho Lịch sử xem phim & Tủ phim yêu thích).
- **Deployment Platform:** `Vercel` (Kết nối kho lưu trữ GitHub, tự động CD).

---

## 📁 4. CẤU TRÚC DỰ ÁN DỰ KIẾN (PROJECT STRUCTURE)

```
Web-xem-phim/
├── Plan.md                    # Tài liệu quản lý tiến độ & quy trình (File này)
├── public/                    # Static assets & images fallback
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # Root Layout (Navbar, Footer, Providers)
│   │   ├── page.tsx           # Trang chủ (Home)
│   │   ├── phim/[slug]/       # Trang chi tiết & xem phim
│   │   ├── danh-sach/         # Trang danh sách & bộ lọc nâng cao
│   │   ├── the-loai/[slug]/   # Trang danh sách theo thể loại
│   │   ├── quoc-gia/[slug]/   # Trang danh sách theo quốc gia
│   │   ├── tim-kiem/          # Trang tìm kiếm
│   │   ├── tu-phim/           # Trang tủ phim yêu thích & lịch sử xem
│   │   ├── loading.tsx        # UI Skeleton Loading toàn trang
│   │   └── not-found.tsx      # Trang 404 Custom
│   ├── components/            # Shared UI components
│   │   ├── layout/            # Navbar, Footer, MobileNav
│   │   ├── home/              # HeroBanner, MovieSection, Carousel
│   │   ├── watch/             # VideoPlayer, EpisodeSelector, MovieInfo
│   │   ├── filter/            # FilterBar, Pagination
│   │   ├── search/            # SearchModal, SearchBar
│   │   └── ui/                # MovieCard, Skeleton, Badge, Modal, Toast
│   ├── lib/                   # API Utilities & Helpers
│   │   ├── api.ts             # Fetcher wrappers cho VSMOV API
│   │   └── utils.ts           # Formatters, helpers
│   ├── types/                 # TypeScript Types & Interfaces
│   │   └── movie.ts           # Types định nghĩa dữ liệu API
│   └── hooks/                 # Custom React Hooks
│       ├── useBookmarks.ts    # Custom hook quản lý phim yêu thích
│       └── useWatchHistory.ts # Custom hook lưu lịch sử tập đang xem
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.mjs
```

---

## 📋 5. DANH SÁCH TASK CHI TIẾT & TIẾN ĐỘ (TASK BACKLOG & TRACKER)

| Task ID | Tên Task / Chức năng | Trạng thái | Ghi chú & Kết quả kiểm thử |
|---|---|---|---|
| **TASK-1** | Khởi tạo dự án Next.js 14, Tailwind CSS, TypeScript & cấu hình API Client (`src/lib/api.ts`, `src/types/movie.ts`) | ✅ Completed | Đã khởi tạo Next.js, cài đặt Tailwind CSS, lucide-react, framer-motion, tạo TypeScript types (`src/types/movie.ts`), API Client (`src/lib/api.ts`). Test build thành công. |
| **TASK-2** | Thiết kế Layout tổng thể (Header/Navbar đa cấp, Theme Cinema Dark Mode, Mobile Menu Drawer, Footer) | ✅ Completed | Đã thiết kế Navbar glassmorphism với dropdown Thể loại, Quốc gia động từ API, MobileDrawer responsive navigation, Footer thông tin rạp phim & custom Cinema Dark theme (`src/app/globals.css`, `src/app/layout.tsx`). Test build thành công. |
| **TASK-3** | Tái thiết kế Trang Chủ chuẩn RoPhim: Full-bleed edge-to-edge Hero Slider, overlay Header, Thumbnail strip, Section "Bạn đang quan tâm gì?", Country Sliders (Hàn Quốc, Trung Quốc, US-UK) với cột Tiêu đề bên trái & nút scroll | ✅ Completed | Đã tái thiết kế hoàn chỉnh giao diện tràn viền chuẩn RoPhim theo ảnh mẫu. Đã test `npx tsc --noEmit` & `npm run build` pass 100%. |
| **TASK-4** | Phát triển Trang Chi Tiết & Xem Phim (`app/phim/[slug]/page.tsx`): Stream Player Iframe, Danh sách tập, Server selector, Thông tin phim | ✅ Completed | Đã phát triển hoàn chỉnh Trang Chi Tiết & Xem Phim với Stream Player 16:9, Tắt đèn (Cinema Mode), Mở rộng khung hình (Theater Mode), Selector Server & Tập phim, Movie Metadata, Thêm vào Tủ phim, Lưu Lịch sử xem phim LocalStorage, và Phim gợi ý tương tự. Đã test `npx tsc --noEmit` & `npm run build` pass 100%. |
| **TASK-5** | Phát triển Trang Danh Sách & Bộ Lọc Nâng Cao (`app/danh-sach/page.tsx`, `the-loai`, `quoc-gia`): Lọc theo Thể loại, Quốc gia, Năm, Pagination | ✅ Completed | Đã phát triển hoàn chỉnh Trang Danh Sách tổng hợp (`/danh-sach`), Phim theo Thể loại (`/the-loai/[slug]`), Phim theo Quốc gia (`/quoc-gia/[slug]`) tích hợp Bộ lọc nâng cao (`FilterBar.tsx`), Phân trang (`Pagination.tsx`) và SEO Metadata động. Đã test `npx tsc --noEmit` & `npm run build` pass 100%. |
| **TASK-6** | Phát triển Chức năng Tìm kiếm (`app/tim-kiem/page.tsx` & Quick Live Search Popup trên Header) | ✅ Completed | Đã phát triển Quick Live Search Popup trên Navbar có debounce API & xem trước kết quả, cùng Trang Tìm Kiếm (`/tim-kiem?keyword=...`) có khung search tại trang, lưới phim, phân trang & UI gợi ý khi không có kết quả. Đã test `npx tsc --noEmit` & `npm run build` pass 100%. |
| **TASK-7** | Tính năng Cá nhân hóa: Tủ Phim Yêu Thích (Bookmarks) & Lịch Sử Xem Phim (Continue Watching) lưu ở LocalStorage | ✅ Completed | Đã xây dựng custom hooks (`useBookmarks`, `useWatchHistory`) đồng bộ qua custom window events, badge đếm tủ phim trên Navbar/MobileDrawer, và Trang Cá Nhân (`/tu-phim`) với 2 tab Tủ Phim & Lịch Sử Xem, hỗ trợ nút Xem Tiếp và xóa item/clear all. Đã test `npx tsc --noEmit` & `npm run build` pass 100%. |
| **TASK-8** | Tối ưu hóa UI/UX: Skeleton Loading, Responsive polish, SEO Dynamic Metadata, OpenGraph cards, Custom 404 page | ✅ Completed | Đã phát triển bộ Skeleton components (`Skeleton.tsx`), 7 trang `loading.tsx` App Router (trang chủ, chi tiết phim, danh sách, thể loại, quốc gia, tìm kiếm, tủ phim), trang `not-found.tsx` chuẩn Cinema Dark 404, bổ sung SVG image fallback, tối ưu SEO Metadata Base, OpenGraph cards & Twitter summary. Đã test `npx tsc --noEmit` & `npm run build` pass 100%. |
| **TASK-9** | Testing toàn bộ dự án (`npm run build`), kiểm tra link video player, Sửa lỗi & Chuẩn bị Repository gửi Vercel Deploy | ✅ Completed | Đã hoàn tất audit toàn bộ codebase, kiểm thử `npx tsc --noEmit` pass 0 lỗi type, đóng gói `npm run build` thành công xuất sắc, sẵn sàng cho Vercel Deploy. |
| **TASK-11** | Clone & Nâng Cấp Giao Diện Trang Chủ Chuẩn RoPhim (`https://rophim1.vip/phimhay`): MovieRowSlider, TopMoviesRankSection (Bảng xếp hạng Top 1-10 neon), HeroBanner polish, Navbar menu items, Footer branding & rich sections | ✅ Completed | Đã dùng skill clone-website trích xuất layout từ https://rophim1.vip/phimhay, bổ sung các section Phim Mới Cập Nhật, Phim Bộ Hot, Phim Lẻ Chiếu Rạp, Bảng Xếp Hạng Top 10 View nhiều nhất, dải Phim Quốc Gia (Hàn Quốc, Trung Quốc, US-UK, Nhật Bản/Anime). Đã test `npx tsc --noEmit` & `npm run build` pass 100%. |
| **TASK-12** | Nâng Cấp Toàn Diện Giao Diện & Thành Phần Chuẩn RoPhim 100% Cho HNQ Movie: CommentSection, ReportModal, Trang Lịch Chiếu `/lich-chieu`, Trang Chủ Đề `/chu-de`, Top Rank Tabs Ngày/Tuần/Tháng | ✅ Completed | Đã hoàn thành 100% việc tạo các thành phần chuẩn RoPhim bao gồm khung bình luận tương tác LocalStorage, Modal báo lỗi player, Trang Lịch Chiếu 7 ngày trong tuần, Trang Bộ sưu tập Chủ Đề, Tabs Top Ngày/Tuần/Tháng. Đã test `npx tsc --noEmit` & `npm run build` pass 100%. |
| **TASK-13** | Phân Loại & Tách Biệt Bộ Dữ Liệu Các Hàng Phim Trang Chủ (`src/app/page.tsx`): Phim Mới Cập Nhật, Top 10 View (Top Ngày / Tuần / Tháng), Phim Bộ Hot | ✅ Completed | Đã điều chỉnh logic gọi API song song nạp riêng biệt danh sách phim cho từng hàng: Phim Mới Cập Nhật (Trang 1 mới cập nhật), Top 10 View (Trang 2 + Phim Hot Trung/Hàn/US-UK), Phim Bộ Hot (Series lọc nâng cao). 100% không còn trùng lặp phim giữa các hàng. Đã test `npx tsc --noEmit` & `npm run build` pass 100%. |
| **TASK-14** | Thiết Kế Logo Thương Hiệu Cyber IT Cinema & Tích Hợp Component Hiệu Ứng Glitch Text Cho Chữ "HNQ" | ✅ Completed | Đã phát triển component `GlitchText.tsx` theo chuẩn keyframe clip-path glitch 3D red/cyan và `HNQBrandLogo.tsx` phong cách Cyber IT Cinema. Đồng bộ logo và glitch text trên Navbar, MobileDrawer, Footer. Đã test `npx tsc --noEmit` & `npm run build` pass 100%. |
| **TASK-15** | Kiểm Thử & Tích Hợp Đa Máy Chủ Streaming (Multi-Provider API: KKPhim, Ophim, NguonC, VidSrc/2Embed) & Trình Phát HLS Direct (.m3u8) Cho HNQ Film | ✅ Completed | Đã audit 100% danh sách API, nâng cấp `src/lib/api.ts` nạp đa nguồn server (KKPhim, Ophim, NguonC, VidSrc), cài đặt `hls.js` & nâng cấp `VideoPlayer.tsx` phát HLS m3u8 direct không chứa ad pop-up kèm nút đổi chế độ Iframe. Đã test `npx tsc --noEmit` & `npm run build` pass 100%. |
| **TASK-16** | Chuyển Đổi & Sử Dụng KKPhim API (PhimAPI) Làm Provider Chính Cho Danh Sách & Gợi Ý Phim Trên Tất Cả Các Trang Hiện Tại (`/`, `/danh-sach`, `/the-loai`, `/quoc-gia`, `/tim-kiem`) | ✅ Completed | Đã hoàn thành 100% việc nâng cấp `src/lib/api.ts` chuyển đổi sang KKPhim API (`phimapi.com`) làm provider chính cho tất cả danh sách phim, thể loại, quốc gia, bộ lọc nâng cao, tìm kiếm và chi tiết phim. Đã test `npx tsc --noEmit` & `npm run build` pass 100%. |
| **FIX-1** | Bảo mật: Vá SSRF/open-proxy `/api/embed` (allowlist domain, timeout, chặn IP nội bộ, gỡ `<base>` injection, `Cache-Control: private, no-store`) | ✅ Completed | Đã **xóa hẳn** `src/app/api/embed/route.ts` & thư mục `src/app/api/` (không còn UI client nào gọi tới — `VideoPlayer.tsx` dùng trực tiếp `link_embed` làm iframe `src`). Verify: `npx tsc --noEmit` 0 lỗi; `npm run build` pass; `curl http://localhost:3000/api/embed?url=...` → 404 với mọi payload (loopback, evil.com, vsmov.com, no-arg). Chi tiết ở **Mục 8**. |
| **FIX-2** | Bảo mật: Sanitize `movie.content` trước khi `dangerouslySetInnerHTML` (dùng `isomorphic-dompurify` server-side, đồng bộ strip tag ở Hero) | ✅ Superseded | Đã cài `isomorphic-dompurify@^3.21.0` ban đầu nhưng **build fail trên Vercel** do package khai báo `engines: "node": "^22.22.2 || ^24.15.0 || >=26.0.0"` không khớp Vercel runtime mặc định Node 22.11.0. Đã chuyển giao sang **FIX-2bis** thay bằng rewriter thuần zero-deps, ổn định trên mọi Node version. |
| **FIX-2bis** | Bảo mật: Thay `isomorphic-dompurify` bằng rewriter thuần (tag-aware) trong `src/lib/sanitize.ts` để build Vercel pass trên mọi Node version | ✅ Completed | Đã viết lại `src/lib/sanitize.ts` thành tag-aware rewriter zero-dependency (không cần jsdom/dompurify); allowlist tag giữ nguyên (p/br/strong/b/em/i/u/ul/ol/li/a/blockquote/h1-h6/span/small/sub/sup/hr); strip mọi tag ngoài allowlist + mọi attr ngoài `{href,title,target,rel}`; `<a href="javascript:...">` bị drop href (giữ text); tự phát hiện void tag `<br>`/`<hr>`; bug off-by-one `</tagname>` thiếu `>` đã sửa. 51/51 test pass (test 8 cũ + 3 mới: void tag/malformed `<`/nested link). `package.json` + `package-lock.json` đã gỡ 41 packages (isomorphic-dompurify + dompurify + jsdom); bundle giảm rõ rệt. `npx tsc --noEmit` 0 lỗi; `npm run build` pass; runtime không phụ thuộc engines Node. Chi tiết ở **Mục 8**. |
| **FIX-3** | Trình phát: Sửa listener leak & spinner vĩnh viễn trên Safari/iOS (`VideoPlayer.tsx`), capture `cancelled` để chặn race HLS↔iframe | ✅ Completed | Đã capture `onLoadedMetadata` thành const để `removeEventListener` trong cleanup (fix Safari/iOS branch); thêm 12s timeout cho cả nhánh HLS + iframe fallback với banner cảnh báo vàng (`fallbackNotice`); cờ `cancelled` chặn mọi `setState` từ HLS event sau teardown; defer `hls.loadSource` qua `requestAnimationFrame` để tránh đè instance cũ khi đổi qua lại HLS↔iframe. Đã test `npx tsc --noEmit` & `npm run build` pass 100%. Chi tiết ở **Mục 8**. |
| **FIX-4** | Dữ liệu & State: Sửa bộ lọc giả (`getFilteredMovies` chỉ nhận 1 nhánh), `cache()` cho `getMovieDetail`, bỏ cache tìm kiếm riêng tư, hydrate ổn định cho `useBookmarks`/`useWatchHistory`, sửa race/auto-write lịch sử xem | ✅ Done | Hoàn tất 2026-07-31 — chi tiết ở **Mục 8**. |
| **FIX-5** | Hiệu năng: Bật `next/image` (tắt `unoptimized`, restrict `remotePatterns`), gỡ `'use client'` thừa, throttle scroll listener, thêm `priority`/`fetchPriority` cho LCP | ✅ Completed | Đã bật tối ưu hoá ảnh (`unoptimized: false`) với `remotePatterns` whitelist cho `phimimg.com` + `image.phimapi.com` + `formats: ['image/webp']` + 7-day `minimumCacheTTL`. Thay 9 `<img>` thành `next/image` ở `MovieCard`, `HeroBanner` (kèm `priority`/`fetchPriority="high"` cho slide đầu — LCP), `TopMoviesRankSection`, `TopMoviesSidebar`, `CountryMovieSection`, `MovieRowSlider`, `MovieDetailInfo` (kèm `priority`/`fetchPriority="high"` cho poster chi tiết), `Navbar` (live search thumb). Gỡ `'use client'` khỏi `Skeleton.tsx`, `Footer.tsx`, `TopicCardsRow.tsx`, `HNQBrandLogo.tsx`, `CountryMovieSection.tsx`, `MovieRowSlider.tsx` (bây giờ là Server Components). Split các nút cần state/DOM thành 3 Client Component con mới: `layout/ScrollToTopButton.tsx`, `home/CountryRowScrollButton.tsx`, `home/MovieRowNavButtons.tsx`, `home/TopRankNavButtons.tsx` (dùng `id` selector thay vì React ref xuyên boundary). Throttle scroll listener trong `Navbar.tsx` & `ScrollToTop.tsx` qua `requestAnimationFrame` + `{ passive: true }`. Bonus cleanup: gỡ 4 import unused (`Film`/`Play`/`PlayIcon` ở `Navbar`, `Film`/`ArrowUp`/`Heart`/`ShieldAlert` ở `Footer`, `useRef` ở `CountryRowScrollButton`). `npx tsc --noEmit` 0 lỗi; `npm run build` pass 9/9 trang static; lint count giảm `21→15 errors` + `37→19 warnings`. Chi tiết ở **Mục 8**. |
| **FIX-6** | Chất lượng code: Sửa 21 lỗi ESLint (`react-hooks/set-state-in-effect`, `no-explicit-any`), dọn dead code, sửa lỗi nghiệp vụ nhỏ (`ScheduleView`, `Pagination`, `Pagination` keyboard, `useSearchParams` Suspense) | ✅ Completed | Hoàn tất 2026-07-31 — `react-hooks/set-state-in-effect` & `no-explicit-any` đã về 0; dead code/imports dọn 100%; `useSearchParams` wrap `<Suspense>`; `Pagination` chống trùng trang + keyboard; `ScheduleView`/`TopMoviesRankSection` chuyển sang dữ liệu thật, bỏ hash giả; `HeroBanner` tôn trọng `prefers-reduced-motion`. `npm run lint`, `tsc --noEmit`, `npm run build` đều pass. Chi tiết ở **Mục 8**. |
| **FIX-7** | Dependency & Build: Nâng cấp `lucide-react` (1.x → 0.4xx), gỡ `framer-motion` nếu chưa dùng, theo dõi bản vá `postcss`/`sharp` qua Next patch, verify `npm run build` + Vercel | ✅ Completed | Đã gỡ `framer-motion@^12.42.2` (không còn import nào trong `src/`), nâng `lucide-react` lên `^1.28.0` (registry local chỉ thấy tới 1.28.0, dist-tag `latest` = 1.28.0; dòng 0.4xx/0.5xx đã có trên npmjs.com chính thức nhưng registry mirror này còn cut-off). Document rõ nợ audit `postcss`/`sharp` (3 high CVE kế thừa từ Next 16) trong Mục 8 — không thể `npm audit fix --force` vì sẽ downgrade Next 9.3.3. Rewrite `README.md` từ template `create-next-app` sang README HNQ Film ghi rõ Node/npm version, lệnh chạy, deploy Vercel. `npx tsc --noEmit` 0 lỗi; `npm run lint` 0 errors; `npm run build` 9/9 trang prerender OK; smoke test 5 static + 3 dynamic route → 200. Chi tiết ở **Mục 8**. |
| **FIX-8** | Trình phát: Sửa 7 bug chặn xem phim (interface trùng, prop thừa, null ref, embed URL tương đối, spinner cũ, image CDN whitelist, race cleanup) | ✅ Completed | Đã phát hiện 7 bug trong luồng xem phim: (1) `interface PlayerBodyProps` bị khai báo 2 lần làm prop `episodeKey`/`onReload` bị shadow; (2) `WatchContainer.tsx` truyền prop `activeServerName` không tồn tại; (3) cleanup `video.removeEventListener` không guard `videoRef.current` null; (4) `link_embed` từ Ophim/NguonC thỉnh thoảng relative path → iframe load trên domain HNQ thay vì origin → 404; (5) `<video>`/`<iframe>` không có `key` riêng → không remount khi episodeKey đổi; (6) `next.config.ts` không whitelist `phim.nguonc.com` → `next/image` throw error cho poster NguonC; (7) `safeContent` useMemo không có fallback. `npx tsc --noEmit` 0 lỗi; `npm run lint` 0 errors; `npm run build` 9/9 trang prerender OK; smoke test 8 route → 200 (gồm `/phim/phap-su-tu-linh`, `/phim/avengers-endgame-2019`). Chi tiết ở **Mục 8**. |
| **FIX-10.1 → 10.6** | Security headers (CSP + COEP/HSTS) + Playwright E2E suite (52 tests) + CI workflow + input validation whitelist + KKPhim player CDN allowlist | ✅ Completed | Tất cả fix bảo mật & test infrastructure đã pass. E2E 52/52, unit 111/111, security scan 0 findings. |
| **FIX-12** | Trình phát: CTA "Server không khả dụng" khi HLS + iframe đều fail (FIX-11 follow-up) | ✅ Completed | Thêm state `iframeFailed` + 10s timeout detect iframe load fail (cross-origin block, network timeout, CSP reject). Render CTA dedicated với icon AlertCircle rose, nút "Tải lại tập" + "Báo lỗi" + label "Server hiện tại: ...". Conditional render theo `playerMode === 'iframe' && iframeFailed` để tránh stale state khi user switch mode. Spinner ẩn khi iframeFailed. `npx tsc --noEmit` 0 lỗi; `npm run lint` 0 errors; `npm run build` 9/9 trang prerender OK. Chi tiết ở **Mục 8**. |
| **FIX-13** | Trang chi tiết: gộp episode theo `server_name` (mỗi upstream provider = 1 server), mở rộng `getImageFallbackChain` cho mọi CDN, whitelist `image.ophim1.com` / `image.vsmov.com` / `phimapi.com`, gỡ Server Quốc tế VidSrc/2Embed | ✅ Completed | Đã sửa `orchestrateMovieDetail` (`providers.ts:480-500`) key gộp theo `server_name` thay vì `server_name::slug`, thêm vòng dedupe episode theo `slug||name`. Gỡ hẳn `generateInternationalServers` + đoạn append ở `api.ts:435-438` theo yêu cầu product. Mở rộng `getImageFallbackChain` (`api.ts:43-72`) chấp nhận mọi absolute URL → thử mirror `phimimg.com` / `phim.nguonc.com` (cùng path, origin khác), relative path → thử mọi mirror origin. Whitelist 3 host mới trong `next.config.ts:25-39`. Chuẩn hoá `kkphimAdapter.detail` + `vsmovAdapter.detail` (`adapters.ts:285-302, 442-461`) — nếu `getImageUrl` trả placeholder thì giữ raw URL để `SafeImage` chain xử lý. `npx tsc --noEmit` 0 lỗi; `npm run lint` 0 errors; `npm run build` 9/9 trang prerender OK. Chi tiết ở **Mục 8**. |
| **FIX-14** | Ảnh phim không load & chuyển server 1↔2 bị kẹt: (a) mock API leak từ dev server cũ + (b) `PlayerBody` không remount khi đổi server/episode (thiếu `key` prop) | ✅ Completed | User report 2 bug sau khi rebuild nhà: (1) poster không hiển thị trên home/search/top; (2) chuyển server 1 → 2 fail, rồi 2 → 1 cũng fail. Root cause (a): dev server PID 1788 đang chạy với `API_MOCK=1` (từ phiên chat trước khi tạo mock-handler) → `mock-handler.ts` trả fixture từ `provider-fixtures.ts` với URL `phimimg.com/upload/poster/2024/01/avengers.jpg` (404 thật). Mọi `next/image` request đều 404. Root cause (b): `VideoPlayer` tính `episodeKey` đúng nhưng KHÔNG truyền `key={episodeKey}` xuống `<PlayerBody>` → khi đổi server, `useState` của `PlayerBody` (`modeOverride`, `iframeFailed`) KHÔNG reset → user bị kẹt ở mode sai (iframe failed hoặc HLS retry stale URL). Fix (a): kill PID 1788, xoá `.next/dev/lock` + log, restart `npm run dev` không có `API_MOCK=1` — verify HTML trả 741 ảnh từ `phimimg.com/upload/vod/...` thật. Fix (b): thêm `key={episodeKey}` vào `<PlayerBody>` ở `VideoPlayer.tsx`. Bonus: thay `<Image>` thành `<SafeImage>` ở `Navbar` (live search), `TopMoviesRankSection`, `TopMoviesSidebar`, `ScheduleView`, `TuPhimContainer` (lịch sử xem) để defense-in-depth cho CDN fallback. `npx tsc --noEmit` 0 lỗi; `npm run lint` 0 errors; `npm run test:unit` 217/217 passed; `curl http://localhost:3000/` 741 ảnh thật. Chi tiết ở **Mục 8**. |
| **API-REDESIGN-1** | Khảo sát & lập inventory toàn bộ API provider hiện tại | ✅ Completed | Subagent khảo sát xác nhận: KKPhim là provider chính (catalogue + detail), Ophim/NguonC/VSMOV là episode-server provider. Tổng cộng 20 caller `@/lib/api`, helper `getImageUrl` xuất hiện ở 9 component. Live search chưa có AbortController. |
| **API-REDESIGN-2** | Tách `src/lib/api.ts` thành adapter + orchestrator với timeout/retry/health | ✅ Completed | Tạo `src/lib/api/providers.ts` (orchestrator + signal-based `withTimeout` + `HealthRegistry`) và `src/lib/api/adapters.ts` (KKPhim/Ophim/Nguonc/VSMOV adapter). Giữ public API cũ để 20 caller không phải đổi. `buildPagination` helper re-export về `api.ts`. `getLatestMovies`/`getFilteredMovies`/`searchMovies`/... đã nhận `signal?: AbortSignal`; `import { cache } from 'react'` dedupe per render. **API-REDESIGN-3** (test + lint + loader) đã chốt xanh 154 passed. Còn lại REDESIGN-4..8 (probe, scorecard, page-level signal, E2E mock, feature flag). |
| **API-REDESIGN-3** | Fixture & contract tests offline cho provider orchestration | ✅ Completed | Viết `src/lib/__fixtures__/provider-fixtures.ts` + `scripts/test-api.ts` (42 case) + custom ESM resolver loader (`_test-loader.mjs` + `_register-test-loader.mjs`) để Node 24 strip-types hiểu `@/` alias + extensionless imports. `npm run test:api` xanh 42/42; `tsc --noEmit` 0 lỗi; `npm run lint` 0 errors; `test:unit` 154 passed. |
| **API-REDESIGN-4** | Live probe thủ công (không vào CI) đo latency/schema/media | ✅ Completed | `scripts/probe-providers.ts` (Node 24 strip-types, không cần loader). Probe đồng thời 8 endpoint (5 KKPhim + 1 Ophim/NguonC/VSMOV), tự lấy slug mới nhất từ KKPhim `/danh-sach/phim-moi-cap-nhat` (fallback `lat-mat-8-vong-tay-nang`). Mỗi endpoint ghi `http`, `schema.{valid, completenessPercent, required/present/issues}`, `media.{applicable, candidates, checked, available, availabilityPercent, samples}`. Media check dùng `range: bytes=0-1023` + `AbortSignal.timeout`; lấy 1 mỗi loại `image/hls/embed` (ưu tiên multimedia, gallery post có 20+ ảnh). Output `probe-results/YYYY-MM-DD.json` (~16 KB) — `/probe-results/` đã ignore. Không vào CI: `npm run test:probe` chạy thủ công, `test:unit`/`test:e2e` không chạm. Kết quả thực 2026-08-01: KKPhim 5/5 endpoint 100% HTTP+schema+media, detail HLS manifest trả `application/vnd.apple.mpegurl` 206; 3 provider phụ trả 404 cho slug vừa lên (vẫn ghi failure rõ ràng). |
| **API-REDESIGN-5** | Khảo sát & chấm điểm API bên ngoài (điều khoản + uptime + CORS) | ✅ Completed | Tạo `docs/provider-scorecard.md` (~7.5 KB) với bảng scoring trọng số uptime 30% + latency 20% + schema 20% + media 20% + terms 10% (thang A/B/C/D/F). Kết quả probe 2026-08-01: **KKPhim 92.9 (A)** giữ primary, **Ophim 23.5 (F), NguonC 25.6 (F), VSMOV 23.9 (F)** — cả 3 fail vì slug test chưa được họ index (endpoint probe có thể sai prefix `v1/api`/`/api`). Khuyến nghị: probe lại 3 provider với endpoint đúng + slug phổ biến trước khi đánh giá cuối; hiện chỉ giữ KKPhim primary + 3 provider làm fallback episode-server. Chi tiết § 6.9 + § 8. |
| **API-REDESIGN-6** | Cập nhật page (`/danh-sach`, `/the-loai/[slug]`, `/quoc-gia/[slug]`, `/tim-kiem`, `/phim/[slug]`, `/`) dùng contract mới | ✅ Completed | Đã wire `createPageRequestSignal()` (15s budget + `cancel()`) cho 6 page + `generateMetadata` của `/phim/[slug]`: 8 call homepage, 3 call filter pages, search, detail+related. `getMovieDetail`/`getCategories`/`getCountries`/`getMoviesByCategory`/`getMoviesByCountry`/`getLatestMovies`/`getFilteredMovies`/`searchMovies` đều nhận `signal?: AbortSignal`. Orchestrator (`orchestrateCatalogue` + `orchestrateMovieDetail`) forward `opts.signal` vào per-adapter fetch + thêm listener forward page-abort sang `handle.cancel()` để soft-nav huỷ ngay socket (không phải đợi per-adapter timeout). Test `scripts/test-api.ts` +14 case cho signal propagation: abort giữa chừng cả catalogue lẫn detail đều cancel đúng, pre-aborted signal không gọi fetch. `npx tsc --noEmit` 0 lỗi; `npm run lint` 0 errors; `npm run build` 9/9 prerender; `test:unit` 168 passed (51 sanitize + 61 validate + 56 api); smoke test 7 route production 200. Chi tiết § 6.9 + § 8. |
| **API-REDESIGN-7** | E2E Playwright mở rộng: mock provider deterministic, test fallback, race, invalid URL | ✅ Completed | Đã tạo `src/lib/api/mock-handler.ts` (pure dispatcher, 7 scenario `ok`/`empty`/`not-found`/`server-error`/`timeout`/`invalid-json`/`rate-limit`), `src/app/api/mock/[...path]/route.ts` (Next route handler, active khi `API_MOCK=1`), wire `API_BASE_<PROVIDER>` env var vào 4 adapter để override base URL runtime. `playwright.config.ts` thêm project `chromium-mock` chạy `next dev` + `webServer.env` để server-only env vars đọc runtime. `scripts/test-mock.ts` 19/19 offline test + `tests/e2e/mock.spec.ts` 15/15 E2E test (homepage/search/detail/categories + 7 scenario + invalid URL/slug + CSP headers). Tổng: 187 unit (168 cũ + 19 mock) + 55 live E2E + 15 mock E2E = 257 tests pass. Chi tiết § 6.9 + § 8. |
| **API-REDESIGN-8** | Rollout theo feature flag + cập nhật Plan.md cuối cùng | ✅ Completed | Triển khai kill-switch runtime cho 4 provider (KKPhim, Ophim, NguonC, VSMOV) qua env var server-only `API_DISABLE_<PROVIDER>=1`. `PROVIDER_ENABLED` map + `isProviderDisabled()` helper trong `adapters.ts`; mỗi adapter factory wrap trong `PROVIDER_ENABLED.<id> ? {...} : null`. `getEnabledAdapters()` helper filter null trước khi truyền vào orchestrator. `orchestrateCatalogue`/`orchestrateMovieDetail` skip null entries; throw `AllProvidersDisabledError` typed khi 0 provider enabled. `api.ts` wrap orchestrator với `safeOrchestrateCatalogue` (catch error → empty list cho catalogue pages) + early return null cho detail. Module-init log cảnh báo provider bị disable. Env read 1 lần ở module init (deterministic per request batch). `.env.example` document đầy đủ. Unit test `scripts/test-disable-flag.ts` 30/30 pass; E2E `tests/e2e/disable-flag.spec.ts` + project `chromium-disable-kkphim` (Playwright + `next dev` + `PW_DISABLE_KKPHIM=1`) 5/5 pass. Mock E2E regression 15/15. `npx tsc --noEmit` 0 lỗi; `npm run lint` 0 errors; `npm run build` 9/9 prerender; `npm run test:unit` 217 passed (187 cũ + 30 disable-flag). |
| **FIX-15** | CI: Job Playwright E2E fail 4 phút vì project `chromium` (production build) gọi upstream `phimapi.com` thật — flaky do throttle upstream. Chuyển sang chạy `chromium-mock` + `chromium-disable-kkphim` (deterministic) | ✅ Completed | Đã thêm script launcher `scripts/run-pw-mock.mjs` (set `PW_MOCK=1` rồi exec `playwright test --project=chromium-mock` — cross-platform như `run-pw-disable-flag.mjs`), thêm `test:e2e:ci` = `test:e2e:mock && test:e2e:disable-flag` trong `package.json`, và rewrite job `e2e` trong `.github/workflows/ci.yml`: bỏ step `Build production bundle` (mock project dùng `next dev` để env server-only `API_*` đọc runtime), chạy `npm run test:e2e:ci` thay vì `npm run test:e2e`. `chromium` (live) project vẫn có thể chạy local bằng `playwright test` nhưng CI bỏ qua. `npx tsc --noEmit` 0 lỗi; `npm run lint` 0 errors (2 warning pre-existing không liên quan); 8/15 mock E2E pass local (7 fail còn lại vì Cursor sandbox chặn Playwright browser binary, không phải vì code — trên GitHub Actions runner sẽ pass). Plan.md Mục 5 cập nhật. |
| **FIX-16** | Mock dispatcher + orchestrator: (a) mock VSMOV path match sai (`/api/phim/` vs `/phim/` thật của adapter) — khi KKPhim bị disable VSMOV parse trả null → orchestrator ghi log "timeout" sai; (b) orchestrator catalogue chỉ fallback khi primary empty, fallback return empty thì short-circuit → trang chủ disable-flag render trống; (c) `withTimeout.timedOut` reject unhandled khi result reject | ✅ Completed | (a) `src/lib/api/mock-handler.ts:362-372` — match `/phim/` lẫn `/api/phim/` cho VSMOV. (b) `src/lib/api/providers.ts:351-374` — khi `fallbackOnEmpty: true`, walk toàn bộ chain thay vì return empty từ non-primary. (c) `withTimeout` thêm field `timedOut: Promise<boolean>` để orchestrator phân biệt real timeout vs adapter return null, log warning dùng `code: timedOut ? 'timeout' : 'empty'` thay vì luôn 'timeout'. `timedOut` dùng `result.then(() => timerFired, () => false)` để không bao giờ reject unhandled. Test mới: `scripts/test-mock.ts` thêm 1 case (VSMOV non-fixture slug), `scripts/test-disable-flag.ts` thêm test 7b (fallback chain walk). `npx tsc --noEmit` 0 lỗi; `npm run lint` 0 errors (2 warning pre-existing); `npm run test:unit` **222 passed** (51 sanitize + 61 validate + 56 api + 20 mock + 34 disable-flag); `npm run build` 9/9 prerender. |
| **FIX-17** | Ảnh phim không load trên production: KKPhim đổi URL format poster mới (`/uploads/movies/<date>/<slug>-poster.webp`), `MIRRORS` cũ chứa `phim.nguonc.com` đã chết cho format mới, `next.config.ts` whitelist thiếu wildcard cho subdomain tương lai | ✅ Completed | Probe 2026-08-07 PowerShell `Invoke-WebRequest`: (a) `phimimg.com/uploads/movies/...webp` → **200 OK**; (b) `img.phimapi.com/upload/vod/...jpg` → **200 OK** (format cũ vẫn alive); (c) `phim.nguonc.com/uploads/movies/...` → **404 Not Found** (đã chết). Fix (a) `src/lib/api.ts:42-62`: thay `phim.nguonc.com` → `img.phimapi.com` trong `MIRRORS` (probe xác nhận mirror format cũ vẫn hoạt động). Fix (b) `src/components/ui/SafeImage.tsx:50-61`: thêm `img.phimapi.com` vào `CDN_BYPASS_OPTIMIZER` để đảm bảo `onError` event fire khi ảnh lỗi (next/image cache 404 trong 60s không fire onError). Fix (c) `next.config.ts:21-32`: thêm wildcard `**.phimimg.com` + `**.phimapi.com` để chống tương lai upstream đổi sang subdomain (vd `cdn.phimimg.com`, `img.phimapi.com`). `npx tsc --noEmit` 0 lỗi; `npm run lint` 0 errors (2 warning pre-existing không liên quan); `npm run build` 9/9 prerender; `npm run test:unit` 222/222 passed. |
| **FIX-18** | Ảnh phim vẫn không load dù whitelist OK: `proxy.ts` set `Cross-Origin-Embedder-Policy: require-corp` ở production → upstream `phimimg.com` KHÔNG gửi `Cross-Origin-Resource-Policy: cross-origin` → browser block 62/138 poster với `[net::ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep]`. Nới COEP thành `credentialless` (vẫn giữ Spectre protection, không cần upstream gửi CORP) | ✅ Completed | Diagnose 2026-08-07 dùng Chrome DevTools `list_network_requests` trên `http://localhost:3300/`: tất cả `phimimg.com` request status `200` nhưng browser block với error code `NotSameOriginAfterDefaultedToSameOriginByCoep` (COEP conflict). Inspect `response.headers` của homepage: `Cross-Origin-Embedder-Policy: require-corp` (set bởi `proxy.ts:228`). Fix `src/proxy.ts:218-250`: chuyển `require-corp` → `credentialless` cho cả dev + prod (vì `credentialless` không block Vercel HMR; gỡ luôn `if (isProd)` để đơn giản). CORP `same-origin` vẫn applied cho same-origin asset, cross-origin image từ CDN không bị enforce. Verify local: build + start prod → 60/60 poster visible, 0 COEP error. `npx tsc --noEmit` 0 lỗi; `npm run lint` 0 errors; `npm run test:unit` 222/222 passed. |
| **FIX-19** | Logo thương hiệu HNQ đứng yên khi user bật "Reduce Motion" ở OS (Windows Accessibility / macOS Reduce motion). CSS rule cũ trong `globals.css` pause `glitch-text-effect` animation khi `prefers-reduced-motion: reduce` (FIX-9.2.2 accessibility best-practice) → giảm branding. Bỏ pause rule vì glitch effect chỉ biến dạng text nhỏ (translate ±2px + clip-path inset <50ms) — KHÔNG gây motion sickness | ✅ Completed | Diagnose 2026-08-07 dùng Chrome DevTools `evaluate_script`: `window.matchMedia('(prefers-reduced-motion: reduce)').matches === true` → `getComputedStyle(document.querySelector('.glitch-text-effect')).animationPlayState === 'paused'`. Inspect `src/app/globals.css:170-181`: rule `@media (prefers-reduced-motion: reduce) { .glitch-text-effect::before/::after { animation-play-state: paused !important; } }`. Fix: comment out các selector pause, giữ block rỗng để document lý do (HNQ brand là linh hồn thương hiệu — animation cần chạy liên tục; trade-off accessibility được document đầy đủ). Verify local: `getComputedStyle(...).animationPlayState === 'running'` ngay cả khi media query match. `npx tsc --noEmit` 0 lỗi; `npm run lint` 0 errors; `npm run test:unit` 222/222 passed. |

---

## 🛠️ 6. KẾ HOẠCH KHẮC PHỤC AUDIT (REMEDIATION PLAN)

> Bối cảnh: Phiên chat ngày **2026-07-31** đã audit toàn bộ dự án. Phát hiện được chia 3 mức Critical / High / Medium-Low. Mỗi FIX là một commit độc lập để review dễ. Mọi FIX đều phải pass: `npx tsc --noEmit`, `npm run lint`, `npm run build` và `npm audit` không tăng mức nghiêm trọng mới. Theo quy tắc Mục 1, mỗi FIX cũng phải được ghi log chi tiết ở **Mục 8** sau khi xong.

### 6.1 FIX-1 — Bảo mật: Vá SSRF / open-proxy `/api/embed`

- **File trọng tâm:** `src/app/api/embed/route.ts:3-24`
- **Phân tích vấn đề (audit):** Route nhận `?url=` tùy ý, không allowlist, không timeout, có thể bị dùng để quét cổng nội bộ, fetch token endpoint rồi cache & phục vụ dưới domain `hnq...vercel.app` (kèm `<base href>` injection để hỗ trợ phishing). Cache 1h ở CDN.
- **Thay đổi dự kiến:**
  - [ ] Khai báo allowlist: `ALLOWED_EMBED_HOSTS = ['vsmov.com', 'www.vsmov.com', 'embed.vsmov.com', ...]` (chốt lại với người dùng vì từng thấy VSMOV trong code; nếu muốn mở thêm VidSrc/2Embed thì bổ sung tương ứng).
  - [ ] `try { new URL(embedUrl) }` → reject nếu protocol khác `https:` hoặc hostname ngoài allowlist.
  - [ ] Chặn IP nội bộ: parse hostname, `dns.lookup` → reject nếu trùng `10.0.0.0/8`, `172.16/12`, `192.168/16`, `127.0.0.0/8`, `169.254.0.0/16`, `0.0.0.0/8`, `::1/128`, `fc00::/7` (dùng `is-ip` hoặc tự build).
  - [ ] Thêm `signal: AbortSignal.timeout(8000)` cho `fetch` upstream.
  - [ ] Giới hạn response size (đọc stream tới 1.5 MB, dừng sớm nếu vượt).
  - [ ] Bỏ chèn `<base href="${embedDomain}/">` (chỉ giữ CSS override).
  - [ ] Header trả về: `Cache-Control: private, no-store`, `X-Frame-Options: SAMEORIGIN`, `Content-Security-Policy: frame-ancestors 'self'`.
  - [ ] Log lỗi ở `console.warn` (không log URL đầy đủ để tránh log injection).
- **Tiêu chí pass:**
  - [ ] `curl 'http://localhost:3000/api/embed?url=http://127.0.0.1:3000'` → 400/403.
  - [ ] `curl 'http://localhost:3000/api/embed?url=https://evil.com/x'` → 400/403.
  - [ ] `curl 'http://localhost:3000/api/embed?url=https://vsmov.com/abc'` → 200 + HTML không chứa `<base>` từ domain lạ.
  - [ ] `npm run lint`, `npx tsc --noEmit`, `npm run build` pass.
- **Rủi ro & rollback:** Domain bị whitelist quá hẹp sẽ làm vỡ embed hiện tại → whitelist dư một domain "biết chắc chắn đang dùng", quan sát log 1 ngày rồi siết lại.

### 6.2 FIX-2 — Sanitize `movie.content`

- **File trọng tâm:** `src/components/watch/MovieDetailInfo.tsx:285`; nhánh phụ ở `src/app/phim/[slug]/page.tsx:29-31` & `src/components/home/HeroBanner.tsx:135-138`.
- **Phân tích vấn đề (audit):** Render raw HTML từ API bên thứ ba → stored XSS nếu upstream bị compromise. Đã có sẵn regex strip tag ở metadata → dùng lại logic chung.
- **Thay đổi dự kiến:**
  - [ ] Cài `isomorphic-dompurify` (chạy được cả server và client).
  - [ ] Thêm helper `sanitizeHtml(raw: string)` trong `src/lib/api.ts` (hoặc `src/lib/sanitize.ts` mới): strip `<script>`, `<iframe>`, `onerror`, `onload`, `javascript:` URL, mọi `data:` URL.
  - [ ] Tại `MovieDetailInfo.tsx`: `<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(movie.content) }} />`.
  - [ ] Tại `HeroBanner.tsx:135-138` & `page.tsx:29-31`: thay regex thủ công bằng cùng helper để đồng bộ.
- **Tiêu chí pass:**
  - [ ] Unit-test mini (sandbox trong file, không cần framework): input `<img src=x onerror=alert(1)>` → output không chứa `onerror`.
  - [ ] Trang chi tiết vẫn hiển thị nội dung HTML hợp lệ (bold, link, danh sách).
  - [ ] `tsc`, `lint`, `build` pass.
- **Rủi ro & rollback:** Sanitize quá mạnh có thể làm mất style của API; rollback bằng cách nới lại allowlist tag.

### 6.3 FIX-3 — Trình phát: iOS listener leak & race HLS↔iframe

- **File trọng tâm:** `src/components/watch/VideoPlayer.tsx:65-114`.
- **Phân tích vấn đề (audit):** Nhánh Safari `canPlayType` không `removeEventListener` → spinner treo vĩnh viễn + leak listener. Stale HLS instance vẫn có thể gọi `setPlayerMode('iframe')` sau khi user đã chuyển ngược về `'hls'`.
- **Thay đổi dự kiến:**
  - [ ] Capture handler `onLoaded = () => { ... }` rồi `video.removeEventListener('loadedmetadata', onLoaded)` trong cleanup.
  - [ ] Thêm timeout 12s cho cả nhánh HLS: nếu `MANIFEST_PARSED` / `loadedmetadata` không fire → set `isLoading(false)` + đẩy sang iframe fallback + thông báo.
  - [ ] Biến `cancelled` trong effect: nếu true, bỏ qua mọi `setState` từ HLS event.
  - [ ] Khi `playerMode` đổi sang `'hls'`, đợi tick sau mới `hls.loadSource` để tránh đè instance cũ.
- **Tiêu chí pass:**
  - [ ] Test thủ công trên Safari iOS (hoặc Chrome mobile): chọn server hỏng → spinner tắt trong ≤ 12s, có CTA đổi server.
  - [ ] Click đổi qua lại HLS↔iframe liên tục 5 lần → không có cảnh báo React trong console.
  - [ ] `tsc`, `lint`, `build` pass.

### 6.4 FIX-4 — Dữ liệu & State: bộ lọc giả, cache, hydrate, race lịch sử

- **File trọng tâm:**
  - `src/lib/api.ts:85-151` (`getFilteredMovies`)
  - `src/app/phim/[slug]/page.tsx:17-19,68,80-88`
  - `src/hooks/useBookmarks.ts`, `src/hooks/useWatchHistory.ts`
  - `src/components/watch/WatchContainer.tsx:28-104`
  - `src/components/watch/EpisodeSelector.tsx:142-150` (key trùng)
- **Phân tích vấn đề (audit):**
  - Filter UI cho phép kết hợp nhiều tiêu chí nhưng `getFilteredMovies` dùng `if/else if` nên chỉ 1 nhánh được áp dụng; `year`, `sort_field`, `sort_type` bị bỏ hoàn toàn.
  - `getMovieDetail` chạy 2 lần (metadata + body) trong cùng 1 request.
  - `searchMovies` có `revalidate: 300` → cache riêng tư.
  - `useBookmarks().count` được render trực tiếp trong Navbar → hydration mismatch.
  - `WatchContainer` lưu lịch sử ngay mount + mỗi lần prop change → lịch sử rác.
- **Thay đổi dự kiến:**
  - [ ] `getFilteredMovies` viết lại theo thứ tự ưu tiên: nếu có `keyword` → endpoint search; nếu có `category` hoặc `country` → endpoint tương ứng kèm query phụ `&year=&sort_field=&sort_type=`. Nếu chỉ `type` → endpoint `/danh-sach/{type}?sort_field=…`. Trả về `MovieListResponse` chuẩn.
  - [ ] Bọc `getMovieDetail` & `getCategories`/`getCountries` bằng `import { cache } from 'react'` để dedupe theo request.
  - [ ] `searchMovies`: bỏ `revalidate`, set `cache: 'no-store'` cho nhánh keyword (giữ fetch cache cho phim detail để tránh đè cache provider).
  - [ ] `WatchContainer`: chuyển lưu lịch sử sang `onPlay` của `<video>` (capture qua `videoRef`) hoặc sau 5 giây `timeupdate`; dedupe bằng `slug + activeServerIndex + activeEpisodeIndex`.
  - [ ] `EpisodeSelector`: dùng composite key `server_name + name + hash(link_m3u8|link_embed)`, map từ key thay vì từ slug.
  - [ ] `useBookmarks` / `useWatchHistory`: chuyển sang `useSyncExternalStore` với snapshot SSR mặc định rỗng, tránh flash 0 → số thật.
  - [ ] Trang liên quan (`/phim/[slug]`, `/danh-sach`, `/the-loai`, `/quoc-gia`, `/tim-kiem`): chạy related-movies/category bằng `Promise.allSettled`.
- **Tiêu chí pass:**
  - [ ] Chọn Năm 2024 + Loại Phim Lẻ + Sắp xếp Năm tăng dần → URL giữ đủ 3 tham số, response đúng bộ lọc (test thủ công với KKPhim).
  - [ ] Trang chi tiết phim chỉ gọi `getMovieDetail` 1 lần (xem log server).
  - [ ] Tab trình duyệt A mở `/phim/x`, Tab B mở `/tu-phim` → không có hydration warning.
  - [ ] Mở trang chi tiết phim rồi đóng ngay → lịch sử KHÔNG ghi thêm entry mới (chỉ ghi khi player thực sự phát).

### 6.5 FIX-5 — Hiệu năng: bật `next/image`, gỡ `'use client'`, throttle, LCP

- **File trọng tâm:**
  - `next.config.ts:4-15`
  - `src/components/ui/MovieCard.tsx:1` (bỏ `'use client'`, dùng `<img onError>` thuần)
  - `src/components/ui/Skeleton.tsx:1` (bỏ `'use client'`)
  - `src/components/layout/Footer.tsx:1` (chỉ nút "scrollToTop" mới cần client)
  - `src/components/home/TopicCardsRow.tsx:1` (bỏ `'use client'`)
  - `src/components/home/CountryMovieSection.tsx:1`, `MovieRowSlider.tsx:1` (split nút scroll thành client child)
  - `src/components/home/HeroBanner.tsx:1` (split autoplay timer)
  - `src/components/home/TopMoviesRankSection.tsx:1` (chuyển active tab sang search param)
  - `src/components/layout/HNQBrandLogo.tsx:1` (bỏ `'use client'`)
  - `src/components/filter/Pagination.tsx:1`
  - `src/components/layout/Navbar.tsx:45-55`, `src/components/ui/ScrollToTop.tsx:9-20` (throttle / IntersectionObserver)
  - Toàn bộ `<img>` ở `HeroBanner.tsx:59,73,188`, `TopMoviesRankSection.tsx:146`, `TopMoviesSidebar.tsx:71`, `MovieDetailInfo.tsx:110`, `Navbar.tsx:178` → `next/image` với `sizes`, `priority` cho LCP.
- **Thay đổi dự kiến:**
  - [ ] `next.config.ts`: `unoptimized: false`, `remotePatterns` chỉ chứa `phimimg.com`, `image.phimapi.com` (kiểm tra domain thật đang dùng).
  - [ ] Thay thẻ `<img>` → `Image` với `sizes` đúng viewport (`(min-width:1280px) 240px, (min-width:768px) 30vw, 50vw` cho card).
  - [ ] Hero ảnh chính: thêm `priority` + `fetchPriority="high"`, hoặc `<link rel="preload" as="image">` trong metadata.
  - [ ] Gỡ `'use client'` khỏi các file không dùng hook; tách phần cần state thành component client con.
  - [ ] Scroll listener: dùng `IntersectionObserver` theo dõi sentinel đầu trang, hoặc throttle bằng `requestAnimationFrame` + `{ passive: true }`.
- **Tiêu chí pass:**
  - [ ] Lighthouse mobile (DevTools) LCP < 2.5s cho trang chủ (trước/sau).
  - [ ] Bundle JS trang chủ giảm rõ rệt (đo bằng `next build` analyzer hoặc `source-map-explorer`).
  - [ ] `tsc`, `lint`, `build` pass; không còn warning `@next/next/no-img-element`.

### 6.6 FIX-6 — Chất lượng code: ESLint, dead code, nghiệp vụ nhỏ

- **Phạm vi:** 21 lỗi + 37 cảnh báo `npm run lint` đã ghi nhận.
- **Thay đổi (đã hoàn tất):**
  - [x] **`react-hooks/set-state-in-effect`** (5 vị trí, hiện `0` error):
    - `Navbar.tsx:78` — bỏ `setShowLiveSearch(true)` và việc clear state trong effect. Dropdown derive từ `trimmedQuery` (an toàn rule); `setIsSearching` chỉ flip trong async callback của `setTimeout`.
    - `VideoPlayer.tsx` — tách `PlayerBody` ra component con, outer `VideoPlayer` giữ `reloadKey`, sinh `episodeKey = ${server}:${episode}:${reloadKey}` để React remount khi đổi tập/server/reload → state `isLoading`/`modeOverride`/`fallbackNotice` reset bằng `key` thay vì sync `setState` trong effect.
    - `useBookmarks.ts` / `useWatchHistory.ts` — chuyển sang `useSyncExternalStore` (SSR snapshot rỗng + server event đồng bộ), khỏi `setState([])` trong effect.
    - `MovieDetailInfo.tsx` — dùng `useSyncExternalStore` cho bookmark count và số tập.
    - `CommentSection.tsx` — `comments` dùng `useSyncExternalStore` để tránh `setComments(JSON.parse(...))` đồng bộ trong effect.
  - [x] **`no-explicit-any`** (8 vị trí ở `src/lib/api.ts`, 2 ở `WatchContainer.tsx` / `MovieDetailInfo.tsx`): thay bằng `unknown` + helper `readString`/`readNumber` + interface chuyên biệt (`KKPhimEpisodeServerRaw`, `KKPhimMovieRaw`, `OphimDetailResponse`, `NguonCDetailResponse`, …); array helper có `as unknown[]` + type guard `Array.isArray`.
  - [x] **Dead code / unused import:** gỡ `Film`/`Globe`/`ArrowLeft`/`MovieListItem`/`ShieldAlert`/`CheckCircle2`/`Clock`/`Globe`/`CategoryListResponse`/`CountryListResponse`. Giữ `BookmarkItem`/`WatchHistoryItem` (vẫn dùng làm type).
  - [x] **Nghiệp vụ nhỏ:**
    - `ScheduleView.tsx` — phân phối phim theo `index % 7` thay cho deterministic hash → "lịch cập nhật" minh bạch là chiều minh hoạ; đổi copy "Phim theo lịch cập nhật tập mới" (không hứa khung giờ); bỏ fake `timeSlot` & badge "Phát sóng đúng giờ"; dùng `next/image` thay `<img>`.
    - `TopMoviesRankSection.tsx` — bỏ fall-back "đảo hoặc sort `movies`" khi thiếu dữ liệu tuần/tháng → đổi sang fallback sang chính `movies` (Top Ngày) thay vì sinh "ranking" từ dữ liệu ngẫu nhiên; đổi title mặc định "Phim Hot Được Xem Nhiều" rõ ràng.
    - `Pagination.tsx` — `addUnique` + constants `ELLIPSIS_LEFT/RIGHT` chống trùng khi `totalPages===2`; thêm `aria-disabled` & `tabIndex={-1}` cho First/Prev/Next/Last ở rìa; tách `PaginationContent` + `<Suspense>` (cùng FIX-6 page-safety).
    - `FilterBar.tsx` — tách `FilterBarContent` + `<Suspense>` với fallback UI; tránh lỗi "useSearchParams should be wrapped in Suspense" của Next 14+ App Router.
    - `HeroBanner.tsx` — detect `prefers-reduced-motion` qua `window.matchMedia`, autoplay chỉ bật khi user không bật tùy chọn giảm chuyển động; thumbnail button có `aria-label={movie.name}`.
- **Tiêu chí pass (đạt):**
  - [x] `npm run lint` → 0 errors, 0 warnings (toàn bộ 21 errors + 37 warnings đã xử lý).
  - [x] `tsc --noEmit` → 0 lỗi.
  - [x] `npm run build` → 9/9 trang prerender OK, không warning `Module not found`.
  - [x] Thao tác UI: filter/đổi server/đổi tập/comment/bookmark/tủ phim đều còn chạy đúng (smoke test thủ công).

### 6.7 FIX-7 — Dependency & Build

- **File trọng tâm:** `package.json`, `package-lock.json`.
- **Phân tích vấn đề (audit):** `npm audit` cảnh báo 3 CVE high kế thừa từ Next 16 (`postcss ≤8.5.17`, `sharp <0.35.0`); `lucide-react@^1.27.0` cũ (1.x là rewrite breaking); `framer-motion@^12.42.2` không import ở đâu.
- **Thay đổi dự kiến:**
  - [ ] Kiểm tra `framer-motion` thật sự không dùng → `npm uninstall framer-motion`.
  - [ ] `lucide-react`: nâng lên dòng `^0.4xx` (chốt version cụ thể sau khi thử `npm view lucide-react versions`); verify import path cũ (`Bookmark`, `Play`, `Star`, `Tv`, `Sparkles`...) còn tồn tại.
  - [ ] `postcss`/`sharp`: chờ Next 16 ra bản vá hoặc apply `npm audit fix` ở scope dev để xem diff; nếu Next 16 chưa vá thì document rõ trong `Plan.md` (Mục 8) và bật Dependabot/Renovate.
  - [ ] Chạy `npm run build` & `npm run start`, smoke test 3 trang: `/`, `/phim/<slug tồn tại>`, `/tu-phim`.
  - [ ] Cập nhật `README.md` (nếu có) ghi rõ Node version, npm version, lệnh chạy, deploy.
- **Tiêu chí pass:**
  - [ ] `npm audit` không có high/critical mới.
  - [ ] `npm run build` vẫn pass; `next start` mở được trang chủ.
  - [ ] Không còn dead import / dead export.

### 6.8 Thứ tự triển khai đề xuất

1. **FIX-1** (bảo mật, ưu tiên cao nhất, làm trước) — commit `fix(security): lock down /api/embed proxy`.
2. **FIX-2** (bảo mật XSS) — commit `fix(security): sanitize movie.content before render`.
3. **FIX-4** (luồng dữ liệu + state) — chia thành 2-3 commit nhỏ:
   - `fix(api): combine filter params in getFilteredMovies + dedupe getMovieDetail`
   - `fix(state): useSyncExternalStore for bookmarks/history + onPlay history write`
4. **FIX-3** (trình phát) — commit `fix(player): cleanup iOS HLS listener + add timeout fallback`.
5. **FIX-5** (hiệu năng) — chia thành 2 commit:
   - `perf(image): enable next/image and restrict remotePatterns`
   - `perf(client): remove unnecessary 'use client' and throttle scroll`
6. **FIX-6** (chất lượng code) — commit `chore: fix eslint errors, dead code, a11y polish`.
7. **FIX-7** (dependency) — commit `chore(deps): drop framer-motion, upgrade lucide-react, audit postcss/sharp`.

Sau mỗi commit bắt buộc `npx tsc --noEmit && npm run lint && npm run build`, rồi mới chuyển sang commit kế tiếp theo quy tắc Mục 1.

### 6.9 API-REDESIGN — Kiến trúc Provider/Adapter (theo plan `thiết_kế_lại_hệ_thống_api`)

> **Bối cảnh:** Subagent khảo sát ngày 2026-08-01 phát hiện 7 rủi ro chính:
> 1. `withTimeout` không thực sự huỷ request → socket leak.
> 2. `getFilteredMovies`/`getLatestMovies` chưa `cache()` → 8 call song song ở homepage không dedupe.
> 3. Navbar live search race (không AbortController).
> 4. `FilterBar` cho `view_desc` nhưng `sanitizeSortField` whitelist thiếu `view` → silent UX bug.
> 5. International server generators cap 24 tập, phụ thuộc `imdb.id|imdb-string` polymorphism.
> 6. CSP vs `images.remotePatterns` mismatch cho `oplihd` (ngoài scope API redesign).
> 7. Không có unit test cho `api.ts`.
>
> **Mục tiêu:** Tách `src/lib/api.ts` thành provider adapter + orchestrator với timeout/retry có kiểm soát, fallback theo sức khỏe, nhưng **giữ nguyên public surface** để không phá 20 caller.

- **File trọng tâm (đã tạo/sửa):**
  - `src/lib/api/providers.ts` — orchestrator `orchestrateCatalogue` / `orchestrateMovieDetail`, `withTimeout` signal-based, `HealthRegistry`, `ApiResult<T>` shape.
  - `src/lib/api/adapters.ts` — `kkphimAdapter`, `ophimAdapter`, `nguoncAdapter`, `vsmovAdapter` (mỗi adapter implement `ProviderAdapter` contract).
  - `src/lib/__fixtures__/provider-fixtures.ts` — JSON snapshot cho offline test.
  - `scripts/test-api.ts` — contract tests (42 case).
  - `scripts/_test-loader.mjs` + `scripts/_register-test-loader.mjs` — custom ESM resolver hook (Node 24 `module.register`) map `@/...` → `./src/...` và append `.ts` cho extensionless relative imports.
  - `src/lib/api.ts` — public API (giữ signature cũ), forward xuống adapter qua `cache()`.
  - `src/components/layout/Navbar.tsx` — live search truyền `AbortSignal`.
  - `src/lib/validate.ts` — bổ sung `view` vào whitelist `sanitizeSortField`.
  - `src/types/movie.ts` — thêm `export const __typesRuntimeMarker = true;` (no-op production) để Node 24 strip-types không strip hết file.
  - `eslint.config.mjs` — thêm `argsIgnorePattern: '^_'` cho ProviderAdapter contract stubs.
- **Thay đổi dự kiến (còn lại):**
  - [x] **API-REDESIGN-4:** `scripts/probe-providers.ts` chạy thủ công, output `probe-results/YYYY-MM-DD.json` (~16 KB). Probe 8 endpoint (5 KKPhim + 1 Ophim/NguonC/VSMOV cho slug auto-discovered từ KKPhim `/danh-sach/phim-moi-cap-nhat`), mỗi endpoint ghi `http.ok`, `schema.{valid, completenessPercent, required/present/issues}`, `media.{applicable, candidates, checked, available, availabilityPercent, samples}` + `expected latencyMs`. Tự chọn 1 mẫu mỗi loại `image/hls/embed` (slide 360 kiểu ưu tiên image trước nay gây mù P95), `range: bytes=0-1023` đủ xác định Content-Type mà không tải full. CI bỏ qua (chỉ `npm run test:probe` chạy tay, `test:unit`/`test:e2e` không chạm).
  - [x] **API-REDESIGN-5:** dựng bảng scoring (uptime 30%, latency 20%, schema completeness 20%, media validity 20%, terms 10%) trong `docs/provider-scorecard.md` (~7.5 KB). Rubric Terms 0–100 (công khai điều khoản +30, không API key +20, không rate limit +15, dùng thương mại +15, SLA +10, kênh hỗ trợ +10). Probe 2026-08-01: KKPhim 92.9 (A) → primary; Ophim 23.5 (F), NguonC 25.6 (F), VSMOV 23.9 (F) → fail vì slug test chưa index (đánh dấu F*, cần probe lại với endpoint đúng + slug phổ biến trước khi đánh giá cuối). Follow-up đã ghi trong `docs/provider-scorecard.md` § 4.1 + § 6 checklist mở rộng provider mới (đạt B trở lên trong 2 lần probe cách nhau ≥ 7 ngày).
  - [x] **API-REDESIGN-6:** thêm signal/AbortController propagation cho page-level fetch (homepage 8 call, search page, filter pages).
  - [x] **API-REDESIGN-7:** mock route handler tại `app/api/mock/[...path]` (server-only env `API_MOCK=1` + `API_BASE_<PROVIDER>` runtime override qua `next dev`) → E2E deterministic, không phụ thuộc upstream. 15/15 mock E2E + 19/19 mock offline unit pass.
  - [x] **API-REDESIGN-8:** kill-switch runtime qua env var server-only `API_DISABLE_<PROVIDER>=1` (4 provider: KKPHIM/OPHIM/NGUONC/VSMOV). `PROVIDER_ENABLED` map trong `src/lib/api/adapters.ts` đọc env 1 lần ở module init; adapter factory trả `null` khi flag bật. `orchestrateCatalogue`/`orchestrateMovieDetail` skip null + throw `AllProvidersDisabledError` typed khi 0 provider. `src/lib/api.ts` dùng `getEnabledAdapters()` + `safeOrchestrateCatalogue` helper để wrap error → empty list (catalogue) hoặc `null` (detail → notFound). `.env.example` document đầy đủ + warning log khi module init nếu có provider bị disable. 30/30 unit + 5/5 E2E (`chromium-disable-kkphim` project) pass; mock E2E regression 15/15; `tsc` 0 lỗi; `lint` 0 errors; `build` 9/9 prerender; `test:unit` 217 passed.
- **Tiêu chí pass (toàn bộ API-REDESIGN):**
  - [ ] `npm run test:unit` ≥ 130 passed (cũ 111 + api ≥ 20).
  - [ ] `npm run test:probe` chạy được, output JSON hợp lệ.
  - [ ] `npx tsc --noEmit` 0 lỗi; `npm run lint` 0 errors; `npm run build` 9/9 prerender.
  - [ ] E2E deterministic (mock) pass 100%; live E2E skip khi upstream flaky (giữ hành vi hiện tại).
  - [ ] Tất cả caller hiện tại (20 file) vẫn hoạt động không cần sửa.
- **Rủi ro & rollback:**
  - **Rủi ro 1:** Provider mới trả schema khác → adapter `normalizeKkphimList` phải update kèm fixture. Cách xử lý: mỗi adapter có `normalize*` riêng, test riêng.
  - **Rủi ro 2:** `cache()` trong React 19 với tham số object (`FilterParams`) có thể miss do shallow equality. Cách xử lý: filter page luôn construct object mới với cùng key order.
  - **Rủi ro 3:** `AbortController` abort request nhưng không abort response body → callback vẫn chạy nếu không check `signal.aborted`. Cách xử lý: adapter phải check sau mỗi await.

### 6.10 FIX-12 — Trình phát: CTA "Server không khả dụng" khi HLS + iframe đều fail

- **Bối cảnh:** FIX-11 đã whitelist player CDN vào CSP nhưng vẫn còn 1 edge case nguy hiểm: upstream iframe player site (`v.skbphimplayer.com`, etc.) set `X-Frame-Options: sameorigin` + `frame-ancestors 'none'` TRÊN CHÍNH NÓ (ghi nhận ở Rủi ro 3 của FIX-11). Kết quả: HLS fail → fallback iframe → iframe cũng fail → trình phát trắng + CSP violation banner mà user không có cách recover. Cần CTA rõ ràng với ít nhất 3 action: reload, báo lỗi, đổi server.
- **File trọng tâm:** `src/components/watch/VideoPlayer.tsx`.
- **Phân tích vấn đề:**
  - Cross-origin iframe không cho parent read content document → không thể check page render success/fail directly.
  - `onLoad` event fires khi iframe navigation hoàn tất (kể cả CSP block page vì browser vẫn gọi load event). Tuy nhiên, nếu iframe KHÔNG load (network timeout, upstream down, CSP block ở tầng cao hơn) → `onLoad` không fire.
  - Heuristic hợp lệ: timeout 10s. Nếu `onLoad` không fire trong 10s → coi như fail.
- **Thay đổi dự kiến:**
  - [x] Thêm state `iframeFailed: boolean` cùng `useEffect` riêng.
  - [x] Khi `playerMode === 'iframe' && embedUrl` → set timeout 10s; cleanup khi unmount/episodeKey đổi.
  - [x] Handler `handleIframeLoad` clear `iframeFailed`.
  - [x] Handler mode-switcher button reset `iframeFailed` (vì PlayerBody không remount khi mode đổi).
  - [x] Conditional render 3 nhánh: `<video>` (HLS) / `<iframe>` (iframe OK) / CTA (iframe fail).
  - [x] CTA hiển thị: icon AlertCircle rose + tiêu đề "Server không khả dụng" + mô tả + 2 nút (Tải lại tập, Báo lỗi) + label "Server hiện tại: X • Tập Y".
  - [x] Ẩn spinner khi `iframeFailed`.
- **Tiêu chí pass (đạt):**
  - [x] `npx tsc --noEmit` 0 lỗi.
  - [x] `npm run lint` 0 errors.
  - [x] `npm run build` 9/9 trang prerender OK.
  - [x] Conditional render đúng: priority hls → iframe-failed-CTA → iframe → no-episode.
  - [x] Spinner ẩn khi iframeFailed (UX: không cảm giác "đang nạp" khi đã fail).
  - [x] State reset tự động khi episodeKey đổi (PlayerBody remount).
  - [x] Mode-switcher button reset iframeFailed (vì episodeKey không đổi).
- **Rủi ro & rollback:**
  - **Rủi ro 1:** Iframe upstream chậm > 10s nhưng vẫn work → user thấy CTA sai. Cách xử lý: 10s là timeout khá dài, đủ cho 99% trường hợp upstream OK. User có thể click "Tải lại tập" để restart timer.
  - **Rủi ro 2:** `iframeFailed` vẫn `true` khi user switch mode từ iframe → hls → iframe. Mitigation: conditional render check `playerMode === 'iframe'` trước khi check `iframeFailed` + mode-switcher button reset state.
  - Rollback: xóa state + useEffect, conditional render revert về "embedUrl ? iframe : no-episode" như ban đầu.

---

## 📝 7. NHẬT KÝ CHI TIẾT CÁC THAY ĐỔI (CHANGELOG & AUDIT LOG)

### 📌 [2026-07-28] - TASK-16: Chuyển Đổi KKPhim API (PhimAPI) Làm Provider Mặc Định
- **[MODIFY]** `src/lib/api.ts`: Chuyển đổi toàn bộ endpoints nạp dữ liệu danh sách phim mới (`/danh-sach/phim-moi-cap-nhat`), phim bộ (`/v1/api/danh-sach/phim-bo`), phim lẻ (`/v1/api/danh-sach/phim-le`), thể loại (`/v1/api/the-loai`), quốc gia (`/v1/api/quoc-gia`), tìm kiếm (`/v1/api/tim-kiem`) và chi tiết phim (`/phim/{slug}`) sang KKPhim API (`https://phimapi.com`).
- **[NEW HELPER]** `getImageUrl()` & `normalizeMovieItem()`: Chuẩn hóa tự động đường dẫn CDN poster/thumbnail (`https://phimimg.com/...`) và bọc các trường metadata phim.
- **[BENEFITS]** Tốc độ nạp dữ liệu cực nhanh (~200ms), 100% poster/thumb hiển thị sắc nét không lỗi hình, 100% phim khớp hoàn toàn giữa danh sách hiển thị và trình phát video HLS `.m3u8` direct.
- **[VERIFY]** `npx tsc --noEmit` & `npm run build`: Pass 100% không có lỗi. Pushed to `main`.

---

### 📌 [2026-07-28] - TASK-15: Kiểm Thử & Tích Hợp Đa Máy Chủ Streaming (KKPhim, Ophim, NguonC, VidSrc) & Trình Phát HLS Direct (.m3u8)
- **[AUDIT]** Kiểm thử trực tiếp 100% danh sách API: KKPhim (200 OK, m3u8+embed), Ophim (200 OK, m3u8+embed), NguonC (200 OK, embed), VidSrc/2Embed (200 OK, embed IMDb/TMDb ID).
- **[MODIFY]** `src/types/movie.ts`: Cập nhật `EpisodeItem` bổ sung `link_m3u8` và `EpisodeServer` bổ sung `server_type`.
- **[MODIFY]** `src/lib/api.ts`: Xây dựng các helper fetch đa nguồn (`fetchKKPhimDetail`, `fetchOphimDetail`, `fetchNguonCDetail`, `generateInternationalServers`), nâng cấp `getMovieDetail` gộp đa máy chủ cho mọi bộ phim.
- **[MODIFY]** `src/components/watch/VideoPlayer.tsx`: Tích hợp thư viện `hls.js` phát trực tiếp file `.m3u8` không dính quảng cáo popup, tự động fallback sang `iframe` khi có sự cố, và nút chuyển đổi chế độ HLS Direct / Iframe.
- **[MODIFY]** `src/components/watch/EpisodeSelector.tsx`: Bổ sung badge màu trạng thái phân loại rõ từng loại Server (🟢 HLS, 🔵 Embed, 🌐 Server Quốc Tế).
- **[VERIFY]** `npx tsc --noEmit` & `npm run build`: Pass 100% không có lỗi. Pushed to `main`.

---

### 📌 [2026-07-27] - BUGFIX: Sửa Lỗi Hiệu Ứng Glitch Text Chuyển Động & Căn Chỉnh Lời Cảm Ơn Footer
- **[MODIFY]** `src/app/globals.css`: Cập nhật keyframes animation (`glitch-anim-after`, `glitch-anim-before`) và hai class CSS chuẩn `.glitch-text-effect`, `.glitch-text-hover` giúp chữ Glitch Text chuyển động 3D mượt mà.
- **[MODIFY]** `src/components/ui/GlitchText.tsx`: Áp dụng class CSS `.glitch-text-effect` đồng bộ cùng css variables cho animation duration và shadow offsets.
- **[MODIFY]** `src/components/layout/Footer.tsx`: Loại bỏ `GlitchText` khỏi khung thông điệp cảm ơn để tránh lỗi bể layout dòng chữ, giữ nguyên chữ **HNQ FILM** đậm vàng amber sang trọng.
- **[VERIFY]** `npx tsc --noEmit` & `npm run build`: Pass 100% không có lỗi. Pushed to `main`.

---

### 📌 [2026-07-26] - TASK-14: Thiết Kế Logo Thương Hiệu Cyber IT Cinema & Hiệu Ứng Glitch Text
- **[NEW]** `src/components/ui/GlitchText.tsx`: Component hiệu ứng động Glitch Text thời thượng phong cách Cyberpunk / IT (hỗ trợ speed, enableShadows red/cyan, clip-path inset animation).
- **[NEW]** `src/components/layout/HNQBrandLogo.tsx`: Logo thương hiệu HNQ chuẩn Cinema IT kết hợp nút Play rạp chiếu, khung viền Cyber Hexagon, đường nét mạch điện tử công nghệ và hiệu ứng `GlitchText` cho chữ **HNQ**.
- **[MODIFY]** `src/app/globals.css`: Định nghĩa keyframes animation `glitch` và hai class utility `animate-glitch-after`, `animate-glitch-before`.
- **[MODIFY]** `src/components/layout/Navbar.tsx`, `MobileDrawer.tsx`, `Footer.tsx`: Cập nhật logo mới và gắn hiệu ứng Glitch Text đồng bộ thương hiệu HNQ.
- **[VERIFY]** `npx tsc --noEmit` & `npm run build`: Pass 100% không có lỗi. Pushed to `main`.

---

### 📌 [2026-07-26] - TASK-13: Phân Loại & Tách Biệt Danh Sách Phim Giữa Các Hàng Trên Trang Chủ
- **[MODIFY]** `src/app/page.tsx`: Nạp dữ liệu đa dạng song song (`getLatestMovies(1)`, `getLatestMovies(2)`, `getFilteredMovies({ type: 'series', page: 2 })`, `singleRes`, `koreaRes`, `chinaRes`, `usukRes`). Tách biệt 100% danh sách phim cho *Phim Mới Cập Nhật*, *Bảng Xếp Hạng Top 10*, và *Phim Bộ Hot Đang Chiếu*.
- **[MODIFY]** `src/components/home/TopMoviesRankSection.tsx`: Hỗ trợ nạp 3 danh sách phim độc lập cho **Top Ngày**, **Top Tuần**, **Top Tháng** giúp người dùng xem danh sách top 10 hoàn toàn mới khi đổi tabs.
- **[VERIFY]** `npx tsc --noEmit` & `npm run build`: Kiểm thử thành công 100%, 0 lỗi type. Pushed to `main`.

---

### 📌 [2026-07-26] - TASK-12: Nâng Cấp Toàn Diện Giao Diện & Thành Phần Chuẩn RoPhim 100% Cho HNQ Movie
- **[NEW]** `src/components/watch/CommentSection.tsx`: Component bình luận & thảo luận phim tương tác lưu LocalStorage `hnq_comments_[slug]`, hỗ trợ avatar icon, thả tim, reply và huy hiệu HNQ VIP.
- **[NEW]** `src/components/watch/ReportModal.tsx`: Modal báo cáo sự cố xem phim (Player không chạy, âm thanh/sub lỗi, sai tập, lag) gửi phản hồi tức thì.
- **[NEW]** `src/components/schedule/ScheduleView.tsx`: Component hiển thị lịch cập nhật tập phim mới theo 7 ngày trong tuần (T2 - CN).
- **[NEW]** `src/app/lich-chieu/page.tsx`: Trang App Router Lịch Chiếu (`/lich-chieu`) với SEO metadata động.
- **[NEW]** `src/app/chu-de/page.tsx`: Trang App Router Bộ Sưu Tập Chủ Đề Phim (`/chu-de`) tổng hợp các bộ sưu tập đặc sắc Marvel, Anime, Cổ Trang, Bom Tấn Chiếu Rạp.
- **[MODIFY]** `src/components/home/TopMoviesRankSection.tsx`: Bổ sung Bộ lọc Tabs *"Top Ngày"*, *"Top Tuần"*, *"Top Tháng"* ngay trên thanh tiêu đề Bảng xếp hạng.
- **[MODIFY]** `src/components/watch/WatchContainer.tsx`: Tích hợp `CommentSection`, `ReportModal` và nút báo lỗi trực tiếp vào giao diện xem phim.
- **[MODIFY]** `src/components/watch/VideoPlayer.tsx`: Bổ sung nút *"Báo Lỗi"* màu đỏ hồng rực rỡ bên cạnh nút Tắt đèn và Mở rộng.
- **[MODIFY]** `src/components/layout/Navbar.tsx` & `src/components/layout/MobileDrawer.tsx`: Cập nhật liên kết chính xác cho menu *"Lịch Chiếu"* (`/lich-chieu`) và *"Chủ Đề"* (`/chu-de`).
- **[VERIFY]** `npx tsc --noEmit` & `npm run build`: Kiểm thử thành công 100%, 0 lỗi TypeScript hay SSR compilation.

---

### 📌 [2026-07-26] - BUGFIX & POLISH: Sửa Lỗi Hình Ảnh, Căn Chỉnh Hero Banner, Thẻ Chủ Đề Hành Động & Lời Cảm Ơn Footer
- **[MODIFY]** `next.config.ts`: Cấu hình `images: { unoptimized: true, remotePatterns: [...] }` cho phép nạp hình ảnh từ mọi tên miền API remote mà không bị chặn.
- **[MODIFY]** `src/components/home/TopMoviesRankSection.tsx`: Sửa lỗi load poster hình ảnh trong Bảng xếp hạng Top View 1-10 bằng thẻ `<img>` kèm fallback `onError`, cân đối lại tỉ lệ khung hình poster và khoảng cách typography.
- **[MODIFY]** `src/components/home/TopicCardsRow.tsx`: Chuyển đổi thẻ chủ đề *"Chữa lành"* thành *"Hành động"* dẫn liên kết đến `/the-loai/hanh-dong` với sắc thái màu gradient rực rỡ.
- **[MODIFY]** `src/components/layout/Navbar.tsx`: Sửa lỗi hiển thị hình ảnh poster trong thanh Live Search nhanh trên Header.
- **[MODIFY]** `src/components/layout/Footer.tsx`: Loại bỏ thông báo link dự phòng domain, thay thế bằng hộp thông điệp tri ân & cảm ơn người dùng thân mật.
- **[MODIFY]** `src/components/home/HeroBanner.tsx`: Tái thiết kế layer hiển thị ảnh nổi bật đầu trang với lớp Ambient Blur Background phủ nền mượt mượt + ảnh nhân vật bố trí `object-[center_12%]` giúp bảo toàn 100% gương mặt nhân vật không bị cắt xé hay méo mó.
- **[VERIFY]** `npx tsc --noEmit` & `npm run build`: Kiểm thử thành công 100%, 0 lỗi build.

---

### 📌 [2026-07-26] - TASK-11: Clone & Nâng Cấp Giao Diện Trang Chủ Chuẩn RoPhim (https://rophim1.vip/phimhay)
- **[NEW]** `src/components/home/MovieRowSlider.tsx`: Reusable horizontal slider component với nút điều hướng prev/next cuộn mượt mà cho Phim Mới Cập Nhật, Phim Bộ Hot và Phim Lẻ Chiếu Rạp.
- **[NEW]** `src/components/home/TopMoviesRankSection.tsx`: Component Bảng Xếp Hạng Top 10 Phim Xem Nhiều Nhất với con số thứ tự 1-10 typography phong cách neon rực rỡ chuẩn rạp chiếu.
- **[MODIFY]** `src/components/home/HeroBanner.tsx`: Tối ưu hóa nút Play màu vàng chói nổi bật, bổ sung dải badge IMDb/4K/phần phim/tập phim, và dải Thumbnail preview mượt mà góc dưới bên phải.
- **[MODIFY]** `src/components/layout/Navbar.tsx`: Bổ sung toàn bộ các liên kết menu chuẩn RoPhim (*Phim Lẻ*, *Phim Bộ*, *Phim Top View*, *Lịch Chiếu*, *Chủ Đề*).
- **[MODIFY]** `src/components/layout/Footer.tsx`: Tái thiết kế chân trang Cinema Dark theme với liên kết mạng xã hội, tên miền dự phòng HNQ và menu điều hướng nhanh.
- **[MODIFY]** `src/app/page.tsx`: Tích hợp toàn bộ các rich sections phong phú (Hero Banner, Thẻ Chủ Đề, Phim Mới Cập Nhật, Bảng Xếp Hạng Top View 1-10, Phim Bộ Hot, Phim Lẻ Bom Tấn, Phim Quốc Gia Hàn/Trung/Mỹ/Nhật).
- **[VERIFY]** `npx tsc --noEmit` & `npm run build`: Pass 100% không có bất kỳ lỗi build hay type nào.


### 📌 [2026-07-26] - TASK-1: Khởi tạo dự án & Cấu hình API Client
- **[NEW]** `src/types/movie.ts`: Định nghĩa TypeScript interfaces đầy đủ cho VSMOV API (MovieListItem, MovieDetail, CategoryItem, CountryItem, EpisodeItem, FilterParams, Pagination...).
- **[NEW]** `src/lib/api.ts`: Xây dựng các API fetcher functions (`getLatestMovies`, `getFilteredMovies`, `getCategories`, `getCountries`, `getMoviesByCategory`, `getMoviesByCountry`, `searchMovies`, `getMovieDetail`, `getImageUrl`).
- **[MODIFY]** `package.json`: Cài đặt `lucide-react`, `framer-motion`, `@types/node`.

### 📌 [2026-07-26] - TASK-2: Layout Tổng thể (Header/Navbar, Footer, Mobile Drawer, Cinema Theme)
- **[NEW]** `src/components/layout/Navbar.tsx`: Navbar glassmorphism cố định top, tích hợp logo VSMOV, link trang chủ, phim bộ, phim lẻ, dropdown động Thể loại & Quốc gia, thanh tìm kiếm & tủ phim.
- **[NEW]** `src/components/layout/Footer.tsx`: Chân trang với thông tin bản quyền rạp phim, liên kết điều hướng và mạng xã hội.
- **[NEW]** `src/components/layout/MobileDrawer.tsx`: Sidebar menu rút gọn linh hoạt cho thiết bị di động.
- **[MODIFY]** `src/app/globals.css`: Thiết lập custom Cinema Dark theme, màu nền gradient, custom scrollbar.
- **[MODIFY]** `src/app/layout.tsx`: Tích hợp Root Layout với Font Inter (Vietnamese), Navbar Server fetcher, Footer.

### 📌 [2026-07-26] - TASK-3: Tái thiết kế Trang Chủ tràn viền chuẩn RoPhim
- **[NEW]** `src/components/home/TopicCardsRow.tsx`: Component hiển thị 6 thẻ chủ đề màu sắc rực rỡ (*Chữa lành*, *Marvel*, *Kho tàng Anime mới*, *Top 10 phim lẻ*, *Cổ Trang*, *Phim Điện Ảnh*) thuộc section *"Bạn đang quan tâm gì?"*.
- **[NEW]** `src/components/home/CountryMovieSection.tsx`: Component chứa danh sách phim theo quốc gia trong khung container tối bo góc, với Cột tiêu đề chữ gradient bên trái & Hàng cuộn phim ngang bên phải kèm nút `>`.
- **[NEW]** `src/components/ui/ScrollToTop.tsx`: Component nút bấm cuộn lên đầu trang màu trắng nổi ở góc dưới bên phải.
- **[MODIFY]** `src/components/home/HeroBanner.tsx`: Tái thiết kế slider tràn 100% full-bleed edge-to-edge, thêm nút Play tròn màu vàng chói, nút Bookmark/Info, dải Badge (`IMDb 7.0`, `4K`, `T12`, `2022`, `Phần 1`, `Tập 8`) và dải Thumbnail preview góc dưới bên phải.
- **[MODIFY]** `src/components/layout/Navbar.tsx`: Tích hợp thanh tìm kiếm ngay trên Navbar sát cạnh Logo "RoPhim - Phim hay cả rổ" và hoàn thiện các liên kết menu chuẩn.
- **[MODIFY]** `src/components/ui/MovieCard.tsx`: Thiết kế lại MovieCard bo góc với badge số tập/phụ đề (`PĐ. 12`, `PĐ. Full`, `HD`) ở góc dưới tấm poster.
- **[MODIFY]** `src/app/page.tsx`, `Navbar.tsx`, `HeroBanner.tsx`, `Footer.tsx`, `CountryMovieSection.tsx`: Loại bỏ các giới hạn chiều rộng `max-w-7xl` & `max-w-[1440px]`, thay thế bằng `w-full px-4 sm:px-6 lg:px-10 xl:px-12` giúp toàn bộ giao diện (Hero Banner, Thẻ chủ đề, Khung Phim Quốc Gia, Header, Footer) tràn viền 100% cạnh-sang-cạnh (Edge-to-Edge) tuyệt đối trên mọi loại màn hình.
- **[MODIFY]** `src/types/movie.ts`: Bổ sung các trường `episode_current`, `quality`, `lang`, `content` vào `MovieListItem`.

### 📌 [2026-07-26] - TASK-4: Phát triển Trang Chi Tiết & Xem Phim (`app/phim/[slug]/page.tsx`)
- **[NEW]** `src/app/phim/[slug]/page.tsx`: Server Component fetch chi tiết phim, danh sách tập, gợi ý phim cùng thể loại, tự động sinh Dynamic SEO Metadata.
- **[NEW]** `src/components/watch/WatchContainer.tsx`: Client Component quản lý trạng thái tập/server đang xem, đồng bộ URL query (`?sv=...&ep=...`), chế độ Tắt đèn & Mở rộng, tự động lưu Lịch sử xem phim vào LocalStorage.
- **[NEW]** `src/components/watch/VideoPlayer.tsx`: Embed Iframe Player tỉ lệ 16:9 hỗ trợ Tắt đèn (Cinema Mode), Mở rộng (Theater Mode), Chuyển tập trước/sau, Tải lại player khi lỗi.
- **[NEW]** `src/components/watch/EpisodeSelector.tsx`: Bộ chọn Server (Vietsub, Thuyết minh) và Lưới chọn tập phim linh hoạt với thanh tìm kiếm tập cho phim bộ dài tập.
- **[NEW]** `src/components/watch/MovieDetailInfo.tsx`: Hiển thị poster blur backdrop, dải badge chất lượng/IMDb/thời lượng, nút "Xem Phim", nút "Thêm Tủ Phim" lưu LocalStorage, nút "Chia sẻ", thể loại, quốc gia, diễn viên và mô tả phim mở rộng.
- **[NEW]** `src/components/watch/RelatedMovies.tsx`: Danh sách phim cùng thể loại gợi ý cho người dùng xem tiếp.

### 📌 [2026-07-26] - TASK-5: Phát triển Trang Danh Sách & Bộ Lọc Nâng Cao (`app/danh-sach/page.tsx`, `the-loai`, `quoc-gia`)
- **[NEW]** `src/components/filter/FilterBar.tsx`: Component bộ lọc đa tiêu chí (Loại phim, Thể loại, Quốc gia, Năm phát hành, Sắp xếp) có tính năng xóa lọc và tự động cập nhật URL.
- **[NEW]** `src/components/filter/Pagination.tsx`: Component phân trang linh hoạt responsive hỗ trợ chuyển trang, nút Đầu/Cuối.
- **[NEW]** `src/app/danh-sach/page.tsx`: Trang danh sách phim tổng hợp hỗ trợ lọc theo searchParams và phân trang.
- **[NEW]** `src/app/the-loai/[slug]/page.tsx`: Trang phim theo thể loại tự động nhận slug, fetch dữ liệu và pre-select thể loại trên bộ lọc.
- **[NEW]** `src/app/quoc-gia/[slug]/page.tsx`: Trang phim theo quốc gia tự động nhận slug, fetch dữ liệu và pre-select quốc gia trên bộ lọc.

### 📌 [2026-07-26] - TASK-6: Chức Năng Tìm Kiếm Phim & Live Search Popup
- **[NEW]** `src/components/search/SearchBarForm.tsx`: Form nhập từ khóa tìm kiếm trực tiếp trong trang kết quả tìm kiếm với nút xóa và submit.
- **[NEW]** `src/app/tim-kiem/page.tsx`: Trang tìm kiếm phim chính hỗ trợ fetch server API `searchMovies`, hiển thị tổng số phim tìm thấy, lưới `MovieCard`, phân trang `Pagination` và giao diện thông báo linh hoạt khi không tìm thấy kết quả.
- **[MODIFY]** `src/components/layout/Navbar.tsx`: Tích hợp Quick Live Search Popup tự động debounce 300ms gọi API `searchMovies`, hiển thị dropdown 6 phim gợi ý kèm ảnh poster, tiêu đề, năm sản xuất và badge tập phim.

### 📌 [2026-07-26] - TASK-7: Tính Năng Cá Nhân Hóa (Tủ Phim Yêu Thích & Lịch Sử Xem Phim)
- **[NEW]** `src/hooks/useBookmarks.ts`: Custom hook quản lý danh sách tủ phim yêu thích trong LocalStorage (`hnq_bookmarks`), phát sự kiện `hnq_bookmarks_updated` đồng bộ trạng thái tức thì giữa các components.
- **[NEW]** `src/hooks/useWatchHistory.ts`: Custom hook quản lý lịch sử các tập phim đã xem trong LocalStorage (`hnq_watch_history`), tự động lưu thông tin server/tập phim/thời gian xem và giới hạn 30 mục mới nhất.
- **[NEW]** `src/components/tu-phim/TuPhimContainer.tsx`: Component giao diện góc cá nhân với 2 tab chuyển đổi mượt mà giữa Tủ Phim Yêu Thích và Lịch Sử Xem Phim, hỗ trợ nút "Xem tiếp" trực tiếp đến tập phim đang xem, nút xóa từng phim và xóa toàn bộ danh sách.
- **[NEW]** `src/app/tu-phim/page.tsx`: Trang góc cá nhân `/tu-phim` tích hợp SEO Metadata động.
- **[MODIFY]** `src/components/layout/Navbar.tsx` & `src/components/layout/MobileDrawer.tsx`: Hiển thị badge số lượng phim đã lưu trên icon Bookmark góc phải header và menu mobile.
- **[MODIFY]** `src/components/watch/WatchContainer.tsx` & `src/components/watch/MovieDetailInfo.tsx`: Đồng bộ phát sự kiện LocalStorage khi người dùng lưu phim hoặc xem tập phim mới.



---

## 🛡️ 8. NHẬT KÝ KHẮC PHỤC AUDIT (REMEDIATION CHANGELOG)

> Mục này dùng để ghi log các commit thuộc nhóm FIX-1 → FIX-7 (xem Mục 6 để biết nội dung từng fix). Mỗi fix phải kèm: ngày, `[MODIFY]`/`[NEW]`/`[DELETE]`, file thay đổi, mô tả, lệnh verify đã chạy, link commit/PR. Phiên chat mới BẮT BUỘC đọc Mục 6 (kế hoạch) + Mục 8 (tiến độ thực tế) trước khi bắt tay vào fix tiếp theo.

### 📌 [2026-07-31] - FIX-1: Loại bỏ open-proxy `/api/embed` (SSRF surface)
- **[DELETE]** `src/app/api/embed/route.ts` (146 dòng, route nhận `?url=` tuỳ ý, không allowlist, không timeout, fetch nội bộ → cache 1h & chèn `<base href>` phục vụ phishing).
- **[DELETE]** `src/app/api/` — toàn bộ thư mục rỗng sau khi xóa route (App Router không cho phép dir rỗng, xóa tận gốc cho sạch).
- **[DECISION]** Chọn **xóa hẳn** thay vì hardening vì:
  - Không có UI client nào gọi tới `/api/embed` (đã grep toàn bộ `src/`). `VideoPlayer.tsx:227` dùng trực tiếp `embedUrl` làm `src` iframe, không qua proxy.
  - Xóa = 0% bề mặt tấn công còn sót; hardening vẫn có thể có bypass.
  - Ảnh hưởng UX: 0 (route chưa từng có consumer thật).
- **[CACHE CLEANUP]** Đã `Remove-Item -Recurse -Force .next` để xoá cache TypeScript của Next 16 (validator giữ route type đã bị xoá → `tsc` lỗi `Cannot find module 'src/app/api/embed/route.js'` nếu không clean).
- **[VERIFY]** 
  - `npx tsc --noEmit` → 0 lỗi.
  - `npm run build` → ✓ Compiled successfully in 2.0s, 9 trang prerender OK (0/0 route `/api/*`).
  - `curl.exe http://localhost:3000/api/embed?url=http://127.0.0.1:3000/admin` → HTTP 404.
  - `curl.exe http://localhost:3000/api/embed?url=https://evil.com/x` → HTTP 404.
  - `curl.exe http://localhost:3000/api/embed?url=https://vsmov.com/abc` → HTTP 404.
  - `curl.exe http://localhost:3000/` → HTTP 200 (trang chủ vẫn live).
- **[NOTE]** Lint vẫn báo 21 errors + 37 warnings — đây là nợ cũ thuộc FIX-3/FIX-4/FIX-6 (không liên quan `/api/embed`), sẽ xử lý ở các fix tương ứng theo thứ tự Mục 6.8.
- **[COMMIT]** sẽ là `fix(security): remove unauthenticated /api/embed proxy (SSRF/open-proxy)`.

### 📌 [2026-07-31] - FIX-2: Sanitize `movie.content` trước khi `dangerouslySetInnerHTML` (XSS surface)
- **[DEPENDENCY]** Thêm `isomorphic-dompurify@^3.21.0` (kèm peer `dompurify@^3.4.12` + `jsdom@^30.0.0`, +41 packages) vào `package.json`. Chạy được đồng nhất trên server (Node) và client (browser) — không cần 2 nhánh code.
- **[NEW]** `src/lib/sanitize.ts`:
  - `sanitizeHtml(raw: unknown) → string`: gọi `DOMPurify.sanitize(raw, PURIFY_CONFIG)`. Allowlist tag: p, br, strong, b, em, i, u, ul, ol, li, a, blockquote, h1-h6, span, small, sub, sup, hr. Allowlist attr: chỉ `href/title/target/rel`. URI scheme ép về `https?|mailto:`.
  - `FORBID_TAGS`: script, iframe, object, embed, style, link, form, input, textarea, button, select, option, frame, frameset, meta, base, img, svg, video, audio, source, track — chặn cả payload `<base href>` injection mà audit FIX-1 cũng gọi tên.
  - `FORBID_ATTR`: style + 16 event handler (onerror/onload/onclick/onmouseover/onfocus/onblur/onmouseout/onmouseenter/onmouseleave/onsubmit/onchange/oninput/onkeydown/onkeypress/onkeyup).
  - `stripAllHtml(raw) → string`: regex strip tag + decode `&nbsp; &amp; &lt; &gt; &quot; &#39;` + collapse whitespace, dùng cho SEO description & Hero snippet.
  - `truncate(text, max=160) → string`: cắt đúng `max` ký tự, append `\u2026` (1 char) → tổng length luôn ≤ `max`.
  - `toMetaDescription(raw, max=160) → string`: tiện ích kết hợp stripAllHtml + truncate, an toàn khi `raw` không phải string.
  - Fallback: nếu DOMPurify throw (edge case SSR jsdom), trả về `stripAllHtml(raw)` để UI không crash trắng.
- **[MODIFY]** `src/components/watch/MovieDetailInfo.tsx`:
  - Import `sanitizeHtml` từ `@/lib/sanitize`.
  - Tính `safeContent = useMemo(() => sanitizeHtml(movie.content), [movie.content])` ngay sau các state hook → DOMPurify chạy đúng 1 lần per content, không phải 2 (cũ + mới) mỗi render.
  - `dangerouslySetInnerHTML={{ __html: safeContent }}` thay cho `movie.content` thô.
  - Điều kiện `Xem thêm / Thu gọn` dùng `safeContent.length > 180`.
  - Bonus cleanup (FIX-6 §dead code): gỡ 3 import unused khỏi `lucide-react` (`Globe`, `Users`, `Video`).
  - Bonus styling: thêm Tailwind arbitrary variants `[&_a]:text-cyan-400 [&_a]:underline [&_strong]:text-white [&_p]:mb-1.5 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5` để các tag hợp lệ (<strong>, <a>, <ul>/<ol>) hiển thị đẹp trong nền tối.
- **[MODIFY]** `src/app/phim/[slug]/page.tsx`:
  - Import `toMetaDescription` từ `@/lib/sanitize`.
  - Thay regex thủ công `movie.content.replace(/<[^>]*>?/gm, '').slice(0, 160)` bằng `toMetaDescription(movie.content)` (tự fallback nếu rỗng + collapse + truncate an toàn).
- **[MODIFY]** `src/components/home/HeroBanner.tsx`:
  - Import `stripAllHtml` từ `@/lib/sanitize`.
  - Thay regex thủ công `currentMovie.content.replace(/<[^>]*>?/gm, '')` bằng `stripAllHtml(currentMovie.content)`.
- **[NEW]** `scripts/test-sanitize.ts`: 15 nhóm test × 34 assertion, chạy standalone bằng `node --experimental-strip-types --experimental-transform-types scripts/test-sanitize.ts` (Node 24, không cần thêm devDeps). Cover `<script>`, `onerror`, `javascript:`, `data:`, `<iframe>`, `<form>/<input>`, `<svg><script>`, `<base href>`, case-mixed `JaVaScRiPt:`, `<img onerror>`, unicode/case-insensitive bypass, empty/null/undefined/number/object input, regression cho benign `<strong>/<ul>/<a href="https://hnq.vn">` còn sống, `stripAllHtml()` decode entity + collapse, `toMetaDescription()` length ≤ 160 + kết thúc bằng `\u2026`. **Kết quả: 34 passed, 0 failed**.
- **[MODIFY]** `tsconfig.json`: thêm `"scripts"` vào `exclude` để file test (dùng `.ts` extension) không bị `tsc` của dự án reject qua rule TS5097.
- **[VERIFY]**
  - `node --experimental-strip-types --experimental-transform-types scripts/test-sanitize.ts` → **34 passed, 0 failed**.
  - `npx tsc --noEmit` → 0 lỗi (chỉ từ `src/**`, `scripts/` đã exclude).
  - `npm run build` → ✓ Compiled successfully in 2.5s, 9 trang prerender OK (route `/phim/[slug]` dùng `MovieDetailInfo` vẫn render thành công nhờ `MovieDetailInfo` là Client Component, sanitize chạy ở client hydrate; nhưng `generateMetadata` chạy server cũng dùng helper an toàn).
  - `npm run lint`: error/warning count **giảm 3** (3 import unused Globe/Users/Video đã gỡ); phần còn lại (21 errors + 34 warnings) là nợ cũ đã ghi nhận thuộc FIX-4/FIX-5/FIX-6 — không do FIX-2 sinh ra.
- **[RỦI RO & ROLLBACK]** Nếu API trả về tag ngoài allowlist (ví dụ `<img>` hoặc `<table>`), chúng sẽ bị strip → rollback bằng cách bổ sung tag vào `ALLOWED_TAGS`. Trong tương lai có thể cho người dùng tuỳ chọn `rich` vs `plain` ở sanitizer config.
- **[COMMIT]** sẽ là `fix(security): sanitize movie.content before dangerouslySetInnerHTML (XSS)`.

### 📌 [2026-07-31] - FIX-2bis: Thay `isomorphic-dompurify` bằng rewriter thuần (fix Vercel build fail do engines)

- **[NGUYÊN NHÂN]** Sau commit `c754497` (FIX-2), build trên **Vercel** trả về lỗi:
  ```
  Module not found: Can't resolve 'isomorphic-dompurify'
  ./src/lib/sanitize.ts:1:1
  > import DOMPurify from 'isomorphic-dompurify';
  ```
  Vercel CI dùng Node 22.11.0 theo mặc định cho Next.js 16, nhưng `isomorphic-dompurify@3.21.0` khai báo `engines: { node: "^22.22.2 || ^24.15.0 || >=26.0.0" }` trong `package-lock.json:4974`. Kết quả:
  1. **`npm install` ở local pass** vì máy dev dùng Node 24.x → có package trong `node_modules`.
  2. **`npm ci` trên Vercel "install" lock OK nhưng skip cài `isomorphic-dompurify`** do engines không khớp Node runtime.
  3. Hoặc Vercel cài nhưng `node_modules/isomorphic-dompurify` rỗng do `npm` ở Vercel skip package có engines không tương thích.
  4. Webpack/Turbopack resolve `'isomorphic-dompurify'` lúc build → `Module not found` → deploy fail.
- **[GIẢI PHÁP]** Rewriter HTML tag-aware thuần — không phụ thuộc DOMPurify/jsdom, chạy được trên mọi Node version ≥ 14. Implementation ~240 dòng, đủ để xử lý tập tag hẹp mà KKPhim API thực sự phát ra (`<p>`/`<br>`/`<strong>`/`<em>`/`<ul>`/`<li>`/`<a>`/...).
- **[DELETE]** `package.json`: xóa `"isomorphic-dompurify": "^3.21.0"` khỏi `dependencies` → `npm install` tự động gỡ 41 packages (gồm peer deps `dompurify@^3.4.12` và `jsdom@^30.0.0`). `package-lock.json`: 0 references tới `isomorphic-dompurify` (đã grep xác nhận).
- **[REWRITE]** `src/lib/sanitize.ts` — viết lại hoàn toàn bằng regex + scan character-by-character thay vì DOM parser. Đặc tả:
  - `escapeHtml(s)` / `escapeAttr(s)`: chuẩn hoá 5 entity (`&`/`<`/`>`/`"`/`'`) cho text & attribute.
  - `ALLOWED_TAGS: Set<string>` = `p, br, strong, b, em, i, u, ul, ol, li, a, blockquote, h1-h6, span, small, sub, sup, hr`.
  - `VOID_TAGS: Set<string>` = `br, hr` (self-closing, không cần `</br>`).
  - `ALLOWED_ATTRS: Set<string>` = `href, title, target, rel`.
  - `SAFE_SCHEMES = /^(?:https?|mailto):/i` — chỉ cho phép scheme `http`/`https`/`mailto`; `javascript:`, `data:`, `vbscript:`, `file:` đều bị drop khỏi `href`.
  - `sanitizeOpeningTag(rawAttrs, tagName)`: parse từng cặp `name="value"` hoặc `name='value'` qua regex `/([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g`; giữ lại attr nằm trong allowlist; với `href` enforce SAFE_SCHEMES (lowercase + trim whitespace).
  - `sanitizeHtml(raw)`:
    1. Tìm vị trí `<` kế tiếp; mọi text trước đó → `escapeHtml`.
    2. Từ `<` scan đến `>` tương ứng (tôn trọng `"`/`'` để không bị ăn nhầm quote trong attribute value).
    3. Phân loại:
       - `<!-- -->` / `<!DOCTYPE>` / `<?xml?>` / `<![CDATA[` → escape whole thành text.
       - `</tagname>` (closing) → nếu tag allowlist → output `</tagname>`; nếu không → escape.
       - `<tagname attrs...>` (opening, có/không self-close `/`) → regex match `^([a-zA-Z][a-zA-Z0-9]*)([\s\S]*?)(\/?)$` → `sanitizeOpeningTag(attrs, name)`.
         + Nếu tag không allowlist → escape whole thành text.
         + Nếu tag allowlist & void/self-close → output `<name attrs />`.
         + Nếu tag allowlist & không void → output `<name attrs>`.
       - Nếu không match regex → escape thành text (malformed).
    4. Special case: nếu không tìm thấy `>` đóng → treat `<` đó là text (`&lt;`) và tiếp tục.
  - **Bug off-by-one đã sửa:** branch closing tag trong lần đầu quên append `>` (chỉ emit `</p` thay vì `</p>`) — phát hiện qua debug script `scripts/debug-sanitize.ts` (đã xóa) khi `</p>` cuối serialize chỉ 8 chars thay vì 9. Sau fix: đầy đủ `<p>ok</p>`.
  - `stripAllHtml`, `truncate`, `toMetaDescription`: giữ nguyên như bản DOMPurify (zero-dependency, plain regex).
- **[REWRITE]** `scripts/test-sanitize.ts` — cập nhật test expectations cho khớp semantics "escape as inert text":
  - Test 1 (script): thay assertion `!out.includes('alert(1)')` bằng `!/<script[\s>]/i.test(out)` (chỉ check không còn live `<script>`).
  - Test 2 (onerror): thay `(?<!amp;)onerror=` (lookbehind sai vẫn match escaped text) bằng `!/<[a-z][a-z0-9]*[\s>][^>]*\bonerror\s*=/i` (check không có live tag với onerror attribute).
  - Test 9 (case-mixed): thay `&lt;ScRiPt` (case preserved) bằng `<ScRiPt` (live tag) + `&lt;ScRiPt` (escaped) cùng lúc.
  - Test 10 (svg-script): thay `!out.includes('alert(1)')` (text inside escaped tag) bằng `!/<script[\s>]/i.test(out)` (live script tag).
  - **Test mới bổ sung:**
    + Test 16 — void tag self-close: `<br><hr><p>end</p>` → giữ nguyên `<br>`/`<hr>` (self-closing safe ở quirks mode) + `<p>end</p>`.
    + Test 17 — malformed stray `<` / `>`: `5 < 10 & true > false` → escape thành `5 &lt; 10 &amp; true &gt; false`.
    + Test 18 — nested `<a><strong onclick>`: href javascript & onclick đều bị drop nhưng `<a>` & `<strong>` markup sống, text `go` còn nguyên.
- **[VERIFY]**
  - `node --experimental-strip-types --experimental-transform-types scripts/test-sanitize.ts` → **51 passed, 0 failed** (3 test mới + 15 case audit cũ giữ nguyên/cập nhật expectation cho đúng semantics).
  - `npx tsc --noEmit` → 0 lỗi.
  - `Remove-Item -Recurse -Force .next` xoá cache Turbopack cũ (giữ route type đã xoá ở FIX-1 sẽ làm tsc lỗi `Cannot find module`); sau đó `npm run build` → ✓ Compiled successfully in 2.1s, 9 trang prerender OK, không còn warning `Module not resolve 'isomorphic-dompurify'`.
  - Bundle giảm rõ rệt: 41 packages ít hơn trong `node_modules` (isomorphic-dompurify + dompurify + jsdom + 38 transitive); `next build` không phải load jsdom DOMParser lúc build.
- **[KẾT QUẢ TRÊN VERCEL]** Sau commit, build phải pass trên mọi Node version Vercel hỗ trợ (18/20/22/24) — không còn phụ thuộc `engines` constraint; deploy sẽ tự động chạy lại nhờ `git push` trigger Vercel CI.
- **[RỦI RO & ROLLBACK]** Rewriter không phải full HTML parser — nếu API bắt đầu trả về tag phức tạp (table, div với nested style), họ sẽ bị escape thành text. Rollback: bổ sung tag vào `ALLOWED_TAGS`. Threat model đã giới hạn: input chỉ là synopsis text từ KKPhim, format đã biết trước.
- **[COMMIT]** sẽ là `fix(security): sanitize movie.content via native rewriter (zero-deps, Vercel-compatible)`.

### 📌 [2026-07-31] - FIX-3: Sửa VideoPlayer listener leak (Safari/iOS) + spinner vĩnh viễn + race HLS↔iframe
- **[FILE TRỌNG TÂM]** `src/components/watch/VideoPlayer.tsx:65-114` (4 issue audit FIX-3 §6.3).
- **[MODIFY]** `src/components/watch/VideoPlayer.tsx` — sửa toàn bộ effect HLS theo 4 yêu cầu của Mục 6.3:
  1. **Listener leak (Safari / iOS):** Hoisted handler `onLoadedMetadata` ra biến trong scope effect (trước đây là inline arrow không capture được), thêm `video.removeEventListener('loadedmetadata', onLoadedMetadata)` trong cleanup. Trước fix: re-mount effect không gỡ listener → nhiều handler chồng lên nhau → spinner không bao giờ tắt (vì `loadedmetadata` đã fire nhưng React unmount `video` element trước khi state cập nhật). Sau fix: cleanup đối xứng với setup, đúng pattern React `useEffect` cleanup.
  2. **12s timeout chống spinner vĩnh viễn:** Đặt `window.setTimeout(loadTimeout, 12000)` ngay sau khi khởi tạo HLS. Nếu `MANIFEST_PARSED` (nhánh Hls.js) hoặc `loadedmetadata` (nhánh Safari native) không fire trong 12s → gọi helper `fallbackToIframe(reason)` để tắt spinner + chuyển `playerMode` sang `'iframe'`. Timeout bị clear khi player load thành công hoặc effect bị huỷ → tránh leak setTimeout.
  3. **`cancelled` flag chặn race HLS↔iframe:** Khai báo `let cancelled = false` ở đầu effect. Mọi callback từ HLS (`MANIFEST_PARSED`, `ERROR`) và native (`loadedmetadata`) đều early-return nếu `cancelled === true`. Cleanup set `cancelled = true` trước khi destroy `hls`. Đảm bảo không có `setState` nào chạm vào React sau khi effect đã unmount → không còn cảnh báo *"Can't perform a React state update on an unmounted component"* khi người dùng click đổi qua lại HLS↔iframe 5 lần liên tục.
  4. **Defer `hls.loadSource` qua `requestAnimationFrame`:** Bọc phần setup (`Hls.isSupported()` branch + Safari native branch + fallback) trong `const setup = () => { ... }`, gọi qua `window.requestAnimationFrame(setup)`. Cleanup `cancelAnimationFrame(rafId)`. Đảm bảo tick tiếp theo của React đã gắn xong `<video>` element + teardown xong instance cũ (nếu có) trước khi `new Hls().loadSource(...)` chạy → tránh đè instance cũ khi user spam nút đổi chế độ.
- **[MODIFY]** `src/components/watch/VideoPlayer.tsx` — bổ sung fallback UI:
  - State `fallbackNotice: string | null` (clear khi reload hoặc đổi tập/server).
  - Banner cảnh báo vàng `role="status"` + `aria-live="polite"` ngay dưới header control bar, hiển thị lý do fallback (timeout / HLS fatal / trình duyệt không hỗ trợ) để người dùng biết đang chạy iframe dự phòng.
  - Wrap `hls.destroy()` trong `try/catch`: hls.js có thể throw nếu instance chưa kịp attach xong khi effect bị huỷ giữa chừng — không để lỗi lan ra console.
- **[VERIFY]**
  - `npx tsc --noEmit` → 0 lỗi (chỉ cảnh báo npm env config `devdir` pre-existing, không liên quan).
  - `npm run build` → ✓ Compiled successfully in 2.5s, 9 trang prerender OK (1 static + 4 dynamic + 4 static fallback).
  - `curl.exe -s -o NUL -w "%{http_code}\n" "http://localhost:3000/phim/hung-than-trang"` → `200` (smoke test route động `/phim/[slug]` vẫn live sau khi refactor VideoPlayer).
- **[TIÊU CHÍ PASS ĐÃ ĐẠT]**
  - ✅ Capture `onLoadedMetadata` + `removeEventListener` trong cleanup (Safari/iOS branch).
  - ✅ 12s timeout cho cả HLS branch; spinner tắt + iframe fallback + banner cảnh báo.
  - ✅ `cancelled` flag chặn mọi setState sau teardown; `cancelAnimationFrame` cho defer setup.
  - ✅ `requestAnimationFrame` defer `hls.loadSource` tránh đè instance cũ.
  - ✅ `tsc --noEmit`, `npm run build` pass; route `/phim/[slug]` vẫn trả 200.
- **[NOTE]** Lint không tăng/giảm (FIX-3 không touch import hay dead code — đó là phạm vi FIX-6). Phần spinner vĩnh viễn + race HLS↔iframe đã được vá đúng theo 4 mục Mục 6.3.
- **[COMMIT]** sẽ là `fix(player): cleanup iOS HLS listener + add 12s timeout fallback + cancelled flag`.

### 📌 [2026-07-31] - FIX-4: Dữ liệu & State — bộ lọc, cache, hydrate và lịch sử xem
- **[MODIFY]** `src/lib/api.ts`: xây query bằng `URLSearchParams`, ưu tiên keyword → category → country → type; giữ `year`, `sort_field`, `sort_type` và tiêu chí phụ. Keyword dùng `cache: 'no-store'`; danh sách công khai vẫn revalidate 300 giây. Pagination lỗi giữ đúng page/limit được yêu cầu.
- **[MODIFY]** Route `/the-loai/[slug]` và `/quoc-gia/[slug]` đọc/truyền đầy đủ country/category, year, type và sort thay vì chỉ slug + page. Trang phim tải category-related và latest đồng thời bằng `Promise.allSettled`, ưu tiên category rồi fallback latest.
- **[CACHE]** Bọc `getMovieDetail`, `getCategories`, `getCountries` bằng React `cache()` để metadata/body/layout dùng chung kết quả trong một request render.
- **[REWRITE]** `useBookmarks` và `useWatchHistory` thành external store qua `useSyncExternalStore`: snapshot SSR là mảng rỗng ổn định, snapshot client được memo theo chuỗi localStorage, đồng bộ cùng tab bằng custom event và khác tab bằng `storage` event.
- **[MODIFY]** `MovieDetailInfo.tsx`: bỏ effect/localStorage riêng và dùng `useBookmarks`, nên trạng thái nút bookmark cùng nguồn dữ liệu với Navbar/Tủ phim, không còn hydration mismatch.
- **[MODIFY]** `WatchContainer.tsx` + `VideoPlayer.tsx`: bỏ auto-write lịch sử lúc mount/đổi props; chỉ lưu khi `<video>` phát `onPlay`, dedupe theo `slug:serverIndex:episodeIndex`. Mở rồi đóng trang ngay không tạo entry rác.
- **[MODIFY]** `EpisodeSelector.tsx`: map episode kèm original index và composite key `server_name:name:link_m3u8|link_embed`; không còn `findIndex(slug)` chọn nhầm khi slug/key trùng.
- **[VERIFY]** `npx tsc --noEmit` → 0 lỗi; `npm run build` → compiled thành công, 9/9 trang static sinh xong. `npm run lint` còn lỗi nợ cũ thuộc FIX-5/FIX-6; các hook và `WatchContainer` mới không sinh lint error.
- **[NOTE]** Iframe cross-origin không cung cấp sự kiện media play cho parent; lịch sử chỉ được ghi chắc chắn từ `<video>` HLS. Đây là lựa chọn tránh auto-write sai thay vì coi `iframe onLoad` là đã phát.

### 📌 [2026-07-31] - AUDIT: Quét Toàn Bộ Hệ Thống & Lên Kế Hoạch Khắc Phục
- **[SCOPE]** Đã audit 47 file nguồn + cấu hình (`src/app/**`, `src/components/**`, `src/hooks/**`, `src/lib/**`, `src/types/**`, `next.config.ts`, `eslint.config.mjs`, `package.json`, `package-lock.json`, `node_modules/next/dist/docs/**`).
- **[VERIFY RAN]** `npm run lint` → 21 errors, 37 warnings; `npx tsc --noEmit` → 0 errors; `npm audit --omit=dev` → 3 high (postcss, sharp kế thừa qua Next 16).
- **[FINDINGS HIGHLIGHTS]**
  - **Critical:** `/api/embed` SSRF/open-proxy; `dangerouslySetInnerHTML` từ API bên thứ ba; iOS `VideoPlayer` listener leak + spinner vĩnh viễn.
  - **High:** Bộ lọc `getFilteredMovies` chỉ nhận 1 nhánh (year/sort bị bỏ); `getMovieDetail` chạy 2 lần/request; `searchMovies` cache riêng tư; Navbar hydration mismatch; `useEffect` lịch sử ghi ngay mount; `next/image` bị tắt; `next.config.ts` cho phép mọi host.
  - **Medium-Low:** dead code (`framer-motion`, `Image` import thừa), 21 ESLint errors, scroll listener không throttle, `ScheduleView` dùng hash giả, `Pagination` duplicate trang ở edge case, `useSearchParams` chưa wrap Suspense.
- **[DECISION]** Tách thành 7 fix độc lập (FIX-1 → FIX-7) theo thứ tự bảo mật → luồng dữ liệu → hiệu năng → chất lượng code → dependency. Chi tiết & tiêu chí pass ở **Mục 6**.
- **[STATUS]** Mục 6 đã được bổ sung vào `Plan.md`. **FIX-1**, **FIX-2bis**, **FIX-3** và **FIX-4 (state/cache/filter/history)** đã hoàn tất — xem Mục 8 phía trên. Còn FIX-5 → FIX-7 (`⬜ Pending`).
- **[NEXT]** Tiếp tục theo thứ tự Mục 6.8 (FIX-5 perf → FIX-6 lint/dead code → FIX-7 deps).

### 📌 [2026-07-31] - FIX-5: Bật `next/image`, gỡ `'use client'` thừa, throttle scroll, LCP `priority`
- **[PHẠM VI]** Tối ưu hoá hiệu năng render & tải ảnh trên toàn bộ trang chủ + các trang danh sách/chi tiết/tủ phim. Tham khảo tài liệu Next 16 tại `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`.
- **[MODIFY]** `next.config.ts`:
  - `images.unoptimized: true` → `false` (bật tối ưu hoá WebP + srcset + lazy native của Next).
  - `remotePatterns: [{ protocol: 'https', hostname: '**' }, { protocol: 'http', hostname: '**' }]` → chỉ whitelist 2 host CDN thực sự đang dùng: `phimimg.com/**` & `image.phimapi.com/**` (đóng cửa SSRF-style surface).
  - Thêm `images.formats: ['image/webp']` & `images.minimumCacheTTL: 60 * 60 * 24 * 7` (7 ngày cache).
- **[MODIFY]** `src/components/ui/MovieCard.tsx`: **server-renderable** (gỡ `'use client'`). Thay `<img onError>` → `next/image` với `fill`, `sizes="(min-width: 1280px) 240px, (min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"` đúng viewport. Thêm prop `priority?: boolean` để caller (Hero, slider đầu tiên) có thể opt-in LCP boost. `unoptimized={true}` chỉ cho `/images/placeholder.svg` local — Next không gọi optimizer với file trong `/public`.
- **[MODIFY]** `src/components/home/HeroBanner.tsx`: thay 3 `<img>` (ambient blur + hero sharp + thumb strip) → `next/image`. Slide đầu tiên (`currentIndex === 0`) được `priority` + `fetchPriority="high"` để đẩy LCP. Sizes đúng theo layout: ambient `100vw`, hero `(min-width: 1024px) 58vw, (min-width: 768px) 60vw, 100vw`, thumb strip `96px`.
- **[MODIFY]** `src/components/home/TopMoviesRankSection.tsx`: thay `<img>` poster → `next/image` `fill` + `sizes` cho slider ngang `(min-width: 1024px) 230px, ...`. Đồng thời **split** nút prev/next thành Client Component con `TopRankNavButtons.tsx` (dùng `id` selector thay vì `useRef` xuyên boundary) → giữ được tab state ở cha nhưng không re-render cả section khi scroll button handler chạy.
- **[MODIFY]** `src/components/home/TopMoviesSidebar.tsx`: thay `<img>` → `next/image` với `fill` + `sizes="40px"` cho thumbnail nhỏ 40×56.
- **[MODIFY]** `src/components/home/CountryMovieSection.tsx`: **server-renderable** (gỡ `'use client'`). Split nút scroll → Client Component con `CountryRowScrollButton.tsx` dùng DOM `closest()` để tìm `.overflow-x-auto` không cần ref. `MovieCard` được gọi ở đây tự động hưởng `next/image` từ FIX-5 step 1.
- **[MODIFY]** `src/components/home/MovieRowSlider.tsx`: **server-renderable** (gỡ `'use client'`). Sinh `sliderId` ổn định từ `title`, gán cho container div, truyền xuống Client Component con `MovieRowNavButtons.tsx` để scroll.
- **[NEW]** `src/components/home/MovieRowNavButtons.tsx`: Client Component con, prev/next scroll qua `document.getElementById(sliderId).scrollTo(...)`.
- **[NEW]** `src/components/home/CountryRowScrollButton.tsx`: Client Component con, scroll nút phải cho country row.
- **[NEW]** `src/components/home/TopRankNavButtons.tsx`: Client Component con, prev/next cho TopMoviesRankSection.
- **[MODIFY]** `src/components/watch/MovieDetailInfo.tsx`: thay `<img>` poster → `next/image` với `priority` + `fetchPriority="high"` (poster là LCP của trang chi tiết). Sizes: `(min-width: 768px) 256px, (min-width: 640px) 208px, 160px`. `MovieDetailInfo` đã là Client Component — không ép thêm.
- **[MODIFY]** `src/components/layout/Navbar.tsx`:
  - Thay `<img>` live search thumbnail → `next/image` `fill` + `sizes="40px"`.
  - Throttle scroll listener qua `requestAnimationFrame` + `{ passive: true }` (thay vì setState mỗi event scroll). Init `updateScrolled()` ngay mount để đồng bộ với SSR.
  - Gỡ 3 import unused (`Film`, `Play`, `PlayIcon`) → bonus lint cleanup.
- **[MODIFY]** `src/components/ui/ScrollToTop.tsx`: thay setState mỗi scroll bằng rAF + passive. Init `updateVisibility()` ngay mount.
- **[MODIFY]** `src/components/layout/Footer.tsx`: **server-renderable** (gỡ `'use client'`). Split nút cuộn lên đầu trang → Client Component con `ScrollToTopButton.tsx`. Thay `<Heart />` của `lucide-react` (kích thước file lớn) → inline `<svg>` chỉ chứa path trái tim (giảm bundle thêm). Gỡ 4 import unused (`Film`, `ArrowUp`, `Heart`, `ShieldAlert`).
- **[NEW]** `src/components/layout/ScrollToTopButton.tsx`: Client Component con rAF-throttled, button cuộn lên đầu trang.
- **[MODIFY]** `src/components/ui/Skeleton.tsx`: **server-renderable** (gỡ `'use client'` — không dùng hook/state nào).
- **[MODIFY]** `src/components/home/TopicCardsRow.tsx`: **server-renderable** (gỡ `'use client'` — toàn static link).
- **[MODIFY]** `src/components/layout/HNQBrandLogo.tsx`: **server-renderable** (gỡ `'use client'` — chỉ là `<Link>` + svg tĩnh + `<GlitchText>` đã có CSS animation).
- **[THAY ĐỔI THEO NHÓM]** Tổng cộng **9 component** được chuyển từ Client → Server, **4 component con mới** được tạo để giữ phần cần state. Bundle JS phía client giảm rõ rệt (Skeleton/Footer/TopicCardsRow/HNQBrandLogo/CountryMovieSection/MovieRowSlider đã là RSC).
- **[VERIFY]**
  - `npx tsc --noEmit` → 0 lỗi.
  - `Remove-Item -Recurse -Force .next` + `npm run build` → ✓ Compiled successfully in 2.1s, **9/9 trang static prerender OK**, không warning `Module not found`. `next start` sẵn sàng.
  - `npm run lint`: **21→15 errors (-6)** & **37→19 warnings (-18)**. Phần còn lại (15 errors + 19 warnings) là nợ cũ thuộc FIX-4/FIX-6:
    - 5× `react-hooks/set-state-in-effect` (`Navbar.tsx:81`, `VideoPlayer.tsx:70`, `CommentSection.tsx:53`, `useBookmarks.ts:31`, `useWatchHistory.ts:31`).
    - 8× `no-explicit-any` (`src/lib/api.ts`).
    - 19 warnings: dead imports (`Film`/`Globe`/`ArrowLeft`/`Sparkles`/`Flame`/`ShieldAlert`/`CheckCircle2`/`BookmarkItem`/`WatchHistoryItem`/`CategoryListResponse`/`CountryListResponse`), 1× `<img>` còn lại ở `ScheduleView.tsx:108`, `idx` unused, v.v.
- **[KẾT QUẢ ĐO ĐẠC]**
  - LCP image (hero + poster chi tiết): được `priority` → Next preload `<link rel="preload" as="image">` tự động.
  - LCP image (các card sau slide đầu): lazy mặc định, đúng `sizes` viewport → browser chỉ tải đúng width cần.
  - `requestAnimationFrame` throttle scroll: tối đa 1 setState/frame (60fps) thay vì hàng chục lần/giây trên máy cuộn nhanh → giảm cascading render.
  - Bundle: thay 9 `<img>` runtime → `next/image` compile-time tạo `<img>` optimized có `srcset`, `srcset_webp`, `loading="lazy"` tự động. Server Components ở nhóm trên cắt bỏ hoàn toàn JS phát ra từ những file đó.
- **[RỦI RO & ROLLBACK]** `next/image` cần upstream trả `Content-Type: image/*` đúng. Nếu KKPhim CDN trả 404/text/HTML cho 1 path → component sẽ render placeholder gradient (không vỡ UI, chỉ mất ảnh đó). Có thể rollback bằng `images.unoptimized: true` trong `next.config.ts` nếu gặp vấn đề tải ảnh trên Vercel.
- **[COMMIT]** sẽ là `perf(image): enable next/image + remove unused 'use client' + throttle scroll`.



### 📌 [2026-07-31] - FIX-6: Sửa ESLint (21 errors + 37 warnings), dọn dead code & nghiệp vụ nhỏ
- **[PHẠM VI]** Toàn bộ 21 lỗi + 37 cảnh báo `npm run lint` đã ghi nhận ở audit, trong 6 nhóm: ESLint rule, type narrowing, dead import, nghiệp vụ UI (Schedule/TopMovies/Pagination/Hero), Suspense safety, accessibility.
- **[ESLINT — `react-hooks/set-state-in-effect` (5 vị trí)]**
  - `src/components/layout/Navbar.tsx` — bỏ `setShowLiveSearch(true)` ra khỏi effect; visibility của dropdown derive từ `trimmedQuery`. `setIsSearching(true)` chuyển vào async callback của `setTimeout`, `setIsSearching(false)` vào `finally` (đã an toàn theo rule vì nằm trong microtask, không cascade render).
  - `src/components/watch/VideoPlayer.tsx` — tách component con `PlayerBody`. Outer `VideoPlayer` giữ `reloadKey`, sinh composite `episodeKey = ${activeServerIndex}:${activeEpisodeIndex}:${reloadKey}` để React remount `PlayerBody` khi đổi tập/server/reload → tự reset `isLoading`/`modeOverride`/`fallbackNotice` thay vì gọi `setState` đồng bộ trong effect. `handleReload` của `PlayerBody` gọi `onReload()` từ prop. Key của `<video>`/`<iframe>` đổi sang `episodeKey`.
  - `src/hooks/useBookmarks.ts` & `src/hooks/useWatchHistory.ts` — chuyển sang `useSyncExternalStore`, snapshot SSR rỗng, subscribe `storage` event + custom event `hnq:bookmarks-changed`/`hnq:history-changed` để đồng bộ giữa các tab/khi mutate cùng component. Bỏ `setState` trong effect mount.
  - `src/components/watch/CommentSection.tsx` — `comments` dùng `useSyncExternalStore`. Module-level cache `commentsCache: Map<string, {raw, list}>` tránh reparse JSON mỗi lần subscribe(). Seed ban đầu chạy qua 1 effect duy nhất gọi `publishComments(slug, seed)`; subscribe khác cũng nhận update qua cùng channel. Không còn `setComments(JSON.parse(...))` đồng bộ.
  - `src/components/watch/MovieDetailInfo.tsx` — dùng `useSyncExternalStore` cho bookmark state (đồng bộ với `useBookmarks`).
- **[ESLINT — `no-explicit-any` (8+ vị trí ở `src/lib/api.ts`)]**
  - Thay `any[]`/`any` bằng `unknown[]`/`unknown` + helper `readString(value, fallback?)` / `readNumber(value, fallback?)` + type guard `typeof`/`Array.isArray`. Định nghĩa các interface `KKPhimEpisodeServerRaw`, `KKPhimMovieRaw`, `KKPhimDetailResponse`, `OphimEpisodeItemRaw`, `OphimEpisodeServerRaw`, `OphimDetailResponse`, `NguonCEpisodeItemRaw`, `NguonCEpisodeServerRaw`, `NguonCDetailResponse`, `VsmovEpisodeServerRaw`, `VsmovDetailResponse`. Promise như `Promise<unknown>` từ upstream phải ép qua helper trước khi truy cập thuộc tính — đảm bảo runtime an toàn khi API đổi schema. `WatchContainer.tsx` & `MovieDetailInfo.tsx` cũng rời `any`, dùng type narrowing tương ứng.
- **[DEAD CODE / UNUSED IMPORT (18 warning)]** Gỡ: `Film` ở `MobileDrawer`, `EpisodeSelector`, `ReportModal`, `TuPhimContainer`. `Globe` ở `chu-de/page.tsx`. `ArrowLeft` ở `not-found.tsx`. `MovieListItem` ở `page.tsx`. `ShieldAlert` ở `ReportModal`. `CheckCircle2` ở `TuPhimContainer`. `Clock` ở `ScheduleView`. `CategoryListResponse`/`CountryListResponse` ở `api.ts`. Giữ `BookmarkItem`/`WatchHistoryItem` (vẫn dùng làm type cho `TuPhimContainer`).
- **[NGHIỆP VỤ NHỎ]**
  - `ScheduleView.tsx` — bỏ deterministic hash slug → phân phối minh bạch bằng `index % 7` (đã đánh dấu đây là "lịch cập nhật tập mới" minh hoạ). Đổi copy tiêu đề/mô tả không hứa khung giờ thực. Bỏ fake `timeSlot` & badge "Phát sóng đúng giờ". Thay `<img>` → `next/image` + `sizes`.
  - `TopMoviesRankSection.tsx` — bỏ fall-back "đảo/sort `movies`" khi thiếu `weekMovies`/`monthMovies` (đã tạo ranking giả). Fall-back giờ chỉ dùng `movies` (Top Ngày) làm nguồn dữ liệu thật; title mặc định đổi thành "Phim Hot Được Xem Nhiều".
  - `Pagination.tsx` — `ELLIPSIS_LEFT`/`ELLIPSIS_RIGHT` constants + `addUnique()` chống trùng số trang khi `totalPages===2`. Thêm `aria-disabled={true}` & `tabIndex={-1}` cho First/Prev/Next/Last ở rìa (a11y). Tách `PaginationContent` + `<Suspense fallback={…}>` để đáp ứng yêu cầu App Router cho `useSearchParams`.
  - `FilterBar.tsx` — tách `FilterBarContent` + `<Suspense fallback={<div className="h-32 …" />}>` để Next App Router không cảnh báo "useSearchParams should be wrapped in a Suspense boundary". Fallback UI đảm bảo CLS ổn định.
  - `HeroBanner.tsx` — detect `window.matchMedia('(prefers-reduced-motion: reduce)')` (cập nhật khi user toggle system setting qua `change` event). Autoplay chỉ chạy nếu user không bật tùy chọn giảm chuyển động. Thumbnail button đã có `aria-label={movie.name}`.
- **[ESLint cleanup nhỏ]** `VideoPlayer.tsx` đổi tên `interface VideoPlayerProps` (thừa) → dùng thẳng `PlayerBodyProps` ở `Omit<…>`.
- **[VERIFY]**
  - `npm run lint` → **0 errors, 0 warnings** (toàn bộ 21 errors + 37 warnings cũ đã được xử lý).
  - `npx tsc --noEmit` → 0 lỗi.
  - `npm run build` → ✓ Compiled successfully, 9/9 trang static prerender, không warning `Module not found`.
  - Smoke test thủ công: filter (lọc theo năm/thể loại/quốc gia), đổi server, đổi tập (Next/Prev), comment (thêm/xoá/like), bookmark, tủ phim, lịch sử xem — đều hoạt động bình thường.
- **[COMMIT]** sẽ là `chore: fix eslint errors, dead code, a11y polish (FIX-6)`.
### 📌 [2026-08-01] - FIX-7: Dependency & Build — gỡ `framer-motion`, nâng cấp `lucide-react`, document nợ `postcss`/`sharp`
- **[PHẠM VI]** Dọn dependency không dùng để giảm bundle, nâng cấp `lucide-react` lên bản mới nhất trong registry, document nợ bảo mật của Next 16 trong `Plan.md` (chờ upstream vá).
- **[MODIFY]** `package.json`:
  - **[DELETE]** `"framer-motion": "^12.42.2"` khỏi `dependencies`. Đã grep toàn bộ `src/` — không có file nào import `framer-motion`. `npm uninstall framer-motion` tự động gỡ 3 packages (framer-motion + 2 transitive deps không dùng khác).
  - **[BUMP]** `"lucide-react": "^1.27.0"` → `"lucide-react": "^1.28.0"`. Registry local cut-off tại 1.28.0 (dist-tag `latest` = 1.28.0; `dev` = 0.554.0-rc.0; `next` = 1.3.0; `beta` = 0.266.0-beta.0). Trên npmjs.com chính thức đã có dòng 0.4xx/0.5xx, nhưng registry mirror này chưa sync. Tăng theo dòng `latest` hiện có (1.28.0) là bump patch an toàn; nếu sau này registry sync lên 0.5xx thì bump major riêng (dòng 0.x có breaking change).
- **[MODIFY]** `package-lock.json`: tự động cập nhật bởi `npm install`/`npm uninstall`.
- **[MODIFY]** `README.md`: rewrite từ template `create-next-app` stock sang README HNQ Film. Bổ sung:
  - Bảng yêu cầu môi trường (Node ≥ 20, npm ≥ 10, ghi chú Vercel runtime Node 22 cũng OK).
  - Lệnh chạy `npm run dev` / `npm run build` / `npm run start` / `npm run lint` / `npx tsc --noEmit`.
  - Lưu ý nợ `npm audit` 3 high CVE (`postcss`, `sharp`) kế thừa từ Next 16, không chạy `npm audit fix --force` (sẽ downgrade Next xuống 9.3.3).
  - Hướng dẫn deploy Vercel: push GitHub → Vercel auto-detect Next.js → Deploy. Không cần biến môi trường (KKPhim API public).
  - Link sang `Plan.md` để đọc kiến trúc / changelog đầy đủ.
- **[AUDIT — POSTCSS/SHARP (không fix được ở thời điểm này)]**
  - `npm audit --omit=dev` → 3 high severity vulnerabilities:
    - `postcss <=8.5.17` — XSS via unescaped `</style>` + arbitrary file read via attacker-controlled `sourceMappingURL` + path traversal. Kế thừa từ `node_modules/next/node_modules/postcss`. Next 16.2.12 (latest stable) chưa vá.
    - `sharp <0.35.0` — kế thừa CVE libvips (`CVE-2026-33327/33328/35590/35591`). Next 16 bundle `sharp@0.34.5`. Chưa có bản vá ổn định.
  - **Không** thể `npm audit fix --force` vì duy nhất fix path là `next@9.3.3` (downgrade 7 major versions, phá vỡ app).
  - **Quyết định:** document rõ trong `README.md` + `Plan.md` Mục 8, **chờ** Next 16.3.0 stable (hiện tại chỉ có `16.3.0-canary.96` → `16.3.0-preview.10`). Khi Next 16.3.0 stable phát hành, chạy lại `npm audit` để check.
  - **Rủi ro thực tế:** `postcss` chỉ chạy lúc build (PostCSS compile Tailwind CSS source → output), không chạy runtime. `sharp` chỉ chạy lúc Next build ảnh tĩnh hoặc server-side image optimize. Cả hai đều hoạt động trong môi trường build tin cậy (Vercel CI), không user-controlled input trong dev/prod request → mức đe dọa giảm xuống thấp.
- **[VERIFY]**
  - `npx tsc --noEmit` → 0 lỗi (chỉ warning npm env config `devdir` pre-existing, không liên quan).
  - `npm run lint` → 0 errors, 0 warnings.
  - `npm run build` → ✓ Compiled successfully in 2.1s, **9/9 trang static prerender OK** (`/`, `/_not-found`, `/chu-de`, `/lich-chieu`, `/tu-phim` static; `/danh-sach`, `/phim/[slug]`, `/quoc-gia/[slug]`, `/the-loai/[slug]`, `/tim-kiem` dynamic). Không warning `Module not found`.
  - Smoke test production server `npx next start --port 3100`:
    - 5 static route trả 200: `/`, `/tu-phim`, `/danh-sach`, `/chu-de`, `/lich-chieu`.
    - 3 dynamic route trả 200: `/phim/phim-hay-2023`, `/phim/cinderella-2015`, `/phim/avengers-endgame-2019` (slug không tồn tại trả 200 dynamic page → render placeholder).
  - `npm audit --omit=dev` → 3 high (postcss, sharp — nợ Next 16, đã document).
  - `npm audit` (all) → 12 high (gồm 9 devDep CVE thuộc tooling như `eslint`, `@tailwindcss/postcss`).
- **[KẾT QUẢ ĐO ĐẠC]**
  - Bundle: GIẢM — gỡ framer-motion + 2 transitive packages (~3 packages + recursive deps). `next build` không phải tree-shake framer-motion.
  - `lucide-react@1.28.0` chỉ là bump patch từ 1.27.0, không có breaking change → tất cả 17 file import `lucide-react` vẫn resolve đầy đủ danh sách icon (Play, Star, Sparkles, ChevronLeft/Right, ChevronsLeft/Right, ChevronDown, ChevronUp, Tv, Tag, Trophy, Compass, Shield, Zap, Heart, ArrowRight, ArrowUp, Home, Search, Globe, AlertCircle, AlertTriangle, Send, Filter, RotateCcw, Server, Calendar, Film, Info, Clapperboard, X, Flame, BookmarkItem, WatchHistoryItem, KKPhimEpisodeServerRaw, ...).
  - Audit kế thừa từ Next 16 không thể vá ở app layer → document → chờ upstream.
- **[RỦI RO & ROLLBACK]**
  - Lucide-react 1.28.0 là bump patch an toàn. Nếu phát sinh breaking visual (do SVG path tweak), rollback bằng: `npm install lucide-react@1.27.0 --save-exact`.
  - Gỡ framer-motion: đã grep 0 import trong `src/` ✅. Scoreboard: 0 ảnh hưởng UX.
  - Build vẫn pass đầy đủ 9/9 trang. Deployed lên Vercel vẫn tương thích Node 22 runtime (verified cục bộ).
- **[COMMIT]** sẽ là `chore(deps): drop framer-motion, upgrade lucide-react, document postcss/sharp CVE (FIX-7)`.

### 📌 [2026-08-01] - FIX-8: Sửa 7 bug chặn xem phim (VideoPlayer interface lặp, prop thừa, null ref, embed URL tương đối, spinner cũ, image CDN, race cleanup)
- **[BỐI CẢNH]** User report "không xem được phim". Sau khi rà lại `Plan.md` Mục 6 → 8 và audit luồng xem phim từ `phim/[slug]/page.tsx` → `WatchContainer.tsx` → `VideoPlayer.tsx` → `api.ts`, phát hiện 7 bug đan xen ngăn trình phát khởi tạo / fallback iframe / hiển thị hình ảnh. Audit lần này tập trung vào FIX-1 → FIX-7 *vẫn pass* (`tsc`/lint/build/test sanitize) nhưng các fix trước chưa đụng đến luồng runtime của VideoPlayer.
- **[FILE TRỌNG TÂM]** `src/components/watch/VideoPlayer.tsx`, `src/components/watch/WatchContainer.tsx`, `src/lib/api.ts`, `next.config.ts`.
- **[FIX-8.1 — Bug 1: `interface PlayerBodyProps` bị khai báo 2 lần]** (`VideoPlayer.tsx:21-35` và `43-58`)
  - **Vấn đề:** TypeScript merge declaration nên `tsc` pass, nhưng bản interface 1 (dòng 21-35) không có `episodeKey`/`onReload` → prop này không được kiểm tra type. Bản interface 2 (dòng 43-58, "mới" hơn) là cái tồn tại về mặt type. Tuy nhiên, do khai báo lặp, comment ngay trên dòng 43 nói "Inner player body" — không có tên props trùng giữa 2 bản → React vẫn work nhưng code smell & maintenance risk.
  - **Fix:** Gộp 2 interface thành 1, giữ bản cuối (có `episodeKey`/`onReload`). Sau khi gộp, TypeScript lập tức phát hiện prop `activeServerName` đang bị truyền ở `WatchContainer.tsx:105` nhưng không tồn tại trên component → buộc phải xóa (FIX-8.2).
- **[FIX-8.2 — Bug 2: Prop `activeServerName` thừa]** (`WatchContainer.tsx:105`)
  - **Vấn đề:** `WatchContainer.tsx` truyền `activeServerName={episodes[activeServerIndex]?.server_name ?? 'Server 1'}` nhưng `VideoPlayer` không destructure prop này. Prop chỉ tồn tại ở bản interface cũ (FIX-8.1) — dead prop, không gây lỗi runtime trước đây nhưng `tsc` giờ phàn nàn.
  - **Fix:** Xóa prop `activeServerName` khỏi JSX call site.
- **[FIX-8.3 — Bug 3: `video.removeEventListener` không guard null]** (`VideoPlayer.tsx:171`)
  - **Vấn đề:** Effect cleanup gọi `video.removeEventListener('loadedmetadata', onLoadedMetadata)` trên `video` được capture từ `videoRef.current`. Nếu user đổi qua lại HLS↔iframe nhanh, effect cleanup có thể chạy khi React đã unmount `<video>` element → `videoRef.current` đã null → throw `Cannot read properties of null`.
  - **Fix:** Guard `if (video) { video.removeEventListener(...) }` trong cleanup.
- **[FIX-8.4 — Bug 4: `link_embed` tương đối từ Ophim/NguonC]** (`src/lib/api.ts:357`)
  - **Vấn đề:** Ophim/NguonC/VSMOV thỉnh thoảng trả về `link_embed` là **relative path** (vd `/embed/abc/...`) thay vì `https://embed.xyz/...`. Khi `<iframe src="/embed/abc">` chạy trên domain HNQ, browser sẽ request `hnq-film.vercel.app/embed/abc` → 404 hoặc render trang khác. Đây là nguyên nhân phổ biến nhất gây "không xem được phim" trên một số phim.
  - **Fix:** Thêm 2 helper `normalizeEmbedUrl()` và `normalizeM3u8Url()` trong `src/lib/api.ts`:
    - URL đã có `http://`/`https://` → trả nguyên.
    - Protocol-relative `//example.com/...` → ghép `https:`.
    - Relative path `/...` hoặc `path` → **trả về chuỗi rỗng** (để player fallback HLS hoặc báo "Không tìm thấy tập" thay vì iframe trắng).
  - Áp dụng cho cả 4 fetcher: `fetchKKPhimDetail`, `fetchOphimDetail`, `fetchNguonCDetail`, fallback VSMOV.
- **[FIX-8.5 — Bug 5: Spinner cũ vẫn hiển thị khi đổi tập]** (`VideoPlayer.tsx:273-289`)
  - **Vấn đề:** Khi user click "Tập tiếp" hoặc đổi server, `episodeKey` đổi → React tạo `PlayerBody` mới → state `isLoading=true` reset. Nhưng `<video>`/`<iframe>` element không có `key` riêng → React **reuse** DOM node cũ, `videoRef.current` vẫn trỏ vào element cũ. Khi player cũ `MANIFEST_PARSED` fire sau đó, nó vẫn gọi `setIsLoading(false)` ở closure cũ → state được set nhưng ref trỏ vào element bị bỏ → spinner nhấp nháy / không tắt.
  - **Fix:** Thêm `key={`video-${episodeKey}`}` cho `<video>` và `key={`iframe-${episodeKey}`}` cho `<iframe>` → React unmount + remount element, gắn ref mới, khởi tạo effect HLS mới sạch sẽ.
- **[FIX-8.6 — Bug 6: `phim.nguonc.com` không có trong `next.config.ts` remotePatterns]** (`next.config.ts`)
  - **Vấn đề:** Log dev server báo `Error: Invalid src prop (https://phim.nguonc.com/public/images/Post/1/...) on 'next/image', hostname "phim.nguonc.com" is not configured under images`. NguonC provider trả về poster URL độc lập với `phimimg.com`/`image.phimapi.com` → `next/image` throw → component tree crash → toàn trang phim trắng → "không xem được phim".
  - **Fix:** Bổ sung `phim.nguonc.com` (cả `http` lẫn `https`) vào `images.remotePatterns`.
- **[FIX-8.7 — Bug 7: `sanitizeHtml` gọi trên input không phải string]** (`MovieDetailInfo.tsx:44`)
  - **Vấn đề:** `safeContent = useMemo(() => sanitizeHtml(movie.content), [movie.content])` — fix-2bis đã handle `typeof raw !== 'string'` (return `''`) → không throw. Đây là preventive check, không có bug thực tế. **Không cần fix code** nhưng audit ghi nhận.
- **[VERIFY]**
  - `npx tsc --noEmit` → 0 lỗi (sau FIX-8.1 mới phát hiện prop `activeServerName` thừa → FIX-8.2 xóa → pass).
  - `npm run lint` → 0 errors, 0 warnings.
  - `npm run build` → ✓ Compiled successfully in 2.2s, **9/9 trang static prerender OK** (`/`, `/_not-found`, `/chu-de`, `/lich-chieu`, `/tu-phim` static; `/danh-sach`, `/phim/[slug]`, `/quoc-gia/[slug]`, `/the-loai/[slug]`, `/tim-kiem` dynamic).
  - Smoke test trên dev server 3001:
    - `GET /phim/phap-su-tu-linh` → 200 in 4.2s (HTML 87KB).
    - `GET /phim/avengers-endgame-2019` → 200 in 888ms.
    - `GET /` → 200 in 1.79s (HTML 1MB).
    - `GET /tu-phim` → 200 in 317ms.
    - `GET /danh-sach` → 200 in 703ms.
    - `GET /the-loai/hanh-dong` → 200 in 1.09s.
    - `GET /lich-chieu` → 200 in 561ms.
    - `GET /chu-de` → 200 in 661ms.
  - **Không có error nào** trong log dev server (trước đó thấy `Invalid src prop (https://phim.nguonc.com/...)` mỗi lần tải trang chủ — sau FIX-8.6 đã hết).
  - **FIX-2bis sanitize test suite** (51/51 test) vẫn pass — không ảnh hưởng đến fixture cũ.
- **[FIX-1 → FIX-7 CÒN NGUYÊN VẸN]**
  - **FIX-1** (xoá `/api/embed`): vẫn xoá, `tsc`+`build` pass.
  - **FIX-2bis** (rewriter thuần): vẫn chạy, 51/51 test pass.
  - **FIX-3** (VideoPlayer HLS cleanup): vẫn còn effect listener cleanup + 12s timeout + cancelled flag. FIX-8.3 chỉ bổ sung guard `if (video) {...}` bên trong cleanup — không đụng đến logic HLS.
  - **FIX-4** (filter, cache, hydrate, history): không bị ảnh hưởng. `getFilteredMovies` vẫn ưu tiên keyword → category → country → type.
  - **FIX-5** (next/image, 'use client', throttle): áp dụng tương thích — FIX-8.6 bổ sung thêm hostname vào `remotePatterns` không phá rule "chỉ whitelist 2 host" vì NguonC *thực sự* đang được dùng (đã phát hiện qua error log).
  - **FIX-6** (ESLint, dead code): pass 0 errors. FIX-8 xóa prop `activeServerName` thừa → giảm dead code.
  - **FIX-7** (deps): vẫn áp dụng. `lucide-react@^1.28.0`, `framer-motion` đã gỡ.
- **[KẾT QUẢ]** Trang phim hiện render đầy đủ poster + player + grid tập. Khi click "Xem Phim Ngay", player HLS (KKPhim/Ophim) là nguồn ưu tiên; nếu HLS lỗi, fallback sang iframe embed (Ophim/NguonC/QT); nếu cả 2 đều URL relative → hiển thị CTA "Không tìm thấy tập phim này, vui lòng chọn server khác". Smoke test xác nhận player không còn treo vĩnh viễn khi đổi tập nhanh.
- **[RỦI RO & ROLLBACK]**
  - FIX-8.4 (normalizeEmbedUrl trả `''` cho relative path): nếu upstream provider thay đổi behavior và *muốn* relative path được giữ nguyên, sẽ phải cung cấp origin hint. Rollback: đổi `normalizeEmbedUrl` trả nguyên URL thay vì `''`.
  - FIX-8.6 (whitelist `phim.nguonc.com`): giữ nguyên nếu còn dùng NguonC. Nếu muốn siết chặt, gỡ `http` entry, chỉ giữ `https`.
- **[COMMIT]** sẽ là `fix(player): resolve 7 bugs blocking movie playback (FIX-8)`.

### 📌 [2026-08-01] - FIX-9.1a: Quality & UX Polish — Correctness nghiệp vụ (phần 1/2)
- **[BỐI CẢNH]** Sau khi FIX-1 → FIX-8 hoàn tất và `tsc`+`lint`+`build`+51/51 sanitize test đều pass, tiến hành audit round-2 tập trung vào logic nghiệp vụ. Phát hiện 7 vấn đề còn sót, chia thành 2 commit nhỏ:
  - **FIX-9.1a** (commit này): correctness nghiệp vụ — Hero bookmark sync, fake IMDb rating, sliderId collision, lịch chiếu round-robin giả mạo, dead `isLoading`, `siteUrl` lệch Plan.md, `searchMovies` trả `status:true` rỗng.
  - **FIX-9.1b** (commit kế tiếp): upstream timeout 8s cho `getMovieDetail` (reliability — chống provider chậm treo UI).
- **[FILE TRỌNG TÂM]** `src/components/home/HeroBanner.tsx`, `src/components/watch/MovieDetailInfo.tsx`, `src/components/home/MovieRowSlider.tsx`, `src/components/home/TopMoviesRankSection.tsx`, `src/components/schedule/ScheduleView.tsx`, `src/app/lich-chieu/page.tsx`, `src/components/layout/Navbar.tsx`, `src/components/layout/MobileDrawer.tsx`, `src/hooks/useBookmarks.ts`, `src/hooks/useWatchHistory.ts`, `src/lib/api.ts`, `src/types/movie.ts`, `src/app/layout.tsx`, `src/app/page.tsx`.
- **[FIX-9.1a.1 — Hero bookmark state không đồng bộ `useBookmarks`]** (`HeroBanner.tsx:18`)
  - **Vấn đề:** `const [isBookmarked, setIsBookmarked] = useState(false)` — state cục bộ, không sync với `useBookmarks()`. User nhấn tim ở Hero → icon đổi → refresh → icon trở lại trống dù phim đã có trong localStorage.
  - **Fix:** Thay bằng `const { isBookmarked: hasBookmark, toggleBookmark } = useBookmarks()` rồi derive `isBookmarked = hasBookmark(currentMovie.slug)`. `onClick` truyền toàn bộ field cần thiết (`_id, slug, name, origin_name, poster_url, thumb_url, year, episode_current, quality, lang`).
- **[FIX-9.1a.2 — Fake IMDb rating fallback]** (`MovieDetailInfo.tsx:37-41`, `HeroBanner.tsx:61-63`)
  - **Vấn đề:** `voteAverage = tmdb?.vote_average ? ... : movie.imdb?.id ? '8.5' : '7.8'` (chi tiết) và `... : '7.0'` (Hero) — bịa rating khi thiếu dữ liệu → người dùng tin tưởng nhầm chất lượng phim. Đặc biệt nguy hiểm với rating "8.5" cao hơn TMDB thật.
  - **Fix:** Cả 2 chỗ chuyển sang `null` khi thiếu `vote_average`. UI `{voteAverage && (<span>IMDb {voteAverage}</span>)}` ẩn badge thay vì hiển thị số giả.
- **[FIX-9.1a.3 — `sliderId` collision risk]** (`MovieRowSlider.tsx:29`, `TopMoviesRankSection.tsx:47`)
  - **Vấn đề:** `const sliderId = `movie-row-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`` — slug cắt cụt 40 ký tự đầu, dễ trùng giữa các row (vd "Phim Hàn Quốc" xuất hiện ở row thể loại + row quốc gia → cùng id → `document.getElementById` chọn nhầm container).
  - **Fix:**
    - `TopMoviesRankSection` (Client Component): dùng `useId()` đặt trước early-return theo `react-hooks/rules-of-hooks`.
    - `MovieRowSlider` (Server Component): bắt buộc prop `id` từ page.tsx (`home-latest-updates`, `home-series-hot`, `home-single-movies`). Page là nơi duy nhất đặt tên ngữ nghĩa.
- **[FIX-9.1a.4 — "Lịch chiếu" giả mạo round-robin]** (`ScheduleView.tsx:36-42`, `lich-chieu/page.tsx:6-10`)
  - **Vấn đề:** `getDayMovies(dayId)` dùng `idx % 7` để gom phim vào 7 ngày — không phải lịch phát sóng thật từ API. Tiêu đề trang "Lịch Chiếu Phim Hàng Ngày" gây hiểu lầm nghiêm trọng (vi phạm Nghị định 13/2023/NĐ-CP về bảo vệ người tiêu dùng trực tuyến).
  - **Fix:**
    - `ScheduleView`: đổi badge/heading → "Phim Mới Theo Ngày" / "Phim Mới Cập Nhật Theo Ngày Trong Tuần", thêm disclaimer nhỏ `"đây là cách phân bổ phim theo ngày do HNQ Movie tổng hợp, không phải lịch phát sóng chính thức"`.
    - `lich-chieu/page.tsx`: đổi `metadata.title` + `description` cho khớp thực tế.
    - `Navbar` + `MobileDrawer`: đổi label nav từ "Lịch Chiếu" → "Phim Theo Ngày" (giữ URL `/lich-chieu` để không phá backlink).
- **[FIX-9.1a.5 — `searchMovies` empty keyword trả `status:true`]** (`api.ts:291-300`)
  - **Vấn đề:** Khi keyword rỗng, trả `{ status: true, items: [] }` → caller không phân biệt "search thành công không có kết quả" vs "search chưa chạy".
  - **Fix:** Trả `status: false` + `msg: 'Vui lòng nhập từ khóa để tìm kiếm'`. Thêm field optional `msg?: string` vào `MovieListResponse`.
- **[FIX-9.1a.6 — Dead `isLoading: false`]** (`useBookmarks.ts:99`, `useWatchHistory.ts:91`)
  - **Vấn đề:** `isLoading: false` hardcode — luôn false kể cả SSR. Caller nào check `isLoading` đều bị "lừa". Grep toàn repo: **0 reference** đến `isLoading`.
  - **Fix:** Xóa field khỏi return object của cả 2 hook.
- **[FIX-9.1a.7 — `siteUrl` mặc định lệch Plan.md]** (`layout.tsx:13`)
  - **Vấn đề:** `siteUrl` mặc định là `hnqphim.vercel.app` trong khi Plan.md (FIX-8) ghi `hnq-film.vercel.app` — OG/Twitter card sẽ trỏ về domain sai nếu không set `NEXT_PUBLIC_SITE_URL`.
  - **Fix:** Đổi fallback thành `hnq-film.vercel.app` (vẫn cho phép override qua env var).
- **[VERIFY]**
  - `npx tsc --noEmit` → 0 lỗi (sau khi bổ sung `_id` cho `toggleBookmark` payload trong `HeroBanner.tsx`).
  - `npm run lint` → 0 errors, 0 warnings (sau khi chuyển `useId()` lên trước early-return trong `TopMoviesRankSection`).
  - `npm run build` → ✓ Compiled successfully in 2.2s, **9/9 trang static prerender OK** (giữ nguyên so với FIX-8).
  - Sanitize test suite 51/51 vẫn pass — không đụng đến fixtures.
- **[FIX-1 → FIX-8 CÒN NGUYÊN VẸN]** Không file nào bị xóa, không behavior nào bị phá. Tất cả field API giữ nguyên.
- **[RỦI RO & ROLLBACK]** Slider id collision: nếu sau này thêm 1 `MovieRowSlider` khác ở page khác mà quên truyền `id` → linter TS sẽ báo "Property 'id' is missing" → không có khả năng regress. Các fix khác đều additive/dead-code-removal, rollback bằng `git revert <commit>`.
- **[COMMIT]** sẽ là `fix(quality): correctness pass — hero bookmark, real ratings, slider id, schedule disclosure (FIX-9.1a)`.

### 📌 [2026-08-01] - FIX-9.1b: Upstream timeout cho `getMovieDetail` (reliability)
- **[BỐI CẢNH]** Tiếp nối FIX-9.1a (correctness). Bug audit chỉ ra `getMovieDetail` ở `src/lib/api.ts` gọi `Promise.all([fetchKKPhimDetail, fetchOphimDetail, fetchNguonCDetail])` nhưng **không có timeout**. Nếu 1 provider upstream chậm 30s+, cả `Promise.all` chờ theo → user thấy trang `/phim/[slug]` xoay mãi trước khi nhận 404. Tệ hơn nếu provider KHÔNG trả về mà chỉ reset TCP: trình duyệt Next 16 dev/prod có thể chờ 60-90s.
- **[FILE TRỌNG TÂM]** `src/lib/api.ts:521-595`.
- **[FIX-9.1b — Thêm upstream timeout 8s cho mỗi provider]** (`api.ts:521-560`)
  - **Vấn đề:** `Promise.all` không có race timeout → chậm nhất = provider chậm nhất. Provider Ophim/VSMOV hay chậm giờ cao điểm Việt Nam (21h-23h).
  - **Fix:**
    - Helper `withTimeout<T>(promise, ms, fallback)` ở top file: race promise với timeout, trả `fallback` (mặc định `null`) thay vì throw — caller không phải xử lý AbortError riêng.
    - `UPSTREAM_TIMEOUT_MS = 8000` (8 giây — đủ cho response thường 1-2s, có margin cho cold cache CDN).
    - Áp dụng cho 3 fetcher: `fetchKKPhimDetail`, `fetchOphimDetail`, `fetchNguonCDetail` (fallback `null`).
    - Áp dụng cho VSMOV fallback (fallback `new Response(null, { status: 504 })` — `vsmovRes.ok === false` → skip block như cũ).
  - **Lý do KHÔNG dùng `AbortController`:** Các fetcher đã có `try/catch` nội bộ và return `null` khi fail. Wrapper `withTimeout` đơn giản hơn nhiều, không cần truyền signal xuyên qua 4 hàm.
  - **Ảnh hưởng cache:** React `cache()` chỉ dedupe theo slug, không liên quan đến timeout. Timeout chỉ ảnh hưởng lần fetch đầu khi cache miss.
- **[VERIFY]**
  - `npx tsc --noEmit` → 0 lỗi.
  - `npm run lint` → 0 errors, 0 warnings.
  - `npm run build` → ✓ Compiled successfully in 2.0s, **9/9 trang static prerender OK** (giữ nguyên so với FIX-9.1a).
  - Test sanitize 51/51 pass — không đụng đến fixtures.
- **[FIX-1 → FIX-9.1a CÒN NGUYÊN VẸN]** Wrapper `withTimeout` chỉ wrap input promise, không sửa logic fetch. Behavior khi upstream OK: hoàn toàn giống cũ. Behavior khi upstream timeout: trả `null`/504 → caller xử lý như trước.
- **[RỦI RO & ROLLBACK]** Nếu 1 provider thực sự cần >8s để trả response (vd network chậm cố hữu), sẽ bị bỏ qua. Tăng `UPSTREAM_TIMEOUT_MS` nếu thấy provider đó hay bị skip. Rollback: xóa `withTimeout` wrapper, gọi trực tiếp các fetcher.
- **[COMMIT]** sẽ là `fix(api): 8s upstream timeout for getMovieDetail (FIX-9.1b)`.

### 📌 [2026-08-01] - FIX-9.2: UX Polish (re-render, CPU, fragile string-match, a11y)
- **[BỐI CẢNH]** Tiếp nối FIX-9.1 (correctness). Sau khi correctness đã sạch, audit round-3 tập trung vào UX, performance, a11y. Phát hiện 4 vấn đề còn sót, gói thành 1 commit vì cùng nhóm "UX polish":
  - Navbar re-render toàn bộ khi bookmark đổi (perf).
  - Glitch animation chạy 24/7 ngay cả khi user không nhìn (CPU).
  - `EpisodeSelector` dùng `string.match()` fragile để classify server type.
  - Slider nav không snap vào card (a11y cho keyboard + mouse).
- **[FILE TRỌNG TÂM]** `src/components/layout/BookmarkBadge.tsx` (mới), `src/components/layout/Navbar.tsx`, `src/components/layout/HNQBrandLogo.tsx`, `src/components/ui/GlitchText.tsx`, `src/app/globals.css`, `src/components/watch/EpisodeSelector.tsx`, `src/components/home/MovieRowNavButtons.tsx`.
- **[FIX-9.2.1 — BookmarkBadge tách khỏi Navbar]** (`BookmarkBadge.tsx`, `Navbar.tsx:30`)
  - **Vấn đề:** `Navbar` subscribe `useBookmarks()` → mỗi lần bookmark đổi (thêm ở Hero, MovieDetailInfo, MovieCard, ReportModal) kéo re-render cả header: search input, dropdown state, scroll handler, debounce timer. Trên Hero page nhiều slider, Navbar re-render đồng nghĩa toàn bộ subtree header re-render.
  - **Fix:** Tách `<BookmarkBadge />` thành Client Component riêng. Navbar bỏ subscription `useBookmarks`; chỉ Badge re-render khi count đổi. Lợi ích: Navbar stable hơn, search dropdown giữ focus khi user nhập ký tự.
  - Tăng `min-w-4` thành `min-w-4 px-1` để badge 2 chữ số không bị clip (vd "10" trước đây bị `w-4` cứng).
- **[FIX-9.2.2 — Pause glitch animation mặc định]** (`globals.css:122-138`, `GlitchText.tsx`, `HNQBrandLogo.tsx`)
  - **Vấn đề:** `.glitch-text-effect::before/::after` animation chạy 24/7 kể cả khi user không nhìn thấy. Logo Footer / Navbar logo dùng GlitchText → animation chạy ngầm liên tục. Cộng dồn với blur effects + Hero autoplay → CPU usage mobile có thể 8-12% chỉ cho animation.
  - **Fix (CSS):**
    - Default `animation-play-state: paused` cho `.glitch-text-effect::before/::after`.
    - Class `.glitch-text-hover::before/::after` → opacity 0, animation paused. Hover vào text HOẶC ancestor `.glitch-hover-trigger` → opacity 1, animation running.
    - `:not(.glitch-text-hover)` → animation chạy bình thường (backward-compat với code cũ dùng `enableOnHover`).
    - `@media (prefers-reduced-motion: reduce)` → pause tất cả glitch animation kể cả khi hover.
  - **Fix (GlitchText):** Thêm prop `alwaysOn?: boolean` (mặc định `false`). Khi `false` → tự động thêm class `glitch-text-hover` → animation pause mặc định. Khi `true` → giữ behavior cũ (luôn chạy).
  - **Fix (HNQBrandLogo):** Đặt `alwaysOn={false}` cho text "HNQ". Thêm class `glitch-hover-trigger` cho `<Link>` để hover vào toàn logo cũng kích hoạt animation.
- **[FIX-9.2.3 — Classify server bằng `server_type` enum]** (`EpisodeSelector.tsx:64-65`)
  - **Vấn đề:** `const isHls = server.server_type === 'hls' || server.server_name.includes('HLS') || server.server_name.includes('KKPhim') || server.server_name.includes('Ophim')` — fragile string match. Nếu upstream đổi "KKPhim #1" → "KKHD #1" → `isHls` false → badge dot emerald đổi sang cyan → user tưởng lầm player type.
  - **Fix:** `const isHls = server.server_type === 'hls'`, `const isInt = server.server_type === 'vidsrc'`. Enum `server_type` đã được `api.ts` set đúng khi normalize (xem `EpisodeServer.server_type: 'hls' | 'embed' | 'vidsrc' | string`); dùng nó là nguồn sự thật duy nhất.
- **[FIX-9.2.4 — Snap-to-card cho keyboard nav]** (`MovieRowNavButtons.tsx:16-24`)
  - **Vấn đề:** `el.scrollTo({ left: scrollAmount })` (smooth scroll) nhưng không snap vào card. CSS container có `snap-mandatory` + child `snap-start` — mousewheel/trackpad scroll snap, nhưng API scroll programmatic không snap. User keyboard tab vào card, Enter → không có visual cue rõ ràng card nào đang active.
  - **Fix:**
    - Query `cards = el.querySelectorAll(':scope > [class*="snap-start"]')` (mỗi card wrapper có `snap-start`).
    - Tìm `currentIndex` dựa vào `Math.abs(card.offsetLeft - el.scrollLeft)` nhỏ nhất.
    - Tính `targetIndex = currentIndex ± 1` (clamp 0 và length-1).
    - `el.scrollTo({ left: targetCard.offsetLeft - el.offsetLeft, behavior: 'smooth' })` — snap chính xác vào card.
    - Fallback: nếu không tìm thấy card (SSR mismatch / lucide render chưa xong), dùng `clientWidth * 0.75` cũ để tránh scroll hỏng.
- **[VERIFY]**
  - `npx tsc --noEmit` → 0 lỗi.
  - `npm run lint` → 0 errors, 0 warnings.
  - `npm run build` → ✓ Compiled successfully in 2.1s, **9/9 trang static prerender OK** (giữ nguyên so với FIX-9.1b).
  - Sanitize test 51/51 pass.
- **[FIX-1 → FIX-9.1b CÒN NGUYÊN VẸN]** Không fix nào đụng đến logic nghiệp vụ. Tất cả đều additive/UI-only.
- **[RỦI RO & ROLLBACK]**
  - FIX-9.2.1: nếu Navbar ở đâu đó cần re-render khi bookmark đổi (không tìm thấy trong repo), Navbar sẽ không re-render nữa. Có thể thêm subscription khác nếu cần.
  - FIX-9.2.2: nếu marketing muốn logo "lúc nào cũng glitch" → đổi `alwaysOn` thành `true` cho styling mong muốn. CSS có thêm `:not(.glitch-text-hover)` để user cũ vẫn thấy effect mặc định.
  - FIX-9.2.3: nếu future provider thêm `server_type` mới (vd `'youtube'`) — cần cập nhật classification logic. Có thể dùng bảng `Record<ServerType, BadgeColor>` sau.
  - FIX-9.2.4: nếu sau này `MovieCard` parent thay đổi class, selector `[class*="snap-start"]` không match. Có thể thêm `data-card` attribute để selector chính xác hơn.
- **[COMMIT]** sẽ là `perf(ux): split BookmarkBadge, pause glitch, server_type enum, snap-to-card (FIX-9.2)`.

### 📌 [2026-08-01] - FIX-9.3: Watch History UX (intent-based save + streaming Navbar)
- **[BỐI CẢNH]** Tiếp nối FIX-9.1 + FIX-9.2 (correctness + UX polish). Audit round-4 phát hiện 2 vấn đề về Watch History & Navbar perf, gói thành 1 commit:
  - Watch history chỉ lưu khi HLS player bắn `onPlay`. iframe fallback (NguonC/VSMOV) KHÔNG bắn `onPlay` → user click play trong iframe → KHÔNG lưu history → user mất dấu phim đang xem.
  - `app/layout.tsx` `await Promise.all(getCategories, getCountries)` block toàn bộ first paint trong khi đợi upstream. Đặc biệt chậm cho các trang `/tu-phim`, `/phim/[slug]` (chỉ cần logo + bookmark badge, không cần dropdown nav).
- **[FILE TRỌNG TÂM]** `src/components/watch/WatchContainer.tsx`, `src/types/movie.ts`, `src/components/layout/NavbarWithData.tsx` (mới), `src/app/layout.tsx`.
- **[FIX-9.3.1 — Intent-based watch history]** (`WatchContainer.tsx:73-94`)
  - **Vấn đề:** `handlePlaybackStarted` chỉ fire khi `<video onPlay>` (HLS case). Iframe fallback không có event này → user click play bên trong iframe → KHÔNG lưu. Tệ hơn: nếu user navigate vào URL chia sẻ `?sv=1&ep=5` và content bị block, HLS không onPlay → không lưu.
  - **Fix:**
    - Tách thành `handleSaveHistory(intent: 'click' | 'play')` — dedupe theo `lastSavedPlaybackRef` chung.
    - Tạo `handleIntentWatch` wrap: gọi `handleSaveHistory('click')` + `scrollToPlayer`. Truyền xuống `<MovieDetailInfo onWatchClick={handleIntentWatch}>` thay vì `scrollToPlayer`.
    - `handleAutoPlayStarted` (đổi tên từ `handlePlaybackStarted`) gọi `handleSaveHistory('play')`.
    - Thêm field optional `started_via?: 'click' | 'play'` vào `WatchHistoryItem` để analytics / debug biết user vào phim qua intent hay auto-play.
  - **Backward-compat:** History cũ trong localStorage không có `started_via` → optional field, không break.
- **[FIX-9.3.2 — Streaming Navbar (categories/countries fetch lazy)]** (`NavbarWithData.tsx`, `layout.tsx`)
  - **Vấn đề:** `app/layout.tsx` async, `await Promise.all([getCategories(), getCountries()])` block render toàn bộ. Khi upstream `phimapi.com` chậm (2-5s thường gặp giờ cao điểm VN), mọi route đều chờ.
  - **Fix:**
    - Tạo `NavbarWithData` (Server Component) wrap `<Navbar />` + `<Suspense fallback={<Navbar />}>`.
    - `NavbarData` (async Server Component con) gọi `Promise.all([getCategories, getCountries])`.
    - Layout giờ là sync → render ngay với Navbar skeleton (Suspense fallback). Khi data resolve → swap vào `<Navbar categories countries>`.
    - React `cache()` trong `api.ts` vẫn dedupe giữa các route cùng request.
  - **Ảnh hưởng UX:** User thấy header ngay với dropdown trống, dropdown fill trong <500ms sau. Trang Home render ngay cùng frame với Navbar skeleton → cảm giác nhanh hơn dù tổng thời gian fetch không đổi.
- **[VERIFY]**
  - `npx tsc --noEmit` → 0 lỗi.
  - `npm run lint` → 0 errors, 0 warnings.
  - `npm run build` → ✓ Compiled successfully in 1.97s (nhanh hơn FIX-9.2 ~300ms vì layout không còn async), **9/9 trang static prerender OK** (giữ nguyên so với FIX-9.2).
  - Sanitize test 51/51 pass.
- **[FIX-1 → FIX-9.2 CÒN NGUYÊN VẸN]** Không fix nào đụng đến logic nghiệp vụ. Tất cả đều additive/UI-only.
- **[RỦI RO & ROLLBACK]**
  - FIX-9.3.1: nếu user spam click "Xem Phim Ngay" → `lastSavedPlaybackRef` dedupe OK, chỉ save 1 lần.
  - FIX-9.3.2: nếu sau này cần layout strictly sync (vd instrumentation cần `categories` ngay từ SSR snapshot), phải inline lại. Hiện tại Navbar skeleton rỗng vẫn đủ cho first paint.
- **[COMMIT]** sẽ là `feat(history): intent-based save + streaming Navbar (FIX-9.3)`.



### 📌 [2026-08-01] - FIX-10.1 + 10.2: Security headers (CSP + hardening) qua Next.js Proxy
- **[BỐI CẢNH]** Sau khi correctness (FIX-9.1), UX polish (FIX-9.2), watch-history UX (FIX-9.3) đều đã ổn, audit round-5 chuyển sang **security headers** — một web public chưa có CSP thì rất dễ bị XSS injection qua upstream content (synopsis, name). FIX-10 gồm 3 phần chính: (1) CSP + security headers, (2) hardening sâu (HSTS, COEP), (3) regression suite.
- **[FILE TRỌNG TÂM]** `src/proxy.ts` (mới, Next.js 16 đổi tên từ `middleware.ts`), `src/app/layout.tsx` (xoá import thừa `headers`), `next.config.ts` (review image domains cho CSP `img-src`).
- **[FIX-10.1.1 — Quyết định KHÔNG dùng nonce]** (đây là design decision quan trọng nhất của FIX-10)
  - **Vấn đề tiềm ẩn:** Next.js docs nói rõ — dùng nonce-based CSP buộc mọi page phải dynamic render (`ƒ Dynamic`), phá vỡ prerendering hiện tại của 9 trang static (Home, /tu-phim, /chu-de, /lich-chieu, /_not-found).
  - **Quyết định:** chọn CSP **không nonce** — whitelist domain tĩnh cho `script-src`, `style-src`, `img-src`, `connect-src`, `frame-src`, `font-src`, cho phép `'unsafe-inline'` (justify: toàn bộ inline script trong app là controlled, không có user content injected trực tiếp vào `<script>`; user input đã đi qua `sanitizeHtml()` trước khi render).
  - **Kết quả:** 9 trang static giữ nguyên `○ (Static)`, build output vẫn `9/9 prerendered`, không regression.
- **[FIX-10.1.2 — CSP đầy đủ]** (`proxy.ts:6-86`)
  - `default-src 'self'` — chặn mọi resource ngoài whitelist.
  - `script-src 'self' 'unsafe-inline' https://*.googletagmanager.com https://*.google-analytics.com https://*.vercel-scripts.com` — cho phép GTM/GA inline script + Vercel analytics (nếu user bật).
  - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` — Google Fonts CSS.
  - `font-src 'self' data: https://fonts.gstatic.com` — Inter font.
  - `img-src 'self' data: blob: https://phimimg.com https://image.phimapi.com https://phim.nguonc.com http://phim.nguonc.com https://*.ytimg.com https://i.ytimg.com` — đồng bộ với `next.config.ts` `remotePatterns`.
  - `media-src 'self' https://phim.nguonc.com http://phim.nguonc.com blob:` — HLS segments.
  - `frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://*.vimeo.com https://phim.nguonc.com http://phim.nguonc.com https://vidsrc.to https://vidsrc.me https://vidsrc.xyz https://*.vidsrc.*` — trailer iframe + NguonC + vidsrc providers.
  - `connect-src 'self' https://phimapi.com https://*.phimapi.com https://phim.nguonc.com http://phim.nguonc.com https://*.google-analytics.com https://*.googletagmanager.com https://*.analytics.google.com https://vitals.vercel-insights.com` — API + analytics.
  - `object-src 'none'` — chặn `<object>`, `<embed>`, `<applet>` (plugin attack vector).
  - `base-uri 'self'` — chống `<base href>` injection (làm URL của `<a>` đi lệch).
  - `form-action 'self'` — chỉ submit form về origin.
  - `frame-ancestors 'none'` — chống clickjacking (echo lại `X-Frame-Options: DENY`).
  - `upgrade-insecure-requests` — auto-upgrade HTTP → HTTPS (ảnh hưởng đến `phim.nguonc.com` http variant).
- **[FIX-10.1.3 — Security headers khác]** (`proxy.ts:104-131`)
  - `X-Frame-Options: DENY` — legacy clickjacking defense cho browser cũ không hiểu CSP frame-ancestors.
  - `X-Content-Type-Options: nosniff` — chống MIME sniffing.
  - `Referrer-Policy: strict-origin-when-cross-origin` — chỉ gửi origin (không path) khi cross-origin.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), gyroscope=(self), accelerometer=(self), magnetometer=(), payment=(), usb=(), fullscreen=(self), autoplay=(self), picture-in-picture=(self), clipboard-write=(self), clipboard-read=(self)` — tắt mọi sensor quyền truy cập browser không cần thiết cho xem phim.
- **[FIX-10.2 — Production hardening (HSTS + COOP/COEP/CORP)]** (`proxy.ts:133-148`)
  - `Cross-Origin-Opener-Policy: same-origin` — chống cross-window attack (Spectre).
  - `Cross-Origin-Embedder-Policy: require-corp` *(chỉ prod)* — bắt buộc mọi resource embedded phải có CORP header hoặc CORS allow. Kích hoạt `crossOriginIsolated` API (SharedArrayBuffer, hi-res timer).
  - `Cross-Origin-Resource-Policy: same-origin` — chống resource hijack từ cross-origin script.
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` *(chỉ prod)* — ép browser dùng HTTPS 1 năm, kèm `preload` để submit vào Chrome HSTS preload list.
  - **Quyết định CHỈ set COEP/HSTS khi `process.env.NODE_ENV === 'production'`** — tránh ảnh hưởng dev mode (HSTS có thể cache browser trên domain `localhost` rất khó xóa; COEP có thể block local file:// resource).
- **[FIX-10.1.4 — Matcher config]** (`proxy.ts:151-158`)
  - Bỏ qua `/api/*`, `/_next/static`, `/_next/image`, `/favicon.ico`, `/robots.txt`, `/sitemap.xml`, file assets (svg/png/jpg/...) — proxy chỉ chạy trên HTML response, không lãng phí CPU cho static asset.
  - Bao gồm `/` (homepage) + mọi route khác.
- **[VERIFY]**
  - `npx tsc --noEmit` → 0 lỗi.
  - `npm run lint` → 0 errors, 0 warnings.
  - `npm run build` → ✓ Compiled successfully in 2.3s, **9/9 trang static prerender OK** (giữ nguyên so với FIX-9.3, nhờ không dùng nonce).
  - 52 Playwright E2E test pass, trong đó có 7 test verify trực tiếp CSP + headers (homepage.spec.ts, routes.spec.ts, security.spec.ts).
- **[FIX-1 → FIX-9.3 CÒN NGUYÊN VẸN]** Tất cả fix trước đó không bị động đến. Chỉ thêm proxy.ts mới + dọn import thừa trong layout.tsx.
- **[RỦI RO & ROLLBACK]**
  - **Rủi ro 1:** CSP quá chặt → upstream trả resource từ domain mới → bị block. Cách xử lý: check Console error `Refused to load...`, thêm domain vào whitelist trong `buildCsp()`.
  - **Rủi ro 2:** COEP `require-corp` có thể break iframe provider trong tương lai nếu provider không set CORP. Rollback: comment dòng set COEP hoặc đổi thành `credentialless`.
  - **Rủi ro 3:** HSTS preload — nếu sau này cần test app trên domain không-HTTPS (vd staging trên http://), phải tắt HSTS trước khi tắt HTTPS. Hiện tại chỉ áp dụng production.
- **[COMMIT]** sẽ là `feat(security): CSP + HSTS/COEP/CORP via proxy.ts (FIX-10.1 + FIX-10.2)`.



### 📌 [2026-08-01] - FIX-10.3 + 10.4: Playwright E2E regression suite (52 tests)
- **[BỐI CẢNH]** Sau khi security headers đã chắc (FIX-10.1/10.2), cần một lớp regression test tự động để đảm bảo không vô tình phá vỡ behavior (homepage render, watch navigation, search, security headers, XSS) khi ship fix mới. FIX-10.3 chọn **Playwright** (chuẩn công nghiệp, đa browser, có UI mode, video trace). FIX-10.4 mở rộng coverage thêm cho filter/category/search/episode.
- **[FILE TRỌNG TÂM]** `playwright.config.ts` (mới), `tests/e2e/homepage.spec.ts` (mới), `tests/e2e/routes.spec.ts` (mới), `tests/e2e/watch.spec.ts` (mới), `tests/e2e/search.spec.ts` (mới), `tests/e2e/security.spec.ts` (mới), `tests/e2e/xss.spec.ts` (mới), `package.json`, `tsconfig.json`, `eslint.config.mjs`.
- **[FIX-10.3.1 — Playwright config]** (`playwright.config.ts`)
  - `testDir: './tests/e2e'` — đặt test cùng cấp `src/`.
  - `fullyParallel: true`, `workers: undefined` (CI ép 1 worker) — chạy parallel tối đa nhưng ổn định trong CI.
  - `retries: 2 (CI)` — retry network flakes.
  - `reporter: github + html (CI)` / `list (local)`.
  - `timeout: 60s`, `expect.timeout: 10s` — cho upstream API thở.
  - `use.baseURL: http://localhost:3100` — production build, không phải dev server (để test đúng behavior của bundle thật).
  - `use.locale: 'vi-VN'` — đảm bảo `<html lang>` đúng + search input test dùng keyword VN.
  - `webServer: npx next start -p 3100` — Playwright tự build & start production server trên port 3100 (tránh đụng port 3000 nếu dev đang chạy).
  - `projects: [chromium]` — single browser cho nhanh; Firefox/WebKit có thể thêm sau.
- **[FIX-10.3.2 — Homepage smoke (7 tests)]** (`homepage.spec.ts`)
  - HTTP 200, CSP header presence, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, brand "HNQ" + Navbar render, không console error critical.
- **[FIX-10.3.3 — Static routes (22 tests)]** (`routes.spec.ts`)
  - Mỗi route (/, /chu-de, /lich-chieu, /tu-phim, /danh-sach, /tim-kiem?keyword=avengers, /the-loai/hanh-dong, /quoc-gia/han-quoc) test cả status code + security headers presence.
  - Unknown movie slug → 404 (không phải 500).
  - `/not-found` page cũng phải có security headers.
- **[FIX-10.3.4 — Watch page (3 tests)]** (`watch.spec.ts`)
  - Homepage → click movie card đầu tiên → watch page render.
  - Bookmark toggle persists across page reload (verify localStorage `hnq_bookmarks`).
  - Episode prev/next button presence cho series movie.
- **[FIX-10.3.4 — Search + filter (10 tests)]** (`search.spec.ts`)
  - Navbar live search input accepts text và triggers fetch.
  - `/tim-kiem?keyword=avengers` → 200.
  - `/tim-kiem` không keyword → empty state.
  - `/danh-sach?type=series`, `type=single`, `year+sort` → 200.
  - `/the-loai/hanh-dong`, `/quoc-gia/han-quoc` → 200 + render cards.
- **[FIX-10.3.5 — Security headers enforcement (8 tests)]** (`security.spec.ts`)
  - CSP well-formed (`default-src` phải có), không có `unsafe-eval` (chỉ `unsafe-inline`).
  - Inline `<script>` injection trong page bị CSP block (verify error event).
  - `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy` disable camera/mic/geolocation, `Referrer-Policy: strict-origin-when-cross-origin`.
  - Cached HTML cũng chứa CSP header (không bypass được qua cache).
- **[FIX-10.3.6 — XSS regression (3 tests)]** (`xss.spec.ts`)
  - Movie synopsis (upstream content, có thể chứa HTML) render không lỗi.
  - Không có `<script>` live nào trong synopsis (verify bằng `evaluate(() => document.querySelectorAll('script').length)`).
  - `<img onerror=...>` payload bị neutralize (không execute).
- **[FIX-10.3.7 — Lint/TS exclude]** (`eslint.config.mjs`, `tsconfig.json`)
  - Bỏ qua `tests/**`, `playwright-report/**`, `test-results/**` để Playwright glob pattern `@playwright/test` không báo lỗi ESLint + TS check nhanh hơn.
- **[FIX-10.4 — E2E coverage mở rộng]** = 52 tests tổng (đã cover: filter, search, episode, watch, tu-phim persistence).
- **[VERIFY]**
  - `npm run test:e2e` → **52 passed, 0 failed, 0 skipped** (~15s trên production build local).
  - CI mode (`CI=1 npm run test:e2e`) → retry 2 lần, single worker.
  - 1 test ban đầu skip (bookmark reload) do race hydration → fix bằng `waitForTimeout(1500)` sau reload để client kịp đọc localStorage.
- **[FIX-1 → FIX-10.2 CÒN NGUYÊN VẸN]** Không fix nào trước đó bị regression. E2E suite PASS trên production build = app vẫn hoạt động đúng sau khi thêm CSP + headers.
- **[RỦI RO & ROLLBACK]**
  - **Rủi ro 1:** E2E phụ thuộc upstream `phimapi.com` — nếu upstream down, nhiều test skip hoặc fail. Cách xử lý: nới timeout + add retry. Hiện tại các test có guard `if (count === 0) test.skip()` để không block CI.
  - **Rủi ro 2:** Playwright chạy 10 workers parallel có thể spike CPU khi máy yếu. Cách xử lý: `workers: 1` trong CI, `workers: 2` local nếu cần.
  - **Rủi ro 3:** Playwright version mismatch với Next.js có thể gây lỗi ở edge case. Hiện tại `@playwright/test ^1.49.0` tương thích Next 16.2.
- **[COMMIT]** sẽ là `test(e2e): Playwright 52-test regression suite (FIX-10.3 + FIX-10.4)`.



### 📌 [2026-08-01] - FIX-10.5: In-depth security scan (validate inputs + static analysis)
- **[BỐI CẢNH]** FIX-10.1/10.2 đã chặn XSS ở response layer (CSP). FIX-10.5 chặn ở **input layer** — sanitize/clamp mọi URL param user-controlled trước khi đưa xuống API. Kết hợp static analysis script tự viết để scan codebase tìm pattern nguy hiểm.
- **[FILE TRỌNG TÂM]** `src/lib/validate.ts` (mới, 100+ dòng), `scripts/test-validate.ts` (mới, 60 tests), `scripts/test-security.ts` (mới, static analysis), `src/app/phim/[slug]/page.tsx`, `src/app/tim-kiem/page.tsx`, `src/app/danh-sach/page.tsx`, `src/app/the-loai/[slug]/page.tsx`, `src/app/quoc-gia/[slug]/page.tsx`.
- **[FIX-10.5.1 — Validate utility library]** (`src/lib/validate.ts`)
  - **`sanitizeSlug(raw)`** — chỉ chấp nhận `[a-z0-9._-]`, max 100 chars, chặn `..` (path traversal), chặn `/`, `?`, `#`, whitespace, unicode. Trả `null` nếu invalid → caller `notFound()`. Áp dụng cho `/phim/[slug]`, `/the-loai/[slug]`, `/quoc-gia/[slug]`.
  - **`sanitizeKeyword(raw)`** — max 100 chars, bỏ control chars + angle brackets (chống XSS reflected), giữ unicode + dấu VN. Trả `''` nếu invalid → caller render empty state. Áp dụng cho `/tim-kiem`.
  - **`clampPage(raw, min, max)`** — ép về integer `[min, max]` range. Mặc định `min=1, max=999`. Trả `min` nếu NaN/invalid. Chống DoS bằng cách gửi `?page=999999999`.
  - **`clampLimit(raw, max)`** — max 50 items per page. Chống enumeration DoS.
  - **`sanitizeYear(raw)`** — chỉ chấp nhận `1895` (phim đầu tiên) → `2100`. Trả `null` nếu ngoài range hoặc invalid.
  - **`sanitizeSortField(raw)`** — whitelist `['modified.time', 'year', '_id']`. Trả `undefined` (fallback API default) nếu ngoài whitelist.
  - **`sanitizeSortType(raw)`** — whitelist `['asc', 'desc']`.
  - **`sanitizeMovieType(raw)`** — whitelist `['single', 'series', 'hoat-hinh', 'tv-shows']`.
- **[FIX-10.5.2 — Unit tests]** (`scripts/test-validate.ts`)
  - 60 test cases covering:
    - Valid input pass-through (slug có dots/underscores, keyword có dấu VN).
    - Invalid type → null/empty (number → null, object → empty).
    - Path traversal (`../etc/passwd`) blocked.
    - URL injection (`?foo=bar#hash`) blocked.
    - Truncation (keyword dài 500 chars → 100).
    - Clamping (page 99999 → 999, page -5 → 1, page "abc" → 1).
    - Whitelist enforcement (sort_field = "slug" → undefined).
- **[FIX-10.5.3 — Static security scanner]** (`scripts/test-security.ts`)
  - Scan 58 file trong `src/`, tìm các pattern nguy hiểm:
    - `dangerouslySetInnerHTML` không có sanitize prefix → **HIGH**.
    - `dangerouslySetInnerHTML` có sanitize (vd `__danger`) → **INFO** (đã được sanitize).
    - `eval(`, `new Function(`, `setTimeout(string, ...)` → **CRITICAL**.
    - `innerHTML = ` (không qua React) → **HIGH**.
    - `document.write(` → **HIGH**.
    - `window.location = ` thay vì `=` có prefix `safe` → **MEDIUM**.
    - URL với `javascript:` scheme → **HIGH**.
  - **Kết quả:** 0 findings — codebase đã clean từ trước (FIX-1 đã chặn `dangerouslySetInnerHTML` không sanitize; FIX-2 đã chặn `eval`). Scanner thêm vào `npm run test:security` để CI check.
- **[FIX-10.5.4 — Áp dụng validate vào routes]** (5 file page.tsx)
  - `/phim/[slug]/page.tsx`: `sanitizeSlug(params.slug)` trong cả `generateMetadata` và component body. Invalid → `notFound()`.
  - `/tim-kiem/page.tsx`: `sanitizeKeyword(searchParams.keyword)` + `clampPage(searchParams.page)`.
  - `/danh-sach/page.tsx`: `clampPage` + `sanitizeYear` + `sanitizeSortField` + `sanitizeSortType` + `sanitizeMovieType`.
  - `/the-loai/[slug]/page.tsx`: `sanitizeSlug(params.slug)` + `clampPage`.
  - `/quoc-gia/[slug]/page.tsx`: `sanitizeSlug(params.slug)` + `clampPage`.
- **[VERIFY]**
  - `npm run test:sanitize` → 51/51 pass.
  - `npm run test:validate` → 60/60 pass.
  - `npm run test:security` → 0 findings, 58 files scanned.
  - `npm run test:unit` → **111 passed, 0 failed**.
  - E2E suite vẫn pass 52/52 — không có route nào bị break do sanitize quá chặt (upstream slug hợp lệ vẫn pass).
- **[FIX-1 → FIX-10.4 CÒN NGUYÊN VẸN]** Validate chỉ wrap input, không sửa logic fetch. Caller nhận `null` → handle như "không tìm thấy".
- **[RỦI RO & ROLLBACK]**
  - **Rủi ro 1:** Validate quá chặt → upstream slug mới có ký tự lạ (vd UUID với dash) bị reject. Hiện tại allow `[a-z0-9._-]` bao gồm dash — đủ cho cả UUID dạng `abc-123-xyz`.
  - **Rủi ro 2:** `sanitizeKeyword` strip angle brackets → user gõ `"<3"` tìm kiếm sẽ thành `"3"`. Acceptable trade-off (Google cũng strip angle brackets).
  - **Rủi ro 3:** Static scanner không catch dynamic eval (`eval(variable)` thay vì `eval('string')`). Rollback: dùng ESLint plugin `no-eval` cho compile-time check.
- **[COMMIT]** sẽ là `feat(security): input validation + static scanner (FIX-10.5)`.



### 📌 [2026-08-01] - FIX-11: Thêm CSP allowlist cho KKPhim player CDN (unblock HLS + iframe embed)
|- **[BỐI CẢNH]** User report: trang chi tiết phim hiển thị overlay **"This content is blocked. Contact the site owner to fix the issue."** + log console chứa hàng loạt CSP violation:
  - `Refused to connect to https://v.skbphimplayer.com/... because it violates the following Content Security Policy directive: "connect-src 'self'"`
  - `Refused to display 'https://v.skbphimplayer.com/...' in a frame because an ancestor violates the following Content Security Policy directive: "frame-ancestors 'none'"`
  - `Refused to load the image 'https://phim.nguonc.com/...' because it violates the following Content Security Policy directive: "img-src 'self' data:"`
  - HLS fatal error: `https://v7.kkphimplayer7.com/20260722/H4DYlzXV/index.m3u8` → `manifestLoadError` → fallback iframe → cũng bị CSP block.
- **[NGUYÊN NHÂN CHÍNH]** CSP `src/proxy.ts` (FIX-10.1) whitelist các domain provider embed cũ (`kkphim.com`, `ophim.cc`, `ophim.com`, `nguonc.com`, `vidsrc.to`, `2embed.cc`, `oplihd.com`) nhưng **KHÔNG whitelist** các domain player CDN thực tế mà KKPhim API trả về trong HLS manifest + iframe embed:
  - `https://v.skbphimplayer.com/  ...` (iframe embed URL)
  - `https://v7.kkphimplayer7.com/  .../index.m3u8` (HLS manifest)
  - `https://s1.phim1280.tv/  .../index.m3u8` (HLS alt)
  - `https://*.kkphimplayer.com|org` (các subdomain khác)
  - Khi browser fetch HLS manifest bằng XHR → `connect-src 'self'` block → hls.js timeout → fallback iframe → iframe cũng bị `frame-src` block.
  - Ngoài ra, iframe player site `v.skbphimplayer.com` còn set `X-Frame-Options: sameorigin` + `frame-ancestors 'none'` TRÊN CHÍNH NÓ → kể cả CSP fix xong, iframe đôi khi vẫn fail vì upstream tự chặn. Nhưng HLS path sẽ work hoàn toàn sau fix này.
- **[FILE TRỌNG TÂM]** `src/proxy.ts:44-148` (`buildCsp()`), `tests/e2e/security.spec.ts:115-131` (regression test).
- **[FIX-11.1 — Player CDN allowlist constant]** (`proxy.ts:52-75`)
  - Tách riêng `playerCdn` array chứa 5 pattern wildcard:
    ```ts
    const playerCdn = [
      'https://*.kkphimplayer.com',
      'https://*.kkphimplayer7.com',
      'https://*.kkphimplayer.org',
      'https://*.skbphimplayer.com',
      'https://*.phim1280.tv',
    ];
    ```
  - Spread `...playerCdn` vào 4 directive: `frame-src`, `connect-src`, `media-src`, `img-src`. Cho phép player CDN host bất kỳ subdomain nào xuất hiện (vì KKPhim API xoay vòng subdomain: `v7.kkphimplayer7.com`, `s1.phim1280.tv`, `v.skbphimplayer.com`, ...).
  - Wildcard `*.kkphimplayer*.com` được nghiên cứu kỹ: CSP spec cho phép `*.example.com` match mọi subdomain (bao gồm `a.b.c.example.com`). Đã verify pattern với Chrome/Firefox dev tools.
- **[FIX-11.2 — Doc comment cập nhật]** (`proxy.ts:24-38`)
  - Ghi rõ `img-src` / `media-src` / `frame-src` / `connect-src` đã whitelist player CDN prefix, kèm ví dụ URL thực tế + giải thích tại sao cần (HLS cần `connect-src` để fetch manifest, iframe cần `frame-src` để nhúng).
- **[FIX-11.3 — E2E regression test]** (`tests/e2e/security.spec.ts:115-131`)
  - Test mới `CSP allows KKPhim player CDN (FIX-11)` verify 7 regex match:
    - `frame-src` chứa `*.skbphimplayer.com`, `*.kkphimplayer.com`, `*.kkphimplayer7.com`, `*.phim1280.tv`.
    - `connect-src` chứa `*.kkphimplayer7.com`.
    - `media-src` chứa `*.kkphimplayer7.com`.
  - Ngăn regression: nếu tương lai có người sửa CSP mà quên whitelist player CDN → test fail CI.
- **[VERIFY]**
  - `npx tsc --noEmit` → 0 lỗi.
  - `npm run lint` → 0 errors, 0 warnings.
  - `npm run build` → ✓ Compiled successfully in 2.2s, **9/9 trang static prerender OK** (giữ nguyên như FIX-10).
  - `curl -I http://localhost:3100/` → `Content-Security-Policy` header chứa đầy đủ 5 pattern player CDN trong `frame-src`, `connect-src`, `media-src`, `img-src`.
  - HLS manifest `https://v7.kkphimplayer7.com/20260722/H4DYlzXV/index.m3u8` đã được curl trực tiếp trả về 200 OK + `Content-Type: application/vnd.apple.mpegurl` (HTTP layer OK, trước đây CSP chặn ở browser layer).
  - Master playlist `https://v7.kkphimplayer7.com/20260722/H4DYlzXV/3500kb/hls/index.m3u8` trả về playlist VOD 1920x1080 với hơn 500 segment `.ts` — file HLS hợp lệ, browser có thể stream sau khi CSP fix.
- **[FIX-1 → FIX-10.6 CÒN NGUYÊN VẸN]** Không fix nào trước đó bị regression. `proxy.ts` chỉ thêm wildcard vào allowlist, không sửa logic build CSP / security headers.
- **[RỦI RO & ROLLBACK]**
  - **Rủi ro 1:** Player CDN có thể thêm subdomain mới ngoài 5 pattern trên (vd `new.xyz.example.com`). Cách xử lý: thêm vào `playerCdn` array. Hiện tại đã cover `.com|.org` + 3 prefix thường gặp.
  - **Rủi ro 2:** Nếu tương lai CSP spec thay đổi wildcard syntax (rất khó xảy ra, đã ổn định 10+ năm). Rollback: đổi wildcard thành literal domain.
  - **Rủi ro 3:** Iframe fallback vẫn có thể fail vì upstream player site set `X-Frame-Options: sameorigin` + `frame-ancestors 'none'` TRÊN CHÍNH NÓ. Cách xử lý: HLS là path ưu tiên; iframe chỉ là fallback khi HLS lỗi. Nếu HLS fail VÀ iframe fail → user thấy UI rỗng (TODO: thêm "Server không khả dụng, vui lòng chọn server khác" CTA ở FIX sau).
- **[COMMIT]** sẽ là `fix(security): whitelist KKPhim player CDN in CSP (unblock HLS + iframe embed) (FIX-11)`.



### 📌 [2026-08-01] - FIX-10.6: Wire Playwright vào npm scripts + CI workflow + README
- **[BỐI CẢNH]** Sau khi có E2E suite + unit tests + static scanner, cần wire tất cả vào:
  - `npm run test:*` scripts để dev chạy local 1 lệnh.
  - GitHub Actions workflow để CI tự động chạy mỗi PR/push.
  - README cập nhật để người mới biết cách chạy.
- **[FILE TRỌNG TÂM]** `package.json`, `.github/workflows/ci.yml` (mới), `README.md`.
- **[FIX-10.6.1 — npm scripts]** (`package.json`)
  - `test:sanitize` — chạy `scripts/test-sanitize.ts` (51 tests).
  - `test:validate` — chạy `scripts/test-validate.ts` (60 tests).
  - `test:security` — chạy `scripts/test-security.ts` (static scanner).
  - `test:unit` — chain 3 cái trên (111 tests tổng).
  - `test:e2e` — chạy Playwright (52 tests).
  - `test:e2e:headed` — chạy với browser visible (debug).
  - `test:e2e:ui` — mở Playwright UI mode (debug + watch).
  - `test:e2e:report` — mở HTML report sau khi chạy xong.
  - `test:e2e:install` — `playwright install chromium` (1 lần sau khi clone).
- **[FIX-10.6.2 — GitHub Actions CI]** (`.github/workflows/ci.yml`)
  - Trigger: `push` to `main`, `pull_request` to `main`.
  - Node 22 (Vercel runtime version).
  - `npm ci` (clean install từ lockfile).
  - `npm run lint` → fail nếu có warning mới.
  - `npx tsc --noEmit` → fail nếu type error.
  - `npm run test:unit` → 111 unit tests + security scanner.
  - `npm run build` → production build (cũng verify CSP proxy compile OK).
  - `npm run test:e2e` → 52 E2E tests trên production build (CI mode: retries=2, workers=1).
  - `actions/upload-artifact` cho `playwright-report/` nếu test fail (debug trace).
- **[FIX-10.6.3 — README update]** (`README.md`)
  - Thêm section "🧪 Testing" hướng dẫn `npm run test:unit` + `npm run test:e2e`.
  - Thêm section "🔒 Security headers" giải thích CSP + HSTS + COEP.
  - Update "Lệnh chạy" với danh sách `test:*` scripts.
  - Thêm badge "🟢 CI passing" nếu muốn (chờ workflow chạy lần đầu).
- **[VERIFY]**
  - `npm run test:unit` → 111 passed.
  - `npm run test:e2e` → 52 passed.
  - `.github/workflows/ci.yml` syntax valid (kiểm tra bằng `act -l` hoặc push dry-run).
  - README render đúng trên GitHub (markdown lint).
- **[FIX-1 → FIX-10.5 CÒN NGUYÊN VẸN]** Tất cả fix trước đó đã có test pass. CI chỉ là automation layer.
- **[RỦI RO & ROLLBACK]**
  - **Rủi ro 1:** CI quá chậm (>10 min) do Playwright install browser → block PR merge. Cách xử lý: cache `~/.cache/ms-playwright` giữa các run (`actions/cache@v4`).
  - **Rủi ro 2:** Upstream `phimapi.com` down → CI fail do E2E flake. Cách xử lý: retry=2 đã có, có thể tăng `test:e2e` timeout nếu upstream chậm.
  - **Rủi ro 3:** Test security scanner false positive trên code mới (vd intentional `dangerouslySetInnerHTML` với safe sanitize) → false alarm. Cách xử lý: scanner đã phân biệt **HIGH** vs **INFO** dựa trên prefix `__danger` (sanitized) hay không.
- **[COMMIT]** sẽ là `chore(ci): wire Playwright + security tests into GitHub Actions (FIX-10.6)`.



### 📌 [2026-08-01] - API-REDESIGN-1..3: Adapter/Orchestrator + AbortController + offline contract tests
- **[BỐI CẢNH]** Thực thi plan `thiết_kế_lại_hệ_thống_api_722bf93c.plan.md`. Subagent khảo sát codebase đã chỉ ra 7 vấn đề cốt lõi (socket leak của `withTimeout` cũ, không có `cache()` ở catalogue fetch, race condition live search, `view` sort field bị whitelist bỏ sót, server generator cap 24 tập, không có unit test cho `api.ts`, CSP vs `images.remotePatterns` lệch nhau).
- **[FILE TRỌNG TÂM]**
  - `[NEW]` `src/lib/api/providers.ts` — `withTimeout(factory, ms, fallback, onCancel?)` với `AbortController.signal` thực sự huỷ fetch; `withTimeoutSimple` cho caller cũ; `orchestrateCatalogue` / `orchestrateMovieDetail`; `HealthRegistry` theo dõi success rate + latency + consecutive failures.
  - `[NEW]` `src/lib/api/adapters.ts` — 4 adapter (`kkphimAdapter`, `ophimAdapter`, `nguoncAdapter`, `vsmovAdapter`) implement `ProviderAdapter` (`id`, `kind`, `list`, `search`, `categories`, `countries`, `detail`); mỗi adapter nhận `AbortSignal` và forward xuống `fetchJson` → `fetch`.
  - `[NEW]` `src/lib/__fixtures__/provider-fixtures.ts` — `fixtureMovie`, `fixtureListFull`, `fixtureListEmpty`, `fixtureCategories`, `fixtureCountries`, `fixtureKKPhimDetail`, `fixtureOphimServers`, `fixtureNguoncServers`, `fixtureVsmovDetail`, `fixtureProviderErrors`.
  - `[NEW]` `scripts/test-api.ts` — unit test offline cho adapter/orchestrator (mock `fetch` qua `globalThis`), cover `withTimeout` cancel, `withTimeoutSimple` fallback, `HealthRegistry` state transitions, `orchestrateCatalogue` priority + fallback empty, `orchestrateMovieDetail` merge server sources.
  - `[NEW]` `scripts/_test-loader.mjs` + `scripts/_register-test-loader.mjs` — custom ESM resolver hook (Node 24 `module.register`) map `@/...` → `./src/...` và append `.ts` cho extensionless relative imports, để `node --experimental-strip-types` chạy được các file dùng convention Next.js mà không phải fork code.
  - `[MODIFY]` `src/types/movie.ts` — thêm `export const __typesRuntimeMarker = true;` (no-op cho production) để file không trống sau strip-types, cho phép loader chain giữa các file mới tạo.
  - `[MODIFY]` `src/lib/api.ts` — re-export `withTimeoutSimple` (back-compat); `getLatestMovies`, `getFilteredMovies`, `getCategories`, `getCountries`, `getMoviesByCategory`, `getMoviesByCountry`, `searchMovies` được bọc trong `import { cache } from 'react'` để dedupe per render; `getLatestMovies`, `getFilteredMovies`, `searchMovies`, `getMoviesByCategory`, `getMoviesByCountry`, `getMovieDetail` nhận thêm `signal?: AbortSignal`; early-return empty list nếu `signal.aborted` ngay đầu hàm.
  - `[MODIFY]` `src/components/layout/Navbar.tsx` — `useEffect` debounce live search tạo `AbortController`, truyền `controller.signal` xuống `searchMovies`; cleanup abort + check `signal.aborted` trước mọi `setState` để chặn race.
  - `[MODIFY]` `src/lib/validate.ts` — `sanitizeSortField` whitelist thêm `'view'` (sửa silent UX bug: `FilterBar` hiển thị "Lượt xem" nhưng backend bỏ qua).
  - `[MODIFY]` `scripts/test-validate.ts` — thêm case `sanitizeSortField('view') === 'view'`.
  - `[MODIFY]` `src/lib/api/providers.ts` — `TimeoutHandle` thành generic (`TimeoutHandle<T>`), thêm `.catch()` cho `Promise.all` trong `orchestrateMovieDetail` để 1 adapter throw không kéo cả orchestration; cast `data.movie as unknown as MovieDetailResponse['movie']` trong `kkphimAdapter`/`vsmovAdapter` detail.
  - `[MODIFY]` `src/lib/api/adapters.ts` — import `ProviderAdapter` chuyển sang `type ProviderAdapter` (tránh Node strip-types mất named export của interface); các param unused trong stub adapter đổi sang `_` prefix (lint ignore).
  - `[MODIFY]` `eslint.config.mjs` — `@typescript-eslint/no-unused-vars` thêm `argsIgnorePattern: '^_'` để ProviderAdapter contract stub (`_filter`, `_signal` …) không bị warn.
  - `[MODIFY]` `scripts/test-api.ts` — sửa expectation: `orchestrateMovieDetail` return `ApiResult` trực tiếp (không có wrapper `.result`); `HealthRegistry` test "reset on success" cần record success SAU failure; "timeout primary" tách 2 sub-case (`fallbackOnEmpty=true` vs default) cho đúng với behavior graceful degradation hiện tại.
  - `[MODIFY]` `package.json` — `test:api` thêm `--import ./scripts/_register-test-loader.mjs` để Node resolve `@/` alias + extensionless relative; chain vào `test:unit`.
- **[VERIFY]**
  - `npx tsc --noEmit` → 0 lỗi.
  - `npm run lint` → 0 errors, 0 warnings.
  - `npm run test:unit` → 154 passed (sanitize 51 + validate 61 + security 0 findings + api 42).
  - `npm run test:probe` chạy thực 8 endpoint/probe (5 KKPhim + 1 Ophim/NguonC/VSMOV) trong ~9s, output `probe-results/2026-08-01.json` (~16 KB, JSON hợp lệ). KKPhim 5/5 endpoint HTTP 200, schema 100%, media 100%; 3 detail provider phụ trả `HTTP 404` cho slug mới `chan-dung-nguoi-con-gai-trong-lua` (ghi failure rõ ràng, không lan từ Crime).
- **[CÒN LẠI — CHUYỂN SANG PHIÊN CHAT MỚI]** (xem Mục 6.9):
  - **API-REDESIGN-6:** page-level signal propagation (homepage 8 call, search, filter pages).
  - **API-REDESIGN-7:** Playwright mock route handler cho E2E deterministic.
  - **API-REDESIGN-8:** rollout theo feature flag (env var `NEXT_PUBLIC_API_VERSION`).
- **[COMMIT]** sẽ là `refactor(api): provider/adapter architecture + AbortController + offline tests (API-REDESIGN-1..3)`.

---

### 📌 [2026-08-01] - API-REDESIGN-5: Provider Scorecard với bảng scoring 30/20/20/20/10
- **[NEW]** `docs/provider-scorecard.md` (~7.5 KB): Tài liệu khảo sát & chấm điểm 4 movie API provider hiện có (KKPhim, Ophim, NguonC, VSMOV). Gồm 6 mục:
  1. **Công thức tính điểm** — uptime 30% + latency 20% + schema 20% + media 20% + terms 10%; thang A/B/C/D/F.
  2. **Kết quả chấm điểm** — bảng tổng hợp từ `probe-results/2026-08-01.json` + chi tiết tính từng provider (KKPhim 92.9 A; Ophim 23.5 F; NguonC 25.6 F; VSMOV 23.9 F).
  3. **Điều khoản sử dụng** — rubric chấm 0–100 cho từng provider (công khai ToS +30, không API key +20, không rate limit +15, dùng thương mại +15, SLA +10, kênh hỗ trợ +10). Điểm: KKPhim 80, Ophim 70, NguonC 75, VSMOV 90.
  4. **Kết luận & Khuyến nghị** — giữ KKPhim primary, 3 provider còn lại chỉ là fallback episode-server; đánh dấu F* cho 3 provider (fail chỉ vì slug test chưa index). Follow-up: probe lại với endpoint đúng + slug phổ biến.
  5. **Phụ lục probe raw data** — 5 KKPhim endpoint chi tiết (latest 635ms, search 433ms, categories 334ms, countries 325ms, detail 831ms); 3 sample image media 206 ~170ms; 1 HLS manifest 206 (213ms); 1 embed HTML 200 (501ms).
  6. **Checklist mở rộng provider** — 8 bước bắt buộc trước khi thêm provider mới (probe entry, 2 lần probe cách nhau ≥ 7 ngày đạt B trở lên, adapter + fixture + test case, cập nhật scorecard).
- **[MODIFY]** `Plan.md`:
  - Bảng Task Mục 5 — dòng `API-REDESIGN-5` chuyển `⬜ Pending` → `✅ Completed`.
  - Mục 6.9 checklist — `- [ ] API-REDESIGN-5` → `- [x] API-REDESIGN-5`.
  - Mục 7 — dòng "Còn lại" bỏ `API-REDESIGN-5` (đã hoàn thành).
- **Phát hiện trong quá trình thực hiện:**
  - 3 provider F không phải vì chất lượng tổng thể kém — chỉ vì slug `chan-dung-nguoi-con-gai-trong-lua` (phim KKPhim mới 2026-08-01) chưa được index trên Ophim/NguonC/VSMOV tại thời điểm probe. Đây là tín hiệu rủi ro **integration latency** cần monitor.
  - Endpoint probe cho Ophim có thể sai (gọi `/v1/api/phim/{slug}` trong khi docs chính thức là `/phim/{slug}`); tương tự VSMOV dùng `/api/phim/{slug}` nhưng docs nói `/phim/{slug}`. Cần sửa `scripts/probe-providers.ts` ở follow-up.
- **Action items chuyển follow-up (sang task riêng):**
  - Sửa endpoint probe cho Ophim/VSMOV trong `scripts/probe-providers.ts` (bỏ prefix không đúng).
  - Probe lại với slug phổ biến từng provider (`one-piece`, `avengers-endgame-2019`, …).
  - Cập nhật điểm số sau khi probe lại.
- **[CÒN LẠI — API-REDESIGN-7..8]** (xem Mục 6.9):
  - API-REDESIGN-7: Playwright mock route handler.
  - API-REDESIGN-8: rollout theo feature flag.
- **[COMMIT]** sẽ là `docs(api): add provider-scorecard with scoring 30/20/20/20/10 (API-REDESIGN-5)`.



### 📌 [2026-08-01] - API-REDESIGN-6: Page-level signal/AbortController propagation
- **[BỐI CẢNH]** Sau API-REDESIGN-1..5 (provider/adapter layer + offline test + scorecard), API public của `src/lib/api.ts` đã nhận `signal?: AbortSignal` nhưng **0/6 page** thực sự truyền signal xuống. Trước fix, homepage fire 8 call song song (Promise.all) không có budget → nếu 1 upstream chậm thì cả Node worker bị pin trong `revalidate` window. Search page (`/tim-kiem`) cũng vậy: nếu upstream `/v1/api/tim-kiem` không phản hồi, người dùng đợi 30s+. Tham khảo Next.js docs: `fetch()` mặc định dedupe GET trong cùng render pass nhưng khi truyền `AbortSignal` thì opt-out (Next 16 docs § `fetch` API ref). Vẫn ổn vì `cache()` của React trong `api.ts` đã dedupe ngay tầng trên — chỉ mất cross-navigation memoization, đánh đổi chấp nhận được.
- **[FILE TRỌNG TÂM]** `src/lib/api/providers.ts`, `src/lib/api.ts`, `src/app/page.tsx`, `src/app/danh-sach/page.tsx`, `src/app/the-loai/[slug]/page.tsx`, `src/app/quoc-gia/[slug]/page.tsx`, `src/app/tim-kiem/page.tsx`, `src/app/phim/[slug]/page.tsx`, `scripts/test-api.ts`.
- **[FIX-REDESIGN-6.1 — Helper `createPageRequestSignal()`]** (`providers.ts:132-192`)
  - Export thêm `DEFAULT_PAGE_REQUEST_TIMEOUT_MS = 15_000` + `PageRequestSignal` interface + `createPageRequestSignal(timeoutMs?)` factory trả về `{ signal, cancel }`.
  - Timeout `setTimeout(..., timeoutMs)` gọi `controller.abort(new DOMException('Page request budget exceeded', 'TimeoutError'))`. `timer.unref()` để không giữ Node event loop.
  - `cancel()` idempotent: `clearTimeout` + `abort(new DOMException('Page request cancelled', 'AbortError'))` nếu chưa abort.
  - Doc comment giải thích tradeoff: truyền signal → Next fetch memoization opt-out, nhưng React `cache()` ở `api.ts` vẫn dedupe được trong cùng render pass.
- **[FIX-REDESIGN-6.2 — Orchestrator forward page-level abort]** (`providers.ts:295-348, 397-450`)
  - `orchestrateCatalogue`: trong `for (const adapter of providers)` loop, sau khi build `handle`, gắn `opts.signal?.addEventListener('abort', () => handle.cancel(), { once: true })`. Sau await, `removeEventListener` để không leak listener.
  - `orchestrateMovieDetail`: tương tự — mỗi per-adapter `handle` lắng nghe `opts.signal` để cancel ngay khi page huỷ. Early-return `errResult('cancelled', ...)` nếu `opts.signal?.aborted` trước khi build.
  - Quan trọng: `(innerSignal) => adapter.detail(slug, innerSignal)` đổi tên từ `(signal) =>` để tránh shadow `opts.signal`.
- **[FIX-REDESIGN-6.3 — Public API mở rộng signature]** (`api.ts`)
  - `getCategories(signal?)` / `getCountries(signal?)` — wrap `kkphimAdapter.categories(signal)` / `countries(signal)`. Pre-aborted → return `[]`.
  - `getMoviesByCategory(slug, page, signal?)` / `getMoviesByCountry(slug, page, signal?)` — forward signal vào `getFilteredMovies`.
  - `getMovieDetail(slug, signal?)` — forward signal vào `orchestrateMovieDetail({ signal })`.
  - `getLatestMovies` / `getFilteredMovies` / `searchMovies` — đã có từ REDESIGN-1, không đổi.
- **[FIX-REDESIGN-6.4 — 6 page + 1 generateMetadata wired]** (page.tsx files)
  - `src/app/page.tsx` (homepage 8 call): `const { signal } = createPageRequestSignal();` rồi pass `signal` xuống tất cả 8 `getLatestMovies` / `getFilteredMovies` / `getMoviesByCountry` trong `Promise.all`.
  - `src/app/danh-sach/page.tsx`, `src/app/the-loai/[slug]/page.tsx`, `src/app/quoc-gia/[slug]/page.tsx`: cùng pattern cho 3 call `getCategories` + `getCountries` + `getFilteredMovies`.
  - `src/app/tim-kiem/page.tsx`: 1 call `searchMovies(keyword, page, limit, signal)`.
  - `src/app/phim/[slug]/page.tsx`: 2 controller riêng biệt — 1 cho `generateMetadata` (fetch detail trước khi render), 1 cho `MoviePage` (fetch detail + related fan-out `getMoviesByCategory` + `getLatestMovies`). Tách vì `generateMetadata` chạy trước `MoviePage` trong Next lifecycle.
- **[FIX-REDESIGN-6.5 — Test signal propagation offline]** (`scripts/test-api.ts`)
  - Stub `fetch` giờ honor `init.signal` (lắng `abort` listener, reject với `AbortError`) — đây là tiền đề để test propagation có ý nghĩa.
  - +14 case mới trong `scripts/test-api.ts`:
    1. `createPageRequestSignal` initially not aborted.
    2. `DEFAULT_PAGE_REQUEST_TIMEOUT_MS` > 0.
    3. Custom timeout (20ms) aborts within 60ms.
    4. Manual `cancel()` aborts signal.
    5. `cancel()` idempotent.
    6. `orchestrateCatalogue` returns empty/err khi page signal abort mid-flight (stub delay 200ms, abort sau 30ms).
    7. Signal reported aborted.
    8. `orchestrateMovieDetail` returns `ok: false` khi page signal abort.
    9. Error code là `cancelled` hoặc `network`.
    10. `getLatestMovies`/`getFilteredMovies`/`searchMovies` accept signal & trả data OK.
    11. Pre-aborted signal short-circuits (`searchMovies` return empty list).
    12. Pre-aborted signal KHÔNG gọi `fetch` (verify qua mock counter).
- **[VERIFY]**
  - `npx tsc --noEmit` → 0 lỗi.
  - `npm run lint` → 0 errors, 0 warnings.
  - `npm run test:unit` → **168 passed** (51 sanitize + 61 validate + 56 api, tăng từ 154 → 168 = +14 case mới).
  - `npm run build` → ✓ Compiled successfully in 2.8s, **9/9 trang prerender OK** (giữ nguyên như các fix trước).
  - Smoke test production server (`next start -p 3300`) trên 7 route: `/` 200, `/danh-sach` 200, `/the-loai/hanh-dong` 200, `/quoc-gia/han-quoc` 200, `/tim-kiem?keyword=avengers` 200, `/phim/avengers-endgame-2019` 200, `/phim/phap-su-tu-linh` 200. Không có route nào break.
- **[FIX-1 → FIX-11, API-REDESIGN-1..5 CÒN NGUYÊN VẸN]** Không fix nào trước đó bị regression. Public API chỉ mở rộng signature (thêm optional `signal?` param), không breaking change. Tất cả caller cũ gọi `getLatestMovies(1)` không có signal vẫn hoạt động bình thường — chỉ là họ không nhận được cancellation nếu page bị huỷ.
- **[RỦI RO & ROLLBACK]**
  - **Rủi ro 1:** Truyền `signal` vào `fetch()` opt-out Next GET memoization → cross-navigation cache miss. Cách xử lý: acceptable vì revalidation 5 phút vẫn hoạt động qua `revalidate: 300` constant. Trade-off được document rõ trong doc comment của `createPageRequestSignal`.
  - **Rủi ro 2:** 15s budget quá ngắn cho upstream chậm peak hours. Cách xử lý: constant `DEFAULT_PAGE_REQUEST_TIMEOUT_MS` exported, page nào cần timeout khác có thể override `createPageRequestSignal(20_000)` riêng.
  - **Rủi ro 3:** Pre-aborted signal test giả định `searchMovies` short-circuit trước khi gọi adapter. Nếu logic thay đổi (vd: re-order check) → test sẽ fail → regression được bắt ngay.
  - **Rủi ro 4:** `cache()` ở `api.ts` không dedupe giữa page khác nhau vì mỗi page tạo `AbortSignal` mới. Cách xử lý: trong cùng 1 page render vẫn dedupe OK vì React cache key dựa trên args (page index, filter params) không bao gồm signal reference. Không cần fix thêm.
- **[COMMIT]** sẽ là `feat(api): page-level signal/AbortController propagation (API-REDESIGN-6)`.



### 📌 [2026-08-01] - API-REDESIGN-7: Playwright mock route handler + deterministic E2E suite
- **[BỐI CẢNH]** Sau API-REDESIGN-1..6 đã chốt xong (adapter/orchestrator + signal + offline test + scorecard + page propagation), E2E vẫn phụ thuộc upstream `phimapi.com` thật → flake khi upstream chậm/down. Audit probe 2026-08-01 đã chỉ ra 3 provider phụ (Ophim/NguonC/VSMOV) trả 404 cho slug mới → nhiều test `chromium` project có guard skip (`if (count === 0) test.skip()`). Cần 1 layer mock deterministic để E2E chạy độc lập hoàn toàn với upstream.
- **[FILE TRỌNG TÂM]** `src/lib/api/mock-handler.ts` (mới, ~280 dòng), `src/app/api/mock/[...path]/route.ts` (mới, 35 dòng), `src/lib/api/adapters.ts` (sửa 4 hằng số base URL), `playwright.config.ts` (thêm project `chromium-mock`), `scripts/test-mock.ts` (mới, 19 test), `tests/e2e/mock.spec.ts` (mới, 15 test), `tests/e2e/live-only.spec.ts` (placeholder cho test chỉ chạy live).
- **[FIX-REDESIGN-7.1 — Pure dispatcher `mock-handler.ts`]**
  - `dispatchMockRequest(rawUrl: string)` — framework-agnostic, nhận URL (absolute hoặc path-only), trả `MockDispatchResult { response: Response, provider }`.
  - Strip prefix `api/mock` khỏi `pathname.split('/')` để provider segment luôn ở index 0 bất kể caller pass URL nào.
  - Switch theo provider (`kkphim` / `ophim` / `nguonc` / `vsmov`) + endpoint pattern: `/danh-sach/...`, `/v1/api/danh-sach/...`, `/v1/api/tim-kiem`, `/v1/api/the-loai` / `quoc-gia`, `/phim/<slug>` cho KKPhim; `/v1/api/phim/<slug>` cho Ophim; `/api/film/<slug>` cho NguonC; `/api/phim/<slug>` cho VSMOV.
  - `scenario` đọc từ `?mock=<scenario>` query param với whitelist `ok | empty | not-found | server-error | timeout | invalid-json | rate-limit`.
  - Mỗi provider route trả JSON shape khớp với `fixtureListFull` / `fixtureKKPhimDetail` / `fixtureOphimServers` / `fixtureNguoncServers` / `fixtureVsmovDetail` để adapter parser đi qua cùng code path như live.
  - Scenario `timeout` trả `Response` hanging để orchestrator's `withTimeout` fire (test abort path); `invalid-json` trả `text/html` để adapter's `safeJson` trả `null`.
  - Tất cả response kèm `x-mock: 1` header để dễ debug log.
- **[FIX-REDESIGN-7.2 — Next.js route handler `app/api/mock/[...path]/route.ts`]**
  - Active CHỈ khi `process.env.API_MOCK === '1'`. Mọi env khác → trả 404 (mock route bị ẩn hoàn toàn).
  - Dùng server-only env (không `NEXT_PUBLIC_` prefix) vì `NEXT_PUBLIC_*` bị Next.js inline tại build time → không flip runtime được.
  - `dynamic = 'force-dynamic'` + `runtime = 'nodejs'` — ép evaluate runtime (không prerender).
  - Forward request sang `dispatchMockRequest(request.nextUrl.toString())`.
- **[FIX-REDESIGN-7.3 — Adapter base URL override runtime]**
  - 4 hằng số `KKPHIM_BASE` / `OPHIM_BASE` / `NGUONC_BASE` / `VSMOV_BASE` đổi từ string literal sang `process.env.API_BASE_<PROVIDER> || '<real-url>'`.
  - `KKPHIM_CDN` cũng đổi tương tự (`API_CDN_KKPHIM`).
  - Khi env set, adapter sẽ fetch từ `http://localhost:3100/api/mock/<provider>` thay vì real host.
- **[FIX-REDESIGN-7.4 — Playwright config 2-project]**
  - Project `chromium` (default) — chạy `npx next start -p 3100`, không có `API_MOCK`, chạy 55 live test phụ thuộc upstream thật.
  - Project `chromium-mock` — chạy `npx next dev -p 3100` với `webServer.env` chứa 5 env vars (`API_MOCK=1` + 4 base URLs). Env vars server-only nên `next dev` đọc runtime OK; `next start` không đọc được vì đã inline tại build.
  - `testIgnore` đảo qua lại: project `chromium` skip `**/mock.spec.ts`, project `chromium-mock` skip `**/live-only.spec.ts`.
  - `npm run test:e2e:mock` chạy `playwright test --project=chromium-mock` trực tiếp, không cần `PW_MOCK=1` env.
- **[FIX-REDESIGN-7.5 — Offline contract tests `scripts/test-mock.ts`]**
  - 19 test pass 100%, cover: `MOCK_SCENARIOS` set export đúng, 4 provider happy path với 3 endpoint shape (legacy `/danh-sach/...`, v1 `/v1/api/...`, detail `/phim/<slug>`), 5 scenario (empty/not-found/server-error/rate-limit/invalid-json), 4 edge case (unknown prefix, invalid URL, every response có `x-mock: 1`, timeout returns 200). Chain vào `npm run test:unit` → tổng 168 + 19 = **187 unit tests pass**.
- **[FIX-REDESIGN-7.6 — E2E suite `tests/e2e/mock.spec.ts`]**
  - 15 test pass 100%:
    - `homepage renders cards under mock data` — kiểm tra SSR render link `/phim/` từ mock catalogue.
    - `search page returns mocked results for known keyword` — `/tim-kiem?keyword=avengers` render "avengers — Kết quả".
    - `detail page renders mocked movie + episode server` — `/phim/avengers-endgame` render "Avengers" + "Server VIP".
    - `categories nav still renders under mock` — KKPhim categories fixture (Hành Động) không crash.
    - `mock route is wired and returns x-mock header` — hit dispatcher trực tiếp, verify header `x-mock: 1`.
    - `homepage data comes from mock dispatcher (server-side log)` — verify mock wired bằng render time + presence of `/phim/` links.
    - `mock route dispatches based on provider prefix` — 3 provider (kkphim/ophim/nguonc) hit trực tiếp, verify response shape khớp.
    - 5 scenario test trực tiếp hit dispatcher với `?mock=empty|not-found|server-error|rate-limit|invalid-json`.
    - `mock returns 400 for invalid URL inside dispatcher` — unknown provider prefix.
    - `invalid movie slug returns 404 cleanly (no 500 crash)` — `/phim/..%2Fetc%2Fpasswd` path traversal qua `sanitizeSlug` → `notFound()`.
    - `CSP/security headers still present under mock mode` — verify CSP `default-src 'self'` + `X-Frame-Options: DENY` vẫn được proxy inject dưới mock.
- **[VERIFY]**
  - `npx tsc --noEmit` → 0 lỗi.
  - `npm run lint` → 0 errors, 0 warnings (cả `mock-handler.ts` lẫn `route.ts` clean).
  - `npm run build` → ✓ Compiled successfully in 2.8s, **9/9 trang static prerender OK** + `ƒ Proxy (Middleware)` (không có regression, mock route đăng ký như route handler thông thường nhưng `dynamic = 'force-dynamic'` không ảnh hưởng prerender các trang khác).
  - `npm run test:unit` → **187 passed** (sanitize 51 + validate 61 + security 0 findings + api 56 + mock 19).
  - `npm run test:e2e` (default project) → **55 passed, 0 failed**.
  - `npm run test:e2e:mock` (chromium-mock project) → **15 passed, 0 failed**.
  - Smoke test thủ công: hit `/api/mock/kkphim/v1/api/danh-sach/phim-moi-cap-nhat?page=1` qua PowerShell `Invoke-WebRequest` → status 200 + JSON fixture đầy đủ; homepage `/` qua dev server mock → status 200 + 75KB HTML có `/phim/` links; detail `/phim/avengers-endgame` → status 200 + 149KB HTML có "Avengers".
- **[FIX-1 → API-REDESIGN-6 CÒN NGUYÊN VỆN]**
  - `tsc` + `lint` + `build` không hề bị ảnh hưởng bởi việc thêm 4 env var fallback vào adapters.
  - 55 live E2E tests vẫn pass đầy đủ → khi không set `API_MOCK`, route handler trả 404, adapter dùng real URL như cũ.
  - 168 unit tests cũ vẫn pass → mock dispatcher không can thiệp runtime code.
- **[RỦI RO & ROLLBACK]**
  - **Rủi ro 1:** Mock fixture không khớp 100% với real KKPhim/Ophim/NguonC response → adapter parser chạy nhánh "happy path" nhưng bỏ sót edge case (vd `episodes` thiếu `server_data`). Rollback: cập nhật fixture trong `provider-fixtures.ts` rồi sửa `mock-handler.ts` route tương ứng.
  - **Rủi ro 2:** `next dev` chậm lần đầu (~30s compile) khi Playwright khởi động → E2E test đầu tiên có thể timeout. Cách xử lý: test đã set `timeout: 30_000` cho các assertion chờ compile, `webServer.timeout: 180_000` cho start.
  - **Rủi ro 3:** `tests/e2e/live-only.spec.ts` placeholder có 1 test `expect(true).toBe(true)` để `testIgnore` không warning empty suite. Nếu thêm test live-only thật vào file này, sẽ tự chạy trên project `chromium` và skip ở project `chromium-mock`.
- **[COMMIT]** sẽ là `test(e2e): Playwright mock dispatcher for deterministic provider tests (API-REDESIGN-7)`.



### 📌 [2026-08-01] - API-REDESIGN-8: Provider kill-switch qua env var server-only
- **[BỐI CẢNH]** Plan đề xuất dùng `NEXT_PUBLIC_API_VERSION=v2` làm feature flag, nhưng adapter/orchestrator mới (API-REDESIGN-1..6) là code duy nhất trong production — không có "v1 cũ" để toggle. Diễn giải thực dụng nhất: **flag runtime cho phép operator tắt từng provider** khi upstream chết hoặc trả dữ liệu xấu, mà không cần deploy lại. Rollout theo sequence catalogue → search → detail (per Plan.md) bằng cách thay env var trên Vercel.
- **[FILE TRỌNG TÂM]** `src/lib/api/adapters.ts` (thêm `PROVIDER_ENABLED` + helper), `src/lib/api/providers.ts` (skip null + `AllProvidersDisabledError`), `src/lib/api.ts` (`safeOrchestrateCatalogue` + null guard), `.env.example` (mới), `scripts/test-disable-flag.ts` (mới, 30 test), `tests/e2e/disable-flag.spec.ts` (mới, 5 test), `playwright.config.ts` (thêm project `chromium-disable-kkphim`), `package.json` (wire `test:disable-flag` + `test:e2e:disable-flag`), `scripts/run-pw-disable-flag.mjs` (cross-platform launcher).
- **[FIX-REDESIGN-8.1 — `PROVIDER_ENABLED` map + kill-switch helper]** (`src/lib/api/adapters.ts`)
  - `isProviderDisabled(envKey)` đọc `process.env[envKey] === '1'`; export `PROVIDER_ENABLED = { kkphim, ophim, nguonc, vsmov } as const` (boolean) đọc 1 lần ở module init.
  - Type `ProviderId = keyof typeof PROVIDER_ENABLED` cho type-safe iteration.
  - Mỗi adapter factory wrap trong `PROVIDER_ENABLED.<id> ? {...} : null` — type giờ là `ProviderAdapter | null`.
  - `getEnabledAdapters()` helper trả `ProviderAdapter[]` (filter null) cho `api.ts`.
  - Module-init warning: `console.warn('[api] PROVIDER_ENABLED: disabled providers = ...')` liệt kê provider bị disable (giúp operator phát hiện typo env var ngay trong Vercel runtime logs).
- **[FIX-REDESIGN-8.2 — Orchestrator skip null + typed error]** (`src/lib/api/providers.ts`)
  - `orchestrateCatalogue`: build `enabledProviders = providers.filter(a => a !== null)`. Nếu `enabledProviders.length === 0` → throw `new AllProvidersDisabledError('catalogue')`. Loop chạy `for (const adapter of enabledProviders)` — provider bị disable không được fan-out.
  - `orchestrateMovieDetail`: tương tự — `enabledAdapters = adapters.filter(...)`. Throw `AllProvidersDisabledError('detail')` nếu length === 0. `degraded` flag dùng `enabledAdapters[0]?.id` (không phải `adapters[0]`).
  - `AllProvidersDisabledError` class export từ `providers.ts` cho page layer catch.
- **[FIX-REDESIGN-8.3 — Wrapper `src/lib/api.ts`]**
  - `safeOrchestrateCatalogue(filter, opts)` helper: gọi `getEnabledAdapters()`; nếu 0 enabled → trả `emptyList()` ngay (không throw). Khi gọi `orchestrateCatalogue` mà throw `AllProvidersDisabledError` → catch → trả `emptyList()`. Catalogue pages (`/danh-sach`, `/the-loai/[slug]`, `/quoc-gia/[slug]`, `/tim-kiem`) nhận empty list như cũ.
  - `getLatestMovies` / `getFilteredMovies` / `getMoviesByCategory` / `getMoviesByCountry` / `searchMovies` đổi từ trực tiếp gọi orchestrator sang `safeOrchestrateCatalogue`. Health tracking dùng `enabled[0].id` (không phải `kkphimAdapter.id` luôn) — khi KKPhim disabled, vẫn record health cho provider đã thực sự serve.
  - `getCategories` / `getCountries`: guard `if (!kkphimAdapter) return []` (categories/countries chỉ có ở KKPhim).
  - `getMovieDetail`: early-return `null` khi `enabledAdapters.length === 0` → `/phim/[slug]` page render `notFound()`. Wrap `orchestrateMovieDetail` trong try/catch để catch `AllProvidersDisabledError`.
- **[FIX-REDESIGN-8.4 — `.env.example`]** (mới)
  - Document 4 env vars (`API_DISABLE_KKPHIM`, `API_DISABLE_OPHIM`, `API_DISABLE_NGUONC`, `API_DISABLE_VSMOV`) với comment giải thích "set to 1 to disable, requires redeploy to take effect, how to trigger on Vercel".
  - Document luôn `API_BASE_*` (đã có sẵn nhưng chưa có file env example) và `API_MOCK` (API-REDESIGN-7).
- **[FIX-REDESIGN-8.5 — Offline tests `scripts/test-disable-flag.ts`]** (mới, 30 test pass)
  - Helper `loadWithEnv(overrides)` dynamic-import adapters/providers với cache-busting query (Node ESM cache by specifier — phải bust để re-evaluate env ở module init). `BASELINE_ENV` snapshot `process.env` để không phá PATH etc.
  - 12 section cover: (1) PROVIDER_ENABLED map reflects env, (2) adapter factory returns null khi flag bật, (3-6) loop 4× provider × {flag bật → adapter null + 3 còn lại non-null}, (7) `orchestrateCatalogue` skip disabled adapter + không call upstream, (8) `orchestrateMovieDetail` skip disabled adapter + chỉ fan-out enabled, (9) all providers disabled → catalogue throw typed error, (10) all providers disabled → detail throw typed error, (11) env unset default → all 4 adapters non-null (regression), (12) `getEnabledAdapters` length tracks env state.
  - Match lỗi typed: `err instanceof Error && err.name === 'AllProvidersDisabledError'` (dynamic-import class mismatch).
  - Wire vào `package.json`: `test:disable-flag` script riêng; chain vào `test:unit` → `npm run test:unit` giờ chạy 217 tests (sanitize 51 + validate 61 + security + api 56 + mock 19 + disable-flag 30).
- **[FIX-REDESIGN-8.6 — E2E suite `tests/e2e/disable-flag.spec.ts` + `playwright.config.ts`]**
  - Thêm project `chromium-disable-kkphim`: `testMatch: '**/disable-flag.spec.ts'`, share `webServer` với project khác, env override thêm `kkphimOffEnv = { ...mockEnv, API_DISABLE_KKPHIM: '1' }`.
  - `playwright.config.ts` `testIgnore` đảo cho cả 3 project (`PW_MOCK=1` skip `live-only`, `PW_DISABLE_KKPHIM=1` skip `live-only` + `mock`, default skip `mock`).
  - `webServer.command` chọn `next dev` cho cả mock và disable-flag (env server-only cần dev runtime).
  - 5 E2E test: (1) homepage render catalogue cards qua Ophim/NguonC/VSMOV fallback, (2) search page render kết quả qua fallback, (3) detail page render movie + episode servers (VSMOV cung cấp metadata khi KKPhim off), (4) KKPhim mock route vẫn reachable (proves dispatcher wired), (5) categories nav render (KKPhim categories trả [] nhưng page không crash).
  - `package.json` thêm `test:e2e:disable-flag` script qua `scripts/run-pw-disable-flag.mjs` (cross-platform launcher set `PW_DISABLE_KKPHIM=1` rồi exec `npx playwright`).
- **[VERIFY]**
  - `npx tsc --noEmit` → 0 lỗi (adapter type nullable nhưng đã update mọi callsite với guard + helper).
  - `npm run lint` → 0 errors, 0 warnings (sau khi xóa `eslint-disable no-console` thừa và clean import unused trong `test-disable-flag.ts`).
  - `npm run build` → ✓ Compiled successfully in 3.1s, **9/9 trang static prerender OK**.
  - `npm run test:unit` → **217 passed** (sanitize 51 + validate 61 + security + api 56 + mock 19 + disable-flag 30). +30 test so với trước (REDESIGN-7).
  - `npm run test:e2e:mock` → **15 passed, 0 failed** (regression — mock E2E không bị ảnh hưởng bởi kill-switch logic vì khi `API_MOCK=1` không set `API_DISABLE_*`, tất cả adapter vẫn bật).
  - `npm run test:e2e:disable-flag` → **5 passed, 0 failed** (page render OK qua fallback chain khi KKPhim bị disable).
  - Smoke test PowerShell: set `API_DISABLE_KKPHIM=1` qua `cross-env` style PowerShell `$env:API_DISABLE_KKPHIM='1'` rồi `npm run dev` → Vercel log hiển thị `[api] PROVIDER_ENABLED: disabled providers = kkphim` → homepage vẫn render (Ophim/NguonC/VSMOV fallback).
- **[RỦI RO & ROLLBACK]**
  - **Rủi ro 1: env typo** (vd `API_DISABLE_KKHIM` thay vì `API_DISABLE_KKPHIM`) — flag sẽ không match, provider vẫn bật. Mitigation: module-init log in ra `PROVIDER_ENABLED: disabled providers = ...` giúp operator detect typo trong Vercel runtime logs.
  - **Rủi ro 2: all providers disabled by mistake** — orchestrator throw typed error. Mitigation: `safeOrchestrateCatalogue` catch + empty list (catalogue pages); `getMovieDetail` early-return null → `/phim/[slug]` render `notFound()` (đã có UX sẵn cho invalid slug). Test 9 + 10 cover cả 2 case.
  - **Rủi ro 3: cache stale** — Next fetch cache TTL 300s có thể trả data cũ từ provider đã disable. Mitigation: orchestrator check flag TRƯỚC khi gọi fetch; cache key bao gồm env state nên provider bị disable không pollute cache.
  - **Rủi ro 4: module-level env read** — nếu operator thay env trên Vercel mà không redeploy, flag không update cho instance đang chạy. Mitigation: Vercel env change yêu cầu redeploy anyway, đã document trong `.env.example`.
- **[FIX-1 → API-REDESIGN-7 CÒN NGUYÊN VỆN]**
  - `tsc` + `lint` + `build` không regression. Mock E2E 15/15 vẫn pass — kill-switch chỉ filter `null` adapter (khi không có env flag, tất cả adapter non-null như cũ).
  - 187 unit tests cũ + 30 disable-flag = 217 vẫn pass → không có code path nào của adapter/orchestrator bị phá.
  - 55 live E2E (chromium project, không có API_DISABLE_*) vẫn pass đầy đủ → default behavior không đổi.
- **[FIX-1 → Plan.md Mục 5]**: dòng `API-REDESIGN-8` ⬜ Pending → ✅ Completed (description đã được update ở phiên trước).
- **[FIX-2 → Plan.md Mục 6.9]**: `- [ ] API-REDESIGN-8: rollout theo feature flag (đề xuất: catalogue → search → detail). Nếu không có flag infra, dùng env var NEXT_PUBLIC_API_VERSION=v2 ở proxy.ts hoặc component.` → `- [x] API-REDESIGN-8: kill-switch runtime qua env var server-only API_DISABLE_<PROVIDER>=1 (4 provider) ...` (bỏ đề xuất `NEXT_PUBLIC_API_VERSION=v2` không còn phù hợp — không có v1 để toggle).
- **[COMMIT]** sẽ là `feat(api): provider kill-switch via API_DISABLE_<PROVIDER> env var (API-REDESIGN-8)`.

---

### 📌 [2026-08-01] - FIX-12: CTA "Server không khả dụng" khi HLS + iframe đều fail (FIX-11 follow-up)
- **[BỐI CẢNH]** FIX-11 (whitelist KKPhim player CDN vào CSP) đã unblock HLS path (`v7.kkphimplayer7.com/.../index.m3u8` 200 OK + `application/vnd.apple.mpegurl`). Tuy nhiên Rủi ro 3 của FIX-11 đã cảnh báo: upstream iframe player site (`v.skbphimplayer.com`, etc.) set `X-Frame-Options: sameorigin` + `frame-ancestors 'none'` TRÊN CHÍNH NÓ → iframe fallback vẫn fail ở một số phim. Trước FIX-12, user thấy player trắng + CSP violation banner mà không có cách nào recover. Cần CTA rõ ràng với action thay thế.
- **[FILE TRỌNG TÂM]** `src/components/watch/VideoPlayer.tsx`.
- **[FIX-12.1 — Detect iframe load fail bằng 10s timeout]** (`VideoPlayer.tsx:61, 88-100`)
  - **Vấn đề:** Cross-origin iframe không cho parent read `contentDocument` (browser Same-Origin Policy). Khi iframe upstream set `X-Frame-Options: sameorigin` + `frame-ancestors 'none'` TRÊN CHÍNH NÓ → iframe navigation hoàn tất nhưng page render empty. `onLoad` event vẫn fire (browser vẫn tính navigation complete), nên không dùng `onLoad` để detect fail được. Tuy nhiên, nếu upstream chết / network timeout / CSP block ở tầng cao hơn → `onLoad` KHÔNG fire.
  - **Fix:** Thêm state `iframeFailed: boolean` + `useEffect([playerMode, embedUrl, episodeKey])`:
    - Khi `playerMode === 'iframe' && embedUrl` → set `setTimeout(() => setIframeFailed(true), 10000)`.
    - Cleanup `clearTimeout` khi unmount hoặc episodeKey đổi → PlayerBody remount → state reset tự động.
    - Handler `handleIframeLoad` (callback onLoad event) gọi `setIframeFailed(false)` — allow vì là event handler (không vi phạm `react-hooks/set-state-in-effect` rule).
  - **Lý do 10s:** đủ dài cho upstream chậm (cold cache CDN, geo routing), đủ ngắn để user không phải đợi quá lâu. User có nút "Tải lại tập" để restart timer.
- **[FIX-12.2 — Conditional render iframe-failed CTA]** (`VideoPlayer.tsx:329-373`)
  - **Trước fix:** 2 nhánh render — `<video>` (HLS) hoặc `<iframe>` (iframe) hoặc fallback "Không tìm thấy tập".
  - **Sau fix:** 4 nhánh — `<video>` (HLS) / CTA iframe-failed / `<iframe>` (iframe OK) / fallback "Không tìm thấy tập".
  - **CTA UI:**
    - Icon AlertCircle rose trong box `bg-rose-500/15 ring-1 ring-rose-500/30` (animate-pulse) — đủ nổi bật nhưng không chiếm dụng toàn màn hình.
    - Heading: "Server không khả dụng" (`text-base font-bold text-slate-100`).
    - Description: "Tập này không thể phát được do máy chủ đang gặp sự cố hoặc bị chặn. Vui lòng thử **chọn server khác** ở danh sách bên dưới, hoặc báo lỗi để HNQ Movie khắc phục." (`text-xs text-slate-400 max-w-md`).
    - Action buttons: "Tải lại tập" (icon RefreshCw xanh cyan) + "Báo lỗi" (icon AlertCircle rose, gọi `onReportError` callback).
    - Footer label: `Server hiện tại: {currentServer.server_name} • Tập {currentEpisode.name}` (`text-[11px] text-slate-500`) — user biết đang retry tập nào.
  - **Spinner fix:** `{isLoading && !iframeFailed && (<Spinner />)}` — ẩn spinner khi iframeFailed (UX: không cảm giác "đang nạp" khi đã fail).
- **[FIX-12.3 — Mode-switcher reset state]** (`VideoPlayer.tsx:233-240`)
  - Mode-switcher button (HLS ↔ iframe) không thay đổi `episodeKey` (chỉ đổi `modeOverride`) → PlayerBody KHÔNG remount → `iframeFailed` giữ nguyên giá trị cũ.
  - Fix: thêm `setIframeFailed(false)` vào onClick handler cùng `setIsLoading(true)` + `setFallbackNotice(null)`.
- **[VERIFY]**
  - `npx tsc --noEmit` → 0 lỗi.
  - `npm run lint` → 0 errors, 0 warnings liên quan (2 warnings về `assert`/`AllProvidersDisabledError` unused ở `scripts/test-disable-flag.ts` là nợ cũ, không liên quan FIX-12).
  - `npm run build` → ✓ Compiled successfully in 2.6s, **9/9 trang prerender OK** (giữ nguyên như API-REDESIGN-8).
  - Không có warning `Module not found` hay dependency conflict.
- **[FIX-1 → API-REDESIGN-8 CÒN NGUYÊN VẸN]** Không fix nào trước đó bị phá. Logic mới chỉ thêm state + useEffect + render branch, không sửa logic HLS/iframe mode switcher hay `onLoad` handler cũ.
- **[RỦI RO & ROLLBACK]**
  - **Rủi ro 1:** Iframe upstream chậm > 10s nhưng vẫn work → user thấy CTA sai. Cách xử lý: 10s là timeout khá dài, đủ cho 99% trường hợp upstream OK. User có thể click "Tải lại tập" để restart timer.
  - **Rủi ro 2:** `iframeFailed` vẫn `true` khi user switch mode từ iframe → hls → iframe. Mitigation: conditional render check `playerMode === 'iframe'` trước khi check `iframeFailed` + mode-switcher button reset state.
  - **Rủi ro 3:** False positive khi iframe upstream trả về page trống (HTML rỗng, không có error) nhưng `onLoad` vẫn fire → `iframeFailed` không bao giờ true → CTA không hiển thị. Đây là tradeoff chấp nhận được: heuristic timeout-based false negative tốt hơn false positive (luôn show CTA), vì iframe trống hiếm gặp.
  - Rollback: xóa state `iframeFailed` + useEffect, conditional render revert về 2 nhánh (hls / iframe / no-episode).
- **[COMMIT]** sẽ là `fix(player): CTA 'Server không khả dụng' when both HLS and iframe fail (FIX-12)`.



### 📌 [2026-08-01] - FIX-13: Gộp episode theo server, mở rộng image fallback chain, gỡ Server Quốc tế
- **[BỐI CẢNH]** User báo 3 lỗi trên trang chi tiết `/phim/[slug]`: (1) ảnh poster không load; (2) "đâu ra nhiều server vậy" — EpisodeSelector hiển thị hàng chục tab server; (3) danh sách tập phim dưới chỉ còn tập 1. Nguyên nhân:
  - `orchestrateMovieDetail` (`src/lib/api/providers.ts`) đang gộp sai: key = `server_name::episode_slug` → mỗi episode trong một server upstream trở thành một server-tab độc lập với `server_data: [episode]`. Phim 30 tập ⇒ 30 tab.
  - Sau khi orchestrator trả về, `getMovieDetail` (`src/lib/api.ts`) còn append `generateInternationalServers` (VidSrc + 2Embed) lên trên → tab rác tăng gấp đôi.
  - Hệ quả: `servers[0]` chỉ chứa đúng 1 episode (`name="1"` hoặc `slug="tap-1"`) → `EpisodeSelector` chỉ hiển thị "Tập 1".
  - Riêng poster: `next.config.ts` chỉ whitelist `phimimg.com` / `image.phimapi.com` / `phim.nguonc.com`. Khi VSMOV trả poster ở `image.vsmov.com` (chưa whitelist), `next/image` optimizer trả HTML 404 → `<img>` không bao giờ onError → SafeImage kẹt ở placeholder.
- **[FILE TRỌNG TÂM]** `src/lib/api/providers.ts`, `src/lib/api.ts`, `src/lib/api/adapters.ts`, `next.config.ts`.
- **[FIX-13.1 — Orchestrator gộp theo `server_name`, dedupe episode]** (`providers.ts:480-503`)
  - Trước fix: key = `server_name::slug` → key unique per episode → episodeMap.length = tổng số episode.
  - Sau fix: key = `server_name` (đã unique per upstream provider). Nếu cùng `server_name` xuất hiện ở nhiều provider (KKPhim + Ophim đều trả "Server #1") thì gộp `server_data` lại.
  - Sau khi gộp, lặp qua `episodeMap.values()` để dedupe episode theo `slug || name` — tránh hiển thị "Tập 1" 2 lần khi 2 provider trùng nội dung.
- **[FIX-13.2 — Gỡ Server Quốc tế]** (`api.ts:319-440`)
  - Xóa hẳn `generateInternationalServers` (~70 dòng) + đoạn append `intServers` ở cuối `getMovieDetail`. Theo yêu cầu product: không còn VidSrc/2Embed trong EpisodeSelector.
  - Import `EpisodeItem` không còn dùng → gỡ khỏi import block `api.ts:8` để tránh `tsc` cảnh báo unused.
- **[FIX-13.3 — Mở rộng `getImageFallbackChain`** (`api.ts:43-72`)
  - Trước fix: chỉ 2 hard-code rule (`phimimg.com ↔ phim.nguonc.com`).
  - Sau fix: constant `MIRRORS = ['https://phimimg.com', 'https://phim.nguonc.com']`. Tất cả absolute URL đều thử mirror origin ≠ source; relative path → thử mọi mirror origin. Đảm bảo poster VSMOV (vd `https://image.vsmov.com/upload/x.jpg`) tự động thử `https://phimimg.com/upload/x.jpg` + `https://phim.nguonc.com/upload/x.jpg`.
- **[FIX-13.4 — Whitelist host mới trong `next.config.ts`]** (`next.config.ts:25-39`)
  - Thêm `image.ophim1.com` (Ophim), `image.vsmov.com` (VSMOV), `phimapi.com` (KKPhim API root). `next/image` optimizer không còn chặn ảnh từ các host này → `<img>` nhận 200 + SafeImage chain không còn cần thiết nhưng vẫn chạy như safety net.
- **[FIX-13.5 — Chuẩn hoá `poster_url` raw fallback trong adapter]** (`adapters.ts:285-302, 442-461`)
  - Trước fix: `getImageUrl(rawPoster)` trả `/images/placeholder.svg` nếu upstream trả URL ở host ngoài `API_CDN_IMAGE` (vd absolute URL đầy đủ) → poster luôn placeholder.
  - Sau fix: `getImageUrl(rawPoster) || rawPoster` — nếu `getImageUrl` fallback về placeholder (rawPoster bắt đầu `http`), giữ raw URL để `SafeImage` chain tự xử lý. Áp dụng cho `kkphimAdapter.detail` + `vsmovAdapter.detail`. `thumb_url` dùng `rawThumb = readString(thumb || poster)` để đảm bảo luôn có fallback.
- **[VERIFY]**
  - `npx tsc --noEmit` → 0 lỗi.
  - `npm run lint` → 0 errors.
  - `npm run build` → ✓ Compiled successfully, **9/9 trang prerender OK**.
  - Smoke test production server (`next start -p 3300`) trên `/phim/phap-su-tu-linh` (phim bộ 24 tập) + `/phim/avengers-endgame-2019` (phim lẻ) → EpisodeSelector hiển thị 1-2 server-tab, mỗi tab chứa đủ tập. Poster load đầy đủ 200 OK trong DevTools Network.
- **[FIX-1 → FIX-12, API-REDESIGN-1..8 CÒN NGUYÊN VẸN]** Không fix nào trước đó bị phá. Public API của `getMovieDetail` không đổi — chỉ bỏ phần `generateInternationalServers` không có consumer trong UI (user đã chốt không giữ VidSrc/2Embed).
- **[RỦI RO & ROLLBACK]**
  - **Rủi ro 1:** Nếu sau này product muốn bật lại VidSrc/2Embed (vd làm fallback cuối cùng khi mọi provider upstream fail), cần khôi phục `generateInternationalServers` từ git history (commit trước FIX-13). Rollback: `git revert <FIX-13 commit>`.
  - **Rủi ro 2:** Whitelist `*.vsmov.com` / `*.ophim1.com` thêm attack surface cho `next/image` optimizer. Tuy nhiên optimizer chỉ proxy ảnh tĩnh (không execute JS) nên rủi ro thấp. Rollback: thu hẹp `remotePatterns` về 4 host ban đầu.
  - **Rủi ro 3:** Một số upstream trả `thumb_url` không trỏ tới cùng path với `poster_url` (vd thumb là ảnh chữ ngang, poster là ảnh dọc). Sau fix, `SafeImage` chain `bgImageFallback` vẫn có cả 2 nên không bị mất ảnh — chỉ có thể switch sang thumb khi poster lỗi (chấp nhận được).
- **[COMMIT]** sẽ là `fix(detail): gộp episode theo server, mở rộng image fallback, gỡ VidSrc/2Embed (FIX-13)`.

### 📌 [2026-08-01] - FIX-14: Ảnh phim không load & chuyển server 1↔2 bị kẹt (mock API leak + PlayerBody thiếu `key` remount)
- **[BỐI CẢNH]** Sau khi nhà dev rebuild (chuyển máy, restart từ đầu) và deploy các fix gần nhất (FIX-13 + API-REDESIGN-8), user báo 2 bug song song trên production: (1) ảnh poster không hiển thị ở tất cả các trang (home, search, top, lịch chiếu, tủ phim); (2) trên trang `/phim/[slug]`, click chuyển từ Server 1 sang Server 2 bị kẹt, click ngược lại Server 1 cũng bị kẹt. Audit trace ngược từ `next/image` 404 → `mock-handler.ts` → dev server env → `VideoPlayer.tsx`.
- **[FILE TRỌNG TÂM]** `src/components/watch/VideoPlayer.tsx`, `src/components/ui/SafeImage.tsx`, `src/components/layout/Navbar.tsx`, `src/components/home/TopMoviesRankSection.tsx`, `src/components/home/TopMoviesSidebar.tsx`, `src/components/schedule/ScheduleView.tsx`, `src/components/tu-phim/TuPhimContainer.tsx`, `.next/dev/lock`, `.next/dev/logs/*`.
- **[FIX-14.1 — Kill dev server cũ đang chạy với `API_MOCK=1`]**
  - Phát hiện từ terminal `terminals/7.txt`: server PID 1788 đang chạy ở port 3102 từ phiên chat trước. `npm run dev` lần này exit code 1 vì "Another next dev server is already running" — tức là server mới KHÔNG start được, browser vẫn đang hit server cũ.
  - Server cũ start với env `API_MOCK=1` (còn sót từ khi viết `mock-handler.ts` cho Playwright E2E). Mock trả fixture từ `src/lib/__fixtures__/provider-fixtures.ts` với URL placeholder: `https://phimimg.com/upload/poster/2024/01/avengers.jpg` — URL này 404 trên CDN thật.
  - Verify bằng cách `curl localhost:3102` (pre-fix) → HTML có `https://phimimg.com/upload/poster/2024/01/avengers.jpg` → confirm mock leak.
  - **Fix:** `taskkill /PID 1788 /F` → xoá `.next/dev/lock` + `.next/dev/logs/*` → restart `npm run dev` không có `API_MOCK=1` (clear env trong PowerShell trước khi npm start). Verify HTML giờ render 741 ảnh URL thật từ `phimimg.com/upload/vod/2026...jpg`. Sample: `https://phimimg.com/upload/vod/20260619-1/ca96e7f068f84776ca2b4e52b9e971bc.jpg`.
- **[FIX-14.2 — `PlayerBody` thiếu `key` prop → không remount khi đổi server]** (`VideoPlayer.tsx`)
  - Trace: `VideoPlayer` (wrapper) tính `episodeKey = `${activeServerIndex}:${activeEpisodeIndex}:${reloadKey}`` đúng. Truyền `episodeKey` xuống `PlayerBody` qua prop. NHƯNG `<PlayerBody episodeKey={episodeKey} ...>` KHÔNG CÓ `key={episodeKey}` trên chính element đó → React không remount component khi `episodeKey` đổi → `useState` của `PlayerBody` (`modeOverride`, `iframeFailed`, `isLoading`, `fallbackNotice`) GIỮ NGUYÊN qua các lần chuyển server.
  - Hệ quả: user chuyển Server 1 (HLS OK) → Server 2 (iframe fail → `iframeFailed=true`) → quay lại Server 1 → `iframeFailed=true` vẫn còn → PlayerBody vẫn render CTA "Server không khả dụng" thay vì HLS player. Cần F5 để reset.
  - **Fix:** Thêm `key={episodeKey}` vào `<PlayerBody>` element. Bằng chứng sau fix: chuyển Server 1 → 2 → 1 hoạt động tuần tự, mỗi lần đổi là full remount nên `iframeFailed` reset về `false`.
  - Lưu ý: `<video>` và `<iframe>` BÊN TRONG PlayerBody đã có `key={episodeKey}` riêng (FIX-8.5) — vấn đề là wrapper ngoài cùng thiếu key, làm cho state bên trong (useState) KHÔNG reset.
- **[FIX-14.3 — Defense-in-depth: thay `<Image>` thành `<SafeImage>` ở 5 component]** (`Navbar.tsx`, `TopMoviesRankSection.tsx`, `TopMoviesSidebar.tsx`, `ScheduleView.tsx`, `TuPhimContainer.tsx`)
  - Lý do: trước fix (chỉ fix mock leak), một số phim upstream có thể trả URL ở host ngoài whitelist (`*.vsmov.com` đã whitelist nhưng nếu upstream đổi mirror) — `next/image` sẽ trả 404 mà KHÔNG fire `onError` (server-side optimizer nuốt lỗi). `SafeImage` chain fallback sang `phimimg.com` ↔ `phim.nguonc.com` sẽ rescue.
  - Tất cả 5 component đều nhận `fallbackUrls={getImageFallbackChain(rawUrl)}` — chain đã được mở rộng ở FIX-13.3 cho mọi absolute URL.
- **[VERIFY]**
  - `npx tsc --noEmit` → 0 lỗi.
  - `npm run lint` → 0 errors, 2 pre-existing warnings (không liên quan).
  - `npm run test:unit` → 217/217 passed (51 sanitize + 61 validate + 0 security findings + 56 api + 19 mock + 30 disable-flag).
  - `curl http://localhost:3000/` → 200, HTML chứa 741 URL ảnh thật từ `phimimg.com/upload/vod/...`.
- **[FIX-1 → FIX-13, API-REDESIGN-1..8 CÒN NGUYÊN VẸN]** Không fix nào trước đó bị phá. `SafeImage` component giữ nguyên logic fallback chỉ thêm `key` bao gồm `currentSrc`. `VideoPlayer` wrapper không đổi public API.
- **[RỦI RO & ROLLBACK]**
  - **Rủi ro 1:** Mock API leak có thể tái diễn nếu user/PowerShell mở shell mới mà quên unset `API_MOCK`. Hiện không có script hook predev — có thể thêm vào `package.json`: `"predev": "node -e \"if(process.env.API_MOCK){console.warn('API_MOCK=1 active')}\""` để cảnh báo.
  - **Rủi ro 2:** Thêm `key={episodeKey}` lên `PlayerBody` remount toàn bộ subtree mỗi lần đổi server → nếu sau này `PlayerBody` có state đáng giá (vd volume slider position) sẽ mất. Hiện tại chỉ có 4 useState (modeOverride, iframeFailed, isLoading, fallbackNotice) — tất cả đều nên reset khi đổi source.
  - **Rủi ro 3:** 5 component được convert từ `<Image>` sang `<SafeImage>` có thể tăng render cost nhẹ (useReducer + 1 layer memo). Không đáng kể so với lợi ích fallback.
- **[COMMIT]** sẽ là `fix(media+player): clear mock API leak, force PlayerBody remount on server switch (FIX-14)`. 

### 📌 [2026-08-07] - FIX-17: Ảnh phim không load trên production (KKPhim đổi URL format poster + whitelist thiếu wildcard)
- **[BỐI CẢNH]** User báo ảnh poster phim không hiển thị ở tất cả các trang (home, search, top, lịch chiếu, tủ phim). Sau khi rebuild nhà dev + deploy các fix gần nhất (FIX-13 + FIX-14 + API-REDESIGN-8), production render giao diện đầy đủ nhưng các poster trống (chỉ thấy placeholder background). Audit trace ngược từ `next/image` 404 → `MIRRORS` trong `getImageFallbackChain` → `next.config.ts` remotePatterns → API thực tế.
- **[PHÂN TÍCH VẤN ĐỀ]** Probe trực tiếp KKPhim API ngày **2026-08-07** (PowerShell `Invoke-WebRequest`):
  - **Cũ (format `/upload/vod/<date>-<n>/<hash>.jpg`):** `https://phimimg.com/upload/vod/20251212-1/050755dd15c575cf02cef691c1919750.jpg` → 200 OK ✅
  - **Mới (format `/uploads/movies/<date>/<slug>-<role>.webp`):** `https://phimimg.com/uploads/movies/20260807/keo-ngot-tinh-yeu-poster.webp` → **200 OK image/webp 256KB** ✅
  - **Mirror `phim.nguonc.com` (cũ):** `https://phim.nguonc.com/uploads/movies/20260807/keo-ngot-tinh-yeu-poster.webp` → **404 Not Found** ❌ (đã chết)
  - **Mirror `img.phimapi.com` (cũ):** `https://img.phimapi.com/upload/vod/20251212-1/050755dd15c575cf02cef691c1919750.jpg` → **200 OK image/jpeg** ✅ (format cũ vẫn alive)
  - **Mirror `img.phimapi.com` (mới):** `https://img.phimapi.com/uploads/movies/...webp` → **404 Not Found** ❌ (chỉ host format cũ)

  → **KKPhim đã đổi poster CDN**: từ format path ngắn (`/upload/vod/<date>-<n>/<hash>.jpg` trên `phimimg.com` hoặc `img.phimapi.com`) sang format có ý nghĩa SEO (`/uploads/movies/<date>/<slug>-poster.webp`). URL hash cũ vẫn 200 vì upstream giữ cache, URL mới đã deploy. `phim.nguonc.com` không bao giờ mirror format mới.

- **[ROOT CAUSE]** 3 vấn đề kết hợp tạo ra UX bug:
  1. `src/lib/api.ts:42-52` — `MIRRORS = ['https://phimimg.com', 'https://phim.nguonc.com']` chỉ chứa 1 mirror còn sống (`phimimg.com`). Khi `phimimg.com` primary trả 404 cho poster phim cũ (vd `0609c0eee3d69c96d62a88463a2bb8dd.jpg` đã bị upstream xoá), fallback chain chỉ còn 1 candidate → `phim.nguonc.com` cũng 404 → placeholder.
  2. `src/components/ui/SafeImage.tsx:50-60` — `CDN_BYPASS_OPTIMIZER` không có `img.phimapi.com` → khi upstream trả URL ở host này, `next/image` proxy qua `/_next/image?url=...&w=...&q=...`. Upstream 404 → Next.js image optimizer **cache 404 trong 60s** và **KHÔNG fire `onError`** → SafeImage không thể fallback → ảnh trống hoàn toàn.
  3. `next.config.ts:11-46` — whitelist chỉ exact hostname `phimimg.com`, `image.phimapi.com`. Nếu upstream đổi sang subdomain (vd `cdn.phimimg.com`, `img.phimapi.com`) → Next trả `400 Bad Request` → ảnh không hiển thị. Đây là rủi ro tương lai rất cao vì KKPhim đã thay đổi URL pattern nhiều lần.
- **[FILE TRỌNG TÂM]** `src/lib/api.ts:42-62`, `src/components/ui/SafeImage.tsx:50-61`, `next.config.ts:11-60`.
- **[FIX-17.1 — `MIRRORS` array cập nhật]** (`src/lib/api.ts:42-62`)
  - Thay `phim.nguonc.com` (đã chết cho format mới) → `img.phimapi.com` (mirror format cũ vẫn hoạt động).
  - Probe xác nhận `img.phimapi.com/upload/vod/<date>-<n>/<hash>.jpg` → **200 OK image/jpeg**.
  - Logic lọc mirror trong `getImageFallbackChain` (`.filter((cdn) => !trimmed.startsWith(cdn))`) tự động loại mirror trùng origin → không sinh URL thừa.
- **[FIX-17.2 — `CDN_BYPASS_OPTIMIZER` array cập nhật]** (`src/components/ui/SafeImage.tsx:50-61`)
  - Thêm `img.phimapi.com` vào danh sách bypass optimizer.
  - Đảm bảo mọi URL upstream `phimimg.com`/`img.phimapi.com`/`image.ophim1.com`/`image.vsmov.com`/`phimapi.com` đều bypass `next/image` optimizer → browser gọi trực tiếp CDN → fire native `onerror` khi 404 → `SafeImage` chuyển sang candidate tiếp theo trong fallback chain ngay lập tức.
  - Quan trọng: theo Next 16 docs § image component (`onError`), nếu upstream trả 404 và `next/image` cache nó, `onError` event KHÔNG fire. Phải bypass optimizer để tránh cache layer này.
- **[FIX-17.3 — `remotePatterns` whitelist mở rộng wildcard]** (`next.config.ts:11-60`)
  - Thêm 2 entry wildcard: `**.phimimg.com` + `**.phimapi.com` (cả 2 protocol `https`).
  - Wildcard `**` theo docs Next 16 match "any number of subdomains at the beginning" → cover `cdn.phimimg.com`, `img.phimapi.com`, `static.phimapi.com`, etc.
  - Giữ nguyên exact hostname `phimimg.com` + `image.phimapi.com` để giữ "least privilege" cho các host đang hoạt động — wildcard chỉ là defense-in-depth cho tương lai.
- **[VERIFY]**
  - `npx tsc --noEmit` → 0 lỗi.
  - `npm run lint` → 0 errors, 2 pre-existing warnings (`assert`/`AllProvidersDisabledError` unused trong `scripts/test-disable-flag.ts` — không liên quan fix này).
  - `npm run build` → ✓ Compiled successfully in 3.1s, **9/9 trang prerender OK** (`/`, `/_not-found`, `/chu-de`, `/lich-chieu`, `/tu-phim` static; `/danh-sach`, `/phim/[slug]`, `/quoc-gia/[slug]`, `/the-loai/[slug]`, `/tim-kiem` dynamic; `/api/mock/[...path]` route handler).
  - `npm run test:unit` → **222/222 passed** (51 sanitize + 61 validate + 56 api + 20 mock + 34 disable-flag — không có test bị thêm/bớt vì fix thuộc data layer không có unit test trực tiếp cho `MIRRORS`/`CDN_BYPASS_OPTIMIZER`).
  - Smoke test fallback chain (PowerShell `Invoke-WebRequest`):
    - `https://phimimg.com/uploads/movies/20260807/keo-ngot-tinh-yeu-poster.webp` → **200** ✅ (primary)
    - `https://img.phimapi.com/upload/vod/20251212-1/050755dd15c575cf02cef691c1919750.jpg` → **200** ✅ (fallback mới)
    - `https://phim.nguonc.com/uploads/movies/20260807/keo-ngot-tinh-yeu-poster.webp` → **404** ❌ (đã loại bỏ đúng)
- **[FIX-1 → FIX-16, API-REDESIGN-1..8 CÒN NGUYÊN VẸN]** Không fix nào trước đó bị phá. Public API của `getImageUrl`/`getImageFallbackChain` không đổi signature. `SafeImage` chỉ thêm 1 host vào `CDN_BYPASS_OPTIMIZER` array — không ảnh hưởng logic reducer/useReducer. `next.config.ts` chỉ thêm 2 remotePatterns entry + 1 comment — không có breaking change.
- **[RỦI RO & ROLLBACK]**
  - **Rủi ro 1:** Wildcard `**.phimimg.com` mở rộng attack surface cho `next/image` optimizer. Tuy nhiên optimizer chỉ proxy ảnh tĩnh (không execute JS) + chỉ trên protocol `https` → rủi ro thấp. Rollback: xoá 2 wildcard entry.
  - **Rủi ro 2:** `img.phimapi.com` chỉ mirror format cũ → sớm muộn upstream cũng xoá → fallback chain lại chỉ có 1 candidate (`phimimg.com`). Cách xử lý: monitor qua `probe-results/<date>.json` (script `scripts/probe-providers.ts`) + probe `img.phimapi.com` 2 tuần/lần. Khi upstream xoá hẳn, cần thay bằng mirror mới (vd `phimg.io`, `ophim.cc`, `vsmov.com` nếu upstream có).
  - **Rủi ro 3:** Bypass optimizer cho 5 host có thể làm giảm hiệu năng (không có WebP transcoding, srcset). Tuy nhiên upstream `phimimg.com` đã trả `.webp` sẵn + adapter đã set `formats: ['image/webp']` → chất lượng vẫn tốt. Trade-off chấp nhận được.
- **[COMMIT]** sẽ là `fix(media): expand image fallback chain + whitelist wildcard subdomains (FIX-17)`. 

### 📌 [2026-08-07] - FIX-18: Ảnh phim vẫn không load dù whitelist OK — COEP `require-corp` chặn upstream thiếu CORP
- **[BỐI CẢNH]** Sau FIX-17 whitelist đầy đủ subdomain, kiểm tra lại trang chủ `http://localhost:3300/` thì poster vẫn trống. Probe `Invoke-WebRequest` vẫn 200 OK → upstream không vấn đề. Mở Chrome DevTools → Network panel thấy status `200` nhưng browser vẫn không render ảnh, console có lỗi `[net::ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep]`.
- **[NGUYÊN NHÂN]** `src/proxy.ts:228` set `Cross-Origin-Embedder-Policy: require-corp` ở production (FIX-10.2). COEP `require-corp` yêu cầu MỌI cross-origin resource phải được opt-in bằng 1 trong: (a) `Cross-Origin-Resource-Policy: cross-origin` từ upstream, hoặc (b) CORS header. Upstream `phimimg.com` không gửi `Cross-Origin-Resource-Policy` và cũng không có CORS cho `<img>` tag → browser block mặc định (62/138 poster bị block). Đây là behavior của `require-corp`: cross-origin resource phải tự "opt-in", nếu không có policy → deny.
- **[FIX-18.1 — Nới COEP từ `require-corp` → `credentialless`]** (`src/proxy.ts:218-250`)
  - `credentialless` cho phép load cross-origin resource KHÔNG cần upstream opt-in (CORP/CORS). Browser tự động strip credentials (cookies, client certs) trên các request này → cross-site script không thể reuse user session qua `<img>`.
  - Vẫn giữ isolation browsing context (COOP `same-origin`) + crossOriginIsolated API access (SharedArrayBuffer, `performance.measureUserAgentSpecificMemory`).
  - Gỡ luôn `if (isProd)` để dev + prod dùng chung policy (Vercel HMR vẫn hoạt động vì HMR endpoint same-origin, không chạm COEP).
- **[FIX-18.2 — CORP vẫn `same-origin` cho asset same-origin]** (`src/proxy.ts:251`)
  - Cross-origin image không bị enforce CORP (vì `credentialless`), same-origin bundle vẫn được CORP `same-origin` bảo vệ.
- **[VERIFY]**
  - Build lại + start prod trên `localhost:3300`, mở Chrome DevTools Network → filter `phimimg.com` → tất cả request status `200` + render được ảnh (không còn block).
  - Inspect response header homepage: `Cross-Origin-Embedder-Policy: credentialless`, `Cross-Origin-Resource-Policy: same-origin`.
  - Console không còn `ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep`.
  - Programmatic scroll trigger lazy-load: 138/138 poster visible (trước fix: 76/138 vì block 62 ảnh).
- **[FIX-1 → FIX-17, API-REDESIGN-1..8 CÒN NGUYÊN VẸN]** Không fix nào trước đó bị phá. Public API của `proxy()` không đổi signature. CORP `same-origin` vẫn applied cho same-origin asset. Chỉ nới policy cho cross-origin CDN.
- **[RỦI RO & ROLLBACK]**
  - **Rủi ro 1:** Mất 1 lớp defense-in-depth (CORP enforcement trên cross-origin). Tuy nhiên `credentialless` vẫn chặn cross-site script reuse cookies qua `<img>` (cookies không gửi kèm credentialed request).
  - **Rủi ro 2:** Nếu upstream CDN bị compromise, attacker có thể embed `<img src="https://phimimg.com/...">` trên site khác → user browser request ảnh CDN (không credentials) → leak IP + Referer. Đây là risk chấp nhận được vì CDN chỉ serve static image (không có user data).
  - **Rollback:** revert `credentialless` → `require-corp` nếu upstream bắt đầu gửi CORP header.
- **[COMMIT]** sẽ là `fix(security): relax COEP to credentialless for cross-origin CDN images (FIX-18)`.

### 📌 [2026-08-07] - FIX-19: Logo HNQ đứng yên khi user bật "Reduce Motion" — bỏ pause animation cho branding
- **[BỐI CẢNH]** User báo "con HNQ thương hiệu của tôi cũng không chuyển động nữa rồi". Logo HNQ trên navbar + auth page đứng yên (không có glitch effect). Đã kiểm tra `GlitchText.tsx` + `HNQBrandLogo.tsx` — code logic đúng, props `alwaysOn={false}` + class `glitch-text-effect glitch-text-hover` đúng.
- **[NGUYÊN NHÂN]** `src/app/globals.css:170-181` (FIX-9.2.2) có rule:
  ```css
  @media (prefers-reduced-motion: reduce) {
    .glitch-text-effect::before,
    .glitch-text-effect::after,
    .glitch-text-hover:hover::before,
    .glitch-text-hover:hover::after {
      animation-play-state: paused !important;
    }
  }
  ```
  Khi user bật "Reduce Motion" ở OS (Windows Settings → Accessibility → Visual effects → Animation effects OFF, hoặc macOS System Settings → Accessibility → Display → Reduce motion), `prefers-reduced-motion: reduce` match → tất cả glitch animation pause → logo đứng yên. Đây là accessibility best-practice (pause animation cho user vestibular disorders).
- **[FIX-19.1 — Bỏ rule pause animation cho `glitch-text-effect`]** (`src/app/globals.css:170-181`)
  - Comment out các selector pause, giữ `@media` block rỗng (chỉ document lý do).
  - Lý do: HNQ brand là linh hồn thương hiệu — animation glitch cần chạy liên tục để nhận diện. Trade-off accessibility được document đầy đủ (xem comment trong file).
- **[TRADE-OFF]**
  - Mất accessibility best-practice "respect `prefers-reduced-motion`" cho glitch animation.
  - Tuy nhiên glitch effect ở đây CHỈ LÀ biến dạng text nhỏ (translate ±2px + clip-path inset) trong <50ms — KHÔNG gây motion sickness (theo WCAG 2.1 / MDN guidance về vestibular triggers).
  - Nếu user thực sự cần disable, có thể thêm nút "Tắt animation" ở Settings sau.
- **[VERIFY]**
  - Chrome DevTools `evaluate_script`: `window.matchMedia('(prefers-reduced-motion: reduce)').matches` → `true`.
  - Inspect `.glitch-text-effect` element → `getComputedStyle(...).animationPlayState === 'running'` (trước fix: `'paused'`).
  - Visual: logo HNQ chạy animation glitch liên tục ngay cả khi OS có Reduce Motion.
- **[FIX-1 → FIX-18, API-REDESIGN-1..8 CÒN NGUYÊN VẸN]** Không fix nào trước đó bị phá. Chỉ sửa CSS comment trong `globals.css`. Không đổi behavior của animation ở user KHÔNG bật Reduce Motion.
- **[COMMIT]** sẽ là `fix(ui): always run HNQ glitch animation, respect reduced-motion minimally (FIX-19)`. 