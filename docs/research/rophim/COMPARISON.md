# Đối chiếu giao diện

Trang mẫu được mở trong trình duyệt thật; bản PTQ được render từ production build với API phim thật. Ảnh local không dùng mockposter.

| Bề mặt | Quy tắc từ mẫu | Bản PTQ |
|---|---|---|
| Hero desktop1440 | toàn màn ngang, chữ42px ởtrái50px, mô tả, nútplaytròn, cụmheart/info, paginationphảidưới | cùng cấu trúc và đủ15video theo thứ tự mẫu; tự phát khi chọn, thêm nút tạm dừng |
| Hero mobile | ảnh/video cao43vh, chữ16.8px, metadata nhỏ,dots | cùng quy tắc; nút âm thanh và tạm dừng hoạt động |
| Danh sách1440 | gutter50px,6cột,16pxgap,poster2:3,radius8 | cùng bố cục; dữ liệuAPIvà độ rộng scrollbar khác nhau |
| Danh sách mobile | gutter16px,2cột,gap8px,chữ13/12.6px | cùng quy tắc; không tràn ngang |
| Chi tiết | backdrop,sidebar400px/chữ320px,CTAởx430,tabnguồnphim | cùng bố cục; cóthẻnguồnảnh294x180vàlinktập thật |
| Chủ đề |8thẻgradient,6cộtdesktop,radius12,textlowerleft | cùng bố cục;2nhómthiếufilterđược thaybằngPhimLẻ/PhimBộ |
| Xem phim | video rộngtrêncùng,tậpphíadưới | cùng cấu trúc; giữHLS/iframevà phục hồilỗi |
| Quảng cáo | bannerngang,popup,stickybottom | không đưa vào bảnPTQ |

Ảnh đại diện: `screenshots/home-1440.png`, `home-375.png`, `catalog-1440.png`, `catalog-375.png`, `detail-1440.png`, `detail-375.png`, `topics-1440.png`, `topics-375.png`. Có thêm bản1920px.

Không gọi kết quả là giống100%: kho phim khác, một số dữ liệu/tính năng của RoPhim không có trong backend hiện tại. Danh sách khác biệt đầy đủ ở README.md.
