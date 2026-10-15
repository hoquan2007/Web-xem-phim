<!-- Hallmark · pre-emit critique: P4 H5 E4 S5 R5 V4 -->
# HNQ Film — audit frontend, 15/10/2026

Báo cáo này giữ nguyên trạng thái và tham chiếu mã nguồn lúc audit ban đầu. Các thay đổi đã triển khai sau đó được đối chiếu tại [IMPLEMENTATION.md](IMPLEMENTATION.md).

## Kết luận

Giao diện có nền tảng catalogue sử dụng được, poster tải được trong các mẫu đã mở, tìm kiếm và đổi loại phim hoạt động. Điểm cần sửa lớn nhất là tính trung thực của nhãn nội dung, khả năng sử dụng trên mobile/bàn phím và một hệ thống thị giác thiếu nhất quán. Cảm giác giao diện mẫu đến từ tổ hợp gradient nhiều màu, glow, khung bo lớn lồng nhau, chữ đậm gần như đồng mức và các hàng nội dung lặp lại.

Ghi nhận **30 phát hiện: 10 P1 · 17 P2 · 3 P3**. Đây là kết quả trong phạm vi kiểm tra dưới đây, không phải tuyên bố tìm hết mọi lỗi của mọi phim, mọi nguồn phát hoặc mọi trình duyệt. Nhận xét thẩm mỹ không chứng minh mã nguồn do AI tạo.

Người dùng đã chọn hướng **rạp phim: tối, tinh gọn, tập trung poster**. Đề xuất triển khai ở [PLAN.md](PLAN.md). Lần làm việc này cài Hallmark và tạo tài liệu; chưa sửa frontend hoặc deploy.

## Phạm vi và độ chắc chắn

