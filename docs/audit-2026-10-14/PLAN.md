# Kế hoạch sửa API và ổn định dự án

Ngày lập: 14/10/2026. Căn cứ: [REPORT.md](REPORT.md), payload/probe và 9 reproductions. Đây là backlog chưa triển khai; không coi một checkbox là đã hoàn tất nếu chưa có evidence tương ứng.

> **Cập nhật triển khai 14/10/2026:** các sửa chữa đã được viết và kiểm thử trong workspace. Xem [IMPLEMENTATION.md](IMPLEMENTATION.md) để đối chiếu từng F01–F26, các giảm thiểu thay cho chức năng backend chưa có và phần còn phụ thuộc upstream. Checklist bên dưới được giữ làm kế hoạch gốc; trạng thái hiện tại nằm trong bảng triển khai, không trong các ghi chú completed lịch sử.

## Kế hoạch thực hiện và đầu ra cụ thể

Mục tiêu hoàn thành: nguồn chính phát được phim; API lỗi thực sự chuyển sang fallback; NguonC giữ đúng phim, metadata và pagination; lỗi upstream không biến thành 404 sai; test production phát hiện được các lỗi audit. Thực hiện tăng dần trên kiến trúc hiện tại, giữ các hàm public đang được page sử dụng trong quá trình chuyển đổi.

| Việc | Lỗi xử lý | File chính cần sửa / thêm | Phụ thuộc | Đầu ra và điều kiện hoàn tất |
|---|---|---|---|---|
| T01 — Chốt baseline và test tái hiện | F25 | `scripts/audit-regressions.mjs`, `scripts/test-api.ts`, `tests/e2e`, fixtures | Không | Chuyển lỗi đã xác nhận thành test mong đợi hành vi đúng; giữ bằng chứng before/after, không sửa expectation để hợp thức hóa bug |
| T02 — Vá dependency | F01 | `package.json`, `package-lock.json` | T01 | Framework và config ESLint tương thích, đọc docs bản mới; build/lint/typecheck/test đạt, audit production được rà soát |
| T03 — Khôi phục player | F02, F03, F13 | `src/proxy.ts`, `src/components/watch/VideoPlayer.tsx`, player tests | T01 | HLS thật tải/phát, iframe không bị gỡ sau 10s, không có CSP block cho nguồn được phép |
| T04 — Ngừng gọi OPhim hỏng | F04 | `src/lib/api/adapters.ts`, cấu hình env và tài liệu triển khai | T01 | Flag tắt nguồn được server áp dụng; không tự đổi sang mirror chưa xác minh; vẫn giữ adapter để có thể bật lại sau kiểm chứng |
| T05 — Tách server khỏi browser | F18 | `src/lib/api.ts`, thêm `src/lib/api/helpers.ts`, thêm `src/app/api/search/route.ts`, các Client Components đang import API | T03, T04 | Helpers dùng được trên client; adapter server-only; live search gọi same-origin, validate input, kill switch thống nhất ở server |
| T06 — Sửa kết quả API, fallback và timeout | F08, F09, F10, F14, F15, F16, F17 | `src/lib/api/providers.ts`, `adapters.ts`, `api.ts`, các page và error UI | T05 | Lỗi mạng/503/schema/timeout đi qua fallback, empty hợp lệ giữ nguyên, HTTP status còn trong diagnostics, deadline abort fetch thật, outage không bị báo phim không tồn tại |
| T07 — NguonC và nhận diện phim | F05, F06, F07 | `src/types/movie.ts`, `adapters.ts`, `providers.ts`, `api.ts`, movie links, bookmarks/history | T06 | Catalogue/search/detail thật; provider refs không mất khi click card; match TMDB type/id/season; dùng metadata thật thay dữ liệu bịa từ slug |
| T08 — Sửa lọc và phân trang | F11, F12 | URL builders/normalizers trong `adapters.ts`, filter pages, contract tests | T06; kiểm tra lại sau T07 | Lọc năm độc lập và filter kết hợp đúng; không bỏ sort/limit im lặng, pagination theo response từng nguồn |
| T09 — Sửa ảnh và CDN | F19 | `src/lib/api/helpers.ts`, `src/components/ui/SafeImage.tsx`, `next.config.ts`, `src/proxy.ts` | T05, T07 | Ảnh NguonC được phép tải, src lỗi không retry lặp, không đoán mirror khác nguồn, thiếu ảnh dùng placeholder |
| T10 — Search và điều khiển tập | F20, F26 | `Navbar.tsx`, `SearchBarForm.tsx`, `WatchContainer.tsx`, `EpisodeSelector.tsx` | T05, T06 | Dropdown xuất hiện lần gõ đầu; đổi server bằng mọi control đều reset/clamp đúng; URL và state đồng bộ |
| T11 — Lưu trữ, report và nội dung UI | F21, F22, F23, F24 | hooks storage, `ReportModal.tsx`, `CommentSection.tsx`, metadata/assets, rating/ranking UI | T07, T10 | Storage invalid không crash; report không báo gửi thành công giả; OG trả 200; rating đúng nguồn và dữ liệu minh họa được ghi nhãn |
| T12 — CI production và kiểm chứng vận hành | F25; nghiệm thu F01–F26 | `playwright.config.ts`, mock fixtures/media, `.github/workflows/ci.yml`, `scripts/probe-providers.ts`, README/scorecard | Hoàn tất từng phần từ T01; nghiệm thu sau T02–T11 | Regression production đạt; probe native từng nguồn; có bảng đóng/mở đủ 26 finding và bằng chứng cuối |

