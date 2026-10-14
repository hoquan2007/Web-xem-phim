# Kết quả triển khai — 14/10/2026

Đã triển khai các sửa chữa trong workspace, chưa commit/push/deploy và chưa đổi cấu hình tài khoản hosting. Báo cáo ban đầu và JSON before được giữ làm baseline.

## Thay đổi chính

- Next/ESLint cùng 16.4.0, cập nhật dependency semver-compatible và lockfile; thêm server-only.
- Tách helpers client, API server và route live search `/api/search` có validation/rate limit.
- KKPhim + NguonC active; OPhim tắt mặc định và có opt-in/kill switch.
- Transport/schema errors giữ code/status; fallback hoạt động khi lỗi, empty hợp lệ không bị coi là outage. Fetch và cả reader response body đều được hủy theo deadline; payload tối đa 4 MiB.
- Health theo nguồn và operation, bounded samples/cooldown/Retry-After; không ghi thành công fallback vào primary.
- NguonC dùng metadata thật, native slug, pagination thật và taxonomy snapshot đã xác minh. Identity type/id/season được kiểm chứng trước khi merge episode hoặc tìm nguồn thay thế.
- CSP cập nhật HLS/player/CDN thật; COEP tương thích iframe. Player sửa timer, race cache/SSR và Safari native error path.
- UI phân biệt outage/empty/not-found; dropdown search hoạt động lần đầu, server/episode state theo URL, selector reset đúng từ quick control.
- Storage read an toàn, filter records hỏng, giữ source/identity trong dữ liệu mới; bỏ seed comments và migrate seed cũ thành ghi chú cá nhân.
- Report tải JSON và nói rõ chưa gửi; OG có PNG/SVG thật; nhãn TMDB và gợi ý phim phản ánh nguồn dữ liệu.
- E2E production, mock media nội bộ, probe dùng catalogue native riêng từng provider.

## Đối chiếu findings

| Finding | Trạng thái | Bằng chứng / lưu ý |
|---|---|---|
| F01 | Đã vá production; còn dev dependency upstream | Production audit 0; toàn bộ còn 5 high package records trong ESLint/braces |
| F02 | Đã sửa | Chromium real HLS buffered, currentTime > 12s, không có CSP violation |
| F03 | Đã sửa cấu hình | frame origin đúng; COEP unsafe-none, quyền fullscreen/PiP theo player origin; iframe production mock tải được |
| F04 | Đã giảm thiểu | OPhim mặc định không được gọi; upstream vẫn cần phục hồi/xác minh trước opt-in |
| F05 | Đã sửa resolution | TMDB type/id/season và native source/slug; link mới có identity hint, fallback kiểm chứng candidate/detail |
| F06 | Đã sửa | Metadata NC thật; đã bỏ hàm synthesized movie; không đặt năm hiện tại từ slug |
| F07 | Đã sửa | Catalogue/search/type/genre/country/year NC; probe native API khỏe trong mẫu |
| F08 | Đã sửa | Test 503/failure-empty khác success-empty và kích hoạt fallback |
| F09 | Đã sửa | Rejected fetch không thoát khỏi catalogue strategy; nguồn sau chạy |
| F10 | Đã sửa | Taxonomy fallback/snapshot có ngày xác minh; NC không giả vờ có taxonomy endpoint |
| F11 | Đã sửa | Year-only đi v1 browse, live probe trả 2024 |
| F12 | Đã sửa URL builder; chờ OPhim phục hồi để live-test | Year/sort/limit/filter giữ trong query; NC unsupported được thông báo |
| F13 | Đã sửa | Iframe chỉ nạp sau hydration; loaded marker/timer cleanup; test qua 11s |
| F14 | Đã sửa | Signal tới fetch và body reader; test connection/body stalled đều cancel |
| F15 | Đã sửa | Total deadline thực, enrichment tối đa 1.8s và chỉ bằng identity verified |
| F16 | Đã sửa | Confirmed not-found khác network; page lỗi nguồn có unavailable/error UI |
| F17 | Đã sửa trong phạm vi process | Circuit breaker từng operation, không tính absence/unsupported/cancel là outage; không có health store dùng chung nhiều instance |
| F18 | Đã sửa | Client imports helper thuần; server-only chặn boundary; search route same-origin |
| F19 | Đã sửa | Bounded/dedup image candidates, placeholder empty, chỉ mirror legacy đã xác minh, CDN NC được allow |
| F20 | Đã sửa | First-query dropdown và error state riêng; input theo URL |
| F21 | Đã giảm thiểu đúng chức năng hiện có | Tải file báo cáo thật; chưa có backend gửi/ticketing, UI không hứa đã gửi |
| F22 | Đã sửa | getItem an toàn và record validation; `[null]` shelf không crash; legacy source optional |
| F23 | Đã sửa asset | OG PNG/SVG có thật; robots/sitemap mở rộng chưa thêm vì không phải lỗi asset này |
| F24 | Đã sửa | Rating TMDB, ranking đổi thành gợi ý, comments demo bỏ/migrate; lịch vẫn minh họa có disclaimer |
| F25 | Đã sửa suite/probe chính | Production mock/kill-switch; assertions dữ liệu/native provider; live smoke riêng. Các spec legacy ngoài suite chính được giữ để tham khảo |
| F26 | Đã sửa | URL là state server/episode, selector remount theo server; native source giữ trong link/history |