- Website thực tế: [hnqfilm.vercel.app](https://hnqfilm.vercel.app/), kiểm tra bằng trình duyệt ngày 15/10/2026, múi giờ Asia/Bangkok.
- Mã nguồn local tại commit `0f96ade3814fd7fe3259ebf6a8110e1357a60867`; working tree sạch trước cài đặt. Chưa xác nhận production dùng đúng commit này. Những khác biệt nhỏ giữa live và local phải đối chiếu lại khi triển khai.
- Nhóm trang đã mở: trang chủ; danh sách tất cả/phim lẻ/phim bộ; thể loại Hành Động; quốc gia Hàn Quốc; tìm kiếm có kết quả/rỗng; chủ đề; phim theo ngày; tủ phim; trang xem Marvel's Luke Cage phần 1; trang 404 chủ động tạo bằng URL không tồn tại.
- Các chiều rộng đã dùng: 320, 375, 414, 768, 1024, 1440px. Đây là lấy mẫu theo trang, không phải mọi trang đều đã chạy ở tất cả kích thước. Tủ phim được đo riêng đủ 320/375/414/768px.
- Có kiểm tra menu mở/đóng, Escape, gợi ý tìm kiếm, bộ lọc loại phim, hộp báo lỗi và cấu trúc DOM/accessibility. Hộp báo lỗi chỉ mở và hủy, không gửi hoặc tạo file báo cáo.
- Chưa chạy axe/Lighthouse, chưa đo Core Web Vitals, chưa kiểm thử Safari/Firefox/thiết bị thật, chưa làm screen-reader audit đầy đủ, chưa xác minh phát xuyên suốt video hay mọi nguồn CDN. Không có điểm hiệu năng hoặc điểm WCAG tổng thể trong báo cáo.
- Ảnh giao diện đã được xem trực tiếp trong phiên kiểm tra; không có bộ PNG baseline được lưu cùng tài liệu này. [EVIDENCE.json](EVIDENCE.json) lưu các quan sát và phép đo chính, phân biệt dữ liệu live với phân tích mã nguồn.

Ký hiệu: **Live + mã** = nhìn thấy trên web và xác định được vị trí liên quan trong local; **Mã** = kết luận từ đường đi trong source, cần thêm kiểm thử runtime khi triển khai; **Thiết kế** = đánh giá thị giác có chủ đích.

## P1 — sửa trước khi mở rộng thiết kế

| ID | Phát hiện và bằng chứng | Vị trí local | Hướng sửa / điều kiện nghiệm thu |
|---|---|---|---|
| F01 | **Metadata không được xác nhận.** Hero gắn cố định `4K`, `T12`, fallback `Tập Full`; đã thấy phim Phù Sa có `TMDB 0.0`. **Live + mã.** | `src/components/home/HeroBanner.tsx:75`, `:145`, `:149`, `:171`; `src/components/watch/MovieDetailInfo.tsx:46` | Chỉ render quality/age/episode khi dữ liệu hợp lệ; rating phải hữu hạn và >0. Không tự suy ra phân loại tuổi. Copy thiếu mô tả phải trung tính. |
| F02 | **Gợi ý bị trình bày như thống kê thật.** Tab Top Ngày/Tuần/Tháng lấy latest trang 2, Trung/Hàn, phim lẻ/Âu Mỹ; card còn gắn `Phần 1` cố định. **Live + mã.** | `src/app/page.tsx:61`; `src/components/home/TopMoviesRankSection.tsx:79`, `:187` | Đổi thành nhóm gợi ý đúng dữ liệu và bỏ số thứ hạng; chỉ giữ ranking theo kỳ nếu có nguồn đo thật. Season chỉ từ metadata. |
| F03 | **Chủ đề và đích đến không tương ứng.** Marvel → mọi phim hành động; Anime → mọi phim Nhật; Cổ Trang → mọi phim Trung; Chữa Lành → mọi phim Hàn. Thẻ Top 10 trang chủ → danh sách phim lẻ thường. **Live + mã.** | `src/app/chu-de/page.tsx:36`, `:45`, `:54`, `:63`; `src/components/home/TopicCardsRow.tsx:40` | Dùng tập phim được tuyển chọn/lọc đúng điều kiện đã hỗ trợ, hoặc đổi tên đúng phạm vi. Không quảng bá bộ sưu tập chưa có dữ liệu. |
| F05 | **Tab tủ phim vỡ nhịp mobile.** 375px: “Tủ Phim Yêu Thích” và “Lịch Sử Xem” thành 3 dòng; ở 320px tab cao khoảng 90/72px, ở 414px vẫn khoảng 57/56px. **Live + mã.** | `src/components/tu-phim/TuPhimContainer.tsx:81` | Nhãn “Đã lưu” / “Lịch sử”, số đếm gọn; nhãn 1 dòng, vùng bấm đồng chiều cao, không cắt icon hay text ở 320px. |
| F06 | **Menu và modal thiếu quản lý focus.** Menu mở nhưng focus vẫn ở nút mở; Escape không đóng; DOM không có dialog semantics. Hộp báo lỗi cũng không có dialog semantics, nút X không tên. **Live + mã**; modal xác nhận xóa có cùng thiếu sót qua **mã**. | `src/components/layout/MobileDrawer.tsx:52`; `src/components/watch/ReportModal.tsx:52`; `src/components/tu-phim/TuPhimContainer.tsx:130` | Focus vào hộp khi mở, giữ Tab trong hộp, Escape đóng, trả focus về trigger; nền không tương tác, khóa cuộn; tên và mô tả hộp được liên kết. |
| F07 | **Không chọn được gợi ý phim bằng Tab như một liên kết.** 6 kết quả là `div` có click, không role/tabindex. **Live + mã.** | `src/components/layout/Navbar.tsx:201` | Đổi mỗi kết quả thành Link thật. Nếu chọn mô hình combobox thì triển khai đầy đủ Arrow/Enter/Escape và active descendant. Ưu tiên danh sách liên kết đơn giản. |
| F08 | **Tên điều khiển/label thiếu.** 5 select bộ lọc có `labels.length=0`; nút xóa từ khóa và nút tìm ở mobile có accessible name rỗng. Nút đèn/mở rộng player cũng mất nhãn khi text bị ẩn. **Live + mã.** | `src/components/filter/FilterBar.tsx:102`; `src/components/search/SearchBarForm.tsx:28`; `src/components/watch/VideoPlayer.tsx:435`; `src/components/layout/Navbar.tsx:173` | `id`/`htmlFor` cho trường, aria-label tiếng Việt cho icon-only controls, selected/pressed/expanded đúng trạng thái. Bổ sung cho tìm tập, textarea và nút X. |
| F09 | **Hero tự chuyển nhưng điều khiển khó phát hiện.** Timer 6000ms, chỉ pause hover/reduced-motion; không pause theo keyboard focus, không có nút dừng. 320px: Prev/Next opacity=0, dải thumbnail display:none. **Live + mã.** | `src/components/home/HeroBanner.tsx:48`, `:55`, `:257` | Mặc định chọn thủ công; nút luôn thấy trên touch và focus. Nếu giữ autoplay phải có pause rõ ràng và pause khi focus. |
| F10 | **Logo vẫn chạy glitch, reduced-motion không được xử lý đầy đủ.** Caller truyền `alwaysOn=false`, nhưng `enableOnHover=false` khiến class vẫn là `glitch-text-effect`, CSS chạy animation liên tục. Media query reduce rỗng; logo còn ping/pulse. **Live + mã** về chuyển động; nhánh reduced-motion được xác định bằng **mã**. | `src/components/ui/GlitchText.tsx:46`; `src/components/layout/HNQBrandLogo.tsx:32`, `:69`; `src/app/globals.css:165`, `:181` | Logo tĩnh mặc định; bỏ ping/pulse trang trí; reduce phải tắt animation trang trí. Sửa logic class thay vì chỉ đổi prop tại caller. |
| F24 | **Navbar desktop xuất hiện quá sớm.** Tại 1024px, nhiều link cao 48px; “Phim Theo Ngày” cao 64px do xuống dòng; logo bị ép theo chiều ngang. **Live + mã.** | `src/components/layout/Navbar.tsx:153`, `:260`; `src/components/layout/HNQBrandLogo.tsx:67` | Chỉ bật nav đầy đủ khi đủ chỗ, dự kiến 1280px sau đo; 768–1279 dùng nav gọn. Link/wordmark không xuống dòng, search có giới hạn linh hoạt. |

## P2 — sửa trong thiết kế lại

| ID | Phát hiện và bằng chứng | Vị trí local | Hướng sửa / điều kiện nghiệm thu |
|---|---|---|---|
| F04 | **Trang phim theo ngày không phân theo ngày cập nhật thật.** `idx % 7` chia đều danh sách, dù đã có chú thích không phải lịch chính thức. Tiêu đề và lời dẫn vẫn ngụ ý thời gian cập nhật thật. **Live + mã.** | `src/components/schedule/ScheduleView.tsx:34`, `:41`, `:65` | Khi chưa có timestamp hợp lệ, trình bày “Gợi ý trong tuần”, giải thích nhóm tuyển chọn. Nếu có ngày sửa thật thì nhóm theo ngày và múi giờ thống nhất, không gọi đó là lịch phát sóng. |
| F11 | **Chia sẻ báo thành công trước khi clipboard thành công.** `writeText()` không await/catch; không có fallback khi bị chặn hoặc API không tồn tại. **Mã.** | `src/components/watch/MovieDetailInfo.tsx:70` | Chỉ báo đã chép sau promise resolve; lỗi thì đưa link có thể chọn/copy, có thông báo truy cập được. |
| F12 | **Mở rộng player chỉ đổi trạng thái nút.** `isExpanded` được dùng cho màu/icon/nhãn của nút, không đổi layout/container. **Mã.** | `src/components/watch/VideoPlayer.tsx:237`, `:448`; `src/components/watch/WatchContainer.tsx:130` | Áp dụng kích thước/layout rạp thật trong route hiện có; thử bật/tắt và kiểm tra bounding box thay đổi ở desktop. Không gọi fullscreen nếu không dùng fullscreen API. |
| F13 | **Landmark `main` lồng nhau.** RootLayout có main, phần lớn page cũng có main; DOM live danh sách/tìm kiếm/tủ phim có 2 main. **Live + mã.** | `src/app/layout.tsx:93`; `src/app/danh-sach/page.tsx:105`; `src/app/tim-kiem/page.tsx:73` | Giữ đúng 1 main cho trang, đặt id cho skip link; nội dung trang dùng section/div phù hợp. |
| F14 | **Token không kiểm soát giao diện thực tế.** `--primary` là đỏ, CTA home amber, player cyan, tủ history emerald; nhiều background slate/hex ngoài token. **Live + mã / Thiết kế.** | `src/app/globals.css:3`; `src/app/page.tsx:94`; `src/components/watch/VideoPlayer.tsx:423`; `src/components/tu-phim/TuPhimContainer.tsx:109` | Một màu hành động amber, palette nền trung tính dùng chung; màu status chỉ mang ý nghĩa trạng thái. Tích hợp vào Tailwind v4 thay vì thêm một bộ token không được dùng. |
| F15 | **Hero chủ đề tím chuyển sắc và nhiều quầng blur.** Trang tìm kiếm/tủ phim cũng dùng cùng kiểu panel có blob. **Live + mã / Thiết kế.** | `src/app/chu-de/page.tsx:96`; `src/app/tim-kiem/page.tsx:76`; `src/components/tu-phim/TuPhimContainer.tsx:55` | Bỏ gradient trang trí ở header nội dung; dùng nền phẳng và thông tin ngắn. Gradient phục vụ đọc chữ trên ảnh vẫn có thể giữ. |
| F16 | **Heading quốc gia tô gradient hồng/tím.** Lệch giọng amber/cyan còn lại, chữ thành vật trang trí. **Mã / Thiết kế.** | `src/components/home/CountryMovieSection.tsx:41` | Chữ đặc, rõ, cùng hệ heading; tạo khác biệt bằng bố cục và poster. Không kết luận utility `.text-gradient` không dùng là lỗi đang hiển thị. |
| F17 | **Chủ đề là lưới feature card 3 cột giống landing page.** Icon trong ô bo, gradient, heading, subtitle, CTA lặp 6 lần; không có poster để nhận biết nội dung. **Live + mã / Thiết kế.** | `src/app/chu-de/page.tsx:113`; `src/components/home/TopicCardsRow.tsx:75` | Home dùng hàng liên kết chủ đề nhỏ; trang chủ đề dùng bộ sưu tập có ảnh phim thật và nhãn chính xác. Chỉ dùng bố cục bất đối xứng khi giúp ưu tiên nội dung. |
| F18 | **Containment và độ nổi bị lạm dụng.** Panel ngoài + card + badge + glass/glow; khối quốc gia bọc nhiều hàng card. **Live + mã / Thiết kế.** | `src/components/home/CountryMovieSection.tsx:21`; `src/components/ui/MovieCard.tsx:46`; `src/components/watch/EpisodeSelector.tsx:57` | Một lớp chứa chính cho mỗi nhóm. Poster đứng trực tiếp trên canvas, bề mặt nâng chỉ dành cho điều khiển hoặc overlay thật. |
| F19 | **Phân cấp chữ yếu dù nhiều chữ đậm.** Inter cho cả body/display, nhiều heading font-black, badge đậm; số thứ tự thêm serif italic, thiếu quy tắc. **Live + mã / Thiết kế.** | `src/app/layout.tsx:2`; `src/components/home/TopMoviesRankSection.tsx:174`; `src/components/home/HeroBanner.tsx:130` | Giới hạn vai trò cỡ/weight; thử display có hỗ trợ tiếng Việt, giữ body dễ đọc. Inter tự nó không phải lỗi; vấn đề là thiếu phân cấp và giọng chữ. |
| F20 | **Tên phim và metadata khó đọc ở card nhỏ.** Tên 1 dòng 12–14px, origin 11–12px, badge 10px. Tìm Marvel trên mobile khó phân biệt đầy đủ phần phim vì tiêu đề bị cắt sớm. **Live + mã.** | `src/components/ui/MovieCard.tsx:77`, `:98`, `:104`; `src/components/home/TopMoviesRankSection.tsx:186` | Tên card cho tối đa 2 dòng với chiều cao dành sẵn; nhãn nút/nav vẫn 1 dòng. Metadata có thứ bậc; đo contrast thực tế trước khi chốt, không suy đoán từ tên class. |
| F21 | **Play và Info ở hero cùng một URL.** Icon gợi hai tác vụ khác nhau nhưng đều tới cùng trang xem; label tiếng Anh. **Live + mã.** | `src/components/home/HeroBanner.tsx:177`, `:211` | CTA chữ “Xem phim”; “Thông tin” chỉ giữ nếu mở phần thông tin/đích có ý nghĩa khác. Nhãn và hành vi phải tương ứng. |
| F22 | **Trang chủ dài và nhịp nội dung lặp.** Hero, 6 chủ đề, latest, top, series, single, 4 quốc gia; nhiều phim xuất hiện lại. Mỗi hàng lại heading/badge/arrow. **Live + mã / Thiết kế.** | `src/app/page.tsx:99`; `src/components/home/MovieRowSlider.tsx:30` | Đưa “Xem tiếp” lên khi có lịch sử, latest sớm, 1 bộ sưu tập có chủ đích; danh mục quốc gia gọn. Khử trùng trong phạm vi viewport/nhóm, giữ đường khám phá toàn bộ catalogue. |
| F23 | **Mỗi card/nút có nhiều tín hiệu hover cùng lúc.** Nâng, zoom, viền, màu, glow và `transition-all`. Đếm tĩnh: 82 dòng transition-all/25 file; 29 dòng hover:scale/15 file. **Mã + Thiết kế.** | `src/components/ui/MovieCard.tsx:46`, `:68`; `src/components/home/TopicCardsRow.tsx:80` | Một tín hiệu phản hồi chính; chỉ transition thuộc tính cần thiết; focus rõ ngay lập tức. Đây là số dòng khớp source, không phải số animation đang chạy hay số instance runtime. |
| F27 | **Ghi chú có thời gian “Vừa xong” được lưu cứng.** Reload ngày sau vẫn đọc chuỗi cũ, không có timestamp để tính thời gian. **Mã.** | `src/components/watch/CommentSection.tsx:144`, `:164`, `:311` | Lưu ISO timestamp, format khi render; đọc tương thích record cũ không parse được. UI ghi chú nên gọn, đúng tính chất cá nhân. |
| F28 | **Loading không khớp kích thước nội dung thật.** Hero skeleton 60/75/85vh, min480/max750; hero thật 520/600/680px; skeleton CTA là nút chữ nhưng hero thật là icon tròn. **Mã**, chưa đo CLS. | `src/components/ui/Skeleton.tsx:50`; `src/components/home/HeroBanner.tsx:82` | Skeleton dùng cùng layout/tokens với kết quả; kiểm tra cold navigation và API chậm. Chỉ kết luận tác động CLS sau đo. |
| F30 | **Origin metadata fallback khác domain được yêu cầu.** Local dùng `https://hnq-film.vercel.app`, người dùng cung cấp `https://hnqfilm.vercel.app`. Production có thể đã override ENV, chưa xác nhận. **Mã / cần xác minh cấu hình.** | `src/app/layout.tsx:13`; `.env.example` | Xác minh domain chính và NEXT_PUBLIC_SITE_URL, kiểm tra OG/Twitter/canonical nếu có. Không tự kết luận production đang dùng origin sai. |

## P3 — biên tập và hoàn thiện

| ID | Phát hiện và bằng chứng | Vị trí local | Hướng sửa |
|---|---|---|---|
| F25 | **Markdown thô và dấu chấm lửng ghi cứng.** Trang chủ đề hiển thị `**HNQ Movie**`; tên topic có `Mới...` ngay từ dữ liệu, dù có thể đủ chỗ. Player hiện “Tập Tập 01”. **Live + mã.** | `src/app/chu-de/page.tsx:107`; `src/components/home/TopicCardsRow.tsx:32`; `src/components/watch/VideoPlayer.tsx:248` | Dùng JSX strong khi cần, tên topic ngắn đầy đủ, truncation chỉ ở CSS; chuẩn hóa tiền tố tập một lần. |
| F26 | **Tên thương hiệu và ngôn ngữ không nhất quán.** HNQ / HNQ Film / HNQ Movie / HNQ Cinema, aria tiếng Anh lẫn tiếng Việt; logo đọc thành HNQ ba lần trong accessibility tree. **Live + mã.** | `src/components/layout/HNQBrandLogo.tsx:69`; `src/components/ui/GlitchText.tsx:48`; `src/components/layout/Footer.tsx:133` | Hiển thị tên HNQ Film thống nhất; tôn trọng tên cá nhân trong brand khi chủ dự án muốn; aria-label một tên, lớp glitch trang trí ẩn khỏi accessibility tree; microcopy tiếng Việt. |
| F29 | **Footer quá nhiều văn mô tả/khung cảm ơn.** Diện tích lớn, lặp thông điệp chung và dẫn 3 nhóm catalogue trong khi điều hướng chính đã có. **Live + mã / Thiết kế.** | `src/components/layout/Footer.tsx:11`, `:18`, `:28` | Wordmark, mô tả 1 câu và nhóm liên kết thật cần thiết; ưu tiên đóng trang gọn. Footer nhiều cột tự nó không phải lỗi vì đây là kho phim có nhiều đích đến. |

## Chấm theo Hallmark — riêng lớp thẩm mỹ

Các mức dưới đây là mức của rubric Hallmark, khác với P1/P2/P3 về tác động sản phẩm. Không lấy điểm thẩm mỹ làm bằng chứng vi phạm WCAG.

| Mức Hallmark | Tell | Vị trí | Sửa |
|---|---|---|---|
| critical | Purple-gradient hero | F15, `src/app/chu-de/page.tsx:96` | Header nền phẳng, tập trung vào chủ đề thật. |
| critical | Gradient headline | F16, `src/components/home/CountryMovieSection.tsx:41` | Chữ đặc theo token. |
| critical | 3-column feature grid | F17, `src/app/chu-de/page.tsx:113` | Chuyển sang ngôn ngữ bộ sưu tập phim. |
| critical | Card-in-card | F18, `src/components/home/CountryMovieSection.tsx:21` | Giảm một lớp panel ngoài. |
| critical | Inter-everywhere | F19, `src/app/layout.tsx:2` | Thiết lập vai trò typography; kiểm tra tiếng Việt và title dài. |
| major | Mid-render token improvisation | F14 | Thu palette về token được sử dụng thật. |
| major | Glassmorphism without purpose | F18 | Nền rõ, glass chỉ cho overlay có lý do. |
| major | Hover-only affordances | F09 | Hiện điều khiển touch và keyboard. |
| major | Auto-rotating carousels with no pause control | F09 | Chuyển thủ công hoặc có pause đầy đủ. |
| major | transition-all / universal scale | F23 | Phản hồi gọn theo thuộc tính. |
| major | Wrap-to-two-lines clickable text | F05, F24 | Rút nhãn và đổi breakpoint. |
| minor | Three periods / copy chưa biên tập | F25 | Sửa dữ liệu hiển thị. |
| minor | Every section padded the same | F22 | Thay nhịp theo vai trò nội dung. |

**Hallmark: 5 critical · 6 major · 2 minor. Verdict: còn nhiều dấu hiệu giao diện mẫu.** Đây là 13 cụm anti-pattern, không cộng thêm vào 30 phát hiện sản phẩm ở trên. Chưa có giao diện mới để công bố pass toàn bộ slop-test.

Không đánh dấu poster grid, nền tối, gradient che ảnh để đọc chữ hay footer catalogue là lỗi tự động. Chúng có thể phù hợp với website xem phim; chỉ xử lý khi cạnh tranh nội dung hoặc gây khó sử dụng.

## Kiểm tra còn cần làm trước nghiệm thu

1. Đo contrast bằng màu đã composite lên nền/ảnh thật. Chữ thường cần 4.5:1, chữ lớn 3:1 theo [W3C về contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html); hiện chưa có phép đo đủ để kết luận toàn site pass/fail.
2. Kiểm tra mọi dòng focus, Tab/Shift+Tab/Escape, zoom 200%, touch, bàn phím mobile. Carousel phải xử lý nội dung tự cập nhật theo [W3C về Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html).
3. State matrix: loading, ảnh lỗi, catalogue lỗi, nguồn phát lỗi, rỗng, title dài, trên 50 tập, nhiều server, storage hỏng, modal ở chiều ngang và bàn phím ảo mở.
4. Lưu screenshot baseline ổn định; so sánh trước/sau với cùng dữ liệu mock. Kiểm tra Chrome, Firefox, Safari và thiết bị iOS/Android thật nếu có.

## Cài đặt và giới hạn triển khai

[Hallmark upstream](https://github.com/Nutlope/hallmark) đã được cài project-scoped tại `.codex/skills/hallmark`, gồm SKILL.md và 106 file reference. Xem [INSTALLATION.md](INSTALLATION.md) để tái cài và sử dụng. Không thêm dependency runtime vào website.

Workspace chưa có `node_modules`; do đó chưa có `node_modules/next/dist/docs/`. Không viết mã Next.js ở lần audit này. Trước triển khai phải cài theo lockfile rồi đọc guide Next.js đi kèm đúng phiên bản theo AGENTS.md, không áp dụng mặc định API từ phiên bản khác.