T01 và phần test của T12 được thực hiện từ đầu, bổ sung cùng mỗi thay đổi. Không chờ sửa xong mọi thứ mới viết test. Các PR trong tài liệu là cách chia thay đổi đề xuất; chưa tạo PR hay thực hiện deploy.

## Các quyết định cần chốt trong lúc triển khai

1. **Bản dependency:** kiểm tra registry/advisory tại thời điểm bắt đầu T02; `16.4.0` là đề xuất từ audit ngày 14/10, không tự coi là phiên bản phù hợp vĩnh viễn. Đọc tài liệu Next cài mới trước khi sửa API/framework.
2. **Lọc tất cả loại theo năm:** probe endpoint có hỗ trợ thật trước khi chọn. Nếu upstream không hỗ trợ all-types, UI phải yêu cầu chọn loại hoặc thông báo rõ giới hạn; không ghép một trang phim bộ + phim lẻ rồi bịa tổng/phân trang.
3. **Provider refs:** ưu tiên thông tin có sẵn và resolution trong request; nếu cần nguồn từ URL thì validate provider qua allowlist, không chấp nhận URL upstream tùy ý. Giữ link KK cũ; refs được lưu trong bookmark/history mới. Chỉ thêm kho mapping bền vững nếu đã xác định nhu cầu và hạ tầng phù hợp.
4. **Report:** trước mắt sửa thông báo để phản ánh đúng khả năng hiện có. Nếu triển khai gửi báo cáo thật, phải chọn nơi lưu bền vững phù hợp deployment; localStorage chỉ là bản lưu trên máy người dùng, không được gọi là đã gửi tới đội kỹ thuật. Không tự thêm dịch vụ/email mới chỉ để đóng finding.
5. **NguonC playback:** catalogue/search/metadata và stream có trạng thái riêng. Nếu embed vẫn WAF/không cho nhúng, không đánh dấu server khả dụng chỉ vì API detail trả 200.
6. **Taxonomy dự phòng:** nguồn không có taxonomy API thì dùng mapping đã xác minh/last-known-good với timestamp; không tạo danh sách “thể loại đầy đủ” từ vài phim mẫu.

## Checklist bàn giao

- [ ] Có hàng kết quả cho từng F01–F26: `đã sửa`, `đã giảm thiểu`, hoặc `còn phụ thuộc upstream`, kèm file và evidence. Không đánh dấu tất cả completed nếu còn case không xử lý.
- [ ] Lint, typecheck, unit/contract tests và production build chạy thành công với lockfile cuối.
- [ ] Production E2E dùng media mock hợp lệ: phát HLS, lỗi nguồn, chuyển nguồn, iframe qua mốc 10s, filter/search, storage lỗi và provider kill switch.
- [ ] Live smoke lấy slug native từ catalogue, kiểm tra ít nhất phim bộ/phim lẻ và hai phim từng nguồn active; đối chiếu title/year/season và media thực.
- [ ] KK hoạt động, KK lỗi, OPhim tắt, toàn nguồn lỗi và toàn nguồn tắt đều có hành vi đúng. NguonC 10/page không bị biến thành 24/page trong UI.
- [ ] Browser không có CSP violation cho ảnh/player/playlist/segment/key đã được phép; ghi riêng lỗi do WAF/upstream và những nguồn còn chưa phát được.
- [ ] URL cũ, bookmark/history cũ còn mở đúng phim sau migration.
- [ ] Báo cáo advisory production sau sửa và hướng dẫn rollback từng đợt được lưu.
- [ ] Thử deployment origin thật sau khi triển khai; báo cáo rõ nếu chưa kiểm chứng mobile Safari hay hosting thực tế.

