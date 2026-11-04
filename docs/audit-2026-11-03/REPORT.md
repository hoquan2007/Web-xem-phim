# Rà soát website, API nhà cung cấp và hệ thống — 03/11/2026

Ngày báo cáo theo Asia/Bangkok (UTC+7). Đây là kiểm tra bản working tree hiện tại, có nhiều thay đổi sẵn từ trước; không sửa mã ứng dụng, nâng dependency hoặc deploy trong đợt này.

## Kết luận

Website dựng và chạy được; các luồng cơ bản phần lớn hoạt động. Có **10 nhóm vấn đề cần xử lý**, trong đó ưu tiên trước là dependency Next.js có advisory, CSP chặn player NguonC mới, và bộ E2E đang thất bại. Các lỗi dữ liệu còn lại ảnh hưởng trực tiếp đến thông tin phim, ghi chú, lịch cập nhật và lưu lịch sử.

Không có bằng chứng để kết luận tất cả nhà cung cấp đều chết hoặc website bị khai thác. HLS KKPhim từng trả 404 trong probe đầu nhưng **hai mẫu đã phát thật được** ở lượt sau. Cần giữ phân biệt lỗi ứng dụng, lỗi upstream theo thời điểm, và rủi ro kiến trúc chưa được đo tải.

Kế hoạch cụ thể: [PLAN.md](./PLAN.md).

## Phạm vi và kết quả kiểm tra

Luồng được rà: trang chủ/chủ đề/danh sách → lọc hoặc tìm kiếm → adapter và nhà cung cấp → chi tiết → chọn tập/player → lưu dữ liệu trên trình duyệt.

| Kiểm tra | Kết quả mới |
|---|---|
| ESLint | Qua, không báo lỗi |
| TypeScript | `npx tsc --noEmit` qua |
| Unit/assertions | 169 qua, 0 lỗi; scanner nội bộ không phát hiện vấn đề trong 87 file |
| Production build | Compile/type/static generation qua; lần đầu exit 1 do cảnh báo bảo mật Next.js, retry exit 0 nhưng vẫn cảnh báo |
| E2E mock đầy đủ | **126 qua, 1 lỗi**; chạy lại riêng bài lỗi vẫn thất bại |
| E2E tắt KKPhim | **6/6 qua**, chạy riêng vì chuỗi chính dừng sau lỗi mock |
| Browser live local | 26 tình huống ở mỗi viewport 1440×960 và 375×812: **52 quan sát trang** |
| Browser rendering | Không ghi nhận `pageerror`, ảnh đã tải bị hỏng hoặc tràn ngang trong các snapshot này; không bao gồm mọi ảnh lazy-load bên dưới màn hình |
| Provider probe chuẩn | 10 endpoint KKPhim/NguonC: HTTP và schema đều qua; 16 mẫu media, 14 thành công ở lần đo này |
| Upstream mở rộng | 107 quan sát, gồm toàn bộ **26 thể loại + 36 quốc gia** đang được KKPhim quảng bá |
| Adapter/orchestrator live | 6 kiểu catalogue/search và detail native của 2 nguồn hoạt động ở lần đo độc lập |
| NguonC riêng | 11 trường hợp: 9 hoạt động, phim chiếu rạp trả 404, filter kết hợp bị từ chối có chủ đích |
| Public website | 8 GET vào `https://hnqfilm.vercel.app`; 5 trang trả 200, robots/sitemap 404, mock API 404 như mong đợi |
| Inventory tĩnh | 100 source files, 28 entry points; 0 module TypeScript không thể đến từ entry point, 0 runtime dependency không có import, 0 asset trùng byte |

Đã duyệt `/`, `/phimhay`, `/danh-sach` và trang 2/filter kết hợp, `/phim-le`, `/phim-bo`, `/chu-de`, cả 7 collection `/c/*`, thể loại, quốc gia, tìm kiếm rỗng/có kết quả/không có kết quả, lịch cập nhật, tủ phim, detail của mỗi nguồn, watch của mỗi nguồn, route không tồn tại và collection không tồn tại. Browser test có thao tác menu, filter, search, bookmark, lịch sử, đổi tập/nguồn, recovery, bàn phím và XSS trong suite hiện có.

