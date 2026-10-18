# Kiểm tra website và codebase PTQ Film — 18/10/2026

## Kết luận

Website build được và các luồng chính trong bộ kiểm thử hiện hành đều chạy tốt. Tuy nhiên, **codebase chưa sạch hoàn toàn và có hai nhóm lỗi chức năng đã tái hiện**: nhận diện sai phim trong dữ liệu cá nhân khi trùng slug giữa các nguồn, và thiếu thông báo khi lưu yêu thích thất bại ở trang chi tiết.

Đợt này kiểm tra working tree local, giữ nguyên các thay đổi logo đã có. Không sửa logic ứng dụng, xóa dependency, xóa component hay deploy. Các test bổ sung, cấu hình audit, log, ảnh và kết quả JSON nằm trong thư mục báo cáo này.

## 1. Kết quả thực chạy

| Kiểm tra | Kết quả |
|---|---|
| `npm run lint` | Qua, không có lỗi/cảnh báo ESLint |
| `npm run build` | Qua; Next.js 16.4.0 compile, kiểm tra TypeScript và sinh trang thành công |
| `npm run test:unit` | 161 phép kiểm tra qua: sanitize 51, validate 61, API 21, mock 23, kill switch 5 |
| Security scan trong unit suite | Quét 96 file mã; 0 finding của các quy tắc hiện có |
| E2E mock | 66 qua |
| E2E khi tắt KKPhim | 6 qua |
| E2E với nguồn thật | 1 qua: từ catalogue mở đúng chi tiết phim và danh sách tập |
| Sáu file E2E cũ bị cấu hình chính bỏ qua | 52 qua, 1 thất bại do kỳ vọng thương hiệu cũ, 1 bỏ qua |
| Bốn tình huống storage bổ sung | 4 thất bại, xác nhận hai nhóm lỗi ở mục 2 |
| TypeScript bật thêm `--noUnusedLocals --noUnusedParameters` | 13 lỗi TS6133: import React dư |
| `npm audit --omit=dev` | 0 advisory được báo cáo |
| `npm audit` toàn bộ | 5 package records mức high, cùng chuỗi ESLint → braces |

Bài responsive hiện có đi qua 15 đường dẫn ở 7 độ rộng 320, 375, 414, 768, 1024, 1440, 1920: kiểm tra main/heading, controls có tên và tràn ngang. Suite còn kiểm tra bộ lọc, tìm kiếm/bàn phím, drawer/focus, trailer, tủ phim, nguồn phát dự phòng, chọn tập, ghi chú và tải báo cáo lỗi.

Nguồn thật đang bật: KKPhim đạt 6/6 endpoint HTTP/schema, NguonC đạt 4/4; các mẫu media được probe trả về thành công. Độ trễ trung bình lần lượt khoảng 254 ms và 426 ms. OPhim tắt mặc định nên không nằm trong probe. Đây là mẫu tại thời điểm chạy, không phải cam kết mọi phim/video đều phát được.

Bằng chứng: [unit](./unit-output.txt), [build](./build-output.txt), [lint](./lint-output.txt), [E2E chính](./e2e-output.txt), [E2E live](./e2e-live-output.txt), [probe nguồn](./provider-probe.json), [tổng hợp JSON](./SUMMARY.json).

## 2. Lỗi chức năng đã xác nhận

### F1 — P2: Tủ phim và lịch sử dùng slug làm định danh duy nhất

Vị trí:

- `src/hooks/useBookmarks.ts:59–81`: `isBookmarked`, `toggleBookmark`, `removeBookmark` chỉ so sánh slug.
- `src/hooks/useWatchHistory.ts:59–73`: lưu/xóa lịch sử cũng chỉ so sánh slug.
- `src/components/tu-phim/TuPhimContainer.tsx:114,157`: truyền slug vào thao tác xóa.
- `src/components/watch/MovieActions.tsx:21`: trạng thái đã lưu dựa trên slug.

