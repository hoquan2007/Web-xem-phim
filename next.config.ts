import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Bật tối ưu hoá ảnh mặc định của Next.js (FIX-5): WebP, srcset, lazy load.
    // Trước FIX-5 giá trị này là `true` để tạm thời vượt qua các vấn đề tích hợp.
    unoptimized: false,
    // Chỉ cho phép 2 host CDN của KKPhim + localhost fallback. Đây là các domain
    // thực sự đang xuất hiện trong poster_url / thumb_url (xem `src/lib/api.ts`).
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'phimimg.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.phimapi.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'phim.nguonc.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'phim.nguonc.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.ophim1.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image.vsmov.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'phimapi.com',
        pathname: '/**',
      },
    ],
    // Tối ưu thêm: định dạng hiện đại + cache header.
    formats: ['image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 ngày
  },
};

export default nextConfig;