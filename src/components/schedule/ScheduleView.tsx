"use client";
import { useEffect, useRef, useState } from "react";
import { CalendarDays } from "lucide-react";
import { MovieListItem } from "@/types/movie";
import { MovieCard } from "@/components/ui/MovieCard";

const dayFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
});
const dateFormat = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh", day: "2-digit", month: "2-digit",
});
const weekdayFormat = new Intl.DateTimeFormat("vi-VN", {
  timeZone: "Asia/Ho_Chi_Minh", weekday: "long",
});
function updatedDay(movie: MovieListItem) {
  if (!movie.modified?.time) return "";
  const value = new Date(movie.modified.time);
  return Number.isNaN(value.getTime()) ? "" : dayFormat.format(value);
}

export function ScheduleView({ latestMovies, seriesMovies, today }: {
  latestMovies: MovieListItem[];
  seriesMovies: MovieListItem[];
  today: string;
}) {
  const seen = new Set<string>();
  const allMovies = [...latestMovies, ...seriesMovies].filter((movie) => {
    const key = `${movie.source}:${movie.slug}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const datedDays = Array.from(new Set(allMovies.map(updatedDay).filter(Boolean))).sort();
  const initialDay = datedDays.includes(today) ? today : datedDays.at(-1) || "unknown";
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const strip = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = strip.current;
    const selected = container?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!container || !selected) return;
    // Scroll this strip only; scrollIntoView could move the entire page.
    container.scrollLeft = selected.offsetLeft - container.offsetLeft - (container.clientWidth - selected.offsetWidth) / 2;
  }, [selectedDay]);
  const anchor = initialDay === "unknown" ? today : initialDay;
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${anchor}T12:00:00+07:00`);
    date.setUTCDate(date.getUTCDate() + index - 3);
    return { date, key: dayFormat.format(date) };
  });
  const unknownMovies = allMovies.filter((movie) => !updatedDay(movie));
  const movies = selectedDay === "unknown" ? unknownMovies : allMovies.filter((movie) => updatedDay(movie) === selectedDay);

  return (
    <>
      <div className="schedule-heading">
        <h1><CalendarDays size={24} aria-hidden="true" /> Lịch cập nhật</h1>
        <p>Thời điểm cập nhật từ nguồn phim</p>
      </div>
      <div ref={strip} className="schedule-date-strip" aria-label="Chọn ngày cập nhật">
        {days.map(({ date, key }) => (
          <button type="button" key={key} aria-pressed={selectedDay === key} onClick={() => setSelectedDay(key)}>
            <span>{dateFormat.format(date)}{key === today ? " · Hôm nay" : ""}</span>
            <strong>{weekdayFormat.format(date)}</strong>
          </button>
        ))}
      </div>
      {unknownMovies.length > 0 && (
        <button type="button" className="schedule-unknown text-link" aria-pressed={selectedDay === "unknown"} onClick={() => setSelectedDay("unknown")}>
          Chưa có ngày cập nhật ({unknownMovies.length})
        </button>
      )}
      <div aria-live="polite">
        {movies.length ? (
          <div className="catalogue-grid">
            {movies.map((movie) => <MovieCard key={`${movie.source}:${movie._id}`} movie={movie} />)}
          </div>
        ) : (
          <div className="empty-state">
            <h2>Chưa có phim cập nhật trong ngày này</h2>
            <p>Danh sách hiển thị thời điểm cập nhật do nguồn phim cung cấp, không phải lịch phát sóng hay lịch công chiếu.</p>
          </div>
        )}
      </div>
    </>
  );
}
