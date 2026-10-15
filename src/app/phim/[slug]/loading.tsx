import "@/components/sites/rophim/detail.css";

export default function MovieDetailLoading() {
  return (
    <div className="rp-detail-page" aria-label="Đang tải thông tin phim" aria-busy="true">
      <div className="rp-detail-backdrop bg-surface" />
      <div className="rp-detail-body">
        <aside className="rp-detail-sidebar"><div className="rp-detail-poster" /><div className="h-6 w-3/4 rounded bg-surface-raised" /></aside>
        <div className="rp-detail-main"><div className="h-14 w-44 rounded-full bg-surface-raised" /><div className="mt-12 h-60 rounded-xl bg-surface" /></div>
      </div>
    </div>
  );
}
