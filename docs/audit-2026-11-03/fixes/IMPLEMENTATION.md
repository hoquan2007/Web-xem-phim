# Triển khai sau audit 03/11/2026

Đã sửa trên working tree hiện tại, giữ các thay đổi có sẵn. Chưa deploy. Báo cáo/plan ban đầu được giữ như tài liệu lịch sử; tài liệu này ghi trạng thái sau sửa.

| Hạng mục | Trạng thái |
|---|---|
| F01 Next advisory | Next + eslint-config-next pin 16.4.4; production audit 0 advisory |
| F02 player CSP | Registry origin chung, thêm embed18; CSP và Permissions-Policy đồng bộ; không mở wildcard toàn mạng |
| F03 mapper | Giữ trailer; NguonC nhận casts/director dạng chuỗi, timestamp ISO, nhãn thể loại/quốc gia, định dạng; taxonomy không có alias xác minh chỉ hiển thị nhãn |
| F04 notes | Storage/cache/listener theo source + slug; note legacy giữ nguyên và hiển thị riêng là chưa xác định nguồn |
| F05 schedule | Lỗi toàn bộ hiện unavailable; dữ liệu một phần có thông báo |
| F06 history | Ghi/xóa lỗi có trạng thái dùng chung, hiện cảnh báo ở detail/watch/tủ phim; không cản xem phim |
| F07 E2E | Selector logo chỉ kiểm tra header/footer hiển thị; bộ mock và kill-switch đều qua |
| F08 SEO | Robots/sitemap; canonical cho home/list/taxonomy/detail; search/watch/tủ phim noindex; filter query hạn chế index |
| F09 NguonC cinema | Trả unsupported trước network request; homepage feed giữ trạng thái lỗi và thông báo theo section |
| F10 tooling | Zod lên 4.6.7, hết high; còn 16 moderate records thuộc ESLint/minimatch |

Đã thêm `/api/health` không fan-out network: trả danh sách nguồn bật, trạng thái circuit của process và cờ đã có sample; media luôn ghi rõ chưa probe. Log lỗi/degraded catalogue/detail có requestId, provider, mã lỗi, elapsed time, HTTP status nếu có và nguồn đã thử; không ghi tiêu đề hay URL stream/token. Log này giúp truy dấu ở mức orchestration, chưa thay cho tracing từng HTTP attempt hoặc hệ thống log tập trung.

Trailer hero chuyển preload sang metadata; reduced-motion không gán video src cho tới khi người dùng bấm phát. Pause thông thường vẫn giữ nguồn để tiếp tục xem. Không xóa/encode lại các video hiện có khi chưa có số liệu mạng người dùng thật.

## Kiểm chứng

- Lint và TypeScript qua.
- 171 unit/assertion qua (thêm contract NguonC thật và trailer/capability); scanner nội bộ giữ trong suite.
- Production build với Next 16.4.4 qua, không còn SecurityFatalError do bản cũ.
- **130 E2E mock + 6 E2E kill-switch qua**, không skip. Thêm kiểm tra ghi chú khác nguồn, cảnh báo quota qua điều hướng và endpoint SEO/health/player policy.
- Test timestamp ghi chú dùng khóa mới; reduced-motion kiểm tra không tải src trước thao tác; các bài autoplay/pause/rapid navigation vẫn qua.
- [Audit production](./npm-audit-production.json): 0; [toàn bộ](./npm-audit-all.json): 16 moderate, 0 high/critical. Không dùng audit force hoặc downgrade dependency.
- [Lint](./lint.txt), [TypeScript](./typescript.txt), [unit](./unit.txt), [build](./build.txt), [E2E](./e2e.txt), [cây dependency](./dependency-tree.txt).
- [Live verification](./live-verification.json): hai HLS KKPhim đạt 14.41s và 15.40s, readyState 4; robots/sitemap/health trả 200; canonical home/lịch đúng route; lịch all-disabled báo unavailable.
- Mobile reduced-motion có **0 request MP4 trước tương tác**. Hai lượt đo có/không chặn prefetch ghi nhận 17/16 request prefetch được khởi tạo, tài nguyên ghi nhận khoảng 1.21/1.18 MB. Đây là mẫu localhost có cache/điều kiện khác nhau, không đủ để quy lỗi outage cho prefetch hay kết luận Core Web Vitals. Vì vậy giữ chính sách prefetch hiện tại.
- Đã xem lại [screenshot mobile](./mobile-false.png); server audit 3200/3202 đã dừng.

## Giới hạn còn lại

- Embed18 từng bị upstream trả 403. Chính sách website đã tương thích origin, nhưng không thể cam kết player upstream/WAF hoạt động từ mọi mạng. OPhim vẫn tắt mặc định.
- Còn 16 moderate advisory trong tooling; cần bản nâng tương thích từ dependency cha. Không ghi các record này thành lỗi production.
- Health/rate limiting vẫn theo process; chưa thêm backend dùng chung vì plan chỉ yêu cầu khi có nhu cầu nhiều instance. Health không xác nhận mọi phim phát được.
- Chưa deploy hoặc đọc log/env riêng production; vì vậy robots/canonical và player trên public deployment chỉ được xác minh sau phát hành. Chưa tự tạo monitoring/automation.
- Không kết luận nguyên nhân của sự cố upstream chập chờn cũ khi thiếu log thời điểm đó. Đã thêm diagnostics cho lần xảy ra tiếp theo.
- Không thực hiện load test, Core Web Vitals trên thiết bị/mạng thật hoặc bảo đảm mọi phim/tập. Phép đo localhost là kiểm tra hành vi, không đại diện độ trễ production.
