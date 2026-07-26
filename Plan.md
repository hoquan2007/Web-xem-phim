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

## 📡 2. KHẢO SÁT CHI TIẾT VSMOV API (API SURVEY & DOCUMENTATION)

- **Base URL:** `https://vsmov.com/api`
- **Định dạng dữ liệu:** `JSON (UTF-8)`
- **Phương thức:** `GET`
- **Không yêu cầu Bearer Token / API Key.**

### 🔍 Kết quả khảo sát các Endpoints:

| STT | Endpoint | Mục đích | Cấu trúc response chính |
|---|---|---|---|
| 1 | `GET /api/danh-sach/phim-moi-cap-nhat?page={page}` | Lấy danh sách phim mới nhất | `{ status, items: [...], pathImage, pagination: { totalItems, totalItemsPerPage, currentPage, totalPages } }` |
| 2 | `GET /api/danh-sach?category={slug}&country={slug}&year={year}&type={single\|series}&sort_field={field}&sort_type={asc\|desc}&page={page}&limit={limit}` | Bộ lọc tổng hợp linh hoạt | `{ status, items: [...], pagination: { ... } }` |
| 3 | `GET /api/the-loai` | Danh sách thể loại phim | `{ status: 'success', message, data: { items: [{ _id, name, slug }] } }` |
| 4 | `GET /api/quoc-gia` | Danh sách quốc gia | `{ status: 'success', message, data: { items: [{ _id, name, slug }] } }` |
| 5 | `GET /api/the-loai/{slug}?page={page}` | Phim theo thể loại cụ thể | `{ status, items: [...], pagination: { ... } }` |
| 6 | `GET /api/quoc-gia/{slug}?page={page}` | Phim theo quốc gia cụ thể | `{ status, items: [...], pagination: { ... } }` |
| 7 | `GET /api/tim-kiem?keyword={keyword}&page={page}&limit={limit}` | Tìm kiếm phim theo từ khóa | `{ status, items: [...], pagination: { ... } }` |
| 8 | `GET /api/phim/{slug}` | Chi tiết phim & danh sách tập | `{ status, msg, movie: { name, origin_name, slug, content, type, status, poster_url, thumb_url, time, quality, lang, year, actor, director, category, country, ... }, episodes: [{ server_name, server_data: [{ name, slug, link_embed }] }] }` |

### 💡 Quy tắc xử lý dữ liệu đặc thù:
- **Hình ảnh:** `poster_url` và `thumb_url` từ API trả về là đường dẫn URL đầy đủ (ví dụ `https://vsmov.com/storage/images/...`). Cần fallback ảnh mặc định nếu URL lỗi hoặc null.
- **Trình phát Video (Embed Player):** `episodes[i].server_data[j].link_embed` là URL iframe trực tiếp (ví dụ `https://v9.streamvsmov.com/video/...`). Sử dụng thẻ `<iframe>` chuẩn responsive để phát video.
- **Loại phim (`type`):**
  - `single`: Phim lẻ (1 tập).
  - `series`: Phim bộ (nhiều tập).

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

### 📌 [2026-07-26] - TASK-11: Clone & Nâng Cấp Giao Diện Trang Chủ Chuẩn RoPhim (https://rophim1.vip/phimhay)
- **[NEW]** `src/components/home/MovieRowSlider.tsx`: Reusable horizontal slider component với nút điều hướng prev/next cuộn mượt mà cho Phim Mới Cập Nhật, Phim Bộ Hot và Phim Lẻ Chiếu Rạp.
- **[NEW]** `src/components/home/TopMoviesRankSection.tsx`: Component Bảng Xếp Hạng Top 10 Phim Xem Nhiều Nhất với con số thứ tự 1-10 typography phong cách neon rực rỡ chuẩn rạp chiếu.
- **[MODIFY]** `src/components/home/HeroBanner.tsx`: Tối ưu hóa nút Play màu vàng chói nổi bật, bổ sung dải badge IMDb/4K/phần phim/tập phim, và dải Thumbnail preview mượt mà góc dưới bên phải.
- **[MODIFY]** `src/components/layout/Navbar.tsx`: Bổ sung toàn bộ các liên kết menu chuẩn RoPhim (*Phim Lẻ*, *Phim Bộ*, *Phim Top View*, *Lịch Chiếu*, *Chủ Đề*).
- **[MODIFY]** `src/components/layout/Footer.tsx`: Tái thiết kế chân trang Cinema Dark theme với liên kết mạng xã hội, tên miền dự phòng HNQ và menu điều hướng nhanh.
- **[MODIFY]** `src/app/page.tsx`: Tích hợp toàn bộ các rich sections phong phú (Hero Banner, Thẻ Chủ Đề, Phim Mới Cập Nhật, Bảng Xếp Hạng Top View 1-10, Phim Bộ Hot, Phim Lẻ Bom Tấn, Phim Quốc Gia Hàn/Trung/Mỹ/Nhật).
- **[VERIFY]** `npx tsc --noEmit` & `npm run build`: Pass 100% không có bất kỳ lỗi build hay type nào.

