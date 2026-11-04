import type { MetadataRoute } from 'next';
import taxonomy from '@/lib/api/taxonomy.json';
export default function sitemap(): MetadataRoute.Sitemap {
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://hnqfilm.vercel.app';
  return ['/phimhay', '/chu-de', '/danh-sach', '/phim-le', '/phim-bo', '/lich-chieu',
    ...taxonomy.categories.map(item => `/the-loai/${item.slug}`),
    ...taxonomy.countries.map(item => `/quoc-gia/${item.slug}`),
  ].map(path => ({ url: new URL(path, origin).href }));
}
