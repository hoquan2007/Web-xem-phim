# Kế hoạch khắc phục sau audit 03/11/2026

**Cập nhật thực hiện:** đã triển khai bản sửa local và kiểm chứng; xem [trạng thái từng hạng mục, kết quả và phần còn lại](./fixes/IMPLEMENTATION.md). Phần bên dưới giữ nội dung kế hoạch ban đầu để đối chiếu. Chưa deploy; advisory moderate tooling, vấn đề upstream và hạ tầng dùng chung được ghi rõ trong tài liệu triển khai.

Cơ sở: [báo cáo và bằng chứng](./REPORT.md). Các hạng mục dưới đây là kế hoạch, **chưa được triển khai**. Ước lượng là thời gian thực hiện có tập trung, chưa tính chờ upstream/triển khai/kiểm tra hồi quy phát sinh.

## Thứ tự thực hiện

| Đợt | Phạm vi | Ước lượng | Điều kiện hoàn thành |
|---|---|---|---|
| A — làm trước | F01 bảo mật Next, F07 E2E, đánh giá F10 tooling | 0.5–1 ngày | Build và bộ kiểm thử đầy đủ qua; production audit không còn advisory chưa xử lý |
| B — phát phim và nguồn dự phòng | F02 CSP, F09 capabilities, điều tra gián đoạn API/media | 1–2 ngày | Player không bị website chặn origin đã xác minh; lỗi upstream được phân biệt; fallback đúng capability |
| C — dữ liệu và trạng thái lỗi | F03 mapper, F04 notes, F05 lịch, F06 history | 1–2 ngày | Dữ liệu thật được giữ, ghi chú không trộn nguồn, lỗi lưu/API hiện rõ |
| D — SEO và vận hành | F08 metadata, logging/health, đo hero | 0.5–1.5 ngày | robots/sitemap/canonical đúng, có tín hiệu chẩn đoán, có số liệu hiệu năng |

Tổng dự kiến khoảng **3–6.5 ngày công** nếu không phải thay nguồn video hoặc làm backend mới. Có thể gộp B/C trong cùng vòng phát hành, nhưng tách thay đổi dependency khỏi thay đổi dữ liệu để dễ kiểm tra và rollback.

## A. Đóng vấn đề dependency và khôi phục bộ kiểm tra

1. Giữ nguyên các thay đổi đang có; ghi lại diff/commit nền trước khi sửa. Không dùng reset/clean để tạo trạng thái “sạch”.
2. Đọc guide tương ứng trong `node_modules/next/dist/docs/` cho phiên bản sẽ dùng, cùng release notes/advisory. Pin **Next 16.4.4 + eslint-config-next 16.4.4** (registry đã xác minh tồn tại), giữ React nếu không có yêu cầu thay đổi.
3. Kiểm tra `npm ls next sharp --all` và cây dependency khi cài production. Xác minh sharp an toàn thực sự được Next dùng, không chỉ tồn tại như devDependency trực tiếp.
4. Sửa test logo: đợi navbar hoạt động, scope theo banner/logo hiển thị, kiểm tra không có hai banner visible. Không thêm retry để làm xanh bộ test.
5. Với tooling: nâng Zod qua dependency cha hoặc trong phạm vi dependency tương thích; kiểm tra minimatch và ESLint. Không downgrade theo `audit fix --force`, không override major thiếu kiểm chứng. Nếu không thể xử lý moderate bằng bản tương thích, ghi nhận riêng cùng điều kiện ảnh hưởng và kế hoạch theo dõi.
6. Chạy lint, TypeScript, unit, production build, E2E mock + kill-switch; lưu audit production và toàn bộ mới. Cập nhật README bằng kết quả mới, giữ báo cáo audit lịch sử như chứng cứ theo ngày.

**Nghiệm thu:** 169 assertion/test hiện có vẫn qua; tất cả 127 E2E mock và 6 kill-switch qua (hoặc số test tăng do bổ sung regression), không skip mới, không còn build SecurityFatalError do phiên bản cũ, báo rõ advisory còn lại thay vì ghi chung “đã an toàn”.

## B. Khôi phục tính tương thích player và dự phòng thực tế

### B1. Player origin — F02

- Lấy mẫu URL embed/HLS từ detail native của từng provider, xác minh scheme/hostname/redirect và yêu cầu trình duyệt.
- Tạo registry origin tin cậy dùng chung cho `frame-src`, `child-src` và Permissions-Policy tương ứng. Với embed18 chỉ thêm sau khi xác minh, không mở tất cả subdomain/domain để vượt qua lỗi.
- Thêm fixture embed18 và kiểm tra runtime CSP; giữ test chặn origin ngoài registry. Kiểm tra fullscreen/autoplay/PiP theo nguồn thật trên desktop/mobile.
- Đối với 403/WAF của provider, ghi rõ upstream unavailable và cho người dùng đổi nguồn đúng phim. Không hứa rằng đổi CSP tự giải quyết 403; không vô hiệu bảo vệ upstream.

