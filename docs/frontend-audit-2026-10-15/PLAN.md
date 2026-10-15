<!-- Hallmark · pre-emit critique: P4 H5 E4 S5 R5 V4 -->
# Kế hoạch thiết kế lại HNQ Film

Trạng thái: đã thực hiện trong workspace ngày 15/10/2026, xem [IMPLEMENTATION.md](IMPLEMENTATION.md) để biết kết quả và giới hạn kiểm chứng. Nội dung bên dưới giữ lại quyết định và tiêu chí của kế hoạch gốc. Người dùng đã chọn **rạp phim: tối, tinh gọn, tập trung poster**.

## Mục tiêu trải nghiệm

Giúp người xem nhận ra phim, chọn đúng phiên bản/tập và bắt đầu hoặc tiếp tục xem nhanh. HNQ Film phải có bản sắc qua tỷ lệ poster, giọng chữ, khoảng cách và cách tuyển nội dung; không dựa vào việc thêm hiệu ứng ở mọi thành phần.

Đối tượng suy ra từ sản phẩm: người Việt xem phim trên điện thoại và desktop. Luồng chính: khám phá hoặc tìm phim → nhận diện đúng phim/phần → chọn tập → xem; luồng trở lại: mở lịch sử → xem tiếp.

## Hệ thống hình ảnh đề xuất

| Thành phần | Quyết định định hướng | Cách kiểm chứng |
|---|---|---|
| Canvas | Nền than tối, 2 cấp surface; chữ trắng dịu và xám đủ contrast. | Poster không bị phủ tối quá mức, control vẫn phân biệt được. |
| Màu hành động | Giữ amber từ giao diện hiện tại, dùng nhất quán cho CTA và selected. Đỏ cho lỗi/nguy hiểm, xanh cho trạng thái thành công, không đổi màu CTA theo từng route. | So home, player, tủ phim và search cạnh nhau. |
| Typography | Body Inter hiện có có thể giữ. Thử Be Vietnam Pro ở heading/display để tạo giọng riêng; kiểm tra glyph tiếng Việt, title dài, trọng lượng font trước khi chốt. Không cần font thứ ba. | Bộ mẫu 10 tên phim ngắn/dài và dấu tiếng Việt, cả 320px lẫn desktop. |
| Phân cấp chữ | Body mục tiêu 14–16px; tên phim 14–16px, metadata thường 12–13px; heading khoảng 22–30px, hero co giãn theo độ dài. Giảm font-black, ưu tiên 400/500/600/700. | Title dài không tràn; card tối đa 2 dòng tên, tên nút/nav 1 dòng. Đây là mục tiêu thiết kế, không phải ngưỡng WCAG về cỡ chữ. |
| Poster | Grid tỉ lệ 2:3; rail phải có lý do khám phá, dùng crop thích hợp cho ảnh ngang; radius nhỏ khoảng 6–10px thay cho bo lớn mọi lớp. | Nhận diện phim không cần hover; fallback không làm đổi kích thước. |
| Spacing | Thang 4px; page gutter khoảng 16/24/40px; container dùng quy tắc thống nhất theo route. | Mobile không ép control; desktop không có khoảng rỗng vô nghĩa. |
| Chuyển động | Dừng autoplay hero mặc định. Hover đổi màu/độ sáng nhẹ, tối đa một tín hiệu chính; reduced-motion tắt trang trí. | UI vẫn đầy đủ khi không hover và khi reduce bật. |
| Component | Button, field, tab, badge, poster card, empty/error state dùng cùng token. | Token có mapping thật vào Tailwind v4; không còn cyan CTA riêng cho player. |

Màu chính xác, font cuối cùng và macrostructure Hallmark chỉ chốt sau preview của trang chủ và trang xem phim. Không ghi một stamp “đã pass” cho thiết kế chưa tồn tại. Không tự động tạo `design.md` hoặc lịch sử build Hallmark như thể đã hoàn tất một redesign.

## Bố cục theo trang

### Trang chủ — một khung điện ảnh và các nhóm có mục đích

