import Link from "next/link";
import PTQBrandLogo from "./PTQBrandLogo";
export default function Footer() {
  return (
    <footer className="film-footer">
      <div className="footer-inner">
        <div className="footer-brand-row">
          <PTQBrandLogo />
          <span className="footer-divider" aria-hidden="true" />
          <div className="footer-countries">
            <Link href="/quoc-gia/han-quoc">Phim Hàn Quốc</Link>
            <Link href="/quoc-gia/trung-quoc">Phim Trung Quốc</Link>
            <Link href="/quoc-gia/au-my">Phim Âu Mỹ</Link>
            <Link href="/quoc-gia/nhat-ban">Phim Nhật Bản</Link>
          </div>
        </div>
        <nav aria-label="Liên kết cuối trang">
          <Link href="/phimhay">Trang chủ</Link>
          <Link href="/phim-le">Phim lẻ</Link>
          <Link href="/phim-bo">Phim bộ</Link>
          <Link href="/chu-de">Chủ đề</Link>
          <Link href="/lich-chieu">Lịch cập nhật</Link>
          <Link href="/tu-phim">Yêu thích</Link>
        </nav>
        <p>
          PTQ Film — Khám phá phim Vietsub, thuyết minh, lồng tiếng từ Hàn Quốc,
          Trung Quốc, Thái Lan, Nhật Bản và Âu Mỹ. Lưu những bộ phim yêu thích
          và tiếp tục câu chuyện của bạn.
        </p>
        <p>© {new Date().getFullYear()} PTQ Film</p>
      </div>
    </footer>
  );
}
