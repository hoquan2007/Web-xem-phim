import Link from "next/link";
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
      <svg
        className="wordmark-symbol"
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M37 12A18 18 0 0 0 8 27"
          stroke="white"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <path
          d="M40 23A18 18 0 0 1 12 39"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinecap="round"
        />
        <path
          d="M8 34A21 21 0 0 0 43 30M5 39A26 26 0 0 0 43 40"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="m20 13 15 9a2 2 0 0 1 0 3l-15 9a2 2 0 0 1-3-1.7V15a2 2 0 0 1 3-2Z"
          fill="white"
        />
        <path
          d="m32 33 7 7"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
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