1. Header ổn định: logo dễ đọc, search nổi bật; nav đầy đủ chỉ xuất hiện khi đủ chỗ. Mobile có nút tìm ngay trên header, không buộc mở menu để bắt đầu tìm.
2. Một phim tiêu điểm, ảnh phim là điểm nhấn; title vừa phải, metadata thật, CTA chữ “Xem phim”, nút “Lưu”. Hero điều khiển thủ công; tránh tải hai lớp ảnh lớn chỉ để tạo blur.
3. “Xem tiếp” xuất hiện ngay sau hero khi có lịch sử thật. Khi không có, bỏ hẳn vùng đó thay vì tạo dữ liệu demo. Hiện tại chỉ biết tập đã mở, chưa có timestamp vị trí phát: không vẽ progress bar hoặc “còn 20 phút” giả.
4. “Mới cập nhật” đặt sớm; poster và tên phim đủ đọc. Giảm kích thước nhóm chủ đề thành liên kết gọn.
5. Một nhóm gợi ý có tên đúng dữ liệu; một bộ sưu tập có ảnh phim thật. Không xếp số 1–10 nếu không có ranking thật.
6. Quốc gia/thể loại chuyển thành lối khám phá gọn hoặc khối có thể mở rộng; vẫn giữ đủ route để người dùng tìm toàn bộ kho phim.
7. Footer gọn với HNQ Film và liên kết cần thiết.

Không biến catalogue thành landing page bán hàng, không thêm thống kê người dùng hoặc nội dung cộng đồng giả. Khác biệt cấu trúc phải phục vụ việc tìm phim.

### Danh sách / thể loại / quốc gia

- Tiêu đề, số kết quả, breadcrumb ngắn; tránh icon có nền phát sáng trước mọi heading.
- Desktop: một hàng filter gọn với label thật. Mobile: nút “Bộ lọc” + số điều kiện, mở sheet có focus đầy đủ, nút áp dụng và xóa rõ ràng. Giữ URL là nguồn sự thật, giữ filter khi phân trang và Back/Forward.
- Grid 2 cột mobile, 3–4 tablet, 5–6 desktop sau khi đo kích thước card; không ép 6 cột nếu title quá nhỏ.
- Tên phim tối đa 2 dòng, phụ đề nhỏ hơn; chỉ hiện quality/lang/rating thực có. Không mặc định Vietsub khi chưa biết.
- Khi đổi filter, có pending state và giữ cấu trúc, kết quả được thông báo cho assistive technology. API lỗi và kết quả rỗng có thông điệp khác nhau.
- Filter năm cần cho chọn năm cũ hơn 17 năm gần nhất khi dữ liệu có hỗ trợ; đây là mở rộng UX, không coi là lỗi mới đã xác minh trong audit.

### Tìm kiếm

- Header và trang kết quả dùng một mẫu search có label; mobile vẫn thấy thao tác “Tìm”.
- Gợi ý là link có thể Tab/Enter; loading không hiện thông báo “không tìm thấy” trước khi request mới trả về.
- Tiêu đề kết quả ngắn, số lượng một chỗ; bỏ panel hero lớn, quầng sáng và badge đếm trùng.
- Rỗng có hướng sửa từ khóa và thao tác quay lại catalogue. Không hứa tìm diễn viên/thể loại nếu API thực tế không hỗ trợ truy vấn đó.

### Trang xem phim

- Giữ player và logic nguồn hiện có. Desktop bố trí player với khu vực chọn tập bên cạnh nếu đủ chỗ; mobile player → tập đang chọn/đổi tập → danh sách tập → thông tin phim.
- Một tiêu đề nhận diện phim trước hoặc gắn với player, không cần lặp nhiều heading lớn; sửa “Tập Tập 01”.
- Server đặt tên thân thiện theo lựa chọn hữu ích cho người xem. HLS/iframe chỉ hiện ở phần tùy chọn kỹ thuật nếu cần chọn để khắc phục lỗi; thông báo mặc định dùng ngôn ngữ “nguồn phát”.
- Nút đèn, mở rộng, báo lỗi có tên tiếng Việt và trạng thái; mở rộng thay đổi layout thật. Đèn tắt vẫn cho keyboard tiếp cận nút bật lại.
- Nhóm tập có selected state cả bằng hình ảnh lẫn ngữ nghĩa, nhóm 50 tập và tìm tập vẫn hoạt động.
- Thông tin phim gọn, synopsis mở rộng khi cần. Dùng ảnh thực, không thêm cover AI.
- Ghi chú cá nhân thu thành một vùng nhỏ, nút lưu nằm ngoài vùng gõ hoặc có padding chừa chỗ; timestamp thật, ghi rõ lưu ở trình duyệt. Báo lỗi tiếp tục thể hiện đúng việc tải file, không giả đã gửi đội kỹ thuật.

### Tủ phim