## Quyết định về provider

| Nguồn | Quyết định | Điều kiện |
|---|---|---|
| KKPhim | Giữ primary catalogue và metadata | Các route/type/taxonomy đã probe đều sống; sửa CSP và semantics year/sort |
| OPhim | Tạm loại khỏi active chain bằng kill switch | API base hiện tại 404 HTML, CDN unavailable. Không chọn mirror mới chỉ vì root trả 200 |
| NguonC | Nâng thành catalogue/search/detail fallback | Chuẩn hóa schema thật, provider refs và pagination trước khi đưa vào chain; playback được kiểm chứng riêng |
| TMDB | Chỉ cân nhắc bổ sung metadata/identity khi cần | Không phải nguồn stream thay thế; dùng ID đã có trong payload trước để tránh thêm API/key không cần thiết |
| Nguồn mới khác | Chưa cần tích hợp ngay | Chỉ khảo sát nếu KK+NC không đáp ứng. Contract/media probe và tính tương thích phải đạt trước khi thêm |

API metadata khỏe và nguồn phát khỏe là hai phép đo riêng. Với NC, catalogue 200 không bảo đảm iframe streamc tránh WAF. Không dùng proxy tùy ý để vượt WAF hoặc mở iframe/stream URL không được kiểm soát.

## Đợt 1 — Khôi phục xem phim và vá dependency

Ưu tiên F01–F04, F13. Có thể chia thành PR cấu hình/player và PR dependency để cô lập regression.

- [ ] Nâng `next` cùng `eslint-config-next` lên bản cùng dòng đã vá. Audit hiện đề xuất `next@16.4.0`; xác minh version tương ứng của eslint-config trước khi pin và đọc docs của phiên bản cài mới. Rà soát sharp/postcss và transitive packages còn lại qua lockfile mới.
- [ ] Chạy audit production và toàn bộ sau update; ghi nguyên nhân nếu advisory còn tồn tại. Không dùng `npm audit fix --force` nếu nó kéo framework xuống dòng khác.
- [ ] Cấu hình `API_DISABLE_OPHIM=1` trong môi trường triển khai kế tiếp, redeploy/restart để module đọc lại flag. Chưa đặt biến trong tài khoản bên ngoài trong phiên audit này.
- [ ] Thêm origin HLS `https://a.kvp726.com` vào connect/media và `https://player.phimapi.com` vào frame allowlist, trên cơ sở sample đã xác minh. Xây registry chung cho CDN/provider và CSP/image config để tránh lệch sau này.
- [ ] Kiểm tra master playlist → variant → segment → key/redirect; mở thêm origin chỉ sau khi xác minh có trong đường phát thật. Không lấy hostname tự do từ upstream để nhét thẳng vào security policy.
- [ ] Sửa timer iframe: lưu timer, clear khi load/cleanup, state không chuyển sang failed sau 10s nếu đã load. Xử lý HLS fail nhưng không có embed bằng error state đúng thay vì chuyển sang mode không có nguồn.
- [ ] Kiểm tra COEP và quyền fullscreen/PiP/autoplay đối với player cross-origin trên browser thực; giữ security headers có ích, điều chỉnh đúng origin cần quyền.

**Nghiệm thu:** phim có HLS `a.kvp726.com` phát được đến thời gian >0, buffer có dữ liệu; không có CSP violation cho nguồn đã xác minh. Iframe vẫn tồn tại sau khi tải và qua mốc 10s. Một HLS cố tình lỗi vẫn chuyển sang nguồn/UX dự phòng đúng. Next build, typecheck, lint và E2E production đều pass, advisory được xử lý/đánh giá có căn cứ.

## Đợt 2 — Sửa contract lỗi và fallback

Ưu tiên F08–F10, F14–F18. Sửa tầng contract trước khi wire-in NC để không nhân rộng các lỗi cũ.

