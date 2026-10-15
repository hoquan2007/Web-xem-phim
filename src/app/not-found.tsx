import Link from "next/link";
import SearchBarForm from "@/components/search/SearchBarForm";
export default function NotFound() {
  return (
    <div className="page-shell">
      <div className="empty-state">
        <p className="text-accent">404</p>
        <h1 className="text-3xl font-semibold mt-3 mb-4">
          Không tìm thấy trang này
        </h1>
        <p>
          Địa chỉ có thể đã thay đổi. Tìm một bộ phim khác hoặc trở lại trang
          chủ.
        </p>
        <SearchBarForm />
        <div className="flex gap-4 flex-wrap mt-6">
          <Link className="text-link" href="/">
            Về trang chủ →
          </Link>
          <Link className="text-link" href="/danh-sach">
            Khám phá phim →
          </Link>
        </div>
      </div>
    </div>
  );
}
