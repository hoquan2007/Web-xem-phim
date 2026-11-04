# Kết quả triển khai mở rộng HLS ngày 04/11/2026

[Kế hoạch chi tiết](./PLAN.md) đã được thực hiện theo các gate kiểm chứng. Đường lookup và quản lý tập đã triển khai tại local. Gate bổ sung provider thứ ba hiện chưa có nguồn đạt đầy đủ điều kiện HLS/identity.

## Thay đổi

- KKPhim hỗ trợ lookup TMDB trực tiếp qua endpoint chính thức `/tmdb/{type}/{id}`. Orchestrator dùng lookup trước search trong cả enrichment nguồn NguonC và khôi phục khi nguồn metadata gốc lỗi. Sau lookup vẫn xác minh identity, type, season. Search giữ vai trò fallback khi lookup không tìm được hoặc trả sai identity/mùa trong ngân sách thời gian chung.
- Phim bộ thiếu season không được trộn giữa các nguồn. Các response cùng tên nhưng khác TMDB hoặc khác mùa bị từ chối.
- Danh sách HLS thay thế được căn theo tên/thứ tự tập gốc NguonC. Tập chưa có URL giữ vị trí trống có nhãn chờ nguồn. Link `ep=1` tiếp tục trỏ tập 2 ngay cả khi nguồn HLS chỉ có tập 1 và tập 3. Các tập mới ở nguồn thay thế được thêm sau danh sách gốc. Nguồn trùng toàn bộ tập/URL được gộp.
- Trang chi tiết và watch hiển thị số tập có nguồn và số tập chờ nguồn. Xem Ngay chọn tập phát được đầu tiên của nguồn mặc định. Link phát ở detail chỉ xuất hiện cho tập có URL. History không ghi nhận ý định xem tập thiếu URL.
- Watch cho phép xem trạng thái của tập còn thiếu bằng URL cũ, giữ lựa chọn tập và hiển thị “Tập này đang chờ nguồn phát”. Nhãn tập trên mobile giữ số tập dễ đọc, trạng thái chờ nguồn nằm trong accessible label/title và nội dung player.

## Khảo sát provider

| Nguồn | Kết quả | Quyết định |
|---|---|---|
| KKPhim | Lookup TV 307478 và movie 299534 trả JSON/detail/HLS. TV 279246 trả 404 | Tích hợp lookup theo contract chính thức |
| OPhim mặc định | ophim1.com trả 404; ophim.cc trả HTML, các origin được forum công bố lỗi kết nối; ophim.live timeout trong mẫu | Tiếp tục tắt |
| VSMOV | Trang API docs và list/detail `/api/*` hiện hoạt động. Hai mẫu detail trả embed, 0 link HLS. Mẫu TV 279246 thiếu season | Chưa đạt gate thêm vào nguồn HLS tự động |
| NguonC | Metadata và danh sách tập còn dùng được; StreamC tiếp tục cách ly | Giữ nguồn metadata và tập gốc, ghép HLS đã xác minh |

Kết quả VSMOV mới thay thế nhận định cũ rằng toàn bộ API của nguồn này không hoạt động. Root `/api` trả 404 nhưng các endpoint được docs công bố trả JSON 200. Tuy nhiên hai mẫu kiểm tra chưa cung cấp HLS và mẫu phim bộ thiếu season, nên chưa thể dùng để tăng độ phủ HLS hoặc ghép tự động Hoàng Hậu Tái Hôn.

Nguồn tài liệu chính thức [KKPhim](https://kkphim2.com/api-document), [VSMOV](https://vsmov.com/api-document), [forum OPhim](https://forum.ophim.cc/d/27-api-postman-ophim-otruyen). Kết quả HTTP/schema thực tế được lưu trong [probe.json](./probe.json).

## Kết quả kiểm chứng

- Lint, TypeScript, build production qua.
- **178 unit/assertion + test tương thích tooling** qua. Thêm regression cho lookup endpoint, sai mùa, outage nguồn metadata, season unknown và khoảng trống giữa các tập.
- **132 E2E mock + 6 kill-switch** qua. [Log E2E](./e2e.txt).
- Browser live ở 375px và 1440px xác nhận *Lời Nói Dối Hoàn Hảo* giữ metadata NguonC, hiển thị 2/2 tập có nguồn và HLS tăng tiến độ hơn 10 giây, readyState 4, 0 iframe.
- *Hoàng Hậu Tái Hôn* hiển thị 0/4 tập có nguồn. Link `sv=0&ep=1` chọn đúng “Tập 2 · Chờ nguồn”, có thông báo chờ nguồn và không tải video/iframe. Cả hai viewport không tràn ngang. [Browser evidence](./browser.json).
- [Audit toàn bộ](./audit-all.json) còn 0 advisory. [Unit](./unit.txt), [build](./build.txt), [lint](./lint.txt), [TypeScript](./typescript.txt).

## Phần còn lại

Chưa bổ sung provider độc lập thứ ba vì các nguồn kiểm tra chưa qua gate. Để đóng phần này cần nguồn công khai có HLS và định danh mùa phim đủ để kiểm chứng, cùng mẫu playback browser thành công. Không thể cam kết tăng độ phủ cho những phim mà mọi nguồn đã kiểm chứng đều chưa có URL.

Phép thử là mẫu tại thời điểm đo. Có URL không bảo đảm mọi tập luôn phát được. Các endpoint lỗi tiếp tục có trạng thái unavailable/cách ly. Bản sửa chưa deploy public, các server audit tạm đã dừng.
