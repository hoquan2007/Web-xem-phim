# Audit codebase và API — 14/10/2026

## Kết luận

Có lỗi upstream thật và lỗi tích hợp trong ứng dụng. KKPhim vẫn hoạt động trong các mẫu đã kiểm tra. OPhim ở base URL hiện cấu hình không còn phục vụ API: 16 request trả HTML 404; trang gốc hiển thị `Sorry, the website has been stopped`. CDN `image.ophim1.com` không phân giải DNS từ môi trường probe. NguonC vẫn có catalogue, search và detail hoạt động nhưng code mới dùng detail, truyền sai slug và bỏ metadata.

Một nguyên nhân trực tiếp gây màn hình đen đã được xác nhận trên Chromium với production build: HLS `a.kvp726.com` trả 200 và CORS `*`, nhưng `connect-src` chặn; iframe dự phòng `player.phimapi.com` cũng bị `frame-src` chặn. Trang phim trả 200 nhưng sau đó hiển thị “Server không khả dụng”.

**Chưa sửa logic ứng dụng hoặc đổi provider/dependency.** Các thay đổi của audit là tài liệu, bằng chứng JSON và script tái hiện. Kế hoạch triển khai nằm ở [PLAN.md](PLAN.md).

## Phạm vi và giới hạn

- Rà soát các tầng `src/app`, components, hooks, types, API adapters/orchestrator, validation/sanitizer, Next config/proxy, scripts, test fixtures, E2E và CI. Inventory hiện có 66 file dưới `src`, 24 file scripts/tests trước khi thêm script audit.
- Đọc hướng dẫn của đúng Next.js 16.2.12 trong `node_modules/next/dist/docs`: fetch, Server/Client Components và metadata.
- 108 quan sát HTTP trong ma trận chính, gồm **toàn bộ 26 thể loại và 36 quốc gia** do KKPhim công bố; thêm 15 quan sát cho NguonC thay thế, CDN/DNS, tài liệu và filter. GET media dùng range để giới hạn tải.
- Detail dùng hai slug lấy độc lập từ catalogue của mỗi nguồn có catalogue hoạt động; kiểm tra riêng slug chia sẻ giữa nguồn. Không lấy một slug KKPhim làm phép đo uptime cho mọi nguồn.
- API có tham số động và hàng chục nghìn phim: kết quả không khẳng định mọi tập, mọi trang và mọi URL video đều hoạt động. Media là mẫu tại thời điểm kiểm tra, không phải chứng nhận playback toàn bộ thư viện.
- DNS/TLS/403 chỉ phản ánh môi trường kiểm tra. Phân biệt API chết, phim không có ở nguồn đó, WAF và CSP của ứng dụng; không suy ra provider chết từ một phim 404.
- Không kiểm tra deployment Vercel thực tế hoặc thay đổi cấu hình tài khoản bên ngoài. Browser kiểm tra production server cục bộ cổng 3200.

## Kết quả kiểm thử hiện có

| Kiểm tra | Kết quả | Ý nghĩa |
|---|---|---|
| `npm run lint` | PASS, gồm script audit | Không có lỗi ESLint |
| `npx tsc --noEmit` | PASS | Không có lỗi kiểu trong phạm vi tsconfig |
| `npm run test:unit` | PASS: 244 assertions/tests | 51 sanitize + 61 validate + 57 API + 23 mock + 52 disable flag |
| Static security scan | 64 file, 0 findings | Không chứng minh dependency/upstream an toàn |
| `npm run build` | PASS; 9 trang prerender | Build thật ngoài sandbox; lỗi quyền SWC trong sandbox không được tính là lỗi code |
| E2E mock / disable KKPhim | PASS: 15 + 5 tests | Chạy **next dev**, theo config thực tế |
| Audit tái hiện API offline | 9/9 vấn đề tái hiện | [regression-results.json](regression-results.json) |
| Chromium production thực tế | Home 200, 132 link phim; phim 200 nhưng player lỗi | [browser-results.json](browser-results.json) |
| `npm audit` toàn bộ dependency | 1 critical + 11 high, 12 package records | [npm-audit.json](npm-audit.json) |
| `npm audit --omit=dev` | 1 critical + 4 high, 5 package records | [npm-audit-production.json](npm-audit-production.json) |

