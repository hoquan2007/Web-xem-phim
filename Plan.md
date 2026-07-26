# 🎬 KẾ HOẠCH PHÁT TRIỂN WEBSITE XEM PHIM (VSMOV API)

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
| **TASK-3** | Phát triển Trang Chủ (`app/page.tsx`): Hero Slider Banner, Phim Mới Cập Nhật, Phim Bộ, Phim Lẻ, Top Phim | ✅ Completed | Đã hoàn thành HeroBanner slider tự động, MovieCard responsive, MovieSection (Phim Mới, Phim Bộ, Phim Lẻ), TopMoviesSidebar (BXH Top 1-10), kết nối VSMOV API với Server Components. Test build thành công. |
| **TASK-4** | Phát triển Trang Chi Tiết & Xem Phim (`app/phim/[slug]/page.tsx`): Stream Player Iframe, Danh sách tập, Server selector, Thông tin phim | 🔄 Pending | Chưa bắt đầu |
| **TASK-5** | Phát triển Trang Danh Sách & Bộ Lọc Nâng Cao (`app/danh-sach/page.tsx`, `the-loai`, `quoc-gia`): Lọc theo Thể loại, Quốc gia, Năm, Pagination | 🔄 Pending | Chưa bắt đầu |
| **TASK-6** | Phát triển Chức năng Tìm kiếm (`app/tim-kiem/page.tsx` & Quick Live Search Popup trên Header) | 🔄 Pending | Chưa bắt đầu |
| **TASK-7** | Tính năng Cá nhân hóa: Tủ Phim Yêu Thích (Bookmarks) & Lịch Sử Xem Phim (Continue Watching) lưu ở LocalStorage | 🔄 Pending | Chưa bắt đầu |
| **TASK-8** | Tối ưu hóa UI/UX: Skeleton Loading, Responsive polish, SEO Dynamic Metadata, OpenGraph cards, Custom 404 page | 🔄 Pending | Chưa bắt đầu |
| **TASK-9** | Testing toàn bộ dự án (`npm run build`), kiểm tra link video player, Sửa lỗi & Chuẩn bị Repository gửi Vercel Deploy | 🔄 Pending | Chưa bắt đầu |

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

### 📌 [2026-07-26] - TASK-3: Phát triển Trang Chủ (`app/page.tsx`)
- **[NEW]** `src/components/ui/MovieCard.tsx`: Thẻ hiển thị poster phim responsive với badge Năm, TMDB rating, hiệu ứng hover zoom và nút Play overlay.
- **[NEW]** `src/components/home/HeroBanner.tsx`: Slider trình chiếu 6 phim mới nhất nổi bật với background autoplay, nút điều hướng Prev/Next, chấm chỉ số slide, nút "Xem Phim Ngay" & "Chi Tiết".
- **[NEW]** `src/components/home/MovieSection.tsx`: Section danh sách phim cho Phim Mới Cập Nhật, Phim Bộ, Phim Lẻ với nút "Xem tất cả".
- **[NEW]** `src/components/home/TopMoviesSidebar.tsx`: Bảng xếp hạng Top 10 phim xem nhiều với rank badge thiết kế Vàng/Bạc/Đồng nổi bật.
- **[MODIFY]** `src/app/page.tsx`: Chuyển đổi từ trang Next.js starter mặc định sang Server Component fetch dữ liệu song song qua `Promise.all` (`revalidate: 300`s).
- **[NEW]** `.agents/AGENTS.md`: Thêm quy tắc workspace bắt buộc test (`npx tsc --noEmit` & `npm run build`), cập nhật `Plan.md`, commit & push sau mỗi task.

### 📌 [2026-07-26] - TASK-3 UI FIX: Tối ưu tràn viền 100% Full-Bleed & Tăng độ trong suốt Hero Banner
- **[MODIFY]** `src/app/page.tsx`: Đưa `HeroBanner` ra ngoài `max-w-7xl` container để tràn viền 100% (Full Bleed Edge-to-Edge) toàn bộ màn hình.
- **[MODIFY]** `src/components/home/HeroBanner.tsx`:
  - Loại bỏ bo góc `rounded-3xl` và viền hộp.
  - Sửa lớp phủ gradient đen: giảm độ đục, loại bỏ gradient đè trung tâm để làm nổi bật tấm ảnh nền poster/backdrop phim.
  - Giữ lại top gradient nhẹ cho Navbar, left gradient mềm 50% cho văn bản, và bottom gradient chuyển tiếp mượt sang danh sách bên dưới.
- **[MODIFY]** `src/lib/api.ts`: Cập nhật `getImageUrl` kiểm tra an toàn `typeof url === 'string'` chống lỗi SSR runtime.

