import React from "react";
export const MovieCardSkeleton: React.FC<{
  aspectRatio?: "portrait" | "landscape";
}> = ({ aspectRatio = "portrait" }) => (
  <div aria-hidden="true" className="animate-pulse">
    <div
      className={`rounded-lg bg-surface ${aspectRatio === "portrait" ? "aspect-[2/3]" : "aspect-video"}`}
    />
    <div className="mt-3 h-10 w-4/5 bg-surface rounded" />
    <div className="mt-2 h-3 w-1/2 bg-surface rounded" />
  </div>
);
export const GridSkeleton: React.FC<{ count?: number; title?: string }> = ({
  count = 12,
  title,
}) => (
  <div aria-busy="true" aria-label={title || "Đang tải phim"}>
    {title && (
      <div className="h-7 w-48 bg-surface mb-6 rounded" aria-hidden="true" />
    )}
    <div className="catalogue-grid">
      {Array.from({ length: count }, (_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  </div>
);
export const HeroBannerSkeleton: React.FC = () => (
  <div
    className="film-hero"
    aria-label="Đang tải phim tiêu điểm"
    aria-busy="true"
  >
    <div className="hero-frame bg-surface">
      <div className="hero-caption animate-pulse" aria-hidden="true">
        <div className="h-14 w-3/4 max-w-lg bg-raised rounded" />
        <div className="mt-4 h-5 w-40 bg-raised rounded" />
        <div className="mt-6 flex gap-3">
          <div className="h-11 w-32 bg-raised rounded" />
          <div className="h-11 w-28 bg-raised rounded" />
        </div>
        <div className="mt-8 h-11 w-40 bg-raised rounded" />
      </div>
    </div>
  </div>
);
export const TopicCardsSkeleton: React.FC = () => (
  <div className="flex gap-2 flex-wrap animate-pulse" aria-hidden="true">
    {Array.from({ length: 6 }, (_, i) => (
      <div className="rounded-full bg-surface h-11 w-24" key={i} />
    ))}
  </div>
);
export const MovieDetailSkeleton: React.FC = () => (
  <div className="space-y-8" aria-busy="true" aria-label="Đang tải phim">
    <div className="watch-layout animate-pulse" aria-hidden="true">
      <div className="bg-surface rounded-lg">
        <div className="h-14" />
        <div className="aspect-video bg-raised" />
        <div className="h-16" />
      </div>
      <div className="h-80 bg-surface rounded-lg" />
    </div>
    <div className="flex gap-6 animate-pulse" aria-hidden="true">
      <div className="w-32 aspect-[2/3] bg-surface rounded shrink-0" />
      <div className="w-full space-y-4">
        <div className="h-8 bg-surface w-3/4" />
        <div className="h-4 bg-surface w-1/2" />
      </div>
    </div>
  </div>
);
