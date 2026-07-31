# 🎬 HNQ Film (Web-xem-phim)

Website xem phim trực tuyến **HNQ Film** — Next.js 16 App Router, TypeScript, Tailwind CSS, Glassmorphism Cinema Dark UI.

> Xem tài liệu đầy đủ: [`Plan.md`](./Plan.md) — kiến trúc, danh sách task, changelog audit (FIX-1 → FIX-10).

---

## 📋 Yêu cầu môi trường

| Tool | Phiên bản khuyến nghị | Ghi chú |
|---|---|---|
| **Node.js** | `≥ 20.x` (phát triển trên Node 24.x, build pass trên 20/22/24) | Vercel runtime mặc định Node 22 cũng OK |
| **npm** | `≥ 10.x` | npm 11.x tạo `package-lock.json` mới — vẫn tương thích |
| **Git** | bất kỳ | để push lên GitHub → Vercel auto-deploy |

> **Lưu ý:** `npm audit` hiện cảnh báo 3 high CVE kế thừa từ Next 16 (`postcss`, `sharp` trong `node_modules/next`). Đây là nợ của upstream, đã được document trong `Plan.md` §6.7 / Mục 8 (FIX-7). Chưa có bản vá ổn định — `npm audit fix --force` sẽ downgrade Next xuống 9.3.3 nên **không** chạy.

---

## 🚀 Lệnh chạy

```bash
# 1. Cài dependencies
npm install

# 2. Dev server (Turbopack, port 3000)
npm run dev

# 3. Production build + start
npm run build
npm run start          # mặc định port 3000

# 4. Lint + type check
npm run lint
npx tsc --noEmit

# 5. Tests (xem section 🧪 bên dưới)
npm run test:unit
npm run test:e2e
```

Mở <http://localhost:3000> trên trình duyệt.

---

## 🧪 Testing

App có **3 lớp test** chạy tự động trong CI:

| Layer | Command | Mô tả | Tests |
|---|---|---|---|
| **Sanitize (XSS)** | `npm run test:sanitize` | HTML sanitizer giữ an toàn content upstream | 51 |
| **Validate (input)** | `npm run test:validate` | Input/clamp helpers cho URL params | 60 |
| **Security scan** | `npm run test:security` | Static analysis tìm `eval`/`dangerouslySetInnerHTML`/`innerHTML` | 58 files |
| **Unit (chain 3 trên)** | `npm run test:unit` | Tất cả unit tests | 111 |
| **E2E (Playwright)** | `npm run test:e2e` | Browser regression suite (Chromium, prod build) | 52 |

**E2E chi tiết:**

```bash
# 1 lần sau khi clone: install Chromium
npm run test:e2e:install

# Chạy production build + Playwright trên port 3100
npm run test:e2e

# Debug modes
npm run test:e2e:headed     # browser visible
npm run test:e2e:ui         # Playwright UI mode (watch + debug)
npm run test:e2e:report     # mở HTML report sau khi chạy
```

E2E cover: **homepage smoke**, **static routes** (/, /chu-de, /lich-chieu, /tu-phim, /danh-sach, /tim-kiem, /the-loai/hanh-dong, /quoc-gia/han-quoc), **watch page** + bookmark persistence + episode nav, **search & filter** (danh-sach với type/year/sort), **security headers** (CSP/X-Frame-Options/Permissions-Policy/Referrer-Policy), **XSS regression** (synopsis không inject script).

Tất cả E2E chạy trên **production build** (`next start`), không phải dev server — để verify đúng behavior của bundle thật.

---

## 🔒 Security headers (FIX-10.1 + FIX-10.2)

App set các security headers ở `src/proxy.ts` (Next.js 16 middleware):

| Header | Value | Mục đích |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline' https://*.googletagmanager.com ...; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; ...` | Chống XSS, clickjacking, plugin injection |
| `X-Frame-Options` | `DENY` | Legacy clickjacking defense |
| `X-Content-Type-Options` | `nosniff` | Chống MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Privacy cho cross-origin requests |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), ...` | Tắt sensor không cần thiết |
| `Cross-Origin-Opener-Policy` | `same-origin` | Chống cross-window attack |
| `Cross-Origin-Embedder-Policy` | `require-corp` *(prod only)* | Bắt buộc CORP/CORS cho embedded resource |
| `Cross-Origin-Resource-Policy` | `same-origin` | Chống resource hijack |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` *(prod only)* | Ép HTTPS 1 năm + HSTS preload |

**Quyết định design:** CSP **không dùng nonce** để giữ prerendering cho 9 trang static (nonce buộc dynamic render). `'unsafe-inline'` cho script/style được justified vì toàn bộ inline content là controlled (user input đi qua `sanitizeHtml()` trước khi render).

**Input validation (FIX-10.5):** tất cả URL params (`slug`, `keyword`, `page`, `year`, `sort_field`, `sort_type`, `movie_type`) đi qua `src/lib/validate.ts` để clamp/sanitize trước khi đưa xuống API. Chống DoS (vd `?page=999999999`) và reflected XSS.

---

## 🗂️ Cấu trúc project

Xem chi tiết trong `Plan.md` §4. Tóm tắt:

```
src/
├── app/              # Next.js App Router (route + page + layout)
├── components/       # Shared UI (layout, home, watch, filter, search, ui)
├── lib/              # API client, sanitize, validate, utils
├── hooks/            # useBookmarks, useWatchHistory (useSyncExternalStore)
└── types/            # movie.ts (toàn bộ interface API)

proxy.ts              # Next.js 16 middleware (CSP + security headers)
tests/e2e/            # Playwright E2E suite (52 tests)
scripts/              # test-sanitize, test-validate, test-security (unit)
.github/workflows/    # CI: lint + type-check + unit + build + e2e

public/               # Static fallback assets
next.config.ts        # image optimization, remotePatterns
playwright.config.ts  # Playwright config
```

---

## 🌐 Deploy lên Vercel

1. Push repo lên GitHub:
   ```bash
   git add .
   git commit -m "feat: security headers + E2E regression suite (FIX-10)"
   git push origin main
   ```
2. Vào <https://vercel.com/new> → Import GitHub repo.
3. Framework Preset: **Next.js** (auto-detect).
4. Bấm **Deploy**. Vercel sẽ tự chạy `npm run build` rồi public URL.

**Không cần biến môi trường** — toàn bộ dữ liệu phim được nạp từ KKPhim public API (`https://phimapi.com`), không cần key.

**Lưu ý security:** Vercel mặc định serve qua HTTPS → HSTS header có hiệu lực ngay. CSP + các headers khác có hiệu lực cả trên dev lẫn prod. Trên dev `localhost` (HTTP), một số browser sẽ ignore HSTS/upgrade-insecure-requests — đó là behavior đúng.

---

## 📜 License & Credit

- Dữ liệu phim: cung cấp bởi [KKPhim (PhimAPI)](https://phimapi.com) — credit tới nguồn gốc.
- Mã nguồn: dự án cá nhân HNQ.