Dependency advisory là các package record có thể phụ thuộc lẫn nhau, không phải 12 lỗ hổng độc lập đã khai thác thành công. Không thực hiện khai thác bảo mật.

## Ma trận endpoint

Chi tiết URL, status, Content-Type, latency, mẫu schema và server nằm trong [live-results.json](live-results.json). Bảng dưới dùng base URL đang có trong code.

| Nguồn | Endpoint / nhóm | Kết quả | Kết luận / xử lý |
|---|---|---|---|
| KKPhim | `/danh-sach/phim-moi-cap-nhat?page=1` | 200, 24 phim | Giữ làm nguồn chính |
| KKPhim | `/v1/api/tim-kiem?keyword=avengers&page=1&limit=6` | 200, 6 phim | Endpoint sống; dropdown có lỗi UI riêng |
| KKPhim | `/v1/api/the-loai`, `/v1/api/quoc-gia` | 200, 26 / 36 mục | Schema `{status,data.items}` đang hợp lệ |
| KKPhim | `/v1/api/danh-sach/{phim-bo,phim-le,hoat-hinh,tv-shows}` | Cả 4 trả 200 | Giữ |
| KKPhim | 26 `/v1/api/the-loai/{slug}` | 26/26 trả 200, có items | Chưa thấy dead endpoint trong taxonomy này |
| KKPhim | 36 `/v1/api/quoc-gia/{slug}` | 36/36 trả 200, có items | Chưa thấy dead endpoint trong taxonomy này |
| KKPhim | `/phim/{slug-native}` | 2/2 trả 200, metadata và episodes | Giữ |
| KKPhim | `/phim/avengers-endgame` | 404 | Slug fixture không hợp lệ tại thời điểm probe; search vẫn có Avengers với slug khác |
| OPhim | `/v1/api/danh-sach/phim-moi-cap-nhat` | 404 HTML | Fallback catalogue hiện hỏng |
| OPhim | `/v1/api/tim-kiem` | 404 HTML | Fallback search hiện hỏng |
| OPhim | `/v1/api/the-loai`, `/v1/api/quoc-gia` | 404 HTML | Taxonomy không khả dụng ở base hiện tại |
| OPhim | 4 `/v1/api/danh-sach/{type}` | 404 HTML | Fallback type hiện hỏng |
| OPhim | `/v1/api/the-loai/hanh-dong`, `/v1/api/quoc-gia/han-quoc` | 404 HTML | Fallback filter hiện hỏng |
| OPhim | `/v1/api/phim/{slug}` — 2 mẫu | 404 HTML | Detail không khả dụng ở base hiện tại |
| OPhim | `/v1/api/home`, `/v1/api/danh-sach/phim-moi`, legacy latest/detail | Cả 4 trả 404 | Chỉ thay path chưa giải quyết được sự cố hiện tại |
| OPhim | Trang gốc `ophim1.com` | 200 HTML “website has been stopped” | Không xem root 200 là API khỏe |
| OPhim | `image.ophim1.com` | Không phân giải DNS | Bỏ khỏi chuỗi ảnh active sau khi tắt nguồn |
| OPhim | `img.ophim.live` root | 200 HTML “website has been stopped” | Chưa có CDN thay thế được kiểm chứng bằng ảnh thật |
| OPhim candidate | `ophim1.cc/v1/api/home`, `ophim19.cc/v1/api/home` | Lỗi mạng/TLS từ probe | Chưa đủ căn cứ đổi sang các host này |
| NguonC | `/api/films/phim-moi-cap-nhat?page=1` | 200, 10 phim | Có thể nâng cấp thành catalogue fallback |
| NguonC | `/api/films/search?keyword=avengers` | 200, 10 phim | Candidate search hoạt động trong mẫu |
| NguonC | `/api/film/{slug-native}` | 2/2 trả 200 | Có metadata thật và episodes |
| NguonC | `/api/film/{kkphim-slug}` — 2 mẫu | 404 | Lỗi nhận diện phim giữa provider |
| NguonC | 4 `/api/films/danh-sach/{type}` | 4/4 trả 200, 10 phim | Candidate thay thế đã probe |
| NguonC | `/api/films/the-loai/hanh-dong`, `/quoc-gia/han-quoc`, `/nam-phat-hanh/2024` | 3/3 trả 200 | Cần chuẩn hóa pagination/filter capabilities trước khi wire-in |

