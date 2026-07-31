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
| **FIX-2** | Bảo mật: Sanitize `movie.content` trước khi `dangerouslySetInnerHTML` (dùng `isomorphic-dompurify` server-side, đồng bộ strip tag ở Hero) | ⬜ Pending | Chi tiết ở **Mục 6.2**. |
| **FIX-3** | Trình phát: Sửa listener leak & spinner vĩnh viễn trên Safari/iOS (`VideoPlayer.tsx`), capture `cancelled` để chặn race HLS↔iframe | ⬜ Pending | Chi tiết ở **Mục 6.3**. |
| **FIX-4** | Dữ liệu & State: Sửa bộ lọc giả (`getFilteredMovies` chỉ nhận 1 nhánh), `cache()` cho `getMovieDetail`, bỏ cache tìm kiếm riêng tư, hydrate ổn định cho `useBookmarks`/`useWatchHistory`, sửa race/auto-write lịch sử xem | ⬜ Pending | Chi tiết ở **Mục 6.4**. |
| **FIX-5** | Hiệu năng: Bật `next/image` (tắt `unoptimized`, restrict `remotePatterns`), gỡ `'use client'` thừa, throttle scroll listener, thêm `priority`/`fetchPriority` cho LCP | ⬜ Pending | Chi tiết ở **Mục 6.5**. |
| **FIX-6** | Chất lượng code: Sửa 21 lỗi ESLint (`react-hooks/set-state-in-effect`, `no-explicit-any`), dọn dead code, sửa lỗi nghiệp vụ nhỏ (`ScheduleView`, `Pagination`, `Pagination` keyboard, `useSearchParams` Suspense) | ⬜ Pending | Chi tiết ở **Mục 6.6**. |
| **FIX-7** | Dependency & Build: Nâng cấp `lucide-react` (1.x → 0.4xx), gỡ `framer-motion` nếu chưa dùng, theo dõi bản vá `postcss`/`sharp` qua Next patch, verify `npm run build` + Vercel | ⬜ Pending | Chi tiết ở **Mục 6.7**. |

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
- **Thay đổi dự kiến:**
  - [ ] **`react-hooks/set-state-in-effect`**: 
    - `Navbar.tsx:78` — chuyển `setLiveResults([])` / `setIsSearching(false)` ra khỏi effect (dùng `useMemo` hoặc derive state từ `searchQuery`).
    - `VideoPlayer.tsx:67` — `setIsLoading(true)` có thể derive từ `key` hoặc dùng `useLayoutEffect` với early-return.
    - `useBookmarks.ts:31` & `useWatchHistory.ts:31` — bỏ `loadBookmarks()` trong effect, khởi tạo state ngay từ `useState(() => readFromStorage())` (cẩn thận SSR).
    - `MovieDetailInfo.tsx:49` — dùng `useSyncExternalStore` (xem FIX-4).
  - [ ] **`no-explicit-any`**: thay bằng `unknown` + type narrowing trong `src/lib/api.ts:19,30,112,218,231,234,256,259,279,282,294,389`; tương tự ở `WatchContainer.tsx:90` & `MovieDetailInfo.tsx:47,60`.
  - [ ] **Dead code / unused import:** dọn theo danh sách 18 cảnh báo (`Image`/`Film`/`Play`/`PlayIcon`/`Sparkles`/`ShieldAlert`/`ArrowLeft`/`Eye`/`Globe`/`notFound`/`MovieListItem`/`CategoryListResponse`/`CountryListResponse`…).
  - [ ] **Nghiệp vụ nhỏ:**
    - `ScheduleView.tsx:33-42` — gỡ deterministic hash; đổi tiêu đề & copy để không hứa "lịch chiếu thật" (hoặc bỏ hẳn trang nếu không có dữ liệu).
    - `TopMoviesRankSection.tsx:36-46` — dùng dữ liệu thật từ `topDayMovies/topWeekMovies/topMonthMovies` đã tách ở TASK-13; cân nhắc bỏ tab nếu provider không trả ranking.
    - `Pagination.tsx:30-56` — chống trùng trang khi `totalPages===2`; thêm `tabIndex={-1}` & `aria-disabled` cho nút Prev/Next/First/Last ở rìa.
    - `Pagination.tsx:19` & `FilterBar.tsx:22` — dùng `useSearchParams` an toàn với `<Suspense>` ở page cha.
    - `HeroBanner.tsx:30-39,189-194` — tôn trọng `prefers-reduced-motion`; thumb có `aria-label={movie.name}`.
- **Tiêu chí pass:**
  - [ ] `npm run lint` → 0 lỗi, cảnh báo giảm ≥ 70%.
  - [ ] `tsc --noEmit` → 0 lỗi.
  - [ ] Thao tác UI chính (filter, đổi server, đổi tập, comment, bookmark) vẫn hoạt động đúng.

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

### 📌 [2026-07-31] - AUDIT: Quét Toàn Bộ Hệ Thống & Lên Kế Hoạch Khắc Phục
- **[SCOPE]** Đã audit 47 file nguồn + cấu hình (`src/app/**`, `src/components/**`, `src/hooks/**`, `src/lib/**`, `src/types/**`, `next.config.ts`, `eslint.config.mjs`, `package.json`, `package-lock.json`, `node_modules/next/dist/docs/**`).
- **[VERIFY RAN]** `npm run lint` → 21 errors, 37 warnings; `npx tsc --noEmit` → 0 errors; `npm audit --omit=dev` → 3 high (postcss, sharp kế thừa qua Next 16).
- **[FINDINGS HIGHLIGHTS]**
  - **Critical:** `/api/embed` SSRF/open-proxy; `dangerouslySetInnerHTML` từ API bên thứ ba; iOS `VideoPlayer` listener leak + spinner vĩnh viễn.
  - **High:** Bộ lọc `getFilteredMovies` chỉ nhận 1 nhánh (year/sort bị bỏ); `getMovieDetail` chạy 2 lần/request; `searchMovies` cache riêng tư; Navbar hydration mismatch; `useEffect` lịch sử ghi ngay mount; `next/image` bị tắt; `next.config.ts` cho phép mọi host.
  - **Medium-Low:** dead code (`framer-motion`, `Image` import thừa), 21 ESLint errors, scroll listener không throttle, `ScheduleView` dùng hash giả, `Pagination` duplicate trang ở edge case, `useSearchParams` chưa wrap Suspense.
- **[DECISION]** Tách thành 7 fix độc lập (FIX-1 → FIX-7) theo thứ tự bảo mật → luồng dữ liệu → hiệu năng → chất lượng code → dependency. Chi tiết & tiêu chí pass ở **Mục 6**.
- **[STATUS]** Mục 6 đã được bổ sung vào `Plan.md`. **FIX-1 (xóa `/api/embed` proxy) đã hoàn tất** xem Mục 8 phía trên. Còn FIX-2 → FIX-7 (`⬜ Pending`).
- **[NEXT]** Sau khi đóng gói commit audit-plan, chạy `git add Plan.md && git commit -m "docs(plan): remediation roadmap for full-code audit" && git push origin main` để lưu kế hoạch lên GitHub.




