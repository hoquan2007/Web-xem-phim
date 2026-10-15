import {
  HeroBannerSkeleton,
  TopicCardsSkeleton,
  GridSkeleton,
} from "@/components/ui/Skeleton";
export default function Loading() {
  return (
    <div>
      <HeroBannerSkeleton />
      <div className="home-content">
        <TopicCardsSkeleton />
        <GridSkeleton count={12} />
      </div>
    </div>
  );
}
