import React from "react";
import { GridSkeleton } from "@/components/ui/Skeleton";

export default function TuPhimLoading() {
  return (
    <div className="page-shell">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="h-28 rounded-lg bg-slate-900/60 border border-white/5 animate-pulse" />
        <GridSkeleton count={12} />
      </div>
    </div>
  );
}
