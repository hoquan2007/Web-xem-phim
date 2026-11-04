# Chẩn đoán và yêu cầu xử lý endpoint StreamC

Kiểm tra ngày 04/11/2026 lúc 16:25 UTC+7. Metadata API NguonC hoạt động, nhưng hai server tập 1 của Hoàng Hậu Tái Hôn đều trả trang chặn Cloudflare. API cung cấp embed và không cung cấp m3u8 trực tiếp cho các tập đã kiểm tra.

| Host | HTTP | Cloudflare Ray ID |
|---|---|---|
| embed18.streamc.xyz | 403 | a552931a187904c2-HKG |
| embed2.streamc.xyz | 403 | a552931c0bd2e2e0-HKG |

Header SAMEORIGIN được quan sát trên trang lỗi Cloudflare. Cần kiểm tra phản hồi player sau khi gỡ chặn trước khi kết luận chính sách nhúng của nội dung player. Nhận định trước đây về SAMEORIGIN của player cần được hiểu theo giới hạn này.

## Thông tin để quản trị upstream xử lý

Nội dung dưới đây là bản nháp yêu cầu kỹ thuật, chưa gửi cho nhà cung cấp.

API `https://phim.nguonc.com/api/film/hoang-hau-tai-hon` đang trả URL embed của StreamC. Các URL tập 1 trên embed18 và embed2 trả trang “Attention Required” / HTTP 403 tại thời điểm và Ray ID trong bảng. Origin website tích hợp là `https://hnqfilm.vercel.app`.

Đề nghị quản trị StreamC tra Security Events/log theo Ray ID để xác định quy tắc hoặc điều kiện chặn. Vui lòng xác nhận endpoint nhúng hiện hành, origin/referer được hỗ trợ và thông tin xác thực tích hợp nếu cần. Nếu có endpoint mới hoặc m3u8 được cấp cho tích hợp này, cần cung cấp URL/contract chính thức để cập nhật adapter.

Sau khi upstream xác nhận, kiểm tra player trong iframe từ origin website trên desktop/mobile, xác nhận phát được và header phản hồi cho phép tích hợp. Khi kết quả đạt mới bật `API_ENABLE_NGUONC_EMBEDS=1`. Trường hợp có hostname mới cần đồng bộ registry CSP/Permissions-Policy trước khi phát hành.

## Trạng thái ứng dụng

Ứng dụng đang cách ly embed StreamC và giữ đường phát HLS cùng identity khi có nguồn thay thế. Quy tắc Cloudflare và response header của domain StreamC nằm ngoài repository và tài khoản triển khai website hiện có. Hiện chưa có quyền quản trị upstream hoặc endpoint mới được nhà cung cấp xác nhận trong phiên làm việc này.

Bằng chứng máy đọc nằm tại [embed-diagnosis.json](./embed-diagnosis.json).
