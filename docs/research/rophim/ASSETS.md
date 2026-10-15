# Tài nguyên tham khảo

| Tài nguyên | Nguồn quan sát | Đích local |
|---|---|---|
| Hero Yêu một người khác (2,144,858 bytes, video/mp4) | https://rophim1.vip/media/lovethanyour.mp4 | public/sites/rophim/love-other-than-yours.mp4 |
| Đủ15video hero và backdrop tương ứng | https://rophim1.vip/baseapi/api/v1/movies/hot | public/sites/rophim/; URL nguồn, kích thước và ánh xạ từng phim trong src/data/hero-slides.json |
| Font | computed system-ui / Segoe UI / sans-serif | font hệ thống, không tải font ngoài |
| Poster và backdrop phim | các API provider hiện có | SafeImage tải theo dữ liệu thực tế; giữ fallback/mirror |
| Logo, favicon, OG banner | thiết kế PTQ mới bằngSVG | PTQBrandLogo.tsx, src/app/icon.svg, public/images/og-banner.svg/png |

HTML/CSS production đã được đọc chỉ để đo bố cục. Không đưa bundle JavaScript, stylesheet production, quảng cáo hoặc tracker của nguồn vào ứng dụng. Các tài nguyên nội dung giữ nguồn gốc như trên; không khẳng định quyền sở hữu chúng.

Video chỉ tải khi slide được chọn. Script cập nhật thủ công: `node scripts/sync-hero-media.mjs` (preview PTQ ở cổng3000 phải đang chạy để đối chiếu phim). Ứng dụng không gọi API RoPhim khi phục vụ banner.