Phim ở hai provider có thể có cùng native slug nhưng `_id`/TMDB khác nhau. Đã tái hiện ba trường hợp bằng dữ liệu hợp lệ trong trình duyệt test riêng:

1. Chỉ lưu phim B của NguonC; mở phim A của KKPhim cùng slug nhưng khác phim. Trang A hiện “Đã Lưu Tủ Phim” dù A chưa được lưu.
2. Tủ phim có A và B cùng slug, khác nguồn/định danh. Xóa A làm mất cả B: kỳ vọng còn 1 card, thực tế 0.
3. Lịch sử có hai mục như trên. Xóa một mục làm mất cả hai: kỳ vọng 1, thực tế 0.

Đề nghị: thống nhất khóa dữ liệu cá nhân theo nguồn và native slug; dùng TMDB type/id/season khi cần nhận diện cùng phim giữa các nguồn. Cần xử lý tương thích record cũ không có source và cập nhật đồng bộ các caller; không chỉ thay riêng hàm xóa. Ghi chú cá nhân cũng dùng khóa theo slug nên cần rà cùng chính sách định danh, nhưng chưa tính phần ghi chú là một lỗi riêng được tái hiện trong đợt này.

Bằng chứng: [test tái hiện](./storage.edge.spec.mjs), [kết quả](./storage-results.json), [log](./storage-output.txt).

### F2 — P2: Không báo cho người dùng khi lưu yêu thích thất bại ở trang chi tiết

`useBookmarks.ts:73–75` bắt lỗi ghi localStorage, chỉ ghi console và trả `false`. `MovieActions.tsx:62` gọi `toggleBookmark(movie)` nhưng bỏ qua kết quả và không có state thông báo lỗi.

Đã mô phỏng `QuotaExceededError`, mở chi tiết phim và bấm “Thêm Tủ Phim”: thao tác thất bại nhưng không có thông báo lỗi tương ứng cho người xem. Test đã loại trừ alert thông báo chuyển trang mặc định của Next.js để tránh nhận nhầm là thông báo lỗi.

Đề nghị: cho thao tác lưu trả kết quả phân biệt thành công/bỏ lưu/thất bại và hiển thị thông báo lỗi tại nơi gọi. `FeaturedCollection` đã có cơ chế báo lỗi lưu; trang chi tiết và hero cần hành vi nhất quán. Phần hero mới được xác nhận bằng đọc mã, chưa có bài tái hiện riêng.

Bằng chứng: tình huống thứ tư trong [test storage](./storage.edge.spec.mjs) và [log](./storage-output.txt).

## 3. Bộ test có phần lỗi thời và phần cần củng cố

- **Sáu file không được project nào trong cấu hình chính chọn chạy:** `homepage.spec.ts`, `routes.spec.ts`, `search.spec.ts`, `security.spec.ts`, `watch.spec.ts`, `xss.spec.ts`. Cấu hình `playwright.config.ts:88–109` chỉ chọn các file được liệt kê cụ thể. Đây không có nghĩa toàn bộ chức năng tương ứng không được test: các suite mới có một phần coverage thay thế.
- Khi chạy riêng 54 test cũ, `homepage.spec.ts:68–74` thất bại vì còn đòi title/logo **HNQ**, trong khi giao diện hiện là **PTQ**. Đây là test lỗi thời, không phải website hiển thị sai thương hiệu.
- `security.spec.ts:39–64` có tên “inline script injection is blocked” nhưng không thực hiện injection; assertion `violations.length >= 0` luôn đúng. Kết quả qua của bài này không chứng minh CSP chặn script injection.
- Test cũ về episode prev/next bị skip trong dữ liệu đang chạy và bản thân không có assertion thực sự về URL sau đổi tập. Các suite watch mới có kiểm tra chọn tập; nên hợp nhất và bỏ bản test gây hiểu nhầm.
- `watch-redesign.spec.ts:142` ghi screenshot thẳng vào hai file ảnh audit cũ đã được Git quản lý. Chạy test làm working tree bẩn và ghi đè bằng chứng lịch sử. Đợt này đã giữ ảnh mới dưới `screenshots/watch-*.png`, khôi phục nguyên trạng hai ảnh lịch sử. Nên dùng `testInfo.outputPath()` như các test khác.

