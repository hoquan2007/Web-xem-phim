import "@/components/filter/catalog.css";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Các chủ đề",
  description: "Khám phá phim theo quốc gia, thể loại và tuyển tập trên PTQ Film.",
};

const collections = [
  { title: "Hàn Quốc", href: "/c/phim-han-quoc-moi", color: "korea" },
  { title: "Trung Quốc", href: "/c/phim-trung-quoc-moi", color: "china" },
  { title: "Hoạt Hình", href: "/c/phim-hoat-hinh-anime", color: "animation" },
  { title: "Âu Mỹ", href: "/c/phim-us-uk-moi", color: "western" },
  { title: "Thái Lan", href: "/c/phim-thai-lan", color: "thai" },
  { title: "Phim Lẻ", href: "/phim-le", color: "single" },
  { title: "Phim Bộ", href: "/phim-bo", color: "series" },
  { title: "TV Show Thực Tế", href: "/danh-sach?type=tv-shows", color: "shows" },
];

export default function TopicPage() {
  return (
    <div className="page-shell catalog-page topic-directory">
      <h1 className="catalog-heading">Các chủ đề</h1>
      <div className="topic-directory-grid">
        {collections.map((collection) => (
          <Link className={`topic-tile topic-tile-${collection.color}`} href={collection.href} key={collection.href}>
            <h2>{collection.title}</h2>
            <span>Xem toàn bộ <ArrowRight size={15} aria-hidden="true" /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