NguonC response list dùng `paginate.current_page`, `total_page`, `total_items`, `items_per_page`; tên gốc là `original_name`. Không dùng parser KKPhim cho nguyên payload này. Endpoint candidate lấy từ [tài liệu NguonC](https://phim.nguonc.com/api-document) và được xác minh bằng GET; dữ liệu [nguonc-alternatives.json](nguonc-alternatives.json).

## Media: API 200 chưa đủ để phát được phim

| Tài nguyên | Probe | Browser/config | Phương án |
|---|---|---|---|
| KKPhim poster/thumb ở `phimimg.com` | 206, Content-Type ảnh | Ảnh chính trong mẫu home tải được | Giữ; sửa fallback ảnh theo nguồn |
| HLS `a.kvp726.com/.../index.m3u8` | 200 / 206, `#EXTM3U`, CORS `*`; child playlist 206 | `connect-src` chặn trong Chromium | Thêm origin đã kiểm chứng cho connect/media; kiểm tra child playlist, segment/key |
| Iframe `player.phimapi.com/player/?url=...` | 206 HTML player | `frame-src` chặn | Cho phép đúng player origin; kiểm tra thêm COEP và Permissions-Policy |
| NguonC poster/thumb `img.nguonc.com` | 206, ảnh thật | Chưa có trong `images.remotePatterns` và CSP img-src | Thêm đúng CDN khi tích hợp metadata/catalogue |
| NguonC `embed15.streamc.xyz` | 403 trang Cloudflare, X-Frame-Options SAMEORIGIN của response lỗi | Không có trong CSP frame-src | Đây là mẫu bị WAF/chặn, không kết luận mọi video chết; không hứa playback sau khi chỉ sửa CSP |

Lưu ý: `net::ERR_ABORTED` của RSC prefetch khi chuyển trang không được tính là API chết. Một sự kiện `script-src/eval` được ghi nhận trong browser audit; chưa xác định nguồn, không đưa thành lỗi chức năng đã kết luận.

## 26 vấn đề cần xử lý

P0: bảo mật cần xử lý trước khi công khai server ảnh hưởng. P1: chức năng cốt lõi, fallback hoặc tính đúng dữ liệu. P2: vận hành/UX/độ bền. Dấu **Live**, **Repro**, **Code** lần lượt chỉ bằng chứng thực tế, tái hiện offline và nhánh code đã xác định; không gọi mọi mục Code là lỗi đã chạy browser.

| ID | Mức | Vấn đề, ảnh hưởng và vị trí | Hướng khắc phục |
|---|---|---|---|
| F01 | P0 | **Live advisory:** Next 16.2.12 thuộc dải affected; production có Next critical và 4 package high. `package.json`, lockfile. | Nâng Next và eslint-config-next cùng dòng đã vá; npm audit hiện đề xuất Next 16.4.0. Rà soát từng advisory theo tính năng sử dụng, cập nhật lockfile và chạy production regression. |
| F02 | P1 | **Live browser:** HLS mới `a.kvp726.com` còn sống nhưng bị CSP chặn. `src/proxy.ts:133`. | Đồng bộ danh sách CDN thật vào connect/media, kiểm tra cả segment/key/redirect. |
| F03 | P1 | **Live browser:** iframe dự phòng `player.phimapi.com` bị CSP chặn. `src/proxy.ts:116`. | Bổ sung đúng frame origin và browser test; không mở `frame-src *`. |
| F04 | P1 | **Live:** OPhim base URL đang ngừng phục vụ, API 404 HTML; CDN configured lỗi DNS. `src/lib/api/adapters.ts:324`. | Tắt bằng `API_DISABLE_OPHIM=1` trong lần cấu hình triển khai tiếp theo; chỉ bật lại khi có host chính thức và contract/media probe đạt. |
| F05 | P1 | **Live + Code:** `orchestrateMovieDetail` gửi cùng slug cho mọi nguồn. Cùng phim TMDB TV 307106 season 1: KK dùng `tung-buoc-ben-nhau-tien-si-yeu-duong-phan-1`, NC dùng `tung-buoc-ben-nhau`. `providers.ts:474`. | Lưu provider refs và canonical identity; match TMDB type/id/season, fallback title+year có kiểm chứng; không merge phim chỉ theo slug. |
| F06 | P1 | **Repro:** NC/OPhim detail bỏ `movie` bằng `undefined as unknown as ...`; orchestrator bịa tên/năm/type từ slug dù NC có metadata. `adapters.ts:482,533`, `providers.ts:637`. | Normalize movie thật; model partial detail đúng kiểu; metadata không có thì hiển thị thiếu dữ liệu, không bịa năm hiện tại. |
| F07 | P1 | **Live + Code:** NC `list/search/categories/countries` là stub. KK tắt + OPhim hỏng thì catalogue không có nguồn thật. `adapters.ts:498`. | Wire-in list/search đã xác minh; taxonomy chỉ khai báo khi có endpoint/map phù hợp; capability matrix rõ ràng. |
| F08 | P1 | **Repro:** HTTP lỗi/JSON sai/schema sai biến thành `{status:false,items:[]}`; `fallbackOnEmpty:false` coi đó là success và không thử fallback. Ảnh hưởng search/filter/country/genre. `adapters.ts:95,253`, `providers.ts:373`, `api.ts:248`. | Phân biệt success-empty với failure ngay tại adapter; error invokes fallback, empty hợp lệ giữ nguyên. |
| F09 | P1 | **Repro:** catalogue không catch rejected fetch; lỗi mạng ném ra khỏi orchestrator, provider khỏe phía sau không chạy. `providers.ts:349–369`. | Catch mỗi provider, phân loại network/cancelled, tiếp tục fallback trong budget. |
| F10 | P1 | **Repro:** getCategories/getCountries chỉ gọi KK; KK 503/disable trả [], không dùng taxonomy fallback. `api.ts:268,284`. | Taxonomy strategy riêng, cache dữ liệu hợp lệ gần nhất; không ghi đè cache tốt bằng lỗi. |
| F11 | P1 | **Live:** lọc chỉ năm/sort đi vào KK legacy latest, upstream bỏ qua filter. `year=2024` trả cả 2026/2023/2021, trong khi v1 phim-le trả toàn 2024. `adapters.ts:174`. | Dùng endpoint có hỗ trợ filter cho browse; xác minh semantics all-types, không tự giới hạn tất cả kết quả thành phim lẻ. |
| F12 | P1 | **Repro:** OPhim URL builder bỏ year, sort, limit và các filter thứ hai; search bỏ limit. `adapters.ts:356,448`. | Serialize theo capabilities, giữ filter kết hợp; báo unsupported thay vì bỏ im lặng. |
| F13 | P1 | **Code:** failTimer iframe luôn fire sau 10s; onLoad chỉ đổi state, không clear timer. Iframe đã load vẫn bị gỡ sau 10s. `VideoPlayer.tsx:90,101`. | Timer ref/loaded marker, clear trên load và cleanup; onLoad không chứng minh video cross-origin phát được, cần health/failure UX phù hợp. |
| F14 | P2 | **Repro:** withTimeoutSimple không nối AbortSignal vào fetch; catalogue wrapper tạo signal nhưng factory bỏ signal, chỉ dừng chờ. `adapters.ts:95,99`, `providers.ts:165,359`. | Factory nhận combined signal, timeout abort fetch thật; loại wrapper timeout lồng nhau không cùng vòng đời. |
| F15 | P2 | **Repro + Code:** catalogue khai báo totalTimeoutMs nhưng không dùng; 5ms budget chạy ~94ms trong mẫu. Detail Promise.all vẫn chờ mọi secondary dù primary xong. `providers.ts:314,347,471`. | Một deadline thực cho orchestration, timeout mỗi call lấy remaining budget; metadata critical path tách khỏi secondary nếu cần. |
| F16 | P1 | **Code:** mọi nguồn lỗi / bị tắt → null → `notFound()`. Outage trở thành “phim không tồn tại”; catalogue/search nói “không khớp”. `api.ts:397`, `app/phim/[slug]/page.tsx:103`, list/search empty branches. | Giữ typed error đến UI; 404 chỉ khi phim được xác nhận absent; outage render retry/unavailable và metadata phù hợp. |
| F17 | P2 | **Code:** health ghi kết quả aggregate/fallback vào provider đầu tiên; tìm kiếm rỗng bị xem như lỗi; score không được dùng để chọn adapter/circuit break. `api.ts:219,256,389`, `adapters.ts:549`. | Record từng attempt theo đúng nguồn và operation; empty hợp lệ không làm provider unhealthy; thêm circuit breaker và cooldown theo lỗi. |
| F18 | P2 | **Code + browser logs:** Client Components import toàn bộ `api.ts` kéo adapters/orchestrator server xuống browser; server-only env/kill switch không được chia sẻ nhất quán. `Navbar.tsx:14`, `api.ts:10`, `providers.ts:26`. | Tách helper URL thuần khỏi server API; `server-only` cho providers; live search qua route same-origin được validate và rate limit. Không mở CORS chỉ để chữa kiến trúc này. |
| F19 | P2 | **Repro + Code:** mirror thay origin cho cả ảnh nguồn khác; các CDN không đảm bảo cùng path. SafeImage retry chính src ở index 0 sau lỗi đầu; getImageUrl('') ra CDN root. `api.ts:29,71`, `SafeImage.tsx:91`. | Dedupe candidates, loại src đã fail, mirror chỉ khi mapping được xác minh; empty dùng placeholder, giới hạn attempts, chọn provider CDN đúng. |
| F20 | P2 | **Live browser + Code:** focus lúc input rỗng không mở dropdown; typing chỉ đổi query. Refocus mới hiện “6 kết quả”. `Navbar.tsx:154–155`. | Mở khi gõ/focus hợp lệ; state loading/error rõ ràng, test lần gõ đầu và clear query. |
| F21 | P2 | **Code:** ReportModal chỉ setIsSubmitted/setTimeout, không lưu hay gửi; UI vẫn hứa đội kỹ thuật xử lý. `ReportModal.tsx:34`. | Lưu report qua API/storage được triển khai, status chỉ success khi persisted; nếu chưa có backend thì nói rõ báo cáo chưa gửi. |
| F22 | P2 | **Code:** getItem ở ngoài try/catch; JSON array được ép kiểu không kiểm tra item. `[null]` làm `.slug` crash; storage bị chặn có thể crash subscribe/render. `useBookmarks.ts:16,27`, `useWatchHistory.ts:16,27`, CommentSection storage. | Bao read/write trong try, validate schema từng record, version/migrate, giới hạn dung lượng; tránh comment demo bị coi là dữ liệu cộng đồng. |
| F23 | P2 | **Live local route:** metadata dùng `/images/og-banner.png` nhưng file không có, route 404. `app/layout.tsx:53,65`. | Tạo asset/đổi sang asset thật; kiểm tra OG bằng request. Không có robots/sitemap explicit: bổ sung nếu muốn SEO hoàn chỉnh. |
| F24 | P2 | **Live browser + Code:** badge “IMDb 10.0” đọc TMDB vote_average. Top Ngày/Tuần/Tháng ghép danh sách mới/quốc gia, không có view statistics; comments seed kể cả nguồn VSMOV đã gỡ. `MovieDetailInfo.tsx:46,129`, `app/page.tsx:59`, CommentSection. | Nhãn TMDB đúng nguồn; đổi ranking thành gợi ý hoặc có analytics thật; bỏ/ghi nhãn nội dung demo. Lịch round-robin đã có disclaimer, giữ là tính năng minh họa nếu chủ ý. |
| F25 | P1 | **Live tests + Code:** mock và assertion che lỗi: fixture slug Avengers hiện trả 404 thật; search chỉ kiểm tra chữ keyword trong tiêu đề; `.first().toHaveCount(1)` không chứng minh player khỏe; CI dev-mode chưa kiểm tra production playback. Probe cũ chỉ lấy slug KK và không kiểm tra catalogue OPhim. `tests/e2e/mock.spec.ts`, `disable-flag.spec.ts`, `playwright.config.ts:135`, `scripts/probe-providers.ts:461`. | Contract fixture từ payload thực, asserts dữ liệu/server/playback/CSP; một suite production; live smoke tách khỏi gate deterministic. Cập nhật README/Plan/scorecard ghi sai số nguồn, mode test, advisory cũ. |
| F26 | P2 | **Code:** EpisodeSelector reset range khi chọn tab server trong selector, nhưng quick select trong VideoPlayer gọi trực tiếp parent handler; rangeIndex cũ có thể ngoài số tập server mới. WatchContainer cũng chỉ đọc sv/ep khi khởi tạo state. `VideoPlayer.tsx:255`, `EpisodeSelector.tsx:23,47,76`, `WatchContainer.tsx:35`. | Clamp/reset group khi active server thay đổi từ mọi control; kiểm thử deep link và URL thay đổi trên cùng component. |

### Advisory cần ưu tiên

Next.js 16.2.12 nằm trong khoảng `<16.3.3` của advisory RCE khi server chạy filesystem Windows, áp dụng App Router không dùng Cache Components. Môi trường phát triển này là Windows; chưa xác minh môi trường production. Advisory yêu cầu nâng phiên bản nếu hosting Windows: [GHSA-p293-qw3h-jr36](https://github.com/advisories/GHSA-p293-qw3h-jr36).

Ngoài ra npm audit ghi nhận SSRF image optimizer trước 16.3.8: [GHSA-cjq9-62q9-8jv4](https://github.com/advisories/GHSA-cjq9-62q9-8jv4). Không có bằng chứng dự án đã bị khai thác. Một số advisory khác cần endpoint/tính năng mà dự án không dùng, nên không quy tất cả cảnh báo thành cùng mức khai thác. Khuyến nghị phiên bản trong plan lấy từ audit hiện tại, không từ ghi chú tháng 8 “chưa có bản vá”.

### Cấu hình cần kiểm thử thêm sau khi sửa CSP

Permissions-Policy hiện đặt fullscreen/autoplay/picture-in-picture chỉ `(self)` trong khi player cross-origin muốn dùng các quyền này. COEP `credentialless` cũng cần test iframe thực trên Chromium/Safari. Chưa kết luận các flag này gây hỏng mọi player; đưa vào acceptance test thay vì tự xóa toàn bộ security headers.

## Bằng chứng và cách chạy lại

- [live-results.json](live-results.json): 108 request chính.
- [extra-live-results.json](extra-live-results.json): root/CDN/DNS, HLS 200 và tài liệu NC.
- [nguonc-alternatives.json](nguonc-alternatives.json): 7 endpoint NC bổ sung.
- [filter-results.json](filter-results.json): lỗi year-only và control v1 đúng.
- [regression-results.json](regression-results.json): 9 lỗi API tái hiện offline.
- [browser-results.json](browser-results.json): CSP, dropdown, player và local 404.
- [npm-audit.json](npm-audit.json), [npm-audit-production.json](npm-audit-production.json): advisory tại thời điểm audit.

```powershell
node scripts/audit-live.mjs
node --import ./scripts/_register-test-loader.mjs --experimental-strip-types --experimental-transform-types scripts/audit-regressions.mjs
npm run build
# Terminal riêng: npm run start -- -p 3200
node scripts/audit-browser.mjs
```

Script live/browser cần Internet; run offline sẽ cho kết quả network failure, không dùng để kết luận provider chết. `audit-live.mjs` lấy mẫu media có giới hạn và không tải cả phim. E2E dev và production server phải dùng `.next` độc lập hoặc chạy nối tiếp để không tranh chấp artifact.
