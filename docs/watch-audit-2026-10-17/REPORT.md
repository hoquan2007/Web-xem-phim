<!-- Hallmark · audit report · artifact self-critique: P5 H4 E4 S5 R5 V3 -->
# Rà soát lại trang xem phim PTQ

Ngày: 17/10/2026. Phạm vi: `/xem-phim/[slug]` và các component mà trang này dùng. Lượt này tạo báo cáo/kế hoạch, không sửa giao diện production.

## Kết luận

Bản sửa trước làm một số thao tác gọn hơn nhưng chưa giải quyết tốt thứ bậc và kích thước bố cục. Việc dùng chiều cao viewport để giới hạn **toàn trang**, giấu tải lại trong menu và chồng CSS mới lên CSS watch cũ làm hướng thiết kế thiếu ổn định. Có một lỗi thao tác đã tái hiện: “Mở rộng” đổi thành “Thu nhỏ” tại khung tablet nhưng kích thước player không thay đổi.

Không thể dùng kết quả42 test chức năng của lượt trước để kết luận giao diện đã đẹp, gần RoPhim hoặc không còn lỗi. Điểm tự chấm trong comment Hallmark cũng không thay thế bằng chứng thực tế.

## Cách kiểm tra và giới hạn

- Đã mở lại [trang chủ RoPhim](https://rophim1.vip/phimhay), tìm cùng bộ phim, đi qua trang chi tiết và [trang xem Người Hùng Yếu Đuối](https://rophim1.vip/xem-phim/nguoi-hung-yeu-duoi.514118). Quan sát player, thanh thao tác, thông tin, nguồn và tập; quảng cáo bị loại khỏi phương án.
- Đã mở bản local với cùng phim, kiểm tra cây accessibility và thao tác menu. Tái hiện trạng thái “Thu nhỏ” tại cửa sổ tablet hẹp hơn ngưỡng CSS1024px, trong khi hình học player giữ nguyên.
- Ảnh mới: [tablet-expand-no-change.png](evidence/tablet-expand-no-change.png). Đây là ảnh nguyên bản từ trình duyệt, không chỉnh sửa để làm mockup.
- Đã đối chiếu CSS hiện tại và hai ảnh kiểm thử375/1440px đang có trong `docs/frontend-audit-2026-10-17/screenshots/`. Hai ảnh đó dùng **media giả lập**, là bằng chứng lịch sử cho bố cục, không phải kiểm tra phát video thật trong lượt này.
- Chưa hoàn thành lượt kiểm tra mobile mới tại320/375/414/768px bằng trình duyệt. Không xác nhận Safari, thiết bị thật, screen reader hay độ ổn định của mọi nguồn phim. Các phần này được ghi thành điều kiện nghiệm thu cho lần triển khai tiếp theo.
- Không đánh dấu ảnh chụp bị lỗi/che khuất trong quá trình capture thành lỗi frontend. Không kết luận màn hình đen hoặc poster đứng yên là lỗi CSS nếu chưa kiểm tra trạng thái phát.

## Phát hiện Hallmark

`major` là vấn đề đáng sửa trong hướng thiết kế/hành vi; `minor` là chi tiết thị giác. Những rủi ro chỉ đọc được từ code được tách riêng, không trình bày như lỗi đã tái hiện trên phim này.

| ID | Mức | Tell / vấn đề | Bằng chứng / vị trí | Hướng sửa |
| --- | --- | --- | --- | --- |
| W01 | major | Geometry driven by the wrong dimension: chiều cao cửa sổ làm co chiều rộng toàn nội dung | `src/components/sites/rophim/detail.css:680` đặt max-width của `.rp-watch-page` theo100svh. Với viewport ngang1920px, công thức cho khoảng823px khi cao600px, nhưng1488px khi cao1080px. Đây là phép tính từ CSS, không phải số đo screenshot. | Container nội dung dựa trên chiều rộng và max-width cố định. Nếu cần giới hạn player, chỉ giới hạn vùng media. |
| W02 | major | Control with no visible result: “Mở rộng” không có tác dụng ở tablet/mobile | Đã tái hiện tại cửa sổ tablet: menu đổi nhãn thành “Thu nhỏ”, player giữ nguyên. `WatchToolbar.tsx:114` luôn render nút; `detail.css:679–682` chỉ áp dụng thay đổi max-width từ1024px. | Bản đầu dùng fullscreen sẵn có của player; ẩn thao tác mở rộng tùy biến khi không có hiệu quả thực tế. |
| W03 | major | Wrong action hierarchy: tải lại bị giấu chung với tùy chọn phụ | `WatchToolbar.tsx:114–117`; quan sát menu thật có Mở rộng/Tải lại/Đổi trình phát/Báo cáo. Khi player chỉ đứng ở poster, người dùng phải biết mở menu mới có thể thử tải lại. | Đưa “Tải lại” và “Chọn tập” ra toolbar. Đổi trình phát vẫn là tùy chọn dự phòng có giải thích. |
| W04 | major | Cascade debt: nhiều lớp watch CSS cùng chi phối một trang | `detail.css:350–428`, `540–558` và `581–737` cùng có rule watch; cả min-height nút và kích thước khung được định nghĩa nhiều lần. Đọc được từ code; không khẳng định mọi rule cũ đều đang tạo lỗi thị giác. | Gom CSS watch thành một stylesheet có phạm vi riêng; chuyển từng rule đang dùng, bỏ override lỗi thời sau kiểm tra hồi quy. |
| W05 | major | Padding-for-padding / weak hierarchy: thông tin phụ ngăn cách player với tập | `WatchContainer.tsx:148–158`, `detail.css:622–637,700–707`. Ảnh kiểm thử375px cho thấy summary, bookmark/share và liên kết chi tiết chiếm thêm một đoạn trước nguồn/tập; mobile ẩn mô tả nhưng vẫn giữ hàng liên kết và các khoảng cách. | Summary gọn, thao tác cá nhân một hàng, có “Chọn tập” ngay dưới player. Chi tiết dài thu gọn và đặt sau phần chọn tập. |
| W06 | major | Secondary content dominates mobile length | `RelatedMovies.tsx:16–24` luôn render6 mục; sidebar xếp xuống dưới trên mobile thành danh sách dọc dài. Xác nhận từ ảnh375px đang lưu. | Desktop tối đa6 gợi ý; mobile ban đầu3 mục, mở thêm bằng thao tác rõ ràng. Chọn tập và thông tin phim vẫn ưu tiên trước. |
| W07 | minor | Small type everywhere | `detail.css:613,625–628,636–637,647,659`: counter11px, metadata11px, nhãn12px và mô tả13px. Đây là kích thước CSS, không phải kết luận fail contrast. | Thân chữ14–15px, thao tác14px, metadata tối thiểu12px. Giữ font system UI của PTQ. |
| W08 | minor | Redundant episode notation | `WatchToolbar.tsx:83–87`: “Tập01” và “1 /8” hiển thị hai tầng; với phim lẻ sẽ có “Tập Full” kèm “1 /1”. | Một dòng “Tập01 ·8 tập”; phim lẻ dùng “Bản đầy đủ” và bỏ bộ đếm không cần thiết. |
| W09 | minor | SEO excerpt reused as on-page content | `WatchMovieSummary.tsx:33` gọi `toMetaDescription`, mặc định cắt160 ký tự ở `src/lib/sanitize.ts:269`, rồi tiếp tục clamp bằng CSS. | Dùng đoạn giới thiệu phục vụ đọc trên trang, có giới hạn chiều dài phù hợp và đường tới chi tiết; không tự rút ngắn hai lần. |

**Tổng: 0 critical ·6 major ·3 minor.** Không có cơ sở để khẳng định đã tìm thấy toàn bộ lỗi hoặc mọi lỗi người dùng thấy đều do một nguyên nhân.

## Các rủi ro và kiểm tra bổ sung

1. **Tên nguồn có thể trùng.** `EpisodeSelector.tsx:39–45` rút nguồn về ngôn ngữ + nhà cung cấp. Nếu hai nguồn cùng KKPhim/Vietsub nhưng khác biến thể, cả hai có thể mang cùng nhãn “Vietsub ·KKPhim”. Phim đang khảo sát chỉ có hai ngôn ngữ khác nhau nên chưa tái hiện tình huống này. Cần nhãn ngắn nhưng duy nhất và giữ tên đầy đủ.
2. **Trạng thái sẵn sàng phát có thể được hiển thị quá sớm.** `VideoPlayer.tsx:176–181` bỏ loading khi nhận MANIFEST_PARSED; các lỗi media/iframe còn phụ thuộc nguồn và trình duyệt. Chưa chứng minh đây là nguyên nhân màn hình đen người dùng gặp. Cần kiểm tra trường hợp có manifest nhưng chưa phát được frame, autoplay bị chặn, buffer dừng và iframe tải trang lỗi.
3. **Keyboard menu cần kiểm tra đầy đủ.** `WatchToolbar.tsx:101–112` có Arrow/Home/End/Escape nhưng chưa quản lý Tab theo mô hình menu đầy đủ. Chưa tái hiện lỗi keyboard trong lượt này. Cần kiểm tra Tab/Shift+Tab, focus sau tải lại và focus khi mở báo cáo.
4. **Cảnh báo ảnh LCP trong dev log.** Khi khảo sát trang thật, Next.js ghi nhận ảnh phim là Largest Contentful Paint và khuyến nghị `loading="eager"`. Đây là cảnh báo hiệu năng đã quan sát, không phải kết luận về điểm Core Web Vitals. Cần xác định đúng ảnh ở màn hình đầu tiên trước khi đặt eager/preload; không áp dụng cho mọi poster trong trang.

## Tài nguyên thực tế có thể dùng

| Có sẵn | Có thể làm ngay |
| --- | --- |
| `MovieDetail`, poster/thumb, content, năm, chất lượng, thể loại | Tên phim, summary, poster thật và phần thông tin thu gọn |
| `EpisodeServer[]`, tên nguồn, tên/slug tập, HLS/embed URL | Một bộ chọn nguồn, danh sách tập, điều hướng và fallback hiện có |
| `VideoPlayer`, hls.js, controls của HTML video/iframe | Giữ trình phát hiện tại; sửa wrapper, trạng thái và hành động phục hồi |
| `MovieActions`, `useBookmarks`, chia sẻ/clipboard | Lưu tủ phim và chia sẻ thật; không thêm đăng nhập giả |
| `useWatchHistory` với nguồn/tập và thời điểm đã xem | Trở lại đúng tập; chưa hứa tiếp tục đúng phút nếu chưa lưu tiến độ |
| `Dialog`, `FilterSelect`, token PTQ và Lucide | Dùng lại dialog/popover, keyboard và icon; không thêm thư viện animation |
| `RelatedMovies` và dữ liệu gợi ý từ category/latest | Sidebar desktop / danh sách gọn mobile; không khẳng định đó là gợi ý cá nhân hóa |
| Ghi chú local và ReportModal xuất JSON | Ghi chú cá nhân, tạo file báo cáo; không nói đã gửi cho kỹ thuật |

Chưa có bằng chứng về backend phòng xem chung, bình luận/đánh giá cộng đồng, tài khoản hay ảnh diễn viên đầy đủ. Những chức năng đó không thuộc bản thiết kế sửa lỗi này.

## Điều cần sửa trong cách đánh giá trước đây

- Kết quả build, lint hoặc test chức năng chỉ chứng minh những điều mà bài kiểm tra thực sự đo. Chúng không chấm được bố cục đẹp hay độ giống nguồn.
- Không chấm điểm site theo comment P5/H5 đang có. Trong lần rà này, **Hierarchy và Execution chưa đạt mức nên bàn giao** do các vấn đề trên.
- Self-critique trong đầu báo cáo là đánh giá chất lượng **tài liệu này**, không phải một chứng nhận rằng giao diện hiện tại đã qua Hallmark.
- Kế hoạch tiếp theo nằm ở [PLAN.md](PLAN.md), thay cho việc tiếp tục áp dụng nguyên xi phương án trước.