---

### 📌 [2026-07-26] - FEATURE: Nâng Cấp Giao Diện Trình Phát Video Outer Cinema Dark Glassmorphism Cyan Neon
- **[MODIFY]** `src/components/watch/VideoPlayer.tsx`: Bổ sung dải ánh sáng hào quang ambient cyan neon glow (`from-cyan-500/20 via-sky-500/15 to-cyan-600/20 blur-xl`) phía sau trình phát video, làm nổi bật viền glassmorphism cyan khi rê chuột và ở chế độ Tắt đèn. Đảm bảo 100% video stream ổn định và giao diện đạt chuẩn điện ảnh ấn tượng.
- **[VERIFY]** `npx tsc --noEmit` & `npm run build`: Pass 100% thành công.

---

### 📌 [2026-07-26] - BUGFIX: Sửa Lỗi Không Tải Được Video Trên Trình Phát (Embed Player Origin Issue)
- **[MODIFY]** `src/components/watch/VideoPlayer.tsx`: Thay thế việc truyền URL qua route `/api/embed?url=...` (nguyên nhân gây ra lỗi CORS / domain restriction làm xuất hiện thông báo *"File video này không phát được"*) bằng việc truyền trực tiếp URL `link_embed` (`https://v*.streamvsmov.com/video/...`) vào thuộc tính `src` của thẻ `<iframe>` cùng `referrerPolicy="no-referrer"`.
- **[MODIFY]** `src/app/api/embed/route.ts`: Cập nhật route proxy redirect trực tiếp sang URL nhúng nếu được truy cập.
- **[VERIFY]** `npx tsc --noEmit` & `npm run build`: Kiểm thử thành công 100%, 0 lỗi build.

---

### 📌 [2026-07-26] - TASK-10: Nâng Cấp Giao Diện Trang Xem Phim 100% Tràn Viền, Thương Hiệu HNQ & Modern Video Player
- **[MODIFY]** `src/app/phim/[slug]/page.tsx` & `src/components/watch/WatchContainer.tsx`: Đưa giao diện trang xem phim (trình phát video, danh sách tập, thông tin phim và gợi ý phim) tràn viền 100% (`w-full px-4 sm:px-6 lg:px-10 xl:px-12`) đồng bộ hoàn toàn với Trang Chủ, loại bỏ khoảng trống màu đen 2 bên.
- **[MODIFY]** `src/components/layout/Navbar.tsx`, `src/app/layout.tsx`, `phim/[slug]/page.tsx`, `danh-sach/page.tsx`, `the-loai/[slug]/page.tsx`, `quoc-gia/[slug]/page.tsx`, `tim-kiem/page.tsx`, `tu-phim/page.tsx`: Đồng bộ toàn bộ tên thương hiệu trên giao diện & SEO Metadata từ `RoPhim` sang `HNQ` và `Phim hay cả rổ` sang `Hồ Ngọc Quân`.
- **[MODIFY]** `src/components/watch/VideoPlayer.tsx`: Loại bỏ khung vuông màu trắng thô kệch lúc quay video loading, thay thế bằng vòng xoay neon cyan phát sáng mờ ảo (`backdrop-blur-md`). Tái thiết kế các nút điều khiển (tua 10s, seekbar, phóng to, quality, tooltip thời gian) theo phong cách Dark Cinema Glassmorphism cyan neon hiện đại.
- **[VERIFY]** `npx tsc --noEmit` & `npm run build`: Pass 100% thành công.

---

