# Xử lý dependency tooling và nguồn phát NguonC

Ngày thực hiện 04/11/2026. Bản sửa ở local.

## Tooling

Đã đưa toàn bộ consumer minimatch trong cây ESLint sang engine chính thức **minimatch 11.0.4** đã vá, qua gói local `tools/minimatch-compat`. Npm audit hiện trả **0 advisory toàn bộ dependency**. `npm ci` từ lockfile đã được kiểm tra thành công.

Plugin dùng minimatch 3 yêu cầu CommonJS export dạng callable, trong khi consumer mới dùng các named exports. Adapter cung cấp cả hai cách gọi và chuyển việc matching sang engine đã vá. Engine alias `minimatch-engine` được khai báo trực tiếp trong devDependencies để gói local resolve được ổn định khi npm ci.

Phạm vi tương thích là các consumer lint của repository. Legacy `makeRe` dùng trong `import/no-internal-modules` được đáp ứng bằng matcher có phương thức `test`, thay vì regex được sinh từ engine cũ. Adapter này không cung cấp contract biên dịch RegExp tổng quát của minimatch 3 cho ứng dụng khác. Khi thay đổi dependency lint cần chạy regression tương thích trước khi nhận bản nâng.

`test:tooling` đã tích hợp vào `test:unit`. Test gọi API qua từng consumer, kiểm tra defaults, named class, glob/brace/filter/match và xác nhận các rule JSX accessibility cùng `import/no-internal-modules` thực sự phát hiện lỗi. Audit bao gồm tên gói engine thực và bản 11.0.4.

## Player

Các embed StreamC đang trả 403/SAMEORIGIN được cách ly khỏi danh sách phát mặc định. Catalogue và metadata NguonC vẫn hoạt động. `API_ENABLE_NGUONC_EMBEDS=1` cho phép operator bật lại sau khi xác minh endpoint nhúng đã phục hồi.

Nguồn HLS từ provider khác chỉ được nhập sau khi xác minh identity TMDB, type và season theo cơ chế hiện có. Khi detail gốc thuộc NguonC, HLS được ưu tiên và ngân sách tìm nguồn thay thế được tăng trong giới hạn deadline chung. Không tìm được nguồn cùng identity thì UI hiển thị chưa có nguồn phát khả dụng.

Response vẫn giữ source/native slug của metadata NguonC. Các link embed bị cách ly được loại khỏi cả đường phát chính và embed fallback của tập có HLS. Regression kiểm tra lọc StreamC và sử dụng HLS đã khớp identity.

Live adapter đã xác nhận `loi-noi-doi-hoan-hao-2026` giữ metadata NguonC, nhận 2 tập HLS từ KKPhim cùng identity. `hoang-hau-tai-hon` hiện chưa có nguồn thay thế đủ điều kiện, trả danh sách server rỗng và thông báo unavailable. Xem [live.json](./live.json).

## Kiểm chứng

- Cài sạch bằng npm ci, lint, TypeScript, unit và production build đã qua.
- 173 assertion/unit hiện có cùng test tương thích tooling qua.
- E2E mock và kill-switch qua, xem [e2e.txt](./e2e.txt).
- Browser live xác nhận HLS từ URL metadata NguonC phát tăng hơn 12 giây trên mobile/desktop, readyState 4 và 0 iframe StreamC. Phim chưa có nguồn thay thế hiện đúng thông báo unavailable sau streaming. Xem [browser.json](./browser.json).
- [Audit toàn bộ](./audit-all.json), [cây dependency](./dependencies.txt), [cài sạch](./npm-ci.txt), [lint](./lint.txt), [unit](./unit.txt), [build](./build.txt).

## Vận hành

Upstream vẫn có thể trả 403 và SAMEORIGIN cho endpoint cũ. Bản sửa loại các endpoint đó khỏi đường phát mặc định và dùng nguồn thay thế đã xác minh. Phim thiếu identity hoặc thiếu nguồn thay thế sẽ tạm chưa phát được. NguonC embed chỉ bật lại sau phép thử browser xác nhận phát thành công từ origin của website.

Chưa deploy public. Không thể coi mọi bộ phim đều đã có HLS thay thế. Lớp tương thích tooling cần tiếp tục được kiểm thử khi cập nhật plugin.
