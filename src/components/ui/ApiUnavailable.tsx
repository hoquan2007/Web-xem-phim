export function ApiUnavailable({
  message = "Chưa kết nối được nguồn phim. Vui lòng thử tải lại trang sau ít phút.",
}: {
  message?: string;
}) {
  return (
    <div role="alert" className="notice my-6">
      {message}
    </div>
  );
}
