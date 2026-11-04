# Khắc phục player và kiểm tra tooling ngày 04/11/2026

Đã triển khai bản sửa local cho luồng hồi phục player. Dependency tooling còn chờ bản phát hành tương thích từ các gói cha.

## Player

- Chromium desktop 1440px và mobile 375px đều nhận HTTP 403 từ embed18. Console xác nhận phản hồi upstream có `X-Frame-Options: sameorigin` và browser từ chối nhúng. Kết quả ghi ở [browser-results.json](./browser-results.json).
- Thêm nút “Thử nguồn cùng tập” cạnh iframe, kể cả khi iframe phát sự kiện load cho một trang lỗi. Người xem có thể thử server khác đã được ghép với đúng identity phim và có tập trùng tên đã chuẩn hóa.
- Khi đổi nguồn thủ công mà thiếu tập đang xem, ứng dụng giữ nguyên nguồn/tập và giải thích lý do. Hành vi cũ nhảy sang tập đầu đã được thay thế.
- Khi không có nguồn cùng tập, hiển thị thông báo chưa có nguồn thay thế và đưa người xem đến khu vực chọn tập/nguồn.
- Bổ sung embed2/embed13 vào registry origin chính xác sau khi xác nhận URL do API NguonC cung cấp. Các origin này có cùng chính sách CSP/permissions với embed1/embed15/embed18.
- Hướng dẫn hồi phục không khẳng định nguồn thay thế phát được. Iframe cross-origin có thể load trang lỗi nên ứng dụng chưa có tín hiệu tự động đáng tin cậy để xác nhận HTTP status/phát video bên trong frame.

403 và header sameorigin cần được nhà cung cấp xử lý hoặc cung cấp endpoint nhúng phù hợp. Bản sửa giúp người dùng đổi nguồn an toàn trong điều kiện upstream tiếp tục lỗi. Chưa xác nhận phát thành công từ iframe NguonC này.

## Tooling

- Audit hiện tại vẫn có **16 moderate package records**, cùng advisory minimatch GHSA-g3hv-75wg-m249. Production audit trả 0.
- Nhánh cài hiện tại là minimatch 3.1.5 và 10.2.5. Registry có 3.1.5 là bản cuối của major 3 và 10.2.6 là bản mới trong major 10, còn advisory yêu cầu 11.0.1.
- `eslint-plugin-react` mới nhất 7.37.5 và `eslint-plugin-import` mới nhất 2.32.0 vẫn yêu cầu minimatch `^3.1.2`. `eslint-plugin-jsx-a11y` mới nhất 6.10.2 cũng yêu cầu `^3.1.2`.
- `@typescript-eslint/typescript-estree` 8.72.1 vẫn yêu cầu `^10.2.2`. `@eslint/eslintrc` mới nhất 3.3.7 vẫn yêu cầu `^3.1.5`.
- ESLint 10 tồn tại nhưng eslint-plugin-react hiện chỉ công bố peer support đến ESLint 9.7. Vì vậy chưa có tổ hợp nâng cấp theo contract đã xác minh để đưa toàn bộ cây sang minimatch đã vá.
- Cần bản phát hành mới của các gói cha hỗ trợ minimatch đã vá trước khi đóng hạng mục này. Manifest và lockfile được giữ ở các phiên bản đã kiểm chứng trong phiên thực hiện này.
- [Advisory chính thức](https://github.com/advisories/GHSA-g3hv-75wg-m249), [audit toàn bộ](./audit-all.json), [audit production](./audit-production.json).

## Kiểm chứng

- Lint, TypeScript, unit hiện có và production build qua.
- **132 E2E mock + 6 kill-switch qua**. Hai regression mới kiểm tra iframe HTTP 403 vẫn có đường đổi đúng tập và thông báo khi thiếu nguồn thay thế. Regression cũ được cập nhật để xác minh không tự nhảy từ tập 80 sang tập 201.
- Đã kiểm tra ảnh desktop/mobile và chỉnh flex-wrap cho lời hướng dẫn/nút hồi phục. Snapshot browser ghi nhận không tràn ngang ở hai viewport.
- [E2E](./e2e.txt), [build](./build.txt), [lint](./lint.txt), [TypeScript](./typescript.txt), [unit](./unit.txt).

Bản sửa đang ở local. Chưa triển khai lên public deployment và chưa tạo lịch monitor tự động.
