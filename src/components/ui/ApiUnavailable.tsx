export function ApiUnavailable({
  message = "Chưa thể tải danh sách phim. Vui lòng thử lại sau ít phút.",
}: {
  message?: string;
}) {
  return (
    <div role="alert" className="notice my-6">
      {message}
    </div>
  );
}