**Nghiệm thu:** không có CSP violation do origin đã kiểm chứng của nguồn hỗ trợ; nguồn lạ vẫn bị chặn; HLS lỗi có đường recovery; ít nhất hai phim/tập thật có tiến độ phát tăng trong Chromium. Iframe không thể đọc cross-origin phải được báo là chưa xác nhận phát nếu thiếu tín hiệu đáng tin cậy.

### B2. Capability theo nguồn — F09

- Khai báo rõ catalogue/search/detail và từng loại filter được hỗ trợ.
- NguonC `phim-chieu-rap` trả `unsupported` trước khi fetch endpoint đã biết 404; filter kết hợp giữ thông báo đúng hiện tại.
- Section homepage giữ thông tin lỗi thay vì chỉ trả mảng rỗng. Phân biệt “không có phim”, “không hỗ trợ bộ lọc” và “nguồn gián đoạn”.
- Chỉ dùng nguồn thay thế có cùng identity đã xác minh; không đổi phim theo slug giống nhau. Không bật OPhim cho tới khi API, CDN và player đều được kiểm tra lại.

**Nghiệm thu:** tắt KKPhim vẫn browse/search/detail được ở nhóm NguonC hỗ trợ; section không hỗ trợ có thông báo phù hợp; không phát sinh network call tới endpoint cinema 404; circuit breaker không bị phạt vì tác vụ unsupported.

### B3. Điều tra hiện tượng chập chờn

- Gắn log có cấu trúc: requestId, route/tác vụ, provider, thời gian, errorCode, HTTP status, fallback đã thử và trạng thái circuit. Không log toàn bộ URL token/hash của stream hoặc nội dung ghi chú người dùng.
- Giữ requestId/warnings từ orchestrator tới nơi ghi log; liên kết request trang/search với provider attempt.
- Đo lại cùng kịch bản desktop/mobile với và không prefetch để xác định có khuếch đại request hay không. Chỉ thay prefetch, timeout hoặc circuit threshold sau khi có số liệu.
- Media health tách khỏi catalogue health; không đánh dấu cả provider chết vì một tập/manifest 404.

**Nghiệm thu:** có thể giải thích một lần UI báo unavailable bằng log tương ứng; không gán nguyên nhân chỉ từ HTTP 200 của probe hoặc hiện tượng hồi phục sau vài giây.

## C. Sửa dữ liệu và phản hồi lỗi

### C1. Mapper — F03

- Tách chuẩn hóa riêng KKPhim/NguonC/OPhim; dùng fixture rút gọn từ response thật, có ngày xác minh.
- KKPhim: giữ `trailer_url` sau validate URL; preserve metadata cần cho detail.
- NguonC: parse `casts`, `director` dạng chuỗi; normalize timestamp string về `{time}`; ánh xạ group Định dạng; giữ nhãn thể loại/quốc gia và chỉ sinh link khi có slug/alias đã xác minh.
- Không dùng kiểu ép TypeScript để che schema runtime. Contract test phải đối chiếu trường có thật ở raw với output, không chỉ kiểm tra `name`/`slug`/`poster`.

**Nghiệm thu:** mẫu “Hoàng Hậu Tái Hôn” giữ 4 diễn viên, 2 đạo diễn, ngày sửa đổi, quốc gia và thể loại; lịch nhận đúng ngày ở múi giờ Việt Nam; mẫu KKPhim có link trailer hiển thị; fixture lỗi schema vẫn kích hoạt fallback.

### C2. Ghi chú theo identity — F04

- Truyền source + native slug vào CommentSection và dùng cùng quy tắc định danh cho storage/cache/listener.
- Giữ dữ liệu legacy `hnq_comments_<slug>`; quyết định migration bảo thủ khi thiếu nguồn, tránh tự gán nhầm. Có thể hiển thị “ghi chú cũ chưa xác định nguồn” để người dùng chọn liên kết khi cần.
- Regression: cùng slug khác source không đọc/ghi/xóa chéo; reload và nhiều tab đồng bộ đúng; ghi lỗi không báo thành công.

**Nghiệm thu:** case tái hiện trong `edge.json → notes` không còn rò giữa hai nguồn; ghi chú cũ vẫn truy cập được theo chính sách đã chọn.

### C3. Trạng thái lịch và lịch sử — F05/F06

