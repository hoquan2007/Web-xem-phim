<!-- Hallmark · redesign plan · artifact self-critique: P5 H4 E4 S5 R5 V3 -->
# Kế hoạch thiết kế lại trang xem PTQ

Trạng thái: đã triển khai phần frontend ngày 17/10/2026. Xem bằng chứng, kiểm thử và giới hạn trong [RESULTS.md](RESULTS.md). Phương án dựa trên [REPORT.md](REPORT.md), dữ liệu thật và tài nguyên đang có. Hướng tham khảo: [trang xem RoPhim](https://rophim1.vip/xem-phim/nguoi-hung-yeu-duoi.514118), loại toàn bộ quảng cáo.

## 1. Mục tiêu và nguyên tắc

Người dùng nhận ra đang xem phim/tập nào, chuyển tập hoặc tải lại ngay khi cần. Video là vùng chính; thông tin và đề xuất hỗ trợ việc xem. Giữ logoPTQ, nền tối, font system UI, vàng hiện có và một thư viện iconLucide. Không mở rộng backend hoặc làm lại toàn bộ trình phát.

**Ba thay đổi so với bản trước:**

1. Chiều rộng toàn trang không còn phụ thuộc chiều cao viewport.
2. “Tải lại” và “Chọn tập” là thao tác trực tiếp; menu chỉ chứa tùy chọn ít dùng.
3. Danh sách tập được tiếp cận nhanh, thông tin dài và gợi ý không đẩy thao tác xem ra xa.

## 2. Bố cục đề xuất

### Desktop

```text
Header PTQ hiện tại

Tên phim · Tập đang xem                              Chi tiết phim ↗
┌─────────────────────────────────────────────────────────────────┐
│                         PLAYER THẬT                             │
│             HLS / iframe hiện có, không crop video               │
├─────────────────────────────────────────────────────────────────┤
│ ‹ Trước   Tập01 ·8 tập   Tiếp ›       Chọn tập   Tải lại   ⋯      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────┬───────────────────┐
│ Poster · Tên gốc · năm · chất lượng          │ Có thể bạn thích  │
│ Giới thiệu ngắn       Lưu tủ phim · Chia sẻ  │ 6 mục tối đa      │
├─────────────────────────────────────────────┤                   │
│ DANH SÁCH TẬP          [Nguồn phát ▾]        │                   │
│ [01 ▶] [02] [03] [04] [05] [06]             │                   │
│ [07]   [08]                                 │                   │
├─────────────────────────────────────────────┤                   │
│ Thông tin thêm ▾     Ghi chú cá nhân ▾       │                   │
└─────────────────────────────────────────────┴───────────────────┘
```

- Container mục tiêu tối đa1440px nội dung, gutter24–32px, căn giữa. Cùng một viewport rộng nhưng cao600/768/1080px phải giữ cùng trục nội dung và độ rộng cột.
- Bản đầu giữ vùng media16:9, controls native/iframe và `object-fit: contain`. Không ép **toàn trang** co lại để toolbar luôn nằm trong màn hình đầu tiên. Việc cần cuộn trên màn hình thấp được xem là hành vi bình thường nếu nội dung vẫn rõ và dễ truy cập.
- Nếu cần chế độ player gọn, triển khai riêng trên media wrapper và kiểm tra cả HLS/iframe; không cho thay đổi đó kéo co summary, tập và sidebar.
- Thanh thao tác56–64px, nút44px tối thiểu; không thêm viền vàng hoặc glow quanh player. Fullscreen dùng control sẵn có của trình phát.
- Tạm ẩn “Mở rộng” tùy biến trong bản sửa đầu. Chỉ đưa trở lại sau khi đã có chế độ rạp phim thực sự thay đổi vùng xem và có điều kiện hiển thị đúng khả năng màn hình. Không còn nhãn thay đổi mà hình học không đổi.
- Tóm tắt ngắn tối đa2–3 dòng, poster khoảng80×120px. Lưu/chia sẻ cùng một hàng gọn; không thêm CTA “Xem Ngay” khi đang ở trang xem.
- Cột chính dùng `minmax(0, 1fr)`, sidebar khoảng280–320px khi đủ rộng; khi thiếu chỗ thì xếp xuống dưới. Breakpoint theo nội dung thực tế, không chỉ theo tên thiết bị.

### Mobile

```text
Header gọn
Tên phim · Tập01
┌────────────────────────────────────┐
│              VIDEO16:9             │
├────────────────────────────────────┤
│ ‹ Trước       Tập01       Tiếp ›   │
│   Chọn tập      Tải lại       ⋯    │
└────────────────────────────────────┘
Poster nhỏ · năm · chất lượng
Lưu tủ phim                         Chia sẻ

Danh sách tập          [Nguồn phát ▾]
[01 ▶] [02] [03] [04]
[05]   [06] [07] [08]

Thông tin thêm ▾
Ghi chú cá nhân ▾
Có thể bạn thích — 3 mục, mở thêm nếu cần
```

- Gutter16px; player giữ16:9; không có nút “Mở rộng” desktop vô tác dụng.
- Hai hàng điều khiển có chủ đích. Nhãn “Chọn tập” ngắn và dẫn tới đúng vùng tập/nguồn, không tạo thêm một bộ chọn nguồn thứ hai.
- Danh sách tập4 cột khi đủ chỗ,3 cột ở320px hoặc khi tên tập dài. Không đặt một nhãn khó hiểu chỉ để giữ số cột.
- Mô tả dài/facts mở bằng disclosure. Nếu đã ẩn mô tả, bỏ cả hàng hoặc khoảng cách không còn phục vụ nội dung.
- Gợi ý chỉ mở3 mục ban đầu; nút “Xem thêm” thật để mở phần còn lại khi có dữ liệu.
- Metadata tối thiểu12px, thao tác14px, body14–15px; tên phim18–20px. Chữ nút không xuống dòng, focus trung tính và mục tiêu chạm44×44px.

## 3. Phân nhóm chức năng

| Hiện trực tiếp | Trong menu / mở khi cần |
| --- | --- |
| Tập trước / tập hiện tại / tập tiếp | Tắt/bật đèn |
| Chọn tập — dẫn tới phần nguồn/tập | Đổi trình phát nếu thật sự có phương án khác |
| Tải lại video | Tạo file báo cáo sự cố với mô tả đúng chức năng |
| Một bộ chọn nguồn tại phần tập | Chi tiết kỹ thuật hoặc tên nguồn đầy đủ |
| Bookmark và chia sẻ trong summary | Thông tin dài, ghi chú cá nhân |

Nguồn phải có nhãn ngắn nhưng duy nhất. Ví dụ nếu hai nguồn cùng Vietsub/KKPhim, dùng thêm biến thể hoặc số phân biệt, giữ tên đầy đủ trong popup. Không vẽ chấm xanh để ám chỉ nguồn khỏe nếu không có dữ liệu kiểm tra sức khỏe.

Với phim lẻ: vô hiệu hóa hoặc ẩn điều hướng tập không cần thiết, nhãn “Bản đầy đủ”; không ép hiển thị “1/1”. Với nhiều tập: phân nhóm50, tìm tập và giữ tập đang xem trong nhóm được chọn, không cuộn giật cả trang.

## 4. Các trạng thái cần thiết kế trước khi viết CSS

| Trạng thái | Người dùng thấy | Hành động |
| --- | --- | --- |
| Đang tải | Khung ổn định, poster phù hợp, nhãn ngắn | Tải lại/chọn nguồn vẫn truy cập được |
| Sẵn sàng nhưng autoplay bị chặn | Poster và nút phát của player | Nhấn phát, không báo lỗi nguồn sai |
| Đang phát / tạm dừng | Controls thật của video/iframe | Không có lớp trang trí che thao tác |
| Buffer lâu / lỗi nguồn | Thông báo ngắn có căn cứ | Thử lại, chọn nguồn, dùng dự phòng nếu có |
| Không có tập | Thông báo rõ, không spinner vô thời hạn | Về phần tập/nguồn hoặc chi tiết |
| Tên nguồn/tên phim dài | Truncate có chủ đích, đọc đầy đủ khi mở | Không cắt mất nút lân cận |
| Tập đầu/cuối | Nút đúng chiều bị disabled | Không đổi URL tới tập ngoài danh sách |
| Đã lưu / lỗi chia sẻ | Trạng thái bookmark thật / link fallback | Không toast thành công giả |

Không suy luận iframe đã phát thành công chỉ vì trang iframe tải xong. Không báo đã gửi hỗ trợ khi thực tế chỉ tải JSON. Kiểm thử media thật tách khỏi kiểm thử mock để biết giới hạn bằng chứng.

## 5. Kế hoạch triển khai theo từng phần

| Bước | Việc làm | File dự kiến | Điều kiện hoàn thành |
| --- | --- | --- | --- |
| 1 · Dọn nền CSS | Liệt kê rule watch đang áp dụng; tách CSS có scope riêng, bỏ các override watch lỗi thời trong file cũ. Giữ CSS trang chi tiết và header | Thêm `src/components/watch/watch.css`; sửa `detail.css`, import trong `WatchContainer.tsx`; token nếu cần | Trang chi tiết không đổi; chiều rộng nội dung ổn định ở cùng độ rộng viewport |
| 2 · Sửa thao tác | Toolbar trực tiếp Chọn tập/Tải lại; điều hướng tập đúng; ẩn mở rộng chưa có tác dụng; menu phụ dễ dùng và đóng đúng | `WatchToolbar.tsx`, `WatchContainer.tsx`, `VideoPlayer.tsx` | Thao tác có kết quả quan sát được; keyboard/Escape/focus hoạt động; không mất nút trên320px |
| 3 · Sắp lại nội dung | Summary nhỏ, một bộ nguồn/tập, disclosure thông tin/ghi chú, gợi ý gọn | `WatchMovieSummary.tsx`, `EpisodeSelector.tsx`, `RelatedMovies.tsx`; dùng lại `MovieActions.tsx` | Chọn tập tiếp cận nhanh; không nhãn nguồn trùng; không đổi CTA của trang chi tiết |
| 4 · Trạng thái phát | Phân biệt tải, sẵn sàng, buffering, lỗi và rỗng; giữ fallback hiện có | `VideoPlayer.tsx`, kiểm thử media/recovery tương ứng | Không spinner chết; không giả báo lỗi hoặc thành công; có đường phục hồi rõ |
| 5 · Nghiệm thu | Chụp và đối chiếu dữ liệu thật, kiểm tra hồi quy và cập nhật tài liệu đúng kết quả | `tests/e2e/watch-redesign.spec.ts`, `recovery.spec.ts`, tài liệu kết quả; `design.md` chỉ cập nhật sau khi bản sửa đạt | Có bằng chứng cho từng tiêu chí dưới đây; không chỉ đếm số test |

Không xóa file production, không thay bộ provider, không tải lại video từ nguồn, không đổi route. Chưa cần thư viện UI/animation mới hoặc cài lại công cụ clone. Nếu phải đổi hành vi dữ liệu ngoài phạm vi UI, tách ra và giải thích cụ thể.

## 6. Nghiệm thu để tránh lặp lại lỗi cũ

### Bố cục

- Khung320,375,414,768,1024,1280,1440,1920px. Kiểm tra trực tiếp trên trình duyệt và ít nhất một lượt điện thoại thật khi có thiết bị.
- Thêm các khung desktop thấp:1920×600 và1920×1080. Chiều rộng nội dung không đổi chỉ vì chiều cao thay đổi.
- Kiểm tra đúng vị trí scroll, trạng thái phát và phim khi so sánh. Ảnh mock phải ghi rõ là mock; không dùng white iframe giả lập làm bằng chứng video thật hoạt động.
- Không chỉ test root overflow: đo cả bounding box của nút, popup, select và nội dung trong parent để tìm clipping. Không cho một control “pass” chỉ vì label thay đổi.
- Thứ bậc trong một lượt nhìn: biết phim/tập, thấy chuyển tập/tải lại, tìm được nguồn; metadata và gợi ý có trọng lượng thấp hơn.

### Dữ liệu và thao tác

- Phim lẻ,8 tập, trên50 tập, tên dài, một/nhiều nguồn, hai nguồn cùng ngôn ngữ/nhà cung cấp, tập không tương ứng và dữ liệu rỗng.
- Giữ source/identity/title/sv/ep. Lịch sử đúng tập; không hứa resume theo phút nếu chưa lưu dữ liệu đó.
- Keyboard: Tab/Shift+Tab, Arrow/Home/End, Escape, focus sau reload/report. Reduced motion, tắt đèn và popup gần mép viewport.
- Kiểm tra HLS thật và iframe thật riêng: tải thành công, autoplay bị chặn, lỗi mạng và fallback. Không giả định parent kiểm soát được controls bên trong iframe.
- Xác định ảnh LCP thật và chính sách eager/preload phù hợp; các poster ngoài màn hình vẫn tải lười. Đo lại trước khi tuyên bố đã cải thiện tốc độ.

### Kỹ thuật và phạm vi

- Lint, production build và các E2E phù hợp. Test chỉ được kết luận đúng phạm vi assertion; “build qua” không đồng nghĩa “thiết kế đạt”.
- So sánh trang chi tiết, trang chủ, tìm kiếm và bộ lọc để bảo đảm CSS watch mới không lan sang phần khác.
- Chốt một bộ ảnh trạng thái thật trước/sau, danh sách sai khác còn lại và giới hạn kiểm chứng. Chỉ sau đó mới cập nhật tài liệu thiết kế hoặc bàn giao triển khai xong.

## 7. Những phần không clone trong vòng này

Quảng cáo/popup; phòng xem chung; bình luận/đánh giá cộng đồng; điểm giả; ảnh diễn viên không có nguồn dữ liệu; trình phát tùy biến bên trong iframe RoPhim. Giữ bộ tài nguyên thật của PTQ và học thứ bậc/bố cục từ nguồn.