## Kiểm chứng

- `npm run lint`: pass, không warning.
- TypeScript và production build: pass với Next 16.4.0.
- Unit suite: **159 checks/tests** (51 sanitizer + 61 validation + 19 API regressions + 23 mock + 5 flags), static security scan pass.
- E2E production: **20 mock/recovery + 6 tắt KKPhim**, gồm bấm card NguonC giữ đúng title/provider.
- Live smoke production lấy slug hiện tại từ catalogue: **1/1 pass**; [live-final-output.txt](live-final-output.txt).
- [checks-after.json](checks-after.json): tổng hợp checks và advisory cuối.
- [regression-after.json](regression-after.json): API regression checks sau sửa.
- [browser-after.json](browser-after.json): HLS real currentTime 12.285s, readyState 4, buffered range 1, không CSP violation; live search lần đầu có kết quả. Đây là sample, không bảo đảm mọi tập/nguồn.
- [provider-after.json](provider-after.json): KKPhim/NguonC catalogue native, search/detail/schema healthy trong mẫu. Media-limit 1 chủ yếu là ảnh, không phải chứng nhận mọi player.
- [npm-audit-production-after.json](npm-audit-production-after.json): 0 advisory production.
- [npm-audit-all-after.json](npm-audit-all-after.json): 5 high dev package records, 0 critical.
- [iframe-test-output.txt](iframe-test-output.txt): iframe tải thành công và giữ được sau 11s.

## Giới hạn còn lại và rollback

Chưa deploy origin thật hoặc kiểm thử mobile Safari. NguonC embed có thể vẫn bị WAF của upstream; API khỏe không đồng nghĩa stream chắc chắn phát. OPhim chưa được phục hồi. Với URL cũ không có identity và nguồn gốc lỗi, hệ thống không đoán phim khác bằng slug và có thể báo unavailable.

Health/rate limiting là theo process. Ghi chú/bookmarks/history là local; reports chưa có server persistence. Khi cần nhiều instance hoặc hệ thống hỗ trợ thật, bổ sung storage/backend phù hợp thay vì coi memory/localStorage là đã đồng bộ.

Rollback code theo nhóm dependency, transport, provider, player/UI; giữ URL cũ và schema storage optional tương thích. Kill switch `API_DISABLE_NGUONC=1` có thể ngừng nguồn NC; `API_ENABLE_OPHIM=1` chỉ dùng sau kiểm chứng và không được vượt `API_DISABLE_OPHIM=1`. Restart/redeploy để cập nhật module env. Không bật `API_MOCK` ở production.
