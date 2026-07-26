import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { getCategories, getCountries } from '@/lib/api';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'HNQ - Web Xem Phim Trực Tuyến HD Vietsub Miễn Phí',
  description:
    'Xem phim trực tuyến miễn phí chất lượng HD, phim bộ Trung Quốc, Hàn Quốc, phim lẻ chiếu rạp, anime hoạt hình chọn lọc mượt mà nhất.',
  keywords: ['xem phim', 'phim vietsub', 'phim bo', 'phim le', 'hnq', 'phim thuyet minh', 'xem phim online'],
  openGraph: {
    title: 'HNQ - Web Xem Phim Trực Tuyến HD Vietsub Miễn Phí',
    description: 'Trang xem phim vietsub chất lượng cao, cập nhật phim mới nhất mỗi ngày.',
    type: 'website',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [categories, countries] = await Promise.all([
    getCategories(),
    getCountries(),
  ]);

  return (
    <html lang="vi" className={`${inter.variable} dark antialiased`}>
      <body className="bg-slate-950 text-gray-100 min-h-screen flex flex-col selection:bg-red-600 selection:text-white">
        <Navbar categories={categories} countries={countries} />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
