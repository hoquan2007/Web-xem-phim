# Video banner PTQ

Đã đối chiếu toàn bộ15slide từ `https://rophim1.vip/baseapi/api/v1/movies/hot` ngày15/10/2026. URL video/backdrop gốc, file local, kích thước và phim tương ứng của PTQ được lưu đầy đủ trong `src/data/hero-slides.json`.

## Hành vi

- Mở `/` hoặc `/phimhay`: video đầu tự phát, ban đầu tắt tiếng theo chính sách autoplay của trình duyệt.
- Chọn bất kỳ slide hoặc bấm trước/tiếp: hủy tải và dừng video cũ, gắn một video mới và tự phát. Chỉ tải clip đang chọn.
- Giữ lựa chọn âm thanh giữa các slide. Nếu trình duyệt chặn phát có tiếng, thử lại với chế độ tắt tiếng và cập nhật nút âm thanh.
- Tạm dừng chỉ áp dụng clip hiện tại. Chế độ giảm chuyển động chờ người dùng bấm Phát ở mỗi clip.
- Lỗi tải video giữ backdrop thật của phim. Nguồn phim bị tắt không được bật lại bởi dữ liệu banner; phim chưa có nguồn chuyển sang tìm kiếm.
- Nút âm thanh/phát nằm trên phần chữ;15nút chọn phim vẫn truy cập được trên mobile.

## Kiểm chứng

`tests/e2e/hero-video.spec.ts` kiểm tra cả15file MP4 thật ở375px và1440px: đúng nguồn, đúng tên phim, video giải mã được, thời gian tăng, không bị pause/lỗi, chỉ một video đang gắn và chỉ clip đầu tải khi mở trang. Kiểm tra thêm chuyển nhanh, tạm dừng, âm thanh, reduced motion, autoplay bị chặn và video không tải được.

Ảnh: `screenshots/hero-video-1440.png` (slide2), `screenshots/hero-video-375.png` (slide15). Trạng thái phát đo được nằm trong `HERO-PLAYBACK-375.json` và `HERO-PLAYBACK-1440.json`.

Cập nhật bộ video thủ công bằng `node scripts/sync-hero-media.mjs` khi preview PTQ chạy ở cổng3000. Bộ phim tham khảo là bản chụp thời điểm trên; không phụ thuộc API RoPhim trong runtime và không nhập quảng cáo.
