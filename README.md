# 🎬 HNQ Film (Web-xem-phim)

Website xem phim trực tuyến **HNQ Film** — Next.js 16 App Router, TypeScript, Tailwind CSS, Glassmorphism Cinema Dark UI.

> Xem tài liệu đầy đủ: [`Plan.md`](./Plan.md) — kiến trúc, danh sách task, changelog audit (FIX-1 → FIX-7).

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
```

Mở <http://localhost:3000> trên trình duyệt.

---

## 🗂️ Cấu trúc project

Xem chi tiết trong `Plan.md` §4. Tóm tắt:

```
src/
├── app/              # Next.js App Router (route + page + layout)
├── components/       # Shared UI (layout, home, watch, filter, search, ui)
├── lib/              # API client, sanitize, utils
├── hooks/            # useBookmarks, useWatchHistory (useSyncExternalStore)
└── types/            # movie.ts (toàn bộ interface API)

public/               # Static fallback assets
next.config.ts        # image optimization, remotePatterns
```

---

## 🌐 Deploy lên Vercel

1. Push repo lên GitHub:
   ```bash
   git add .
   git commit -m "chore(deps): drop framer-motion, upgrade lucide-react (FIX-7)"
   git push origin main
   ```
2. Vào <https://vercel.com/new> → Import GitHub repo.
3. Framework Preset: **Next.js** (auto-detect).
4. Bấm **Deploy**. Vercel sẽ tự chạy `npm run build` rồi public URL.

**Không cần biến môi trường** — toàn bộ dữ liệu phim được nạp từ KKPhim public API (`https://phimapi.com`), không cần key.

---

## 📜 License & Credit

- Dữ liệu phim: cung cấp bởi [KKPhim (PhimAPI)](https://phimapi.com) — credit tới nguồn gốc.
- Mã nguồn: dự án cá nhân HNQ.
