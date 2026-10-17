<!-- Hallmark · audit + design proposal · pre-emit critique: P5 H5 E4 S5 R5 V4 -->
# Phương án thiết kế lại trang xem phim PTQ

Ngày khảo sát: 17/10/2026. Trạng thái: phương án để triển khai, chưa sửa giao diện production.

## Phạm vi và bằng chứng

- Từ [trang chủ RoPhim](https://rophim1.vip/phimhay), tìm đúng “Người Hùng Yếu Đuối”, mở [chi tiết](https://rophim1.vip/phim/nguoi-hung-yeu-duoi) và [trang xem](https://rophim1.vip/xem-phim/nguoi-hung-yeu-duoi.514118).
- So sánh với [trang xem PTQ](http://localhost:3000/xem-phim/nguoi-hung-yeu-duoi?source=kkphim&sv=1&ep=0) và hai ảnh người dùng cung cấp. Bằng chứng gồm ảnh trình duyệt, DOM, kích thước và code hiện tại.
- RoPhim được quan sát ở viewport 1280×720. PTQ được kiểm tra ở 1280×720, 1440×1000 và 375×812. Các số đo khác viewport không dùng làm bằng chứng khớp từng pixel. Chưa khảo sát trực tiếp RoPhim trên mobile; bố cục mobile bên dưới là đề xuất cho PTQ.
- Đây là nghiên cứu bố cục trang xem. Không tải lại video, không thay logo, header, tìm kiếm hay thiết kế trang chủ.

## Những vấn đề đã xác nhận

| Ưu tiên | Hiện tại | Nguyên nhân / tác động |
| --- | --- | --- |
| P0 | Mobile mất nút tải lại | Ở 375px, khung player kết thúc tại x≈357px nhưng nút tải lại nằm ở x≈365–401px. Nhóm nguồn dùng `shrink-0`, select tên dài và khung `overflow-hidden` khiến nút bị cắt. Root không cuộn ngang vẫn có thể che lỗi này. |
| P1 | Cụm dưới player quá dày | Ở 1280px, hai hàng tiêu đề/nguồn và tiện ích cao tổng khoảng 139px. Các thao tác kỹ thuật và điều hướng tập có trọng lượng thị giác gần ngang nhau. |
| P1 | Chọn nguồn xuất hiện hai nơi | Native select trong player và các nút nguồn trong danh sách tập cùng điều khiển một trạng thái. Tên dài như “Server VIP (KKPhim - Thuyết Minh)” chiếm nhiều diện tích. |
| P1 | Khó thấy thao tác dưới player ngay khi vào trang | Video 16:9 cộng khoảng cách đầu trang và hai tầng điều khiển đẩy thao tác xuống dưới. CSS hiện đặt player max-width 1385px, toàn trang max-width 2000px; danh sách tập và thông tin lại rộng theo toàn trang. |
| P1 | Thứ tự thông tin chưa liền mạch | Danh sách tập là một thẻ lớn, tiếp theo là khối thông tin dài và một nút “Xem Ngay” đưa trở lại player đang có sẵn phía trên. |
| P2 | Nhiều nút có nền, viền và màu nhấn đồng thời | Đổi trình phát, tập tiếp, trạng thái nguồn, tắt đèn và báo lỗi cạnh tranh nhau. Nút ở mobile đo được khoảng 38px cao, có nút chỉ 36px rộng. |
| P2 | Bộ chọn tập giữ màu cũ ở chuỗi dài | Nút nhóm 1–50, ô tìm tập và một số trạng thái vẫn dùng cyan/slate trực tiếp thay vì token PTQ hiện tại. |

Màn hình đen trong ảnh không đủ để kết luận lỗi CSS hay nguồn phát. Lần kiểm tra local ghi nhận video có dữ liệu sẵn và kích thước nội tại 1920×1080. Cần kiểm tra riêng trạng thái tải, phát và lỗi; đổi bố cục không tự sửa lỗi giải mã hoặc nguồn video.

## Điểm nên học từ RoPhim

RoPhim dùng cấu trúc player lớn → một thanh tiện ích → thông tin phim gọn → nguồn và tập. Trong khung 1280px, vùng player có gutter 20px, tỉ lệ 16:9 và thanh tiện ích khoảng 64px, không có hai tầng điều khiển như PTQ. Bên dưới là cột nội dung chính và sidebar 380px; thông tin phim kết hợp poster nhỏ, tên/metadata và đoạn giới thiệu ngắn. Danh sách tập dùng nút nền tối, tập đang xem màu vàng, cao khoảng 50px.

Áp dụng cho PTQ: nền tối có phân cấp nhẹ, một hàng thao tác gọn, metadata rút ngắn, tập hiện tại rõ ràng và nội dung bám cùng trục. Giữ hệ chữ system UI, logo PTQ và token hiện có. Không cần đổi theme hay thêm animation trang trí.

## Bố cục desktop đề xuất

```text
Header PTQ hiện tại
                     khoảng cách 20–24px
┌─────────────────────────────────────────────────────────┐
│                     PLAYER 16:9                         │
│             giữ nguyên hình, không crop video           │
├─────────────────────────────────────────────────────────┤
│ ‹ Tập trước   Tập 01 / 08   Tập tiếp ›    Tắt đèn    ⋯   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────┬───────────────────┐
│ Poster nhỏ · Tên phim               │ Có thể bạn thích  │
│ Tên gốc · năm · chất lượng          │ Danh sách gọn     │
│ Tóm tắt tối đa 3 dòng · Chi tiết →   │ poster + tên      │
│ Lưu tủ phim · Chia sẻ               │                   │
├─────────────────────────────────────┤                   │
│ Danh sách tập    [Vietsub] [Th.minh] │                   │
│ [01 ▶] [02] [03] [04] [05] [06]    │                   │
│ [07]   [08]                         │                   │
├─────────────────────────────────────┤                   │
│ Ghi chú cá nhân — mở khi cần        │                   │
└─────────────────────────────────────┴───────────────────┘
```

- Khung nội dung chung đề xuất tối đa 1440px; gutter 24–32px desktop, 16px mobile. Player, toolbar và vùng thông tin dùng cùng mép ngoài.
- Chế độ mặc định giới hạn chiều cao player theo khoảng trống viewport sau header, khoảng cách và toolbar; duy trì 16:9 bằng cách giới hạn cả chiều rộng tương ứng. Không kéo giãn hoặc dùng `object-cover` cho video. Màn hình thấp vẫn có thể cần cuộn; ưu tiên để thấy thanh điều khiển trong viewport desktop thông thường.
- “Mở rộng” chủ động bỏ giới hạn mặc định và tăng vùng xem; fullscreen tiếp tục dùng trình phát sẵn có.
- Toolbar mục tiêu 56–64px ở desktop, một hàng. Thông tin tập được đọc nhanh ở giữa nhóm trước/tiếp. Tập đầu/cuối vô hiệu hóa điều hướng đúng chiều.
- Sidebar 280–320px chỉ xuất hiện khi đủ rộng (đề xuất từ 1280px). Dùng dữ liệu phim liên quan đang có. Ở tablet chuyển xuống dưới. Không để cột trống khi không có dữ liệu.
- Tóm tắt phim đặt trước tập theo trật tự RoPhim, nhưng giới hạn khoảng 120–160px trên desktop. Poster khoảng 80×120px; phần mô tả dài và facts chuyển sang “Thông tin phim” hoặc trang chi tiết.

## Phân nhóm nút và chức năng

| Nhóm | Bố trí và cách thể hiện |
| --- | --- |
| Tập trước / tập tiếp | Đặt sát player, nhãn rõ; nút cùng kích thước. Tập tiếp là thao tác được ưu tiên, không cần thêm hiệu ứng glow. |
| Tắt đèn | Toggle trung tính ở toolbar; có nhãn trạng thái, giữ toolbar sử dụng được khi bật lớp tối. Không thêm viền vàng quanh player. |
| Tùy chọn `⋯` | Chứa Mở rộng/Thu nhỏ, Tải lại video, Đổi trình phát khi có phương án dự phòng, Tạo báo cáo sự cố. Mobile dùng menu/sheet có nhãn đầy đủ. |
| Chọn nguồn | Chỉ giữ tại khu vực danh sách tập. Nhãn theo ngôn ngữ “Vietsub”, “Thuyết minh”; nếu trùng ngôn ngữ giữa nhiều nguồn, thêm nhà cung cấp để phân biệt. Tên đầy đủ vẫn có thể xem được. |
| Lưu / chia sẻ | Đặt cạnh tóm tắt phim, dùng chung logic bookmark và chia sẻ hiện tại. Không lặp “Yêu thích” và “Thêm vào” nếu cùng một chức năng. |
| Xem Ngay | Giữ ở trang chi tiết; bỏ khỏi biến thể thông tin trên trang xem. Tiêu đề/tóm tắt liên kết về trang chi tiết. |
| Báo lỗi | Để trung tính trong menu; chỉ dùng màu lỗi khi thực sự có lỗi. Hiện tại chỉ tạo file báo cáo tải xuống, phải diễn đạt đúng, không thông báo đã gửi tới đội kỹ thuật. |

Không đưa “Phát trực tiếp / Phát nhúng” thành nút nhấn chính. Cách gọi hiện tại dễ bị hiểu là livestream; trong menu nên dùng “Đổi trình phát” và mô tả lựa chọn dự phòng khi khả dụng.

## Mobile và tablet

- Dưới 768px: một cột; player 16:9; không ép thu nhỏ video theo giới hạn chiều cao desktop. Toolbar chia có chủ đích thành hàng điều hướng tập và hàng tiện ích khi thiếu chỗ, thay vì để flex tự tràn.
- Ô nguồn dùng `minmax(0, 1fr)` / `min-width: 0`, tên dài không được đẩy nút ra ngoài. Với nhiều nguồn, dùng dropdown/popover có chiều rộng giới hạn thay vì dãy nút tên dài.
- Mục tiêu chạm tối thiểu 44×44px. Nhãn nút không xuống hai dòng; biểu tượng đơn phải có accessible name. Focus giữ màu trung tính của hệ PTQ.
- Tên phim và metadata gọn, mô tả thu gọn mặc định. Danh sách tập ngay sau tóm tắt; lưới mục tiêu 4 cột tại 375px, giảm còn 3 nếu tên tập dài hoặc chiều rộng 320px không đủ. Không ép chữ bị cắt khó phân biệt.
- 768–1279px: player và các vùng nội dung chung một cột chính; gợi ý phim xuống cuối trang. Thông tin có thể đặt poster bên trái nhưng không giữ sidebar hẹp thiếu chỗ.
- Tập đang xem có màu vàng và biểu tượng phát; khi danh sách dài, tự giữ tập đó trong nhóm 50 tập đang hiển thị. Chuyển nhóm hoặc tìm tập không cuộn giật toàn trang.

## Trạng thái và hành vi cần giữ

1. Khung video có kích thước ổn định khi tải; dùng poster/backdrop sẵn có nếu phù hợp và dòng “Đang tải phim…”. Không để spinner che lỗi vô thời hạn.
2. Lỗi nguồn hiển thị thông báo ngay trong player cùng “Thử lại” và “Chọn nguồn khác”; không suy luận mọi màn hình đen là lỗi nguồn.
3. Giữ HLS/iframe fallback, history, bookmark và URL `source`, `sv`, `ep`, `identity`, `title` nếu đang có. Không xây lại player chỉ để đổi giao diện.
4. Đổi nguồn nên giữ cùng tập khi có thể đối chiếu chính xác; nếu nguồn đó không có tập tương ứng, chọn tập hợp lệ và thông báo rõ. Hiện code đang đưa về tập đầu khi đổi nguồn, cần quyết định và kiểm thử hành vi này trong lúc triển khai.
5. Chỉ dùng vàng cho trạng thái tập/nguồn đang chọn và thao tác cần nhấn mạnh. Trạng thái default, hover, focus, active, disabled, loading, error, success được kiểm tra trong ngữ cảnh thực tế.
6. Chưa thêm tự chuyển tập trong vòng đầu. Nếu bổ sung công tắc như RoPhim, mặc định tắt; chỉ chuyển sau sự kiện kết thúc hợp lệ, không chuyển khi lỗi hoặc người dùng đang chọn tập.

## Các phần từ nguồn chưa phù hợp

- Quảng cáo, popup và banner: loại khỏi bố cục.
- Xem chung: cần hệ thống phòng và đồng bộ phát; không làm nút giả.
- Bình luận cộng đồng, đánh giá và điểm IMDb từ nguồn: không sao chép dữ liệu hoặc tạo số liệu. PTQ tiếp tục dùng ghi chú cá nhân và dữ liệu đánh giá thực đang có.
- Sidebar diễn viên có ảnh: chỉ làm khi dữ liệu ảnh diễn viên đáng tin cậy có sẵn. Vòng đầu dùng phim liên quan, không đoán ảnh người.
- Bộ nút bên trong iframe của RoPhim thuộc trình phát nhúng; vòng đầu giữ controls của HTML video / iframe hiện có, chỉ thiết kế lại phần bố cục PTQ sở hữu.

## Lộ trình triển khai và quyền sở hữu file

| Bước | Nội dung | File dự kiến |
| --- | --- | --- |
| 1 | Tổ chức player + toolbar, sửa nút bị cắt mobile, loại bộ chọn nguồn trùng | `src/components/watch/VideoPlayer.tsx`, `src/components/watch/WatchContainer.tsx`; có thể thêm `WatchToolbar.tsx` nếu giúp tách giao diện khỏi logic phát |
| 2 | Đặt summary → nguồn/tập → ghi chú; thêm vùng gợi ý bên phải khi đủ rộng | `WatchContainer.tsx`, `MovieDetailInfo.tsx`, `RelatedMovies.tsx`, `MovieActions.tsx` với biến thể watch riêng |
| 3 | Nguồn/tập gọn, trạng thái chọn đồng nhất, tập hiện tại và chuỗi dài | `EpisodeSelector.tsx`; cân nhắc tái sử dụng popover/listbox hiện có nếu phù hợp |
| 4 | CSS có phạm vi `.rp-watch-page`; token cho kích thước và màu còn thiếu | `src/components/sites/rophim/detail.css`, `tokens.css`; chỉ chỉnh rule watch trong `src/app/globals.css` nếu xung đột |
| 5 | Kiểm tra thao tác và so sánh desktop/mobile; cập nhật tài liệu sau khi thật sự hoàn tất | Các bài kiểm thử watch hiện có trong `tests/e2e/`, `design.md`, tài liệu kết quả |

Không xóa cây route hoặc thay bộ xử lý provider. `/xem-phim/[slug]` vẫn là trang xem; `/phim/[slug]` vẫn là trang chi tiết. Các biến thể mới không được làm mất CTA ở trang chi tiết.

## Tiêu chí nghiệm thu

- Kiểm tra 320, 375, 414, 768, 1280, 1440 và 1920px, gồm viewport desktop thấp. Không có nút nằm ngoài hoặc bị cắt trong khung cha; không chỉ kiểm tra root có cuộn ngang hay không.
- Một bộ chọn nguồn; không còn “Xem Ngay” lặp trên trang xem. Video giữ đúng tỉ lệ, không crop; thay tập/nguồn không gây nhảy layout bất thường.
- Kiểm tra tập đầu, giữa, cuối; phim lẻ; một/nhiều nguồn; tên phim/nguồn dài; >50 tập; danh sách rỗng; HLS lỗi và iframe fallback.
- Các nút đều có tác dụng đúng nhãn; keyboard, Escape, focus restoration, reduced motion, tắt đèn và mở rộng hoạt động.
- Kiểm tra chức năng tải lại còn nhìn thấy và sử dụng được ở 375px; menu không bị `overflow-hidden` của player cắt.
- Chạy lint, production build và các E2E liên quan watch/history/recovery; đối chiếu ảnh thực trước/sau cùng viewport và trạng thái. Tài liệu này chưa khẳng định các tiêu chí đã đạt vì chưa triển khai.
