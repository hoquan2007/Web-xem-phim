"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
export default function MovieRowNavButtons({ sliderId }: { sliderId: string }) {
  const scroll = (direction: number) => {
    const el = document.getElementById(sliderId);
    if (el)
      el.scrollBy({
        left: direction * el.clientWidth * 0.8,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  };
  return (
    <div className="flex gap-2">
      <button
        className="icon-button"
        aria-label="Xem phim trước trong hàng"
        onClick={() => scroll(-1)}
      >
        <ChevronLeft size={17} />
      </button>
      <button
        className="icon-button"
        aria-label="Xem phim tiếp trong hàng"
        onClick={() => scroll(1)}
      >
        <ChevronRight size={17} />
      </button>
    </div>
  );
}
export { MovieRowNavButtons };
