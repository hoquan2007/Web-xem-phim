import Link from "next/link";
import Image from "next/image";
interface Props {
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
  className?: string;
  onClick?: () => void;
}
export default function PTQBrandLogo({ className = "", onClick }: Props) {
  return (
    <Link
      href="/phimhay"
      onClick={onClick}
      className={`wordmark ${className}`}
      aria-label="PTQ Film — Trang chủ"
    >
      <Image
        className="wordmark-symbol"
        src="/images/ptq-film-logo.png"
        width={48}
        height={48}
        sizes="48px"
        alt=""
        aria-hidden="true"
      />
      <span className="wordmark-copy">
        <strong>
          PTQ<span>Film</span>
        </strong>
        <small>Thế giới phim của bạn</small>
      </span>
    </Link>
  );
}
export { PTQBrandLogo };
