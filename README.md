# PTQ Film

Website phim dùng Next.js 16.4, React 19, TypeScript và Tailwind CSS.

Giao diện hiện tại được dựng theo RoPhim với nhận diện PTQ và bỏ quảng cáo. Xem [báo cáo triển khai, ánh xạ trang và ảnh kiểm tra](docs/research/rophim/README.md). Trang chủ: `/phimhay`.

## Chạy dự án

Node.js 22.18+ hoặc Node 24; npm 10+.

```powershell
npm ci
npm run dev
```

Mở http://localhost:3000. Bản production:

```powershell
npm run build
npm run start
```

## Nguồn dữ liệu

- **KKPhim**: nguồn catalogue/metadata chính. Browse có filter dùng v1 endpoint đã xác minh.
- **NguonC**: catalogue, search, type, thể loại, quốc gia, năm và detail dự phòng. Pagination theo API thật, mặc định 10/phân trang trong mẫu hiện tại.
- **OPhim**: tắt mặc định vì API/CDN được audit đang không khả dụng. Chỉ opt-in sau khi xác minh lại cả API và CDN.

Server giữ status lỗi khác với kết quả rỗng; network/HTTP/schema/timeout đi qua fallback. Phim được nhận diện theo nguồn, native slug và TMDB type/id/season khi có dữ liệu; không ghép episode chỉ vì trùng slug. Link có identity giúp tìm nguồn thay thế đúng phim khi nguồn gốc lỗi. Link cũ thiếu identity vẫn được hỗ trợ nhưng có thể báo unavailable nếu không thể xác minh phim ở nguồn khác.

NguonC hiện chưa có contract đã xác minh cho filter kết hợp hoặc sort tùy ý: UI sẽ báo giới hạn khi chỉ còn nguồn này. Catalogue khỏe không đảm bảo mọi embed/stream khỏe; một số iframe NguonC có thể bị WAF của upstream chặn.

## Cấu hình

Xem `.env.example`; biến server cần restart/redeploy sau khi thay đổi:

| Biến | Ý nghĩa |
|---|---|
| `API_DISABLE_KKPHIM=1` | Tắt KKPhim |
| `API_DISABLE_NGUONC=1` | Tắt NguonC |
| `API_ENABLE_OPHIM=1` | Opt-in OPhim sau kiểm chứng |
| `API_DISABLE_OPHIM=1` | Kill switch ưu tiên hơn opt-in |
| `API_BASE_KKPHIM`, `API_BASE_NGUONC`, `API_BASE_OPHIM` | Override origin cho nguồn đã xác minh hoặc mock |
| `API_CDN_OPHIM` | CDN ảnh OPhim đã xác minh |
| `NEXT_PUBLIC_SITE_URL` | Origin public cho metadata |

Không đặt `API_MOCK=1` trên production. Live search gọi `/api/search` cùng origin; provider adapters có `server-only` và không nằm trong client bundle. Health/circuit breaker và rate limiting là theo process; hệ thống nhiều instance cần storage chia sẻ nếu muốn áp dụng giới hạn chung.

## Kiểm thử

```powershell
npm run lint
npx tsc --noEmit
npm run test:unit
npm run build
npm run test:e2e
```

`test:e2e` mặc định chạy mock và tắt KKPhim trên **next start**. Mock API, ảnh và iframe ở cùng server; HLS mock cố ý 503 để kiểm tra fallback. Unit tests kiểm tra lỗi HTTP/mạng/schema, deadline, hủy cả response body, metadata/identity và storage hỏng. Real HLS progress được kiểm chứng riêng bằng Chromium live audit.

```powershell
# Chỉ chạy khi có Internet/upstream hoạt động
npm run test:e2e:live
npm run test:probe -- --media-limit 1
node scripts/audit-regressions.mjs
# Terminal riêng: npm run start -- -p 3200
node scripts/audit-browser.mjs docs/audit-2026-10-14/browser-after.json
```

Probe lấy native slug từ catalogue riêng mỗi nguồn; không dùng một slug KKPhim để chấm uptime NguonC. Kết quả probe là mẫu tại thời điểm đo.

## Player và dữ liệu cá nhân

CSP cho phép đúng origin ảnh/player/HLS đã kiểm chứng. COEP là `unsafe-none` để tương thích iframe ngoài; CSP, COOP, CORP, HSTS và các header khác vẫn được áp dụng. Iframe được nạp sau hydration để không bỏ lỡ onLoad và không bị gỡ nhầm sau 10 giây.

Bookmarks/history và ghi chú lưu trên trình duyệt; dữ liệu cũ được đọc tương thích và lọc record hỏng. Báo cáo sự cố tải thành file JSON, **chưa gửi tới đội kỹ thuật**. Website không có backend cộng đồng/báo cáo trong phiên bản này.

## Audit và trạng thái sửa

Thiết kế giao diện rạp phim mới đã triển khai ở local ngày 15/10/2026: nền tối, poster làm trọng tâm, controls dùng chung và cải thiện mobile/bàn phím. Xem [kết quả triển khai frontend và ảnh kiểm chứng](docs/frontend-audit-2026-10-15/IMPLEMENTATION.md), [kế hoạch](docs/frontend-audit-2026-10-15/PLAN.md) và hệ thống giao diện tại [design.md](design.md). Bản này chưa tự deploy lên Vercel.

- [Báo cáo ban đầu](docs/audit-2026-10-14/REPORT.md)
- [Kế hoạch](docs/audit-2026-10-14/PLAN.md)
- [Đối chiếu triển khai và giới hạn còn lại](docs/audit-2026-10-14/IMPLEMENTATION.md)

Audit production sau cập nhật hiện không còn advisory. Còn 5 high package records trong chuỗi dev dependency ESLint/braces; không downgrade Next/ESLint để chạy audit force.
