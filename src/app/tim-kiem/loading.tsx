import React from "react";
import { GridSkeleton } from "@/components/ui/Skeleton";

export default function SearchLoading() {
  return (
    <div className="page-shell">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="h-36 rounded-lg bg-slate-900/60 border border-white/5 animate-pulse" />
        <GridSkeleton count={18} />
      </div>
    </div>
  );
}