- [ ] Adapter trả discriminated result: `success(data)`, `empty`, `not_found`, `unsupported`, `failure(code,httpStatus,retryAfter,latency,provider,requestId)`; status business và HTTP không ép vào cùng boolean.
- [ ] Validate JSON schema tối thiểu: items phải array; movie/episode/name/slug/URL đúng kiểu; reject business status error, loại item invalid, không ép `unknown` thành MovieDetail.
- [ ] Catalogue catch từng call. Network, 429, 5xx, timeout, invalid JSON/schema thử provider kế tiếp; empty 200 hợp lệ giữ empty theo chính sách. Không retry 404 hoặc input invalid như outage.
- [ ] Taxonomy có strategy/capabilities riêng; dữ liệu hợp lệ gần nhất làm last-known-good, ghi timestamp và TTL. Provider không hỗ trợ operation được skip, không return empty giả success.
- [ ] Fetch chỉ dùng một controller/deadline hợp nhất, gắn signal vào request thật; dọn timer và abort listeners. `totalTimeoutMs` là deadline chung, không reset budget theo từng provider.
- [ ] Tách detail metadata critical path và enrichment secondary; giới hạn chờ secondary, tránh phim primary khỏe bị chậm vì nguồn phụ chết.
- [ ] Giữ error tới page để phân biệt outage và absence; dùng retry/unavailable state, chỉ gọi notFound cho xác nhận không tồn tại. Tạo error boundary thích hợp cho lỗi render/network ngoài dự kiến.
- [ ] Record health cho mỗi provider+operation, theo lỗi thật; fallback thành công không “chữa” health của primary. Circuit breaker mở sau ngưỡng lỗi, half-open sau cooldown; giới hạn retry/backoff và tôn trọng 429 Retry-After.
- [ ] Tách `src/lib/api` server-only, URL helpers thuần client-safe và same-origin live-search route có validation/rate limit. Env/kill switch đọc ở server, không sao chép default adapter vào browser.
- [ ] Giải quyết cache dedupe: params object và signal mới làm React cache khác key; metadata/page đang tạo signal riêng. Dedupe theo key chuẩn hóa provider+operation+params trong phạm vi request, giữ timeout riêng; không nhầm AbortSignal opt-out memoization với tắt persistent fetch cache.

**Nghiệm thu:** thêm regression tests tương ứng 9 reproductions. Primary 503, DNS failure, JSON invalid, timeout đều gọi healthy fallback; primary success-empty không gọi fallback sai. Timeout abort socket thật; cancellation không hiển thị stale result. Budget không vượt đáng kể cấu hình; status/error/provider còn tới logs/UI.

## Đợt 3 — Tích hợp NguonC bằng identity đúng

Ưu tiên F05–F07, F11–F12, F19.

- [ ] Normalize `original_name → origin_name`, `description → content`, native ID/name/year/type/category/country, episodes `items/embed`, pagination `paginate.*`; giữ metadata gốc thật.
- [ ] Wire-in latest `/api/films/phim-moi-cap-nhat`, search `/api/films/search`, type `/api/films/danh-sach/{slug}`, category/country/year theo [nguonc-alternatives.json](nguonc-alternatives.json).
- [ ] Khai báo capabilities rõ ràng: filters, sort, page size, taxonomy, HLS/embed. NC mẫu trả 10/page; không bịa 24/page, không đổi pagination bằng client slice mà thiếu tổng đúng.
- [ ] Tạo canonical identity ưu tiên `(tmdb.type, tmdb.id, tmdb.season)`, có provider refs `{provider,nativeSlug,nativeId}`. Match phim khác nguồn theo ID, không dựa duy nhất title hoặc slug. Khi không có ID, title+year+type có confidence; ambiguous thì không merge.
- [ ] Xử lý trường hợp đã xác minh: KK slug dài và NC `tung-buoc-ben-nhau` cùng TMDB 307106 tv season 1. Lookup NC bằng nativeSlug sau khi match.
- [ ] Giữ refs khi trả catalogue/search và tạo link phim; tránh fallback NC card mất source khi click `/phim/{slug}`. Giữ compatibility URL/bookmarks/history cũ bằng resolution layer/migration, không tự đổi hết URL công khai.
- [ ] NC metadata thay cho synthesized movie. Nếu missing dữ liệu bắt buộc, biểu diễn thiếu dữ liệu; không tự đặt phim 2026, single, Full, một tập.
- [ ] Whitelist ảnh `img.nguonc.com` theo path đã xác minh; sửa candidates ảnh, giới hạn retry. OPhim nếu phục hồi phải lấy CDN từ contract thật, không mặc định `image.ophim1.com`.
- [ ] Dùng endpoint KK có semantics filter đúng; giải quyết year-only/sort-only/all-types và combined filters bằng contract test. OPhim được phục hồi cũng phải giữ year/country/type/limit trong URL.
- [ ] Playback NC test riêng: xác định player có thể embed trong deployment origin. Chỉ đưa server khả dụng vào UI; không xem trang 403 Cloudflare là player khỏe, không kết luận toàn provider chết.

**Nghiệm thu:** tắt KKPhim và OPhim, catalogue/search của NC vẫn có phim thật; click card giữ đúng phim/source, title/năm/ảnh đúng metadata. Trang 2 đúng pagination 10/page. Không ghép episode của season/phim khác. Nguồn stream bị chặn có trạng thái khả dụng chính xác và có đường phục hồi.

