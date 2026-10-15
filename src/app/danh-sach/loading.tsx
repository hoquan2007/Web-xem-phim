import React from "react";
import { GridSkeleton } from "@/components/ui/Skeleton";

export default function FilterListLoading() {
  return (
    <div className="page-shell">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12">
        <GridSkeleton count={24} title="Đang tải danh sách phim..." />
      </div>
    </div>
  );
}
