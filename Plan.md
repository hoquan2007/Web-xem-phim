# 🎬 KẾ HOẠCH PHÁT TRIỂN WEBSITE XEM PHIM (VSMOV API)

> **File:** `Plan.md`  
> **Mục đích:** Tài liệu quản lý tiến độ, quy trình làm việc và kiến trúc kỹ thuật dự án web xem phim trực tuyến.  
> **Nền tảng triển khai:** GitHub + Vercel deployment.

---

## 📜 1. QUY TẮC PHÁT TRIỂN DÀNH CHO AGENT (AGENT WORKFLOW RULES)

1. **Đọc `Plan.md` đầu mỗi session:** Mỗi khi bắt đầu một phiên chat mới (new chat), Agent **BẮT BUỘC** đọc file `Plan.md` này đầu tiên để nắm rõ bối cảnh dự án, kiến trúc, và các task đã hoàn thành/chưa hoàn thành.
2. **Chia nhỏ Task & Làm từng phần:** Không triển khai dồn dập toàn bộ web cùng lúc. Luôn chia dự án thành các Task chức năng độc lập (Task 1, Task 2, Task 3...).
3. **Cập nhật tiến độ sau khi hoàn thành task:** Sau khi làm xong mỗi task:
   - Đánh dấu `[x] Completed` vào checklist ở **Mục 5: Danh sách Task & Tiến độ**.
   - Ghi chú ngắn gọn những thay đổi đã thực hiện và đường dẫn các file chính.
4. **Kiểm thử kỹ lưỡng (Testing strictness):**
   - Trước khi commit, phải chạy lệnh kiểm thử (`npm run build` hoặc chạy dev server kiểm tra không lỗi TypeScript, không lỗi Linting).
   - Đảm bảo giao diện responsive trên Mobile & Desktop, không vỡ layout.
5. **Git Commit & Push:**
   - Commit với thông điệp rõ ràng theo chuẩn Conventional Commits (ví dụ: `feat: add hero banner component`, `fix: handle missing episode stream link`).
   - Push lên nhánh `main` (hoặc nhánh làm việc) để Vercel tự động build & deploy preview/production.

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
| **TASK-2** | Thiết kế Layout tổng thể (Header/Navbar đa cấp, Theme Cinema Dark Mode, Mobile Menu Drawer, Footer) | 🔄 Pending | Chưa bắt đầu |
| **TASK-3** | Phát triển Trang Chủ (`app/page.tsx`): Hero Slider Banner, Phim Mới Cập Nhật, Phim Bộ, Phim Lẻ, Top Phim | 🔄 Pending | Chưa bắt đầu |
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
