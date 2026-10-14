import type { NextConfig } from "next";
import { IMAGE_REMOTE_PATTERNS } from './src/lib/image-policy';

const nextConfig: NextConfig = {
  images: {
    // Bật tối ưu hoá ảnh mặc định của Next.js (FIX-5): WebP, srcset, lazy load.
    // Trước FIX-5 giá trị này là `true` để tạm thời vượt qua các vấn đề tích hợp.
    unoptimized: false,
    // Dùng cùng danh sách với SafeImage để cấu hình optimizer không bị lệch.
    remotePatterns: IMAGE_REMOTE_PATTERNS,
    // Tối ưu thêm: định dạng hiện đại + cache header.
    formats: ['image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 ngày
  },
};

export default nextConfig;
