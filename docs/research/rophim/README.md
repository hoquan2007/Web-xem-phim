# PTQ Film — bản dựng theo RoPhim

Đã cài template [ai-website-cloner-template](https://github.com/JCodesMore/ai-website-cloner-template) ở `tools/ai-website-cloner-template` (checkout gốc `ee3f5a2f31fd549b9593fa4f7cf6d2955ee593bb`). Skill chính thức đã được cài vào `.agents/skills/clone-website` và `.codex/skills/website-cloner`.

Template nằm riêng, được loại khỏi lint/TypeScript của ứng dụng. Không chép starter đè lên hệ thống dữ liệu hay trình phát hiện có. Template đã chạy `npm ci --ignore-scripts`, cập nhật các bản vá tương thích và nâng Next/eslint-config-next lên16.4.1; `npm run check` đạt. Audit của template còn9 cảnh báo high trong chuỗi công cụ braces/fast-glob/shadcn; không dùng force downgrade và không đưa các dependency đó vào ứng dụng PTQ.

Preview: http://localhost:3000/phimhay. Khởi động lại bằng `npm run build` rồi `npm run start -- -p 3000`.

## Ánh xạ trang

| Trang mẫu | Trang PTQ | Mã chính |
|---|---|---|
| `/phimhay` | `/`, `/phimhay` | `src/app/page.tsx`, `HeroBanner`, `MovieRowSlider` |
| `/phim-le`, `/phim-bo` | cùng đường dẫn; giữ `/danh-sach` | `FilterListPage`, `FilterBar`, `catalog.css` |
| `/the-loai/:slug`, `/quoc-gia/:slug` | cùng đường dẫn | các route thể loại/quốc gia |
| `/c/phim-han-quoc-moi` và4 tuyển tập liên quan | cùng đường dẫn | `src/app/c/[slug]/page.tsx` |
| `/chu-de` | `/chu-de` | thẻ gradient,8 tuyển tập có dữ liệu thật |
| tìm kiếm từ header | `/tim-kiem?keyword=...` | `Navbar`, `SearchBarForm` |
| `/phim/:slug` | `/phim/:slug?source=...&identity=...` | `MovieRoute`, `MovieDetailPage` |
| `/xem-phim/:slug.id` | `/xem-phim/:slug?source=...&sv=...&ep=...` | `WatchContainer`, `VideoPlayer` |
| yêu thích/lịch sử | `/tu-phim` | `TuPhimContainer`, localStorage hiện có |
| `/lich-chieu` | `/lich-chieu` | lịch cập nhật theo `modified.time` thực tế |

URL xem cũ `/phim/:slug?sv=...&ep=...` vẫn mở trình phát. Giữ thông tin source/identity/title, khả năng khôi phục ảnh và fallback nguồn phim.

## So sánh giao diện

Đã quan sát trang mẫu bằng trình duyệt ở mobile390px, desktop1440px và1920px: hero, danh sách, chi tiết, xem phim, chủ đề và lịch. Ghi chép đo đạc ở `BRIEF.md`; thiết kế hiện hành ở `design.md`.

- Nền#191b24, footer#0f111a, system-ui, điểm nhấn vàng/xanh theo trang mẫu.
- Header40px dưới1600px,60px ở màn hình rộng. Hero tràn ngang, video thật, điều khiển âm thanh và tạm dừng; tôn trọng giảm chuyển động.
- Poster có6 cột ở1440px,2 cột mobile; hàng quốc gia theo thứ tự mẫu.
- Chi tiết có backdrop, sidebar400px/vùng chữ320px, nútXem Ngay tại x430, tab và thẻ nguồn có ảnh294×180.
- Player tràn khung, video nằm đầu khung; các tập ở phía dưới.
- Logo PTQ dạng vector, favicon và ảnh chia sẻ đồng bộ. Không có banner, popup, script hay khu vực quảng cáo từ trang mẫu.

## Kiểm tra

- `npm run lint`: đạt.
- `npx tsc --noEmit`: đạt.
- `npm run build`: đạt, Next16.4.0 của ứng dụng giữ nguyên.
- `npm run test:unit`: đạt toàn bộ sanitize/validate/security/provider/mock/kill-switch.
-44 E2E mock đạt, gồm kiểm tra đủ15video thực ở375/1440px và105 lượt route/kích thước ở320/375/414/768/1024/1440/1920px.
-6 E2E tắtKKPhim đạt: nguồn còn lại vẫn phục vụ danh sách/tìm kiếm/chi tiết/xem phim.
- Ảnh chụp với dữ liệu thật ở `screenshots/`, kết quả runtime/overflow/video ở `LIVE-QA.json`. Script tái tạo: `node scripts/capture-ptq-preview.mjs` khi preview đang chạy.

## Khác biệt còn lại

- Danh sách/slug/tập lấy từ API của PTQ nên có thể khác kho phim RoPhim. Hero có đủ15phim/video theo thứ tự mẫu; liên kết phim được đối chiếu với nguồn PTQ. Xem [HERO-VIDEOS.md](HERO-VIDEOS.md).
- Dữ liệu hiện có chỉ cung cấp tên diễn viên; tab diễn viên hiển thị tên, chưa có danh bạ/chân dung/tiểu sử giống trang mẫu.
- Phòng xem chung, tài khoản/đăng nhập, bình luận cộng đồng, đánh giá công khai và các trang giới thiệu/chính sách của RoPhim chưa được triển khai. Tủ phim/lịch sử/ghi chú vẫn là dữ liệu riêng trong trình duyệt.
- Lịch hiển thị ngày cập nhật thật, không giả dữ liệu lịch phát sóng. Hai tuyển tập chưa được API hỗ trợ được thay bằngPhim Lẻ/Phim Bộ.
- Chưa triển khai lênVercel; website công khai chỉ thay đổi sau một lần deploy.
