# Rà soát thông báo giao diện — 05/11/2026

Phạm vi: nội dung thông báo, trạng thái trống và nội dung trợ giúp trên trang chủ, danh mục, tìm kiếm, chi tiết, xem phim, lịch cập nhật và tủ phim. Giữ bố cục và phong cách hiện có.

| Phát hiện | Xử lý |
| --- | --- |
| Khung thống kê `x/y tập có nguồn phát` xuất hiện thường xuyên | Gỡ khỏi trang chi tiết và xem phim; bỏ component không còn dùng. |
| Thông báo tự đổi trình phát mang nội dung kỹ thuật và tồn tại sau khi khôi phục | Bỏ thông báo; vẫn giữ cơ chế chuyển trình phát và trạng thái tải/lỗi. |
| Lời nhắc lỗi luôn xuất hiện dưới mọi video nhúng | Gỡ lời nhắc; giữ nút `Thử nguồn cùng tập` để khôi phục khi cần. |
| Tiêu đề `Server không khả dụng`, mô tả lỗi trùng ý | Đổi thành `Không thể phát video`, rút ngắn hướng dẫn; giữ nút thử lại và đổi nguồn. |
| Thông báo chưa có nguồn bị lặp ở chi tiết và trình phát | Bỏ khối thông báo lặp; giữ trạng thái tập `Chờ nguồn` và hướng dẫn trong player. |
| Ghi chú cá nhân có lời giải thích dài và lặp ở tiêu đề đóng/mở | Chỉ giữ một câu về tính riêng tư và lưu trên trình duyệt, bên trong phần ghi chú. |
| Hộp báo cáo dùng khung cảnh báo lớn và thông báo thiếu hệ thống nội bộ | Đổi thành trợ giúp văn bản nhỏ; ghi rõ file tải về máy, không tự động gửi đi. Không giả lập gửi thành công tới hỗ trợ. |
| Lịch cập nhật nói về nhà cung cấp và giải thích dài trong trạng thái trống | Đổi sang mô tả nội dung phim mới/tập mới và lời mời chọn ngày khác. |
| Tủ phim trống lặp lại thông tin lưu trên trình duyệt | Rút gọn thành lời mời lưu phim; thông tin phạm vi lưu vẫn có ở phần đầu trang. |
| Trạng thái không tải được danh mục nhắc tới kết nối nguồn phim | Chuyển sang thông báo ngắn về tác vụ không hoàn tất và hướng dẫn thử lại. |
| Trailer trống nhắc tới nguồn cung cấp | Rút gọn thành `Chưa có trailer.` |

## Thông báo được giữ

- Lỗi lưu tủ phim, lịch sử, ghi chú: cần để người dùng biết dữ liệu chưa được lưu.
- Xác nhận xóa: cần để tránh mất dữ liệu do thao tác nhầm.
- Lỗi sao chép liên kết: có liên kết thay thế để người dùng sao chép.
- Tập chưa có nguồn, nguồn không có tập đang xem: giúp tránh chuyển sang sai tập.
- Danh sách lịch cập nhật không đầy đủ khi một yêu cầu lỗi: tránh hiểu nhầm dữ liệu đầy đủ.
- Trạng thái tải, kết quả tìm kiếm và thông báo cho trình đọc màn hình.

## Kiểm chứng

- TypeScript, ESLint cho các component đã sửa và production build đều đạt.
- Ảnh giao diện sau sửa ở 1440, 768 và 375 px; trang xem và hộp báo cáo không tràn ngang, không còn banner chuyển trình phát thường trực.
- Tải báo cáo vẫn tạo file `ptq-bao-loi-phim.json`, có xác nhận rõ không tự động gửi đi.
- Bảy đường dẫn đại diện trả 200 trên server local với dữ liệu mock: chi tiết, xem phim rỗng, lịch cập nhật, tủ phim, trang chủ, danh mục và tìm kiếm. Kết quả máy đọc tại `verification.json`.
- Chạy 37 ca E2E recovery, watch-redesign, storage và redesign: 36 đạt lần đầu; một fixture storage từng ghi đè lịch sử từ iframe mock cùng origin. Đã giới hạn khởi tạo dữ liệu vào trang chính, chạy lại ca đó và đạt.

Ảnh dùng dữ liệu mock để kiểm tra giao diện và tương tác, không chứng minh khả năng phát của nhà cung cấp bên ngoài. Thay đổi chưa được commit hoặc deploy trong lượt này.
