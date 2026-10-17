# Bổ sung các phần trang chủ PTQ còn thiếu so với RoPhim

Ngày khảo sát: **16/10/2026, múi giờ Asia/Bangkok**.

Phạm vi lần này: phân tích và lập kế hoạch. Chưa thay đổi frontend, chưa triển khai hay push kế hoạch này.

## 1. Đối chiếu thực tế

Đã mở [trang mẫu](https://rophim1.vip/phimhay) và [PTQ đang công khai](https://hnqfilm.vercel.app/phimhay), cuộn trang mẫu để tải các phần xuất hiện muộn, thử nút tiến của Top 30 và chọn poster trong TV Shows. Đã đọc mã trang chủ, component hàng phim, registry tuyển tập, kiểu dữ liệu và adapter nguồn phim của PTQ.

PTQ công khai đã có nhận diện PTQ và đủ 15 slide hero; homepage hiện chỉ gắn hero, Xem tiếp khi có lịch sử và 4 hàng quốc gia. Những phần thiếu bên dưới không phải lỗi deploy bản cũ. `TopMoviesRankSection.tsx` có trong repo nhưng không được gắn vào homepage; nó hiện là hàng gợi ý tối đa 10 phim, chưa phải thiết kế Top 30 trong ảnh.

Trang mẫu tải nội dung theo vị trí cuộn và tháo một số khối ngoài màn hình khỏi DOM. Vì thế đọc HTML ban đầu hoặc đếm heading một lần sẽ bỏ sót nhiều hàng. Một lần tương tác bị chuyển sang trang phim khác do cơ chế điều hướng/quảng cáo của nguồn; không tái tạo cơ chế này. Chưa xác minh đầy đủ breakpoint/mobile của các khối cuối trang; đây là bước bắt buộc trước khi triển khai CSS.

Bốn ảnh người dùng gửi được giữ nguyên trong `reference/`, tên có hậu tố `-user`; đây là ảnh tham chiếu của người dùng, không phải ảnh do lần khảo sát này chụp.

## 2. Những phần còn thiếu và mức phù hợp

| Khối ở trang mẫu | Trạng thái PTQ | Đề xuất |
|---|---|---|
| Top 30Phim Bộ hôm nay | Chưa có hàng poster xếp hạng | **Ưu tiên cao.** Clone bố cục, số thứ tự vàng lớn, góc poster xen kẽ, metadata và cuộn ngang. Dữ liệu ban đầu dùng tuyển chọn có nguồn; chưa gọi là xếp hạng hôm nay của PTQ. |
| Top 30Phim Lẻ Hôm Nay | Chưa có | **Ưu tiên cao.** Chung component với phim bộ; dữ liệu và thứ tự riêng. |
| Hoạt Hình Anime Hay | Có đường dẫn tuyển tập, chưa có banner lớn trên homepage | **Ưu tiên cao.** Clone ảnh nền ngang, lớp gradient, nội dung trái và dải poster chọn phim phía dưới. |
| TV Shows Truyền Hình | Adapter hỗ trợ loại phim, chưa có khối homepage/tuyển tập tương ứng | **Ưu tiên cao.** Dùng chung component banner với hoạt hình. |
| Phim Bộ Mới Nhất | Có danh sách `/phim-bo`, chưa có hàng homepage | **Làm cùng đợt đầu.** Dữ liệu đủ, tận dụng hàng phim hiện có. |
| Phim Chiếu Rạp Mới | Chưa có hàng và pipeline phân loại đã kiểm chứng | **Có điều kiện.** Nguồn thô có `chieurap`, adapter hiện bỏ trường này; cần xác minh endpoint/tuyển tập và giữ cờ trước khi gắn nhãn. |
| Rổ Phim Đề Cử | Chưa có | **Phù hợp**, đổi thành **PTQ Đề Cử**, tuyển chọn từ phim có nguồn xem hoạt động. |
| HH Anime Mới cập nhật | Chưa có hàng homepage | **Phù hợp**, dùng danh sách hoạt hình theo cập nhật, khác vai trò với banner tuyển chọn. |
| Phim Kinh Dị | Có route thể loại, chưa có hàng homepage | **Phù hợp**, dùng taxonomy `kinh-di` đã có. |
| Hoạt Hình Trẻ Em | Chưa có tuyển tập xác thực | **Có điều kiện.** Tuyển chọn theo phân loại độ tuổi phù hợp; không coi toàn bộ hoạt hình là phim trẻ em. |
| Rổ Phim Sắp Chiếu | Chưa có nguồn ngày phát hành/trạng thái đủ tin cậy | **Để đợt sau.** Không suy ra sắp chiếu từ việc phim chưa có tập hoặc phim có năm mới. |
| Bình luận mới | PTQ chỉ có ghi chú riêng trong trình duyệt | **Chưa nên clone chức năng.** Cần bình luận dùng chung, tài khoản/định danh, lưu trữ, chống spam và quản trị; không nhập bình luận/người dùng của RoPhim. |

Giữ loại bỏ quảng cáo, banner nhà cái, popup, chuyển hướng và tracker. Không đưa đăng nhập, phòng xem chung hay dữ liệu cộng đồng giả vào đợt bổ sung homepage.

## 3. Dữ liệu đã kiểm tra và cách dùng

Đã gọi trực tiếp 4 endpoint của nguồn KKPhim hiện được PTQ sử dụng, mỗi endpoint trả 30 phim, `status=true`:

- `https://phimapi.com/v1/api/danh-sach/hoat-hinh?page=1&limit=30`: loại `hoathinh`; có Yêu Nhân Thần Thám, Bastard!!.
- `https://phimapi.com/v1/api/danh-sach/tv-shows?page=1&limit=30`: loại `tvshows`; có Running Man, Tiệm Bánh Gạo Vũ Trụ, Chiến Binh Đường Phố.
- `https://phimapi.com/v1/api/danh-sach/phim-bo?page=1&limit=30`: loại `series`.
- `https://phimapi.com/v1/api/danh-sach/phim-le?page=1&limit=30`: loại `single`.

Các mẫu có poster, thumb, năm, tập, ngôn ngữ, metadata TMDB và cờ `chieurap`. Danh sách hiện không cung cấp sẵn mô tả đầy đủ và ảnh phong cảnh chất lượng ổn định cho mọi phim. Banner cần làm giàu một số phim được tuyển chọn, có giới hạn số request và cache; không gọi detail cho toàn bộ phim của tất cả các hàng.

`MovieListItem` chưa có lượt xem theo ngày. `MovieDetail` có khai báo `view` và `chieurap`, nhưng normalizer hiện không giữ các trường này; khai báo TypeScript không chứng minh runtime có dữ liệu. Ngay cả lượt xem tổng hoặc TMDB score cũng không tương đương bảng xếp hạng ngày của PTQ.

### Quyết định đề xuất cho hai hàng Top 30

Đợt đầu giữ thiết kế xếp hạng nhưng đặt tên **30 Phim Bộ Nổi Bật** và **30 Phim Lẻ Nổi Bật**, kèm mô tả tuyển chọn của PTQ. Có thể lấy danh sách tham khảo RoPhim để biên tập, nhưng chỉ hiển thị phim đã đối chiếu đúng tên gốc, TMDB và mùa với nguồn PTQ. Thứ tự là thứ tự tuyển chọn, không tuyên bố là lượt xem ngày.

Nếu cần dùng nguyên tên **Top 30 Hôm Nay**, triển khai một trong hai cơ chế riêng: nguồn bảng xếp hạng có nguồn gốc/ngày cập nhật được công bố rõ, hoặc thống kê xem thật của PTQ. Phương án thống kê PTQ cần lưu trữ server, chống đếm lặp/bot và chốt ngày theo Asia/Bangkok. Không chặn việc clone giao diện để chờ hệ thống này.

Khi nguồn phim bị tắt/lỗi, áp dụng orchestrator hiện có. Không lấy snapshot để bật lại nguồn bị tắt. Không đủ30 phim thì hiển thị số lượng thật và đổi tiêu đề phù hợp; không nhân bản phim cho đủ chỉ tiêu.

## 4. Quy tắc thiết kế và tương tác

### Hai hàng có số thứ tự

- Trên desktop: dải poster dọc2:3, khoảng cách theo trang mẫu; một số poster có cạnh/góc nghiêng xen kẽ, không nghiêng toàn bộ caption. Số vàng lớn nằm cạnh khối tên gốc/tên Việt và tập/mùa.
- Lần khảo sát ở viewport 1280 px, mỗi item khoảng 220 px và gap 16 px; ảnh người dùng thể hiện 6 item ở màn hình rộng. Xác minh breakpoint thực tế trước khi chốt CSS.
- Trang mẫu có 30 slide mỗi hàng. Nút tiến đưa sang mục kế tiếp; nút lùi bị vô hiệu ở đầu. PTQ cần cùng hành vi cho chuột, bàn phím và vuốt cảm ứng, có focus rõ và không tràn toàn trang.
- Badge dựa trên ngôn ngữ/tập thật. Không tự tạo hai số PĐ/TM nếu backend chỉ có một trạng thái tập tổng hợp.

### Hai banner Hoạt hình/TV Shows

- Đây là banner **ảnh**, đã kiểm tra không có phần tử video trong hai khối này. Không cần thêm video nền hoặc tải lại15 clip hero.
- Khối ảnh ngang bo góc, gradient bên trái, tên phim, tên gốc màu vàng, năm/mùa/tập, mô tả rút gọn, nút xem, lưu và thông tin.
- Dải poster nhỏ chọn phim điều khiển ảnh nền và nội dung cùng một lúc. TV Shows mẫu có 20 slide chính và20 thumbnail. PTQ có thể khởi đầu8–12 phim đã có ảnh/mô tả tốt, mở rộng khi đủ dữ liệu; không để thumbnail chọn phimA mà CTA vẫn trỏ phimB.
- Trên điện thoại: ảnh và nội dung xếp theo chiều dọc hoặc lớp phủ có đủ tương phản; thumbnail cuộn ngang. Cần đối chiếu mẫu mobile trực tiếp trước khi chọn phương án cuối.
- Hỗ trợ bàn phím, tên truy cập cho từng poster, trạng thái đang chọn và reduced motion. Nếu bổ sung tự chuyển theo mẫu, có nút tạm dừng và không tự chuyển khi người dùng đang thao tác.
- Giữ logo PTQ, màu nền/type system hiện có. Bookmark và link xem tiếp tục dùng danh tính phim/provider hiện có.

## 5. Thứ tự trang chủ dự kiến

Giữ hero → Xem tiếp →4 hàng quốc gia. Sau đó theo hướng trang mẫu:

1. Hai hàng30 phim nổi bật: phim bộ rồi phim lẻ.
2. Chiếu rạp khi xác thực dữ liệu → Phim bộ mới nhất → PTQ Đề Cử.
3. Banner Hoạt hình → Hoạt hình mới cập nhật → Kinh dị.
4. Banner TV Shows → Hoạt hình trẻ em khi có tuyển chọn.
5. Sắp chiếu khi đủ dữ liệu → footer.

Bình luận mới chỉ được chèn vào vị trí tương ứng sau khi có backend thật. Các khối có điều kiện chưa đủ dữ liệu được bỏ qua có chủ đích, không thay bằng hàng phim ngẫu nhiên cùng tên. Hạn chế lặp cùng một phim trong các hàng gần nhau; banner được phép nhắc lại phim nổi bật nhưng cùng một hàng không trùng danh tính/mùa.

## 6. Kế hoạch thực hiện theo đợt

### Đợt 1 —4 khối trong ảnh và dữ liệu nền

1. Chốt ảnh/đo breakpoint, kiểu nghiêng poster, crop và trạng thái chọn trên desktop/mobile; lưu bằng chứng đối chiếu. Đọc tài liệu Next 16.4 trong `node_modules/next/dist/docs/` trước khi viết component/data fetching.
2. Tạo registry nội dung homepage ở server: nguồn, thứ tự, loại hàng, tuyển chọn, đường dẫn và thời điểm cập nhật. Lấy danh sách qua API/orchestrator hiện có; không phụ thuộc API RoPhim trong mỗi lượt mở PTQ.
3. Tạo `RankedMovieRow.tsx` dùng chung cho hai hàng, cùng CSS riêng; dùng helper ảnh/đường dẫn hiện có. Component `TopMoviesRankSection` cũ chỉ tái sử dụng nếu interface và hành vi phù hợp, không đổi tên hàng10 phim để giả Top 30.
4. Tạo `FeaturedCollection.tsx` dùng chung cho Hoạt hình và TV Shows: banner ảnh, bộ chọn thumbnail và hành động thật. Chỉ hydrate vùng tương tác, giữ fetch metadata ở server.
5. Gắn4 khối vào `src/app/page.tsx` sau các hàng hiện có. Hero15 video được giữ nguyên hành vi.
6. Mở rộng registry `/c/[slug]`: giữ đường dẫn hoạt hình, thêm `/c/tv-shows-chuong-trinh-truyen-hinh`; định tuyến theo type `hoathinh`/`tvshows`. Tất cả nút xem thêm phải mở đúng loại danh sách.

### Đợt 2 —các hàng bổ sung phù hợp với kho phim

7. Thêm Phim bộ mới nhất, PTQ Đề Cử, Hoạt hình mới cập nhật và Kinh dị bằng `MovieRowSlider` hiện có. Registry tách tiêu đề giao diện khỏi tiêu chí chọn dữ liệu.
8. Giữ `chieurap` từ nguồn sau khi xác thực, kiểm tra endpoint/tuyển tập tương ứng, rồi bổ sung Chiếu rạp. Bổ sung tuyển chọn trẻ em đã kiểm tra nội dung.
9. Dùng ảnh phong cảnh thật, fallback poster/placeholders khi thiếu. Làm giàu metadata có giới hạn/cache, tải ảnh dưới màn hình theo nhu cầu; không tải trước mọi backdrop hoặc tạo hàng trăm request detail.

### Đợt 3 —các tính năng cần dữ liệu/backend mới

10. Bảng xếp hạng PTQ theo ngày nếu muốn giữ nhãn Hôm Nay; bổ sung tiêu chí và dữ liệu sắp chiếu.
11. Bình luận cộng đồng/tài khoản/quản trị triển khai thành hạng mục backend riêng, không nằm trong clone giao diện đợt 1.

## 7. Những file dự kiến thay đổi

| File/vùng | Công việc |
|---|---|
| `src/app/page.tsx` | Gắn các khối theo thứ tự, chia vùng tải dữ liệu để các khối dưới không giữ chậm hero. |
| `src/components/home/RankedMovieRow.tsx` mới | Hàng có số thứ tự, poster và điều hướng. |
| `src/components/home/FeaturedCollection.tsx` mới | Banner và dải poster điều khiển đồng bộ. |
| `src/components/home/collections.css` mới | CSS riêng cho các khối mới, tránh ghi đè catalog/detail/player. |
| `src/lib/home-collections.ts` mới | Chuẩn hóa/tuyển chọn/khử trùng/làm giàu dữ liệu phía server. |
| `src/data/home-collections.json` mới nếu cần | Tuyển chọn có nguồn gốc và ngày đối chiếu, không chứa dữ liệu cộng đồng. |
| `src/app/c/[slug]/page.tsx` | Thêm loại tuyển tập thực sự được hỗ trợ; giữ URL hiện có. |
| `src/types/movie.ts`, `src/lib/api/adapters.ts` | Chỉ mở rộng metadata cần thiết đã xác thực như `chieurap`; giữ optional/fallback. |
| `tests/e2e/home-collections.spec.ts` mới | Kiểm tra workflow của hàng xếp thứ tự và hai banner. |
| `docs/research/rophim/` | Ảnh đối chiếu, ánh xạ route, mô tả nguồn dữ liệu và giới hạn còn lại. |

## 8. Điều kiện nghiệm thu

- Có đủ4 khối trong ảnh, đúng nhóm phim, có nội dung thật và CTA tới đúng phim/mùa/provider. Không có quảng cáo hoặc chuyển hướng nguồn.
- Kiểm tra320/375/414/768/1024/1440/1920 px; không tràn trang; poster, tiêu đề, số thứ tự và thumbnail không đè nhau. Đối chiếu trực tiếp với nguồn cùng viewport/trạng thái.
- Chọn nhanh thumbnail: ảnh, tiêu đề, metadata, bookmark và CTA đồng bộ. Nút tiến/lùi và vuốt đúng biên; focus bàn phím và reduced motion hoạt động.
- Thiếu ảnh/mô tả, nguồn lỗi, dữ liệu ít, trùng phim, provider bị tắt: có fallback đúng; không hiển thị số liệu/tập giả.
- Đo request trước/sau: hero không chờ các bộ sưu tập mới; không tải đồng loạt mọi ảnh lớn/video. Chỉ các khối cần tương tác thành client component.
- Lint, TypeScript, production build, E2E mới và regression hero15 video/catalog/detail/player cùng đạt. Chưa chạy các kiểm thử này cho kế hoạch vì lần này chỉ tạo tài liệu.

**Khuyến nghị:** bắt đầu đợt 1 với4 khối người dùng chỉ ra, dùng thiết kế sát mẫu và dữ liệu PTQ đã đối chiếu. Tiếp đó mở rộng các hàng khám phá ở đợt 2; tách xếp hạng theo ngày và cộng đồng thành công việc riêng có dữ liệu thật.
