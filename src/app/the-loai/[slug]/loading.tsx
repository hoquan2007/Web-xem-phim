import React from "react";
import { GridSkeleton } from "@/components/ui/Skeleton";

export default function CategoryLoading() {
  return (
    <div className="page-shell">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12">
        <GridSkeleton count={24} title="Đang tải phim theo thể loại..." />
      </div>
    </div>
  );
}