Đề nghị: tích hợp các assertion còn hữu ích từ test cũ vào suite hiện hành, cập nhật nhận diện PTQ, thêm regression cho F1/F2 rồi bỏ test trùng hoặc không có kiểm chứng thực chất.

Bằng chứng: [cấu hình chạy legacy riêng](./playwright.legacy.config.mjs), [kết quả legacy](./legacy-results.json), [log](./legacy-output.txt), [danh sách test cấu hình hiện hành](./test-inventory.json).

## 4. Mã và dependency không còn được sử dụng

Đã dựng đồ thị import từ entry point theo quy ước Next.js, tính cả type import và dynamic import dạng literal, rồi đối chiếu lại các tên bằng tìm kiếm toàn bộ `src`, `scripts`, `tests`.

### 9 component không có nơi import

| File | Ghi chú |
|---|---|
| `src/components/home/CountryMovieSection.tsx` | Section quốc gia cũ |
| `src/components/home/CountryRowScrollButton.tsx` | Nút cuộn của bố cục quốc gia cũ |
| `src/components/home/MovieSection.tsx` | Grid section cũ |
| `src/components/home/TopicCardsRow.tsx` | Thanh chủ đề cũ |
| `src/components/home/TopMoviesRankSection.tsx` | Component xếp hạng cũ |
| `src/components/home/TopMoviesSidebar.tsx` | Sidebar xếp hạng cũ |
| `src/components/home/TopRankNavButtons.tsx` | Controls xếp hạng cũ |
| `src/components/layout/ScrollToTopButton.tsx` | Không còn được Footer dùng |
| `src/components/ui/GlitchText.tsx` | Wrapper không còn được dùng |

Tổng khoảng 14.5 KB mã nguồn. Đây chủ yếu là nợ bảo trì; không suy ra toàn bộ số byte này đang được tải vào client bundle. Có thể dọn sau khi giữ mốc Git và chạy lại kiểm thử.

### Import/props/package dư

- **13 import React dư:** xem [kết quả TypeScript chặt hơn](./unused-typescript.txt). Nằm ở các page/loading, `FilterListPage`, `Pagination` và `MovieRoute`. JSX runtime hiện tại không cần các import mặc định này nếu file không dùng kiểu/thành viên React.
- **Hai dependency trực tiếp không có import:** `clsx`, `tailwind-merge`. Không tìm thấy chỗ dùng trong mã ứng dụng hay scripts; là ứng viên gỡ khỏi manifest/lockfile.
- `PTQBrandLogo.tsx:4–5` khai báo `size`, `showSubtitle` nhưng component không đọc chúng và không có caller dùng. Có thể thu gọn API props.
- Hai script đồng bộ asset import `sharp`, nhưng `package.json` không khai báo trực tiếp; hiện đang dùng dependency bắc cầu từ Next.js. Nếu giữ các script này, nên khai báo dependency công cụ rõ ràng thay vì phụ thuộc vào cách npm hoist.

Bằng chứng và công cụ lặp lại: [inventory](./code-inventory.json), [script phân tích](./inspect-codebase.mjs).

## 5. Asset dư và asset trùng