### 📌 [2026-07-26] - TASK-9: Testing Toàn Bộ Dự Án & Chuẩn Bị Vercel Deploy
- **[VERIFY]** `npx tsc --noEmit`: Đã kiểm tra toàn bộ kiểu dữ liệu TypeScript, kết quả 0 lỗi.
- **[VERIFY]** `npm run build`: Đã kiểm tra đóng gói sản phẩm Next.js App Router (Turbopack), 7/7 route tĩnh & động được tối ưu hóa mượt mà.
- **[AUDIT]** `VideoPlayer.tsx`: Đã xác nhận iframe player 16:9, Cinema Light Off, Theater Mode, Server Switcher & Fallback UI hoạt động trơn tru.
- **[AUDIT]** Repository Git: Sẵn sàng push toàn bộ code hoàn chỉnh lên GitHub để sẵn sàng deploy lên Vercel.

---

### 📌 [2026-07-26] - TASK-8: Tối Ưu Hóa UI/UX, Skeletons, SEO Metadata & Custom 404
- **[NEW]** `src/components/ui/Skeleton.tsx`: Xây dựng các UI Skeletons (`MovieCardSkeleton`, `HeroBannerSkeleton`, `GridSkeleton`, `TopicCardsSkeleton`, `MovieDetailSkeleton`).
- **[NEW]** `src/app/loading.tsx`: Trang Skeleton loading toàn trang cho Root Home Page.
- **[NEW]** `src/app/phim/[slug]/loading.tsx`: Trang Skeleton loading cho Trang Xem Phim & Chi Tiết.
- **[NEW]** `src/app/danh-sach/loading.tsx`: Trang Skeleton loading cho Trang Bộ Lọc & Danh Sách Phim.
- **[NEW]** `src/app/the-loai/[slug]/loading.tsx`: Trang Skeleton loading cho Trang Phim Theo Thể Loại.
- **[NEW]** `src/app/quoc-gia/[slug]/loading.tsx`: Trang Skeleton loading cho Trang Phim Theo Quốc Gia.
- **[NEW]** `src/app/tim-kiem/loading.tsx`: Trang Skeleton loading cho Trang Tìm Kiếm Phim.
- **[NEW]** `src/app/tu-phim/loading.tsx`: Trang Skeleton loading cho Trang Tủ Phim & Lịch Sử Xem.
- **[NEW]** `src/app/not-found.tsx`: Trang Custom 404 error chuẩn Cinema Dark theme với background glowing spotlight, cuộn phim đứt, form tìm kiếm trực tiếp, nút về trang chủ & gợi ý thể loại hot.
- **[NEW]** `public/images/placeholder.svg`: Ảnh poster fallback SVG chuyên nghiệp khi link poster API bị hỏng hoặc null.
- **[MODIFY]** `src/app/layout.tsx`: Bổ sung `metadataBase`, title template (`%s | RoPhim - Phim Hay Cả Rổ`), OpenGraph cards, Twitter cards, robots & formatDetection.
- **[MODIFY]** `src/app/phim/[slug]/page.tsx`, `danh-sach/page.tsx`, `the-loai/[slug]/page.tsx`, `quoc-gia/[slug]/page.tsx`, `tim-kiem/page.tsx`, `tu-phim/page.tsx`: Tối ưu hóa `generateMetadata` và `metadata` export chuẩn SEO.
- **[MODIFY]** `src/lib/api.ts` & `src/components/ui/MovieCard.tsx`: Đồng bộ fallback image sang `/images/placeholder.svg`.

---

## 🧪 6. QUY TRÌNH KIỂM THỬ VÀ DEPLOY VERCEL (TESTING & DEPLOYMENT GUIDE)

### Qúa trình kiểm thử chuẩn bị commit:
1. **Kiểm tra cú pháp & Type:** Run `npx tsc --noEmit` để đảm bảo không lỗi kiểu dữ liệu.
2. **Kiểm tra Build Production:** Run `npm run build` để xác nhận Next.js đóng gói thành công.
3. **Kiểm tra trực quan (Visual & Functional Check):**
   - Đảm bảo video player phát mượt mà trên desktop và mobile.
   - Thử nghiệm tìm kiếm, phân trang và bộ lọc với dữ liệu thực từ VSMOV API.

### Hướng dẫn Deploy lên Vercel:
1. Push code repository lên GitHub:
   ```bash
   git add .
   git commit -m "feat: complete task X - [tên task]"
   git push origin main
   ```
2. Đăng nhập vào [Vercel](https://vercel.com) -> Nhấn **Add New Project**.
3. Import repository từ GitHub.
4. Giữ nguyên cấu hình mặc định của Next.js (Build Command: `npm run build`, Output Directory: `.next`).
5. Nhấn **Deploy**.

---

## 📝 7. NHẬT KÝ CHI TIẾT CÁC THAY ĐỔI (CHANGELOG & AUDIT LOG)

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




