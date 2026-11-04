import type { MetadataRoute } from 'next';
const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://hnqfilm.vercel.app';
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/tu-phim', '/tim-kiem', '/xem-phim/'] }, sitemap: `${origin}/sitemap.xml` };
}
