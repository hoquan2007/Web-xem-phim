# Các khối trang chủ đã bổ sung

Ngày hoàn thiện: **16/10/2026 (Asia/Bangkok)**. Preview: [localhost:3000/phimhay](http://localhost:3000/phimhay).

## Kết quả

- Hai hàng **30 Phim Bộ Nổi Bật** và **30 Phim Lẻ Nổi Bật**: poster nghiêng xen kẽ, số vàng, tên phim/tên gốc, tập/mùa và nhãn ngôn ngữ thật. Cuộn từng mục, vô hiệu hóa nút ở biên, hỗ trợ bàn phím và cảm ứng.
- **Hoạt Hình Anime Hay** và **TV Shows Truyền Hình**: banner ảnh có gradient, mô tả, CTA xem/lưu/thông tin, mỗi khối có 8 phim đã đối chiếu. Desktop có dải poster; mobile dùng chấm chọn và vuốt ngang như mẫu. Đổi phim không kéo cả trang theo, mọi liên kết/bookmark cập nhật cùng nội dung.
- Thêm5 hàng: **Phim Chiếu Rạp Mới**, **Phim Bộ Mới Nhất**, **PTQ Đề Cử**, **Hoạt Hình Mới Cập Nhật**, **Phim Kinh Dị**.
- Giữ nguyên hero15 video và4 hàng quốc gia. Các khối mới dùng Suspense riêng; bộ dữ liệu theo loại được memoize theo khóa chuỗi, không bắt hero chờ các request mới.

## Dữ liệu và nguồn gốc

Đã đọc API công khai của trang mẫu: `https://rophim1.vip/baseapi/api/v1/lists/homepageLists?page=2&limit=4` và các trang3–4. Chỉ lấy metadata tuyển tập; không nhập JavaScript/CSS production, quảng cáo, bình luận hay tài khoản nguồn.

`scripts/sync-home-collections.mjs` đối chiếu theo tên Việt/tên gốc, năm (cho phép chênh một năm ở các mùa truyền hình), mùa và loại phim với KKPhim; không lấy slug nguồn làm slug PTQ. Kết quả được ghi vào `src/data/home-collections.json`, gồm nguồn, thời điểm, phim PTQ và URL/kích thước ảnh nền:

| Nhóm | Đối chiếu được từ mẫu | Sử dụng khi render |
|---|---|---|
| Phim bộ nổi bật |26/30 | Ưu tiên phim đã đối chiếu, bổ sung từ phim bộ đang cập nhật để đủ 30 nếu nguồn có đủ. |
| Phim lẻ nổi bật |23/30 | Cùng nguyên tắc, chỉ phim lẻ. |
| Đề cử |12/15 |12 phim đã đối chiếu. |
| Hoạt hình |8/10 |8 phim và ảnh nền thật. |
| TV Shows |8/10 |8 phim và ảnh nền thật. |

Không khẳng định đây là bảng xếp hạng lượt xem theo ngày. Nếu dữ liệu ít thì tiêu đề đếm số phim thực tế. Mỗi hàng khử trùng theo danh tính TMDB/mùa hoặc provider+slug. Metadata nguồn PTQ có thể khác tên dịch, poster, năm/tập của mẫu; ví dụ Family Guy mùa 12 được nguồn PTQ ghi năm 2013, mẫu ghi 2014.

Đã xác minh `https://phimapi.com/v1/api/danh-sach/phim-chieu-rap?page=1&limit=30`:30/30 mẫu có `chieurap=true`. Adapter nay giữ cờ boolean này; hàng Chiếu rạp chỉ nhận các item có cờ thật, không suy ra từ năm hoặc chất lượng video.

Runtime dùng API/orchestrator hiện có, không gọi RoPhim. Dữ liệu tuyển chọn không bật lại provider đã bị tắt; khi có phim tương ứng từ nguồn còn bật thì dùng liên kết nguồn đó. Hai banner có 16 ảnh nền local, chỉ gắn ảnh của phim đang chọn; các ảnh khác tải theo nhu cầu. Khi cuộn gần một khối, browser có thể tải sớm ảnh đang chọn của khối kế tiếp theo chính sách lazy loading.

Đồng bộ lại thủ công: `node scripts/sync-home-collections.mjs`. Việc này có mạng, thực hiện riêng với thời gian phục vụ trang chủ; cần kiểm tra lại danh sách sau khi đồng bộ.

## Ánh xạ route

| Trang mẫu | Trang PTQ |
|---|---|
| `/phimhay` | `/phimhay` và `/` |
| `/c/phim-hoat-hinh-anime` | Cùng đường dẫn, truy vấn đúng loại hoạt hình |
| `/c/tv-shows-chuong-trinh-truyen-hinh` | Cùng đường dẫn, truy vấn TV Shows |
| `/c/phim-chieu-rap-moi` | Cùng đường dẫn, truy vấn Chiếu rạp |
| Phim bộ mới nhất | `/phim-bo` |
| Kinh dị | `/the-loai/kinh-di` |
| Xem/thông tin phim trong khối mới | `/phim/:slug?source=...&identity=...&title=...` theo helper hiện có |

## Đối chiếu và kiểm tra

Đã quan sát mẫu desktop và375 px. Mẫu mobile dùng ảnh trên, nội dung dưới, dấu chấm chọn; bản PTQ áp dụng cùng cách sắp xếp, không tự chuyển khi người dùng đọc. Trên desktop, dải poster có 8mục thay vì20–30mục của mẫu vì chỉ giữ phim đã đối chiếu đủ metadata/ảnh.

Ảnh dưới `screenshots/` lấy từ production build với dữ liệu thật, không phải mock. Có8 ảnh: hai hàng và hai banner tại375/1440 px. `LIVE-QA.json` ghi tiêu đề, phim được chọn, overflow và lỗi runtime. Các ảnh trong `reference/` là ảnh gốc do người dùng gửi. Script tái tạo: `node scripts/capture-home-collections.mjs` khi preview chạy cổng3000.

- `npm run build`: đạt Next 16.4.0, bao gồm TypeScript.
- `npm run lint`: đạt.
- `npm run test:unit`: đạt toàn bộ sanitize/validate/security/API/mock/kill-switch.
- 50 E2E mock đạt, gồm 6 workflow mới và hồi quy hero 15 video/catalog/detail/player.
- 6 E2E tắt KKPhim đạt; đã thêm kiểm tra khối mới không lộ liên kết đến nguồn đã tắt.
- Sau sửa cuộn thumbnail, chạy lại 6 workflow tuyển tập: đạt.
- 375/1440 px dữ liệu thật: 8 ảnh đối chiếu không có lỗi runtime hoặc tràn ngang. E2E bổ sung 320/414/768/1024/1920 px; 375/1440 px kiểm tra đủ hàng, nút biên, bộ chọn, bàn phím, vuốt, bookmark/lỗi storage và route xem thêm.

## Phần vẫn để lại theo kế hoạch

Chưa thêm tuyển tập trẻ em vì chưa có phân loại độ tuổi được xác thực. Chưa thêm Sắp chiếu vì danh sách tham khảo có cả phim đã phát hành nhiều năm, chưa có lịch phát hành phù hợp để sử dụng. Bình luận cộng đồng/tài khoản và lượt xem theo ngày cần backend/dữ liệu riêng. Không tạo các khối này bằng số liệu hoặc bình luận giả.

Chưa commit/push hay deploy thay đổi lần này. Website Vercel hiện tại chỉ thay đổi sau khi người dùng yêu cầu phát hành bản mới.
