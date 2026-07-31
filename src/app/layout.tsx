import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import NavbarWithData from '@/components/layout/NavbarWithData';
import Footer from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
});

// FIX-9.1a.6: align với Plan.md (FIX-8 ghi `hnq-film.vercel.app`).
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hnq-film.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'HNQ - Hồ Ngọc Quân | Xem Phim Vietsub HD 4K Miễn Phí',
    template: '%s | HNQ - Hồ Ngọc Quân',
  },
  description:
    'Xem phim trực tuyến chất lượng cao 4K HD hoàn toàn miễn phí trên HNQ. Tuyển tập phim bộ Trung Quốc, Hàn Quốc, phim lẻ chiếu rạp, anime hoạt hình vietsub thuyết minh mới nhất.',
  keywords: [
    'xem phim',
    'hnq',
    'hồ ngọc quân',
    'phim vietsub',
    'phim bo',
    'phim le',
    'phim chieu rap',
    'phim hay',
    'xem phim online',
    'phim 4k',
  ],
  authors: [{ name: 'HNQ Team' }],
  creator: 'HNQ',
  publisher: 'HNQ',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'HNQ - Hồ Ngọc Quân | Xem Phim Vietsub HD 4K Miễn Phí',
    description:
      'Xem phim trực tuyến chất lượng cao 4K HD miễn phí trên HNQ. Phim bộ, phim lẻ, phim chiếu rạp vietsub cập nhật liên tục mỗi ngày.',
    url: siteUrl,
    siteName: 'HNQ - Hồ Ngọc Quân',
    locale: 'vi_VN',
    type: 'website',
    images: [
      {
        url: '/images/og-banner.png',
        width: 1200,
        height: 630,
        alt: 'HNQ - Xem Phim HD Vietsub Miễn Phí',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HNQ - Hồ Ngọc Quân | Xem Phim Vietsub HD 4K Miễn Phí',
    description:
      'Xem phim trực tuyến chất lượng cao 4K HD miễn phí trên HNQ. Phim bộ, phim lẻ, phim chiếu rạp vietsub cập nhật liên tục.',
    images: ['/images/og-banner.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // FIX-9.3.2: fetch categories/countries chuyển sang `<NavbarWithData />`
  // (Server Component riêng, wrap trong <Suspense>). Layout giờ render ngay →
  // page children (Home, Movie detail, Tủ phim) không bị block bởi upstream
  // chậm. Navbar streaming fill dropdown sau.
  return (
    <html lang="vi" className={`${inter.variable} dark antialiased`}>
      <body className="bg-slate-950 text-gray-100 min-h-screen flex flex-col selection:bg-red-600 selection:text-white">
        <NavbarWithData />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
