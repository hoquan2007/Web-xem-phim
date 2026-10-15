# HNQ Film — kết quả triển khai

Hoàn tất trong workspace ngày 15/10/2026. Hướng đã chọn: **rạp phim tối, tinh gọn, tập trung poster**. Mã nguồn được thay đổi và kiểm tra ở local; **chưa publish/deploy lên Vercel**.

## Thay đổi chính

- Một hệ thống dùng chung tại [design.md](../../design.md) và [tokens.css](../../tokens.css): canvas than tối, amber cho hành động, Be Vietnam Pro cho heading, Inter cho body. Tailwind được nối vào token; CSS entry hiện có được giữ.
- Logo tĩnh, header có search và liên kết thật; mobile có nút tìm trực tiếp. Drawer và các modal dùng native dialog, có focus trap, Escape và trả focus. Gợi ý search là link có thể dùng bằng bàn phím, có trạng thái chờ đúng query.
- Hero chuyển thủ công, một lớp ảnh chính; bỏ badge tuổi/chất lượng suy đoán và rating không hợp lệ. Poster card hiển thị tối đa 2 dòng tên phim. Đã kiểm tra và sửa lỗi rail co card quá nhỏ.
- Home có “Xem tiếp” từ lịch sử thật, giữ nguồn, identity và số tập trong URL. Gợi ý không còn ngụy trang thành thống kê Top Ngày/Tuần/Tháng.
- Catalogue/search/chủ đề/tủ phim dùng cùng hệ thống. Bộ lọc mobile áp dụng các lựa chọn cùng lúc; label được liên kết đúng, URL và điều kiện phân trang được giữ. Năm có thể chọn về 1900 thay vì chỉ 17 năm gần nhất.
- Chủ đề dẫn tới đúng thể loại/quốc gia. Trang `/lich-chieu` giữ route nhưng trình bày gợi ý khám phá, không chia phim theo index để gọi là ngày cập nhật.
- Player có chọn tập cạnh video trên desktop; “Mở rộng” thật sự mở rộng vùng player và được ẩn ở kích thước không có layout phụ để mở rộng. Nút chọn tập có selected state đọc được; title phim và nhãn tập tách riêng, không còn “Tập Tập”.
- Clipboard chỉ báo thành công sau khi ghi được; lỗi có trường chứa link để copy. Ghi chú cá nhân dùng timestamp ISO, nút nằm ngoài textarea, vẫn đọc ghi chú/reply cũ. Báo lỗi nói rõ việc tải file, không giả đã gửi hỗ trợ.
- Một `main` cho mỗi trang, skip link, focus-visible, reduced-motion; 404, loading, unavailable và footer được làm gọn. Origin fallback và `.env.example` dùng `hnqfilm.vercel.app`.

## Đối chiếu 30 phát hiện

| ID | Kết quả |
|---|---|
| F01 | Bỏ metadata cố định; quality/lang/episode chỉ từ dữ liệu, rating hữu hạn trong (0,10]. |
| F02 | Nhãn gợi ý mới; bỏ thứ hạng và season cố định. |
| F03 | Liên kết chủ đề và truy vấn khớp nhau; bỏ tên Marvel cho toàn bộ hành động. |
| F04 | Không còn weekday round-robin; đổi sang các nhóm khám phá trung thực. |
| F05 | Tab “Đã lưu” / “Lịch sử”, đã kiểm tra 320/375/414/768/1024/1440px. |
| F06 | Dialog dùng chung; kiểm thử trap focus/Escape/return focus qua drawer và report. |
| F07 | Search suggestion là Link, giữ source-qualified identity. |
| F08 | Label và accessible name cho controls; các route mẫu không có nút hiển thị rỗng tên. |
| F09 | Hero thủ công, điều khiển luôn hiện trên mobile, vùng bấm 44px. |
| F10 | Logo không chạy glitch/ping; reduced-motion được kiểm thử. |
| F11 | Clipboard reject không báo thành công, có fallback link. |
| F12 | Expand thay đổi chiều rộng player thật trên desktop, đã đo trong E2E. |
| F13 | RootLayout sở hữu main; page/loading không lồng main. |
| F14 | Palette và hành động được thống nhất; màu status vẫn được phép theo ngữ nghĩa. |
| F15 | Bỏ header tím/blur blobs ở các trang phụ. |
| F16 | Country heading dùng chữ đặc. |
| F17 | Chủ đề dùng ảnh phim thật, thay lưới feature tiles nhiều màu. |
| F18 | Giảm panel/glass/khung lồng nhau trên các bề mặt đang dùng. |
| F19 | Cặp font và vai trò typography rõ; giữ body Inter có chủ đích. |
| F20 | Card có 2 dòng tên và metadata riêng; contrast hệ token được kiểm thử. |
| F21 | Hero chỉ giữ tác vụ xem/lưu; bỏ Info cùng đích xem. |
| F22 | Country section gọn hơn; thêm xem tiếp theo dữ liệu cá nhân, giảm khối trang trí. |
| F23 | Các component được thiết kế lại bỏ hover zoom, glow và transition-all. Component cũ không còn dùng vẫn được giữ trong repo. |
| F24 | Nav đầy đủ từ 1280px; nhỏ hơn dùng menu, không ép nhãn nhiều dòng. |
| F25 | Sửa Markdown thô, ellipsis topic ghi cứng và tiền tố tập. |
| F26 | HNQ Film thống nhất; logo có một accessible name, controls tiếng Việt. |
| F27 | Timestamp ISO mới; record cũ không có ngày hợp lệ hiển thị “Ghi chú đã lưu”. |
| F28 | Hero skeleton dùng chung cấu trúc/chiều cao; loading khác theo layout mới. Chưa đo CLS field. |
| F29 | Footer gọn, không có panel cảm ơn và nhiều đoạn mô tả lặp. |
| F30 | Sửa origin fallback và ví dụ ENV. Cấu hình ENV đang có trên Vercel cần đối chiếu khi deploy; không tuyên bố production đã đổi. |

