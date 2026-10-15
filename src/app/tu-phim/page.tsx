import "@/components/filter/catalog.css";
import React from "react";
import { Metadata } from "next";
import TuPhimContainer from "@/components/tu-phim/TuPhimContainer";

export const metadata: Metadata = {
  title: "Tủ Phim Yêu Thích & Lịch Sử Xem",
  description:
    "Quản lý danh sách các bộ phim đã lưu và xem tiếp lịch sử theo dõi phim trực tuyến của bạn trên PTQ.",
  openGraph: {
    title: "Tủ Phim Yêu Thích & Lịch Sử Xem | PTQ",
    description:
      "Quản lý danh sách các bộ phim đã lưu và xem tiếp lịch sử theo dõi phim trực tuyến của bạn trên PTQ.",
    siteName: "PTQ Film",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tủ Phim Yêu Thích & Lịch Sử Xem | PTQ",
    description:
      "Quản lý danh sách các bộ phim đã lưu và xem tiếp lịch sử theo dõi phim trực tuyến của bạn trên PTQ.",
  },
};

export default function TuPhimPage() {
  return (
    <div className="page-shell catalog-page">
      <div className="w-full">
        <TuPhimContainer />
      </div>
    </div>
  );
}
