# Kết quả sửa trang xem PTQ — 17/10/2026

Đã triển khai phần frontend của [kế hoạch](PLAN.md), theo các vấn đề trong [báo cáo Hallmark](REPORT.md). Giữ dữ liệu/provider, logo PTQ, hệ màu và font hiện có. Không thêm quảng cáo, backend hoặc trình phát giả.

## Những thay đổi đã hoàn thành

| Vấn đề | Thay đổi | Bằng chứng |
| --- | --- | --- |
| W01 · Chiều rộng phụ thuộc chiều cao | Nội dung tối đa1440px; gutter32px desktop,16px mobile; breakpoint sidebar chỉ dựa trên chiều rộng | Test so sánh player và các cột ở1920×1080 với1920×600 |
| W02 · Mở rộng đổi nhãn nhưng không đổi khung | Bỏ nút mở rộng tùy biến; giữ fullscreen native/iframe | Test menu không còn mục Mở rộng; kiểm tra trực tiếp desktop/tablet |
| W03 · Tải lại bị giấu | Tải lại và Chọn tập hiện trực tiếp; Chọn tập cuộn và focus đúng nguồn/heading | Test thao tác, kích thước nút và focus sau tải lại tại320–1920px |
| W04 · CSS chồng lớp | Tách `src/components/watch/watch.css`, scope theo `.rp-watch-page`; bỏ các rule watch cũ trong `detail.css` và `globals.css` | Rà code và hồi quy các route liên quan |
| W05 · Thông tin đẩy phần tập xuống xa | Tên phim/tập nằm trên player, summary gọn, mô tả đầy đủ và ghi chú nằm trong disclosure sau danh sách tập | Ảnh thật và mock được phân biệt bên dưới |
| W06 · Gợi ý mobile quá dài | Mobile hiện3 mục; Xem thêm/Thu gọn hoạt động thật; desktop tối đa6 | Test mở/thu danh sách; xem ảnh375px |
| W07 · Chữ nhỏ | Body/thao tác14px; metadata ít nhất12px; nút44px, focus trung tính | Kiểm tra CSS, kích thước control và contrast |
| W08 · Bộ đếm thừa | Nhiều tập dùng “Tập01 ·120 tập”; phim một tập dùng “Bản đầy đủ” | Test trường hợp một tập, nhiều tập và rỗng |
| W09 · Mô tả cắt hai lần | Bỏ helper SEO160 ký tự khỏi summary; clamp thị giác và có toàn văn trong disclosure | Rà component, quan sát phim thật |

Nguồn trùng ngôn ngữ/nhà cung cấp có số phân biệt ổn định và tooltip tên đầy đủ. Không thêm chấm trạng thái nguồn không có dữ liệu. Đổi nguồn tiếp tục giữ đúng tập theo tên khi thứ tự khác nhau; URL và lịch sử giữ source/sv/ep cùng ngữ cảnh đang có.

Menu hỗ trợ Arrow/Home/End, Escape, Tab/Shift+Tab và trả focus. Báo cáo sự cố vẫn tải file JSON về thiết bị; không hiển thị thông báo gửi hỗ trợ thành công giả.

## Kiểm chứng

- `npm run lint`: qua.
- `npm run build`: qua, gồm TypeScript và production compilation.
- `npm run test:unit`: toàn bộ các nhóm qua.
- `npm run test:e2e:mock -- watch-redesign.spec.ts redesign.spec.ts recovery.spec.ts mock.spec.ts interface-improvements.spec.ts`: **54/54 qua**.
- Sau khi sửa cách chụp ảnh để đưa scroll về đầu trang và bỏ focus đang còn trên control: chạy lại riêng `watch-redesign.spec.ts`, **7/7 qua**.
- Các khung kiểm tra toolbar:320,375,414,768,1024,1280,1440,1920px. Kiểm tra bounding box của nút trong player, popup trong viewport, focus, trạng thái disabled và tràn ngang. Test chiều rộng ở1920×600/1080 kiểm tra cả player và các cột nội dung.
- Có test playlist HLS đã parse nhưng segment chưa tới: loading phải còn hiện, Tải lại/Chọn tập vẫn dùng được. Test này không giả lập thành công phát video.
- Hồi quy trang chi tiết, trang chủ, tìm kiếm, bộ lọc, điều hướng, ghi chú, bookmark/chia sẻ và report. Đây là kiểm tra chức năng/hình học; không phải cam kết không còn mọi lỗi thị giác.

## Kiểm tra trực quan và media thật

- Đã mở local với **Người Hùng Yếu Đuối**, nguồn KKPhim thuyết minh, tập01. HLS ban đầu chờ thao tác phát; sau khi nhấn play quan sát được hình phim chuyển động và trạng thái audio playing. Không báo nguồn lỗi khi autoplay bị chặn.
- Đã quan sát trực tiếp toolbar, summary, danh sách tập và nguồn tại cửa sổ desktop rộng và tablet khoảng860px. Đã đối chiếu ảnh mock375px và1440px sau lượt kiểm thử cuối.
- **Giới hạn còn lại:** chuyển thủ công sang iframe bên ngoài `player.phimapi.com` ở cùng tập cho cây accessibility báo “Unable to play media”. Đây là kết quả của trình phát ngoài; parent không đọc được trạng thái phát xuyên origin để tự báo chính xác mọi lỗi. HLS chính đã phát được; đường tải lại/chọn nguồn vẫn có sẵn. Không coi sự kiện iframe onLoad là xác nhận phát thành công.
- Chưa xác minh Safari/iOS, điện thoại vật lý, screen reader hoặc toàn bộ phim/nguồn. Không có kết quả đo tốc độ/LCP để tuyên bố cải thiện hiệu năng.

## Ảnh bằng chứng

- [Desktop với dữ liệu và video thật](evidence/implemented-real-desktop.png): ảnh nguyên bản từ trình duyệt, tại vị trí cuộn để thấy toolbar và phần tập.
- [Mobile375px — media mock](evidence/implemented-mock-375.png).
- [Desktop1440px — media mock](evidence/implemented-mock-1440.png).

Hai ảnh mock có khung trắng “Mock player ready”; đó là fixture phục vụ kiểm tra bố cục, không phải trạng thái video thật của sản phẩm. Ảnh chụp toàn trang cuối cùng đã đưa scroll về đầu trang để header cố định xuất hiện đúng vị trí trong ảnh.

Các điểm tự chấm Hallmark trong comment là ghi chú tự đánh giá thiết kế; không thay thế bằng chứng kiểm tra ở trên. Bản sửa hiện nằm trong workspace local.
