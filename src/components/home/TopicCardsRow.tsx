import Link from "next/link";
const topics = [
  ["Hành động", "/the-loai/hanh-dong"],
  ["Tình cảm", "/the-loai/tinh-cam"],
  ["Hoạt hình", "/the-loai/hoat-hinh"],
  ["Cổ trang", "/the-loai/co-trang"],
  ["Phim lẻ", "/danh-sach?type=single"],
  ["Khám phá chủ đề →", "/chu-de"],
];
export function TopicCardsRow() {
  return (
    <nav className="topic-links" aria-label="Khám phá theo chủ đề">
      {topics.map(([name, href]) => (
        <Link key={href} href={href}>
          {name}
        </Link>
      ))}
    </nav>
  );
}
