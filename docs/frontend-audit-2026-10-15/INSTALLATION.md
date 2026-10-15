# Hallmark trong dự án HNQ Film

Đã cài ngày 15/10/2026 từ [Nutlope/hallmark](https://github.com/Nutlope/hallmark), đường dẫn upstream `skills/hallmark`, qua skill-installer. Skill có frontmatter version `1.1.0`.

- Nơi cài: `D:/Web-xem-phim/.codex/skills/hallmark/` — phạm vi dự án.
- Nội dung kiểm tra: `SKILL.md` và 106 file trong `references/`.
- SHA-256 của `SKILL.md`: `59469635BBBD21ACDDBC664D95E8D97147F454B2D8F4A0A89C7D2C5AFBE67577`.
- Upstream branch cài: `main`; chưa pin theo commit SHA upstream. Hash trên xác định nội dung local đã cài; không dùng nó như commit GitHub.
- Không thêm npm package, script runtime hay thay đổi `package-lock.json`.

Lệnh đã chạy:

```powershell
python C:/Users/HNQuan/.codex/skills/.system/skill-installer/scripts/install-skill-from-github.py --repo Nutlope/hallmark --path skills/hallmark --dest D:/Web-xem-phim/.codex/skills
```

Skill khả dụng tự động từ lượt tương tác tiếp theo; lần audit này đã đọc trực tiếp file đã cài. Có thể gọi bằng yêu cầu tự nhiên hoặc:

```text
hallmark audit src/components/home/HeroBanner.tsx
hallmark redesign src/app/page.tsx --mood cinematic
```

Khi triển khai kế hoạch, cung cấp thêm `docs/frontend-audit-2026-10-15/PLAN.md` và yêu cầu giữ route, data identity, storage compatibility. Skill hỗ trợ quyết định thiết kế; nó không phải scanner tự động đảm bảo phát hiện tất cả lỗi frontend.

Installer không ghi đè thư mục skill có sẵn. Nếu cập nhật sau này, kiểm tra thay đổi upstream và sao lưu tùy chỉnh local trước; không xóa thư mục skill một cách ngầm định. README upstream cũng mô tả cách cài/cập nhật bằng `npx skills add nutlope/hallmark`; chưa chạy lệnh đó trong dự án này.