## Đợt 4 — UI, lưu trữ và tính đúng nội dung

Ưu tiên F20–F24, F26.

- [ ] Live-search hiện dropdown từ lần gõ đầu; phân biệt loading/empty/error, abort old query, đồng bộ input khi URL thay đổi.
- [ ] Report API/storage thực có slug/provider/server/episode/reason/timestamp/requestId. Success chỉ sau khi persistence thành công; failure có retry. Không gửi email/chat ra ngoài nếu chưa có yêu cầu tích hợp cụ thể.
- [ ] Bookmarks/history/comments validate từng record, có version migration, safe storage wrapper khi getItem/setItem bị chặn/quota; test malformed `[null]` và storage SecurityError.
- [ ] Quick-server select reset/clamp rangeIndex và episode state; URL sv/ep cùng state không lệch khi navigation.
- [ ] Sửa nhãn rating thành TMDB; ranking thành gợi ý hoặc dùng metrics thật; bỏ comments demo tự gắn danh tính HNQ Support nếu không có backend thật. Giữ lịch round-robin dưới nhãn minh họa rõ ràng.
- [ ] Tạo OG banner thật hoặc dùng asset có sẵn; kiểm tra metadata route, robots/sitemap nếu bổ sung.

**Nghiệm thu:** UI search đúng lần đầu; report được lưu thật hoặc ghi rõ chưa gửi; storage invalid không gây crash; quick select từ server dài sang ngắn không làm danh sách tập rỗng sai; OG asset trả 200.

## Đợt 5 — Kiểm thử và vận hành để không tái diễn

- [ ] Lưu fixture tối thiểu từ payload live hợp lệ của từng provider; không giả thiết slug/cdn/schema giống nhau. Update riêng để người review thấy contract thay đổi.
- [ ] CI deterministic chạy unit + contract + production E2E. Cấu hình mock ở build/runtime phù hợp với prerender, không cho static output real-data lẫn vào mock và không dùng dev-mode làm bằng chứng production.
- [ ] Assertion kiểm tra cards có dữ liệu, đúng provider/ID, pagination, episodes có playable URLs; không chỉ chữ keyword/title hoặc count của `.first()`.
- [ ] Route lỗi 503/429/invalid JSON/timeout phải đi qua **adapter và page**, không chỉ GET mock route trực tiếp.
- [ ] Media mock có playlist/segment/player local hợp lệ để test HLS progress, iframe timer và CSP độc lập mạng. Live smoke riêng kiểm chứng một số nguồn thực.
- [ ] Nâng `probe-providers.ts`: catalogue native từng nguồn, metadata, cross-source resolution và media chain; schema/Content-Type là gate, 200 HTML “stopped” không healthy.
- [ ] Health monitoring theo endpoint/capability, provider và media origin; log requestId, HTTP/errorCode/latency, lưu timestamps và tỷ lệ theo cửa sổ nhiều lần đo. Một probe không gọi là uptime % dài hạn.
- [ ] Cập nhật README, Plan và scorecard theo dữ liệu mới; VSMOV đã removed, số nguồn active thực tế, test mode và advisory phải nhất quán.

Không tạo automation định kỳ trong lần audit này. Nếu triển khai monitoring, lên lịch probe riêng với tần suất phù hợp giới hạn nguồn; CI PR không phụ thuộc một upstream ngẫu nhiên đang chậm.

## Trình tự triển khai và rollback

1. PR A: CSP + timer/player hotfix, cùng tests chứng minh playback; PR B: dependency upgrade, cập nhật lockfile và advisory review.
2. PR C: typed adapter results, fallback/cancellation/error UI/server-client separation và regression tests.
3. PR D: NguonC catalogue + metadata + canonical mapping + pagination/image config; bật qua feature flag sau khi checks đạt.
4. PR E: UI/storage/report/SEO và CI/health tooling.

Mỗi đợt phải có production build + tests phù hợp + evidence browser. Rollback bằng reverting PR/config/feature flag của đợt đó; giữ dữ liệu canonical refs/migration tương thích ngược. Nếu NC playback chưa đạt, vẫn có thể dùng metadata/catalogue khi UX báo đúng unavailable; không quảng cáo server NC như lựa chọn phát chắc chắn.

Sau các đợt trên: thử lại ở deployment origin thật, nhiều phim/tập/nguồn, mobile Safari và Chromium; so sánh với baseline audit, đóng finding khi test tương ứng đạt. Việc deploy/đổi tài khoản hosting không nằm trong phạm vi đã thực hiện của báo cáo này.
