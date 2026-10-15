"use client";
import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
export default function SearchBarForm({
  initialKeyword = "",
  onNavigate,
}: {
  initialKeyword?: string;
  onNavigate?: () => void;
}) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [previous, setPrevious] = useState(initialKeyword);
  const id = useId();
  const router = useRouter();
  if (previous !== initialKeyword) {
    setPrevious(initialKeyword);
    setKeyword(initialKeyword);
  }
  return (
    <form
      className="search-form"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (keyword.trim()) {
          router.push(
            `/tim-kiem?keyword=${encodeURIComponent(keyword.trim())}`,
          );
          onNavigate?.();
        }
      }}
    >
      <label className="sr-only" htmlFor={id}>
        Tìm kiếm phim
      </label>
      <div className="search-input-wrap">
        <Search size={18} className="search-icon" />
        <input
          id={id}
          className="film-field"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Nhập tên phim, từ khóa…"
        />
        {keyword && (
          <button
            type="button"
            className="search-clear"
            aria-label="Xóa từ khóa"
            onClick={() => setKeyword("")}
          >
            <X size={16} />
          </button>
        )}
      </div>
      <button className="film-button primary" type="submit">
        Tìm
      </button>
    </form>
  );
}