## Các lỗi có bằng chứng

### F01 — P1: Next.js 16.4.0 nằm trong phạm vi advisory production

- `package.json:32` pin Next 16.4.0. `npm audit --omit=dev` báo **1 package record critical**, gồm **3 advisory**: SVG image optimization RCE, Server Actions DoS và typed-array `use cache` RCE.
- Build đầu đã dừng với `SecurityFatalError`; retry thành công không có nghĩa advisory được khắc phục.
- Cần đánh giá điều kiện khai thác, không đồng nhất kết quả version scan với RCE đã xác nhận: `npm ls next sharp --all` cho thấy Next dùng **sharp 0.35.5**, đáp ứng workaround của advisory ảnh; không tìm thấy `use server`, `use cache` hoặc `cacheComponents` trong mã/config hiện tại. Môi trường local là Windows; advisory ảnh mô tả glibc Linux. Chưa xác minh cây dependency thực tế trên deployment.
- Bản vá tối thiểu trong các advisory là 16.4.1; registry hiện cung cấp **16.4.4**, có `eslint-config-next` cùng phiên bản và peer dependencies tương thích React 19/ESLint 9 đang dùng.
- **Khắc phục:** nâng Next + eslint-config-next đồng bộ lên bản vá đã kiểm chứng, giữ sharp an toàn trong cây production, chạy lại build/audit/E2E. Cập nhật nhận định “production 0 advisory” trong README sau khi có kết quả mới.
- Bằng chứng: [npm production audit](./npm-audit-production.json), [build đầu](./build.txt), [build retry](./build-retry.txt), [bản vá trên registry](./next-patch.json).
- Nguồn chính thức: [advisory image optimization](https://github.com/advisories/GHSA-2464-fhr4-w9xw), [Server Actions](https://github.com/advisories/GHSA-p3m5-59mp-jv5r), [use cache](https://github.com/advisories/GHSA-673q-mjm6-r5xr).

### F02 — P1: CSP chặn player NguonC đang được API trả về

- Phim `hoang-hau-tai-hon` từ NguonC trả iframe trên **`https://embed18.streamc.xyz`**.
- `src/proxy.ts:81` chỉ liệt kê embed1/embed15; Permissions-Policy tại dòng 181–183 cũng dùng danh sách cũ.
- Chromium ghi nhận `frame-src` violation; trang watch hiển thị **“Server không khả dụng”**, iframe bị loại khỏi DOM.
- **Khắc phục:** xác minh origin mới, quản lý danh sách player được phép ở một nơi và đồng bộ CSP/Permissions-Policy; thêm regression với hostname thực tế. Không mở toàn bộ `https:` hoặc wildcard mọi domain để chữa nhanh.
- **Giới hạn:** probe trực tiếp embed18 còn nhận 403 từ upstream. Sửa CSP chỉ gỡ chặn ở phía website; chưa chứng minh được nguồn phát đó sẽ hoạt động sau sửa.
- Bằng chứng: [runtime.json → playback NguonC](./runtime.json), [ảnh player](./screenshots/watch-nguonc.png), [provider probe](./providers.json).

### F03 — P2: Adapter làm mất dữ liệu có thật của nhà cung cấp

Tại `src/lib/api/adapters.ts:100,118–135`:

| Trường | Upstream thật | Kết quả ứng dụng |
|---|---|---|
| Trailer KKPhim | Có `trailer_url` YouTube | `normalizeDetail` không đưa trường này vào movie; tab báo chưa có trailer |
| Diễn viên NguonC | `casts` là chuỗi danh sách tên | Adapter chỉ đọc `raw.actor` dạng array → `[]` |
| Đạo diễn NguonC | `director` là chuỗi | Adapter chỉ nhận array → `[]` |
| Thể loại/quốc gia NguonC | Group/list có `id`, `name`, **không có slug** | `normalizeTaxonomy` yêu cầu slug → loại toàn bộ |
| Thời điểm NguonC | `modified`/`created` là chuỗi ISO | `record(raw.modified)` → `{}`; lịch không nhận ra ngày cập nhật |
| Loại phim NguonC | Có group “Định dạng” | Không ánh xạ → `type: unknown` |

- Mẫu: “Hoàng Hậu Tái Hôn” có 4 diễn viên, 2 đạo diễn, 5 thể loại và quốc gia Hàn Quốc; object đã chuẩn hóa mất các thông tin trên. Đây là lỗi mapper, không phải API thiếu dữ liệu.
- **Khắc phục:** tách mapper theo contract từng nguồn; hỗ trợ chuỗi/array đúng trường, chuẩn hóa timestamp, giữ trailer. Nhãn taxonomy không có slug phải đối chiếu bảng alias/slug đã kiểm chứng; không tự suy ra đường dẫn upstream thiếu căn cứ.
- Bằng chứng: [raw fields trong edge.json](./edge.json), [movie sau adapter](./provider-integration.json).

### F04 — P2: Ghi chú bị trộn giữa các nguồn trùng slug

- `src/components/watch/CommentSection.tsx:52` lưu bằng `hnq_comments_${slug}`; cache và listeners cũng chỉ theo slug.
- Tái hiện trên mock: ghi chú ở `/phim/avengers-endgame?source=kkphim`, sau đó mở cùng slug `source=nguonc` → ghi chú xuất hiện ở nguồn kia. Hai bên dùng chung đúng một khóa localStorage.
- **Khắc phục:** định danh ghi chú theo provider + native slug; có chính sách tương thích dữ liệu cũ thiếu source. Không tự động nhân bản/gán note cũ cho mọi phim cùng slug và không xóa dữ liệu cũ.
- Bằng chứng: [edge.json → notes](./edge.json), [ảnh](./screenshots/notes-collision.png).

### F05 — P2: Lịch cập nhật che giấu lỗi toàn bộ nguồn

- `src/app/lich-chieu/page.tsx` chỉ chuyển `items` sang `ScheduleView`, bỏ trạng thái lỗi của cả hai kết quả.
- Server local cổng 3202 tắt toàn bộ nguồn: `/danh-sach` báo nguồn không khả dụng, `/api/search` trả 503, nhưng `/lich-chieu` trả 200 và ghi **“Chưa có phim cập nhật trong ngày này”**.
- **Khắc phục:** tách trạng thái thành công-rỗng, lỗi toàn bộ và dữ liệu một phần; truyền trạng thái vào view, giữ dữ liệu còn tốt và thông báo gián đoạn có nút thử lại.
- Bằng chứng: [edge.json → outages](./edge.json).

### F06 — P2: Lỗi lưu lịch sử chỉ có trong console

- `src/hooks/useWatchHistory.ts:48–88` bắt lỗi `localStorage` rồi `console.error`, không trả kết quả để UI thông báo.
- Tái hiện `Storage.setItem` ném `QuotaExceededError`: bấm Xem Ngay vẫn điều hướng, không có cảnh báo lịch sử không lưu; storage không có record. Bookmark và ghi chú đã có thông báo nhưng history chưa có.
- **Khắc phục:** trả kết quả ghi/xóa rõ ràng, đưa trạng thái lỗi lên watch/tủ phim; giữ trải nghiệm xem phim khi không lưu được; không cập nhật cache như đã thành công.
- Bằng chứng: [edge.json → storage](./edge.json).

### F07 — P2: Một bài E2E làm chuỗi kiểm tra thất bại

- `tests/e2e/homepage.spec.ts:73–74` dùng `header img.wordmark-symbol` với thao tác yêu cầu một element.
- Cả lần chạy 127 bài và lần chạy lại riêng đều lỗi strict mode: selector bắt **2 ảnh**. Navbar dùng Suspense; DOM có header fallback và header trong đoạn streaming. Không có bằng chứng hai header cùng hiển thị cho người dùng.
- `npm run test:e2e` dùng `&&`, vì vậy project kill-switch không chạy nếu lỗi này còn; trong audit đã chạy 6 bài đó riêng và đều qua.
- **Khắc phục:** chờ navbar hydrate/hoạt động, kiểm tra banner/logo hiển thị bằng locator theo role/phạm vi phù hợp; xác minh chỉ có một banner hiển thị. Không dùng retry hoặc `.first()` để che lỗi nhiều element.
- Bằng chứng: [E2E đầy đủ](./e2e.txt), [chạy lại riêng](./e2e-logo-recheck.txt), [ảnh thất bại](./screenshots/logo-test-failure.png), [kill-switch](./e2e-disable-flag.txt).

### F08 — P2: Thiếu robots/sitemap và canonical cho các URL trùng nội dung

- Public website trả **404 cho `/robots.txt` và `/sitemap.xml`**. Source không có route/file cho hai tài nguyên này. Meta `robots` trong layout không tạo robots.txt.
- 52 snapshot không có `link rel=canonical`; `/` và `/phimhay` cùng render trang chủ, collection và route quốc gia cũng có các URL tương đương. Một số trang kế thừa `og:url` của trang chủ, một số trang ghi đè openGraph nên thiếu URL.
- Đây là thiếu sót SEO/metadata, không làm player ngừng chạy.
- **Khắc phục:** chọn URL chuẩn cho mỗi nhóm nội dung, canonical theo route và identity/provider, robots/sitemap phù hợp. Quyết định rõ cách index query filter, search, watch và dữ liệu cá nhân trước khi sinh sitemap; không liệt kê hàng loạt mọi tổ hợp query.
- Bằng chứng: [runtime.json → production/pages](./runtime.json), [edge.json → http](./edge.json), `src/app/layout.tsx`.

### F09 — P2: NguonC nhận tác vụ phim chiếu rạp dù endpoint không có

- `buildNguoncListUrl({type:'phim-chieu-rap'})` dựng `/api/films/danh-sach/phim-chieu-rap?page=1`; API thật trả **404**.
- Khi KKPhim không hoạt động, tác vụ này được thử như một nguồn dự phòng bình thường rồi trả lỗi. `getHomeFeed` còn bỏ trạng thái API và trả mảng items, nên hàng phim chiếu rạp có thể biến mất mà không giải thích.
- Các loại series/single/hoạt hình/TV, thể loại, quốc gia và năm độc lập đã qua. Filter kết hợp bị `unsupported` là giới hạn đã công khai, không phải lỗi mới.
- **Khắc phục:** khai báo capability từng nguồn/tác vụ, trả `unsupported` cho thao tác đã biết không hỗ trợ; xử lý thông báo theo từng section và không làm hỏng sức khỏe catalogue do endpoint không có.
- Bằng chứng: [nguonc-matrix.json](./nguonc-matrix.json), `src/lib/api/adapters.ts:163–169`, `src/lib/home-collections.ts:15`.

### F10 — P2: Advisory tooling đã thay đổi, tài liệu cũ không phản ánh hiện tại

- Full npm audit: **18 package records = 1 critical + 1 high + 16 moderate**. Production chỉ có record Next critical; phần còn lại thuộc dev/tooling.
- High là `zod <4.6.6`; moderate lan truyền qua minimatch/ESLint. Số package records không phải số lỗ hổng độc lập.
- Một số `fixAvailable` gợi ý downgrade ESLint xuống 4 hoặc eslint-config-next về 0.x; không phù hợp stack này.
- **Khắc phục:** cập nhật tooling trong phạm vi tương thích, kiểm tra cây phụ thuộc và audit sau thay đổi; không chạy `npm audit fix --force` theo gợi ý downgrade. Ghi rõ advisory nào còn tồn tại và phạm vi dev/production.
- Bằng chứng: [npm-audit.json](./npm-audit.json). Nguồn: [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5), [minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249).

## Quan sát cần theo dõi, không gán nguyên nhân khi chưa đủ bằng chứng

1. **Upstream media không ổn định:** probe đầu nhận HLS KKPhim 404; lượt browser sau chính phim đó chạy `currentTime≈14.74s`, phim thứ hai `≈15.47s`, đều `readyState=4`. Iframe NguonC trả 403 khi gọi trực tiếp. Không thể chữa WAF/quyền truy cập upstream chỉ bằng đổi CSP.
2. **Tìm kiếm/detail gián đoạn theo lượt:** lượt desktop `/tim-kiem?keyword=avengers` và detail KKPhim báo unavailable, lượt mobile sau trả kết quả/metadata bình thường; một số trang chuyển sang NguonC. Adapter độc lập sau đó qua. Có thể liên quan upstream, traffic prefetch hoặc circuit breaker, nhưng không có log request/provider tương ứng để chứng minh nguyên nhân. Cần đo/log trước khi sửa chiến lược timeout/fallback.
3. **Observability hạn chế:** orchestrator có requestId/warnings, nhưng `src/lib/api.ts` không đưa đầy đủ diagnostics đến log vận hành; không có `/api/health` hay log media tập trung trong source. Báo cáo này không truy cập log/env riêng của deployment, nên không kết luận trạng thái vận hành production từ local.
4. **Giới hạn theo process:** rate limit `/api/search` và HealthRegistry dùng `Map` trong memory. Đây là rủi ro khi chạy nhiều instance, không phải lỗi distributed đã tái hiện. Cần kiểm tra forwarding-header trust và storage dùng chung nếu triển khai yêu cầu giới hạn toàn cục.
5. **Video hero nặng:** asset lớn nhất ~35.2 MB; `HeroMedia` dùng `preload="auto"` kể cả khi reduced-motion làm video pause. Chưa đo Core Web Vitals hay băng thông mobile thật; nên đo transfer/LCP trước khi chọn encode hoặc chính sách tải.
6. **HTTP 200 cho notFound sau streaming:** `/c/not-a-collection` hiển thị 404 nhưng HTTP 200, có meta `noindex`. Đây là hành vi streaming của Next.js; không ghi nhận thành lỗi chức năng trong đợt này.

## Nhà cung cấp và phần đã xác minh hoạt động

- **KKPhim:** latest/search/type/category/country hoạt động; 26/26 thể loại và 36/36 quốc gia HTTP 200 trong mẫu. Adapter giữ native identity; 2 HLS sample phát được ở lượt sau. Không suy ra mọi phim/tập đều phát được.
- **NguonC:** catalogue/search/detail và bộ lọc đơn qua; phân trang thực 10 item được giữ. Có lỗi mapper và CSP như F02/F03; embed trả 403 trong probe. Là nguồn dự phòng catalogue có ích, chưa thể coi là dự phòng phát phim hoàn chỉnh.
- **OPhim:** 16 quan sát endpoint trên origin mặc định đều không thành công (404); hai hostname ứng viên không kết nối được. Tắt mặc định là đúng. Không tự bật lại hay đổi origin chưa xác minh.
- **Website:** mock API bị 404 khi không bật API_MOCK; catalogue/search phân biệt trạng thái unavailable ở các trang chính; bookmarks/history có định danh theo nguồn trong luồng đã sửa trước; kiểm tra XSS, storage regression và kill switch hiện có phần lớn qua.

## Bằng chứng và giới hạn

- [Runtime desktop/mobile/public](./runtime.json), [kiểm tra lỗi biên](./edge.json), [probe chuẩn](./providers.json), [upstream mở rộng](./upstream-full.json), [adapter live](./provider-integration.json), [NguonC matrix](./nguonc-matrix.json), [inventory](./code-inventory.json).
- [Lint](./lint.txt), [TypeScript](./typescript.txt), [unit](./unit.txt), [build](./build-retry.txt), [E2E](./e2e.txt).
- Script tái lập nằm trong thư mục này: `runtime-audit.mjs`, `edge-audit.mjs`, `provider-integration.mjs`, `nguonc-matrix.mjs`. Runtime cần server live 3200, mock 3201 và all-disabled 3202 như mô tả trong plan.
- DNS bị giới hạn trong sandbox ở lần thử đầu; các kết quả mạng dùng trong báo cáo là lần đã chạy ngoài sandbox có kết nối được. Không coi lỗi DNS sandbox là downtime nhà cung cấp. Turbopack trong sandbox cũng không hoàn tất; build ngoài sandbox đã hoàn tất.
- Không sửa/deploy, không kiểm tra khai thác bảo mật, tải lớn, mọi phim/tập, Safari/Firefox, toàn bộ nội dung CDN hoặc log/env production. Public HTTP kiểm tra được tính khả dụng của URL, không chứng minh deployment giống working tree local.
