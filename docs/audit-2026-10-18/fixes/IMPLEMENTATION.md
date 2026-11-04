# Bản sửa và dọn mã sau audit — 18/10/2026

## Kết quả

Đã sửa hai nhóm lỗi chức năng đã xác nhận, dọn mã/asset không dùng, đưa các bộ test bị bỏ sót trở lại CI và chạy lại toàn bộ kiểm tra. Working tree local chưa deploy.

| Kiểm tra sau sửa | Kết quả |
|---|---|
| Build production / TypeScript | Qua |
| ESLint | Qua |
| Unit / assertion | 169 qua, 0 lỗi |
| E2E mock | 127 qua, 0 lỗi, 0 skip |
| E2E tắt KKPhim | 6 qua, 0 lỗi |
| E2E với API thật | 1 qua |
| Import / parameter dư theo TypeScript | 0; đã bật kiểm tra thường trực trong tsconfig |
| Module không đến được từ entry point | 0 theo đồ thị import đã rà |
| Dependency trực tiếp không được import | 0 trong phạm vi inventory |
| Asset public trùng byte | 0 |
| Advisory production do npm báo cáo | 0 |

## Lưu dữ liệu cá nhân

- Yêu thích và lịch sử phân biệt phim theo provider + native slug. Xóa một mục không còn xóa phim từ nguồn khác trùng slug; lưu/xem phim mới không ghi đè lịch sử của phim khác nguồn.
- Các record cũ thiếu source được đối chiếu bằng `_id` hoặc TMDB khi có đủ thông tin. TMDB khác nhau hoặc mùa TV khác nhau không bị gộp. Khóa `hnq_bookmarks` và `hnq_watch_history` giữ nguyên, không có thao tác xóa hay migration hàng loạt.
- React key của tủ phim/xem tiếp và khóa chống ghi trùng playback cũng dùng định danh tương ứng.
- `toggleBookmark` trả kết quả phân biệt thao tác thành công và lỗi ghi. Trang chi tiết, hero và featured collection đều hiện thông báo khi trình duyệt không ghi được dữ liệu.
- Ghi chú cá nhân và khóa ghi chú cũ giữ nguyên trong đợt sửa này; phần ghi chú chưa được audit tái hiện thành lỗi riêng và không bị tự động chuyển dữ liệu sang khóa mới.

Regression trong [storage.spec.ts](../../../tests/e2e/storage.spec.ts) gồm bốn tình huống lỗi ban đầu, đọc/bỏ lưu record legacy, báo lỗi lưu ở hero và bảo toàn lịch sử cùng slug giữa các provider. Có thêm 8 unit test cho helper định danh và tương thích dữ liệu cũ tại [test-storage.ts](../../../scripts/test-storage.ts).

## Test và CI

- Project mock tự chọn `tests/e2e/*.spec.ts`, ngoại trừ test live và kill switch chạy riêng. Sáu file từng bị bỏ qua đã trở lại bộ kiểm tra thường xuyên.
- Thương hiệu/ảnh logo trong smoke test đã cập nhật PTQ; bài test cuộn tới footer trước khi kiểm tra ảnh lazy-load.
- Thay assertion bảo mật luôn đúng bằng kiểm tra runtime CSP thực sự chặn embedded object.
- Test điều hướng tập dùng fixture dài tập và xác minh URL, trạng thái chọn tập, nút trước/sau. Test lưu/bỏ lưu xác minh qua reload thay vì chờ cố định và skip khi không thấy nút.
- Screenshot watch dùng `testInfo.outputPath()`, không còn ghi đè hai ảnh audit lịch sử được Git quản lý.
- `noUnusedLocals` và `noUnusedParameters` được bật để ngăn import/parameter dư quay lại.

## Phần đã dọn

- Xóa 9 component cũ không còn nơi import: CountryMovieSection, CountryRowScrollButton, MovieSection, TopicCardsRow, TopMoviesRankSection, TopMoviesSidebar, TopRankNavButtons, ScrollToTopButton và GlitchText.
- Loại 13 import React không dùng và hai props không có tác dụng của PTQBrandLogo.
- Gỡ `clsx`, `tailwind-merge` khỏi manifest/lockfile; khai báo `sharp` trực tiếp trong devDependencies cho các script asset.
- Xóa 5 SVG starter không được dùng.
- Ba backdrop Family Guy hiện dùng chung `anime-45382.jpg`, xóa hai bản sao giống hệt byte, giảm 319,256 byte. Dữ liệu của các mùa vẫn tách biệt. Script đồng bộ preload fingerprint các backdrop hiện có và dùng tên theo hash cho nội dung mới, tránh tạo thêm bản sao theo từng ID.
- Giữ SVG nguồn sinh ảnh OG, alias icon, fixture/mock, tokens và tài liệu/preview mà các công cụ hoặc bài test vẫn sử dụng.

## Advisory dev còn lại

Npm vẫn báo 5 package records high trong cùng chuỗi `eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces`. **Production: 0 advisory.**

Đã đối chiếu registry: bản `braces` mới nhất vẫn là 3.0.3; bản ESLint plugin Next 16.4.2 vẫn dùng fast-glob. [Advisory GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) ghi chưa có patched version. Vì vậy không hạ Next/ESLint, thay thư viện bằng API không tương thích hoặc giấu advisory. Chưa thể đánh dấu phần này là đã vá; cần cập nhật khi upstream có bản sửa tương thích. Các advisory này thuộc tooling dev hiện tại, không nằm trong dependency production.

## Bằng chứng và phạm vi

- [Build](./build-output.txt), [lint](./lint-output.txt), [unit](./unit-output.txt).
- [127 + 6 E2E](./e2e-output.txt), [live E2E](./e2e-live-output.txt).
- [Inventory sau dọn](./code-inventory.json), [npm audit production](./npm-audit-production.json), [npm audit toàn bộ](./npm-audit-all.json), [tổng hợp](./SUMMARY.json).

Kết quả áp dụng cho bản production local và các case Chromium đã chạy. Chưa deploy, chưa xác minh mọi phim/stream, trình duyệt hay tải đồng thời lớn. Báo cáo audit ban đầu giữ nguyên số liệu lịch sử; tài liệu này ghi trạng thái sau sửa.