## Xác minh

| Kiểm tra | Kết quả |
|---|---|
| `npm run lint` | Pass |
| `npx tsc --noEmit` | Pass |
| `npm run test:unit` | Pass cả sanitize, validate, security, API, mock và kill switch |
| `npm run build` | Pass với Next.js 16.4.0; đã đọc docs kèm package về layout/client/CSS/font/image/accessibility |
| E2E mock production | **36/36 pass** |
| E2E tắt KKPhim | **6/6 pass** |
| Responsive | **10 route mẫu × 6 chiều rộng = 60 trạng thái**, một main, không tràn document, nút hiển thị có tên |
| Màu chữ | 10 cặp foreground/background token ≥4.5:1; control tập selected và nút xem cũng kiểm tra ≥4.5:1 |
| Focus/keyboard | Drawer, search mobile, filter sheet, report và player expand pass các ca mới |
| Hồi quy | Image fallback, iframe qua failure timer, storage hỏng, source identity và file report vẫn pass |
| Whitespace | `git -c core.autocrlf=false diff --check` pass |

Lệnh E2E cuối dùng cùng production bundle:

```powershell
npm run test:e2e:mock -- --output=docs/frontend-audit-2026-10-15/visual-check
npm run test:e2e:disable-flag
```

Đã xem trực tiếp local với dữ liệu/poster thật ở trang chủ, catalogue, tủ phim; kiểm tra 375px và desktop. Bộ ảnh lưu dưới đây dùng **fixture mock** để dễ tái lập; vùng player trắng là iframe fixture “Mock player ready”, không phải lỗi player production. Ảnh đã được kiểm tra trực quan, trong đó phát hiện và sửa màu selected episode trước lượt test cuối.

## Ảnh kiểm chứng

| Trang | Mobile 375px | Desktop 1440px |
|---|---|---|
| Home | [Ảnh mobile](screenshots/home-375.png) | [Ảnh desktop](screenshots/home-1440.png) |
| Catalogue | [Ảnh mobile](screenshots/danh-sach-375.png) | [Ảnh desktop](screenshots/danh-sach-1440.png) |
| Player | [Ảnh mobile](screenshots/watch-375.png) | [Ảnh desktop](screenshots/watch-1440.png) |
| Tủ phim | [Ảnh mobile](screenshots/tu-phim-375.png) | [Ảnh desktop](screenshots/tu-phim-1440.png) |

## Giới hạn và cách chạy

- Chưa triển khai lên `hnqfilm.vercel.app`; thay đổi trên website public chỉ xuất hiện sau bước deploy riêng.
- Chưa chạy Safari/Firefox hoặc thiết bị iOS/Android thật, axe toàn bộ hay field Core Web Vitals. Contrast test không thay thế audit mọi pixel chữ trên mọi ảnh/iframe ngoài.
- Mock E2E kiểm tra fallback và UI contract, không bảo đảm mọi video/CDN bên ngoài luôn phát được. Chưa đo vị trí phát; “Xem tiếp” trở lại tập gần nhất, không dựng progress giả.
- Font Google được tải khi build rồi self-host. Môi trường build cần tải font được hoặc có cache; browser người xem không gọi Google để tải font.
- Chưa có backend gửi báo lỗi/cộng đồng. Không thay đổi tính chất lưu cục bộ của bookmark, history, ghi chú.
- Có thể xem local bằng `npm run dev`, hoặc `npm run build` rồi `npm run start`. Các server kiểm tra tạm thời đã được dừng sau QA.

Hallmark đã dùng để chọn cấu trúc và rà các anti-pattern; không công bố “58/58 pass” hoặc chứng nhận WCAG toàn site. Self-critique: **P4 H4 E4 S4 R5 V4**, ghi trong token stamp và project memory. Thiết kế nhất quán theo `design.md`, không xoay theme theo từng trang.
