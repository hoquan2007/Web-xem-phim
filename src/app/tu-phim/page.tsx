import React from 'react';
import { Metadata } from 'next';
import TuPhimContainer from '@/components/tu-phim/TuPhimContainer';

export const metadata: Metadata = {
  title: 'Tủ Phim Yêu Thích & Lịch Sử Xem',
  description:
    'Quản lý danh sách các bộ phim đã lưu và xem tiếp lịch sử theo dõi phim trực tuyến của bạn trên RoPhim.',
  openGraph: {
    title: 'Tủ Phim Yêu Thích & Lịch Sử Xem | RoPhim',
    description:
      'Quản lý danh sách các bộ phim đã lưu và xem tiếp lịch sử theo dõi phim trực tuyến của bạn trên RoPhim.',
    siteName: 'RoPhim - Phim Hay Cả Rổ',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tủ Phim Yêu Thích & Lịch Sử Xem | RoPhim',
    description:
      'Quản lý danh sách các bộ phim đã lưu và xem tiếp lịch sử theo dõi phim trực tuyến của bạn trên RoPhim.',
  },
};

export default function TuPhimPage() {
  return (
    <main className="w-full min-h-screen pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-10 xl:px-12 bg-slate-950 text-slate-100">
      <div className="max-w-7xl mx-auto">
        <TuPhimContainer />
      </div>
    </main>
  );
}
