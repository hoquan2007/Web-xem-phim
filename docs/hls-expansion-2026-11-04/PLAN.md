# Mở rộng nguồn phát HLS

**Trạng thái thực hiện.** Đã triển khai bước 2–6 và hoàn tất khảo sát bước 1. Việc kích hoạt provider thứ ba còn chờ nguồn đạt gate. Xem [kết quả triển khai và giới hạn](./IMPLEMENTATION.md).

## Mục tiêu

Giữ metadata/native slug NguonC, tăng khả năng tìm tập phát được từ nguồn khác và bảo toàn định danh phim/mùa/tập. Endpoint mới chỉ tham gia đường phát sau khi API, identity và mẫu HLS đã được kiểm chứng.

## Các bước triển khai và nghiệm thu

1. **Khảo sát nguồn.** Kiểm tra các origin OPhim do tài liệu/quản trị công bố, catalogue/search/detail và mẫu media. Đọc tài liệu chính thức KKPhim cho lookup TMDB/IMDb. Lưu status/schema của từng endpoint. Origin không hoạt động tiếp tục bị tắt. Chỉ đưa nguồn có phép thử thành công vào cấu hình mặc định.
2. **Tra cứu identity trực tiếp.** Mở rộng contract adapter bằng lookup TMDB tùy chọn. KKPhim dùng endpoint `/tmdb/{type}/{id}` đã công bố, xác thực lại identity và season từ response. Search theo tên là fallback khi lookup không hỗ trợ, không tìm thấy hoặc trả sai mùa. Toàn bộ thao tác nằm trong deadline chung.
3. **Bảo toàn từng tập.** Đối chiếu tên tập đã chuẩn hóa và loại nguồn trùng URL. Đối với phim NguonC, giữ thứ tự/tên tập của nguồn gốc khi xây nguồn phát thay thế. Các tập thiếu HLS giữ trạng thái unavailable, tránh việc lọc danh sách làm tập 3 trở thành tập 2 trong URL cũ. Không dùng title/slug giống nhau làm bằng chứng đủ để trộn phim.
4. **Hiển thị độ phủ.** Trang chi tiết/watch cho biết số tập có nguồn phát và số tập còn thiếu. Nút Xem Ngay chọn tập phát được đầu tiên. Tập thiếu nguồn có thông báo và đường chọn tập khác. Ngăn nút phát/lịch sử ghi nhận một tập không có URL phát.
5. **Regression.** Kiểm tra lookup đúng ID/sai mùa/404/timeout, fallback search theo tên, nguồn trùng, thiếu identity và thiếu tập giữa danh sách. Kiểm tra URL tập 2 vẫn là tập 2 và không nhảy sang tập 3.
6. **Xác minh.** Lint, TypeScript, unit, tooling compatibility, build, E2E mock/kill-switch và mẫu playback thật trên desktop/mobile. Kiểm tra audit dependency vẫn bằng 0. Ghi trạng thái từng mục và các nguồn chưa đạt gate. Bản triển khai hoàn thành tại local.

## Giới hạn nghiệm thu

Độ phủ được đo trên mẫu catalogue tại thời điểm kiểm tra. Phim không có nguồn cùng identity hoặc thiếu tập cụ thể tiếp tục báo unavailable. Việc thêm nguồn thứ ba phụ thuộc kết quả gate API/media ở bước 1.
