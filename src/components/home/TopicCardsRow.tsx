'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface TopicCard {
  title: string;
  subtitle: string;
  href: string;
  gradient: string;
  textColor?: string;
  subtitleColor?: string;
}

const topicCards: TopicCard[] = [
  {
    title: 'Hành động',
    subtitle: 'Xem chủ đề',
    href: '/the-loai/hanh-dong',
    gradient: 'from-red-600 via-rose-500 to-orange-600',
    textColor: 'text-white',
    subtitleColor: 'text-rose-100/90',
  },
  {
    title: 'Marvel',
    subtitle: 'Xem chủ đề',
    href: '/tim-kiem?keyword=marvel',
    gradient: 'from-blue-600 via-blue-500 to-indigo-600',
    textColor: 'text-white',
    subtitleColor: 'text-blue-100/90',
  },
  {
    title: 'Kho Tàng Anime Mới...',
    subtitle: 'Xem chủ đề',
    href: '/the-loai/hoat-hinh',
    gradient: 'from-purple-600 via-indigo-600 to-purple-700',
    textColor: 'text-white',
    subtitleColor: 'text-purple-100/90',
  },
  {
    title: 'Top 10 phim lẻ hôm nay',
    subtitle: 'Xem chủ đề',
    href: '/danh-sach?type=single',
    gradient: 'from-amber-400 via-yellow-400 to-amber-500',
    textColor: 'text-slate-950',
    subtitleColor: 'text-slate-900/80',
  },
  {
    title: 'Cổ Trang',
    subtitle: 'Xem chủ đề',
    href: '/the-loai/co-trang',
    gradient: 'from-red-800 via-rose-900 to-amber-950',
    textColor: 'text-white',
    subtitleColor: 'text-rose-200/90',
  },
  {
    title: 'Phim Điện Ảnh Mới...',
    subtitle: 'Xem chủ đề',
    href: '/danh-sach?type=single',
    gradient: 'from-emerald-400 via-green-400 to-emerald-500',
    textColor: 'text-slate-950',
    subtitleColor: 'text-slate-900/80',
  },
];

export const TopicCardsRow: React.FC = () => {
  return (
    <section className="w-full py-4">
      <h2 className="text-xl sm:text-2xl font-black text-slate-100 mb-5 tracking-tight flex items-center gap-2">
        Bạn đang quan tâm gì?
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4">
        {topicCards.map((card, idx) => (
          <Link
            key={idx}
            href={card.href}
            className={`group relative overflow-hidden rounded-2xl p-4 sm:p-5 bg-gradient-to-br ${card.gradient} shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:scale-[1.02] flex flex-col justify-between min-h-[110px] sm:min-h-[125px]`}
          >
            {/* Title */}
            <h3 className={`text-base sm:text-lg font-extrabold line-clamp-2 leading-tight ${card.textColor}`}>
              {card.title}
            </h3>

            {/* Link Action */}
            <div className="flex items-center gap-1 mt-3">
              <span className={`text-xs font-bold ${card.subtitleColor}`}>
                {card.subtitle}
              </span>
              <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1 ${card.subtitleColor}`} />
            </div>

            {/* Soft Ambient Glow Effect */}
            <div className="absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-150 transition-transform" />
          </Link>
        ))}
      </div>
    </section>
  );
};