- Tiêu đề “Tủ phim”, tab “Đã lưu” / “Lịch sử”, số đếm một hàng tại 320px.
- Phim đã lưu dùng card chung. Lịch sử cho biết tập gần nhất; chỉ thêm progress/resume position nếu có dữ liệu phát và storage contract mới được kiểm thử.
- Xóa một mục có Undo nếu triển khai được; xóa toàn bộ có xác nhận và keyboard/focus đúng. Không xóa dữ liệu người dùng trong quá trình thay đổi UI.
- Empty state nhỏ và hữu ích, liên kết về catalogue; không chiếm nguyên một màn hình chỉ cho minh họa bookmark.

### Chủ đề / phim theo ngày / trạng thái hệ thống

- Chủ đề: chỉ có bộ sưu tập mà dữ liệu và liên kết thực sự mô tả đúng. Có thể đổi tên các thẻ hiện tại sang nhóm quốc gia/thể loại đúng; không cần viết backend tuyển tập chỉ để giữ tên quảng cáo.
- `/lich-chieu`: giữ route; đổi cách trình bày thành gợi ý trong tuần nếu chưa có lịch hoặc timestamp thật. Không phân phim theo index rồi gọi là ngày cập nhật.
- Loading, empty, API unavailable, 404, ảnh lỗi dùng cùng giọng chữ và spacing. Skeleton khớp layout thật; 404 nói ngắn và đưa tìm kiếm/quay về.

## Các đợt triển khai và tiêu chí hoàn tất

| Đợt | Công việc | ID audit | Hoàn tất khi |
|---|---|---|---|
| 0. Chuẩn bị | Cài dependency theo lockfile, đọc docs Next đúng bản, xác định live/local, chụp baseline và state matrix. | F28, F30 | Có baseline với dữ liệu cố định và cấu hình domain đã xác minh. |
| 1. Sửa sự thật và thao tác | Metadata, ranking/topic/date copy; tab mobile; drawer/modal; labels, link gợi ý, carousel; logo motion và nav breakpoint. | F01–F10, F24, F25 | 10 P1 đều đạt acceptance, thao tác keyboard không bị mất focus, không còn nhãn giả. |
| 2. Nền thiết kế và lát cắt đầu tiên | Token chung, typography, button/field/tab/card; hoàn thiện header + home + một trang xem phim ở desktop/mobile. | F14–F23, F26 | Review ảnh cạnh nhau cho 2 trang và 4 mobile widths, chốt ngôn ngữ thị giác trước khi nhân rộng. |
| 3. Nhân rộng có kiểm soát | Catalogue/search, thư viện, chủ đề/tuần, ghi chú/report, clipboard, expand, empty/error/loading, footer. | F04, F11–F13, F20, F27–F30 | Tất cả route dùng hệ thống chung; lỗi clipboard/nguồn lỗi không báo thành công giả. |
| 4. Nghiệm thu | Kiểm thử hồi quy, accessibility thủ công + công cụ, contrast, ảnh baseline, performance và browser matrix. | Toàn bộ | Có bằng chứng pass hoặc danh sách giới hạn còn lại; không có P1 mở. |

Không ước tính thời gian bằng số ngày trước khi biết quy mô baseline, tình trạng nguồn phát và số vòng duyệt thiết kế.

## Bản đồ thay đổi dự kiến

Đây là danh sách để triển khai in-place; lần audit này chưa sửa các file bên dưới. **Không có file production nào dự kiến xóa.** Giữ routes, identity/source query, provider fallback, storage compatibility và hạ tầng test hiện tại.

