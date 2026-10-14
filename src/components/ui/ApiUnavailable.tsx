export function ApiUnavailable({ message = 'Nguồn phim đang không khả dụng. Vui lòng tải lại trang sau ít phút.' }: { message?: string }) {
  return <div role="alert" className="my-8 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6 text-center text-sm text-amber-200">{message}</div>;
}
