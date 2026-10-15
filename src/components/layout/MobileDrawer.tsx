"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryItem, CountryItem } from "@/types/movie";
import { Dialog } from "@/components/ui/Dialog";
export default function MobileDrawer({
  isOpen,
  onClose,
  categories,
  countries,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  countries: CountryItem[];
}) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title="Khám phá PTQ Film"
      className="drawer"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) {
            router.push(
              `/tim-kiem?keyword=${encodeURIComponent(query.trim())}`,
            );
            onClose();
          }
        }}
      >
        <label className="film-label" htmlFor="drawer-search">
          Tìm phim
        </label>
        <div className="flex gap-2">
          <input
            autoFocus
            id="drawer-search"
            className="film-field min-w-0"
            placeholder="Tìm kiếm phim…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="film-button primary">Tìm</button>
        </div>
      </form>
      <nav className="drawer-nav" aria-label="Điều hướng mobile">
        <Link href="/" onClick={onClose}>
          Trang chủ
        </Link>
        <Link href="/phim-le" onClick={onClose}>
          Phim lẻ
        </Link>
        <Link href="/phim-bo" onClick={onClose}>
          Phim bộ
        </Link>
        <Link href="/chu-de" onClick={onClose}>
          Chủ đề
        </Link>
        <Link href="/lich-chieu" onClick={onClose}>
          Lịch cập nhật
        </Link>
        <Link href="/tu-phim" onClick={onClose}>
          Tủ phim yêu thích
        </Link>
        <details>
          <summary>Thể loại</summary>
          <div>
            {categories.map((c) => (
              <Link key={c.slug} href={`/the-loai/${c.slug}`} onClick={onClose}>
                {c.name}
              </Link>
            ))}
          </div>
        </details>
        <details>
          <summary>Quốc gia</summary>
          <div>
            {countries.map((c) => (
              <Link key={c.slug} href={`/quoc-gia/${c.slug}`} onClick={onClose}>
                {c.name}
              </Link>
            ))}
          </div>
        </details>
      </nav>
    </Dialog>
  );
}