| Nhóm | File hiện có dự kiến sửa | File có thể thêm |
|---|---|---|
| Nền | `src/app/globals.css`, `src/app/layout.tsx` | `tokens.css` ở root, được import thật từ stylesheet entry; bộ component UI nhỏ chỉ khi cần |
| Header/footer | `src/components/layout/Navbar.tsx`, `MobileDrawer.tsx`, `HNQBrandLogo.tsx`, `Footer.tsx`; `src/components/ui/GlitchText.tsx` | Primitive dialog/sheet dùng chung nếu cần |
| Home | `src/app/page.tsx`; `src/components/home/HeroBanner.tsx`, `TopicCardsRow.tsx`, `TopMoviesRankSection.tsx`, `MovieRowSlider.tsx`, `CountryMovieSection.tsx`, các nav button liên quan | `ContinueWatchingSection.tsx` dùng dữ liệu lịch sử có sẵn |
| Catalogue/search | `src/components/ui/MovieCard.tsx`, `SafeImage.tsx` nếu layout yêu cầu; `src/components/filter/FilterBar.tsx`, `Pagination.tsx`; `src/components/search/SearchBarForm.tsx`; `src/app/danh-sach/page.tsx`, `tim-kiem/page.tsx`, `the-loai/[slug]/page.tsx`, `quoc-gia/[slug]/page.tsx` | Chỉ tách filter sheet nếu cần, không đổi route |
| Watch | `src/components/watch/WatchContainer.tsx`, `VideoPlayer.tsx`, `EpisodeSelector.tsx`, `MovieDetailInfo.tsx`, `CommentSection.tsx`, `ReportModal.tsx`, `RelatedMovies.tsx`; `src/app/phim/[slug]/page.tsx` | Primitive điều khiển dùng chung theo thực tế |
| Trang phụ/state | `src/components/tu-phim/TuPhimContainer.tsx`, `src/components/schedule/ScheduleView.tsx`; `src/app/chu-de/page.tsx`, `lich-chieu/page.tsx`, `tu-phim/page.tsx`, `not-found.tsx`, `error.tsx`, các `loading.tsx`; `src/components/ui/Skeleton.tsx`, `ApiUnavailable.tsx` | Không tạo route thay thế |
| Test | Bổ sung tình huống có giá trị vào `tests/e2e`, script test storage hiện có khi đổi schema | Regression test cho keyboard/mobile và lỗi clipboard; ảnh baseline có dữ liệu mock |

Mỗi đợt cần nêu danh sách file thực sự sẽ sửa trước khi làm. Không ghi đè toàn bộ globals.css; giữ `@import "tailwindcss"`, mở rộng token theo hệ hiện hữu. Chưa cần thêm thư viện animation.

## Kiểm thử và tiêu chí phát hành

1. Sau `npm ci`, đọc phần app/layout/font/image/CSS/accessibility có liên quan tại `node_modules/next/dist/docs/`. Nếu package không cung cấp docs như AGENTS.md mô tả, xác minh tài liệu chính thức đúng phiên bản trước khi sửa Next APIs.
2. Kiểm tra 320/375/414/768/1024/1280/1440px. Không tràn trang; rail ngang được phép trong vùng riêng. Không dùng overflow:hidden để che lỗi layout; controls không bị cắt và title dài không đè nhau. Mobile label nút/nav 1 dòng; title phim trong card có thể 2 dòng.
3. Keyboard toàn luồng: search → gợi ý → detail → episode → modal → return focus; drawer/sheet Escape, Tab, Shift+Tab; active states được thông báo. Test reduced-motion, zoom 200%, focus-visible tức thì và contrast theo nền thật.
4. Test dữ liệu thiếu: không age/quality/rating, zero/NaN rating, season khác 1, title rất dài, ảnh lỗi, 0/1/50/51+ tập, nhiều server, catalogue lỗi khác với catalogue rỗng.
5. Test lỗi/compatibility: clipboard reject, storage chặn/hỏng, dữ liệu bookmark/history cũ, reload/back/forward giữ query, report chỉ tải file, server fallback/đổi tập vẫn đúng identity.
6. Chạy các lệnh dự án: `npm run lint`, `npx tsc --noEmit`, `npm run test:unit`, `npm run build`, `npm run test:e2e`. Mở thêm live smoke khi upstream hoạt động; không dùng mock pass để khẳng định mọi video ngoài đều phát.
7. Chụp trước/sau cùng dữ liệu ở home/catalogue/search/watch/library. Kiểm tra Chrome + Firefox + Safari theo khả năng môi trường, ghi rõ phần chưa chạy. Đo LCP/CLS/INP sau khi có bản chạy; phân biệt lab test và field data, không bịa điểm Lighthouse.
8. Rà lại Hallmark theo genre điện ảnh đã chốt và các ngoại lệ phù hợp catalogue; chỉ công bố số gate pass sau thực sự đánh giá. Review cuối phải trả lời: poster có là điểm nhấn, tên phim có đọc được, tác vụ chính có rõ, page có còn quá nhiều hiệu ứng không?

Chỉ xem redesign hoàn tất khi các thay đổi đã được nối vào route thật, qua kiểm thử, có ảnh kiểm chứng và báo cáo các giới hạn còn lại. Publish/deploy chỉ thực hiện trong phạm vi người dùng yêu cầu cho bước triển khai sau.
