import "@/components/filter/catalog.css";
import { connection } from "next/server";
import React from "react";
import { Metadata } from "next";
import { getLatestMovies, getFilteredMovies } from "@/lib/api";
import { ScheduleView } from "@/components/schedule/ScheduleView";

export const metadata: Metadata = {
  title: "Lịch cập nhật phim",
  description: "Theo dõi phim theo thời điểm cập nhật thực tế do nguồn phim cung cấp trên PTQ Film.",
};

export const revalidate = 300;

export default async function SchedulePage() {
  await connection();
  const [latestRes, seriesRes] = await Promise.all([
    getLatestMovies(1),
    getFilteredMovies({ type: "series", limit: 20 }),
  ]);

  const latestMovies = latestRes.items || [];
  const seriesMovies = seriesRes.items || [];

  return (
    <div className="page-shell catalog-page schedule-page">
      <div className="w-full">
        <ScheduleView
          latestMovies={latestMovies}
          seriesMovies={seriesMovies}
          today={new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())}
        />
      </div>
    </div>
  );
}
