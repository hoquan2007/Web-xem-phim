import React from 'react';
import Link from 'next/link';
import GlitchText from '@/components/ui/GlitchText';

interface HNQBrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
  onClick?: () => void;
}

export const HNQBrandLogo: React.FC<HNQBrandLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
  onClick,
}) => {
  const iconSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-xl';
  const subTextSize = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-[11px]' : 'text-[10px]';

  return (
    <Link
      href="/"
      onClick={onClick}
      className={`glitch-hover-trigger group inline-flex items-center gap-2.5 select-none transition-transform hover:scale-[1.02] active:scale-95 ${className}`}
    >
      {/* High-Tech Cyber Film Play Emblem */}
      <div className={`relative ${iconSize} flex-shrink-0`}>
        {/* Glow ambient background blur */}
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 via-rose-500 to-cyan-500 rounded-2xl blur-md opacity-60 group-hover:opacity-100 transition-opacity animate-pulse" />

        {/* Outer Tech Hexagon / Squircle Frame */}
        <div className="relative w-full h-full rounded-2xl bg-slate-950 border border-amber-400/40 p-1.5 shadow-2xl flex items-center justify-center overflow-hidden group-hover:border-cyan-400/80 transition-colors">
          {/* Cyber Circuit Lines Overlay */}
          <svg
            className="absolute inset-0 w-full h-full text-slate-800 opacity-40 group-hover:opacity-80 transition-opacity"
            viewBox="0 0 100 100"
            fill="none"
          >
            <path
              d="M10 10 H90 V90 H10 Z M20 50 H35 M65 50 H80 M50 20 V35 M50 65 V80"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            <circle cx="20" cy="50" r="3" fill="#f59e0b" />
            <circle cx="80" cy="50" r="3" fill="#06b6d4" />
          </svg>

          {/* Film Reel Aperture + Play Triangle Icon */}
          <div className="relative z-10 w-full h-full rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-600 flex items-center justify-center shadow-inner text-slate-950">
            <svg
              className="w-3/5 h-3/5 fill-slate-950 transform group-hover:scale-110 transition-transform duration-300 ml-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
              viewBox="0 0 24 24"
            >
              {/* Play symbol with tech cut */}
              <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86a1 1 0 0 0-1.5.86z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Cyber Glitch Brand Name */}
      <div className="flex flex-col justify-center">
        <GlitchText speed={0.4} alwaysOn={false} className={`${textSize} tracking-wider font-black`}>
          HNQ
        </GlitchText>

        {showSubtitle && (
          <span
            className={`${subTextSize} font-bold text-amber-400/90 tracking-tight flex items-center gap-1 group-hover:text-cyan-400 transition-colors`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            Hồ Ngọc Quân
          </span>
        )}
      </div>
    </Link>
  );
};

export default HNQBrandLogo;