- Schedule nhận trạng thái cả latest và series: lỗi toàn bộ hiện ApiUnavailable/retry, lỗi một phần giữ phần còn lại và thông báo; success-empty mới hiện “chưa có phim”.
- History hook trả kết quả ghi/xóa/clear và phản hồi lỗi cho watch/tủ phim. Không cản việc xem phim khi storage bị chặn.
- Kiểm tra quota, SecurityError, storage JSON hỏng, timezone/ngày rỗng và unknown timestamp. Không xóa dữ liệu người dùng để sửa lỗi parse.

**Nghiệm thu:** server all-disabled không bị hiểu thành ngày không có phim; partial data vẫn thấy; chặn setItem/removeItem khiến UI báo lỗi rõ ràng; successful history/bookmark behavior giữ nguyên.

## D. Metadata, vận hành và hiệu năng

### D1. SEO — F08

- Chọn home canonical `/phimhay` hoặc `/` theo quyết định sản phẩm; route còn lại redirect hoặc canonical tương ứng.
- Thêm robots và sitemap bằng convention phiên bản Next đang dùng. Quy định canonical cho collection/country/category/detail; xử lý source/identity/query nhất quán.
- Định nghĩa index/noindex cho search, filter query, watch và tủ phim; chỉ đưa URL có nội dung ổn định vào sitemap.
- Kiểm tra HTML trả từ public URL sau deployment, không chỉ metadata object trong source.

**Nghiệm thu:** robots/sitemap trả 200 đúng MIME/nội dung; canonical tuyệt đối trỏ đúng trang; URL trùng nội dung thống nhất; không đưa local/mock/private browser data vào sitemap.

### D2. Health, rate limit và media

- Bổ sung health/readiness có timeout và dữ liệu tổng hợp tối thiểu; không gọi tất cả provider trên mỗi health request.
- Nếu cần giới hạn chung nhiều instance, chuyển rate limit/circuit sang storage dùng chung phù hợp và xác minh nguồn IP đáng tin cậy. Đây là thay đổi kiến trúc theo yêu cầu vận hành, không cần chặn bản vá chức năng trước.
- Lập phép đo có giới hạn để kiểm tra API, ảnh, manifest, segment và embed riêng. Khi triển khai monitor, chỉ báo thay đổi có ý nghĩa để tránh spam; đợt audit này không tự tạo automation.
- Đo transfer và LCP mobile cho hero. Nếu video 35 MB ảnh hưởng, encode kích thước/bitrate phù hợp, tải theo tương tác/điều kiện thiết bị và giảm preload ở reduced-motion. Không xóa asset chỉ dựa trên kích thước.

## Cổng nghiệm thu trước phát hành

1. `npm run lint`, `npx tsc --noEmit`, `npm run test:unit`, `npm run build`, `npm run test:e2e` qua.
2. Regression mới có F02–F07/F09 và contract mapper bằng fixture thật; smoke live có chi tiết + playback thực, không chỉ card render.
3. Chạy lại probe nhà cung cấp với native slug mỗi nguồn; ghi riêng lỗi API, schema, CDN, HLS và embed. Không đánh giá uptime theo slug của nguồn khác.
4. So sánh screenshot desktop/mobile cho home/catalogue/detail/watch/tủ phim/lịch; kiểm tra keyboard, loading/empty/error và reduced-motion.
5. Sau khi triển khai bản đã được phép phát hành: xác minh route/API/metadata/header trên public deployment và theo dõi lỗi; chuẩn bị rollback về artifact trước nếu xảy ra regression. Không rollback về dependency đã biết có advisory chỉ để làm xanh test.

## Tái lập các phép đo audit

- Live production server: `npm run start -- -p 3200`.
- Mock server 3201: `API_MOCK=1`, `API_MOCK_ORIGIN=http://localhost:3201`, `API_BASE_KKPHIM=http://localhost:3201/api/mock/kkphim`, `API_BASE_NGUONC=http://localhost:3201/api/mock/nguonc`, chạy Next start cổng 3201; env chỉ áp dụng process audit.
- All-disabled server 3202: `API_DISABLE_KKPHIM=1`, `API_DISABLE_NGUONC=1`, `API_DISABLE_OPHIM=1`, chạy Next start cổng 3202.
- `node docs/audit-2026-11-03/runtime-audit.mjs` và `node docs/audit-2026-11-03/edge-audit.mjs`.
- Adapter probe: `node --import ./scripts/_register-test-loader.mjs --experimental-strip-types --experimental-transform-types docs/audit-2026-11-03/provider-integration.mjs`; NguonC matrix dùng cùng command với `nguonc-matrix.mjs`.
- Các script ghi đè artifact cùng tên của đợt này; muốn giữ lịch sử cần sao lưu/chọn thư mục ngày mới trước khi chạy lại.