- **5 SVG mặc định không được ứng dụng tham chiếu:** `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`; tổng 3,314 byte. Là ứng viên xóa an toàn sau xác nhận không dùng ngoài ứng dụng.
- **3 backdrop giống hệt byte:** `anime-45382.jpg`, `anime-45399.jpg`, `anime-45402.jpg`. Cả ba hiện đều được data tham chiếu, dùng cùng backdrop Family Guy cho các mùa khác nhau. Không phải ảnh bị tải hỏng hay file chết. Có thể đổi dữ liệu/generator sang chung một file, giảm 2 bản sao, khoảng 312 KiB.
- `public/images/og-banner.svg` không được trang dùng trực tiếp nhưng đang là nguồn sinh `og-banner.png` trong script đồng bộ logo: giữ vai trò này khi dọn.
- `public/images/ptq-icon.png` không có tham chiếu runtime hiện hành; là bản icon dự phòng/alias có thể cân nhắc hợp nhất, không kết luận tự động phải xóa.
- Không phát hiện video/backdrop trong `public/sites` không được runtime data tham chiếu bằng phương pháp kiểm tra hiện tại.

## 6. Dependency và bảo mật

`npm audit --omit=dev` báo **0 advisory production**. Toàn bộ cây dependency báo **5 package records mức high**: `braces`, `micromatch`, `fast-glob`, `@next/eslint-plugin-next`, `eslint-config-next`.

Đây là cùng một chuỗi ảnh hưởng từ advisory [braces stack-exhaustion DoS](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), không phải năm lỗi độc lập trong tính năng xem phim. Npm hiện đề xuất đổi `eslint-config-next` về 14.2.35 dưới `fixAvailable`; không áp dụng tự động vì không đồng bộ Next.js 16.4 hiện tại. Cần chọn cách vá cây dev dependency tương thích rồi chạy lại lint/build/test.

Security scan bằng regex của dự án không thay thế kiểm thử bảo mật đầy đủ. Đợt này chưa xác nhận có đường khai thác XSS thực tế. CSP hiện cho phép inline script theo thiết kế đã ghi trong `src/proxy.ts`; phần bình luận về “9 trang static” đã lỗi thời so với build hiện tại, nên cập nhật cùng chính sách/test bảo mật.

Bằng chứng: [audit production](./npm-audit-production.json), [audit toàn bộ](./npm-audit-all.json).

## 7. Thứ tự xử lý đề xuất

1. Sửa F1 về định danh phim và giữ các regression test mới; đây là phần có nguy cơ làm mất mục yêu thích/lịch sử.
2. Sửa F2 để báo lỗi lưu rõ ràng, thống nhất giữa trang chi tiết, hero và featured collection.
3. Làm sạch cấu hình/test lỗi thời và cách ghi screenshot; đưa regression mới vào CI chính.
4. Dọn 9 component, 13 import, hai dependency dư và props không dùng.
5. Dọn SVG mặc định, hợp nhất backdrop trùng, khai báo `sharp` cho tooling và xử lý advisory dev một cách tương thích.

Giữ các khóa storage `hnq_*` để đọc dữ liệu đã lưu của người dùng; đổi tên cần migration. Giữ fixture/mock route có cờ `API_MOCK` vì vẫn được test sử dụng. Giữ `tokens.css` và file preview trong docs đang được E2E đọc. Các tài liệu/ảnh audit cũ là bằng chứng lịch sử, cần phân biệt với asset production trước khi dọn.

## 8. Giới hạn của kết luận

Đã kiểm tra bản production local bằng Chromium, các tuyến/trạng thái của suite hiện có và probe nguồn thật. Chưa kiểm tra bản deploy bên ngoài, Safari/Firefox, toàn bộ phim/tập trong mọi provider, phát dài hạn từng stream, tải đồng thời lớn hoặc mọi điều kiện mạng/thiết bị. Phân tích CSS/asset có URL sinh động cần kiểm chứng thêm trước khi xóa tự động. Không có kết quả nào ở đây bảo đảm “website hoàn toàn không có lỗi”.

Để chạy lại hai audit bổ sung:

```powershell
npx playwright test --config docs/audit-2026-10-18/playwright.legacy.config.mjs
npx playwright test --config docs/audit-2026-10-18/playwright.edge.config.mjs
node docs/audit-2026-10-18/inspect-codebase.mjs
```

Các lệnh legacy/edge hiện trả exit code khác 0 đúng theo các lỗi chưa được sửa trong báo cáo.
