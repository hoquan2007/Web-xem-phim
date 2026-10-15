"use client";
import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Menu, ChevronDown, X, Loader2, Heart } from "lucide-react";
import { CategoryItem, CountryItem, MovieListItem } from "@/types/movie";
import {
  getImageUrl,
  getImageFallbackChain,
  getMovieHref,
} from "@/lib/api/helpers";
import { SafeImage } from "@/components/ui/SafeImage";
import { Dialog } from "@/components/ui/Dialog";
import SearchBarForm from "@/components/search/SearchBarForm";
import MobileDrawer from "./MobileDrawer";
import PTQBrandLogo from "./PTQBrandLogo";
import BookmarkBadge from "./BookmarkBadge";
const subscribe = () => () => {};
const client = () => true;
const server = () => false;
export default function Navbar({
  categories = [],
  countries = [],
  searchEnabled = true,
}: {
  categories?: CategoryItem[];
  countries?: CountryItem[];
  searchEnabled?: boolean;
}) {
  const hydrated = useSyncExternalStore(subscribe, client, server);
  const router = useRouter();
  const pathname = usePathname();
  const [atTop, setAtTop] = useState(true);
  useEffect(() => {
    const update = () => setAtTop(window.scrollY < 50);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    query: string;
    items: MovieListItem[];
    error?: string;
  }>({ query: "", items: [] });
  const [showSearch, setShowSearch] = useState(false);
  const [dropdown, setDropdown] = useState<"category" | "country" | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const trimmed = query.trim();
  const pending = trimmed !== results.query;
  useEffect(() => {
    if (!trimmed) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?${new URLSearchParams({ keyword: trimmed, limit: "6" })}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("search");
        const data = await response.json();
        if (!controller.signal.aborted)
          setResults({ query: trimmed, items: data.items || [] });
      } catch {
        if (!controller.signal.aborted)
          setResults({
            query: trimmed,
            items: [],
            error: "Chưa tải được gợi ý. Bạn có thể nhấn Enter để tìm.",
          });
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setDropdown(null);
      if (!searchRef.current?.contains(event.target as Node))
        setShowSearch(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);
  return (
    <>
      <header
        className={`film-header ${atTop && (pathname === "/" || pathname === "/phimhay" || pathname.startsWith("/phim/")) ? "over-hero" : ""}`}
      >
        <div className="header-inner">
          <button
            className="header-menu-toggle"
            aria-label="Mở menu"
            aria-expanded={drawer}
            disabled={!searchEnabled || !hydrated}
            onClick={() => setDrawer(true)}
          >
            <Menu size={24} />
          </button>
          <PTQBrandLogo />
          <div
            className="header-search"
            ref={searchRef}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setShowSearch(false);
                e.stopPropagation();
              }
            }}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget))
                setShowSearch(false);
            }}
          >
            <form
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                if (trimmed) {
                  router.push(
                    `/tim-kiem?keyword=${encodeURIComponent(trimmed)}`,
                  );
                  setShowSearch(false);
                }
              }}
            >
              <Search size={18} className="search-icon" />
              <input
                className="film-field"
                aria-label="Tìm kiếm phim"
                placeholder="Tìm kiếm phim..."
                disabled={!searchEnabled || !hydrated}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowSearch(true);
                }}
                onFocus={() => setShowSearch(true)}
              />
              {query && (
                <button
                  className="search-clear"
                  aria-label="Xóa từ khóa"
                  type="button"
                  onClick={() => setQuery("")}
                >
                  <X size={16} />
                </button>
              )}
            </form>
            {showSearch && trimmed && (
              <div className="search-suggestions" aria-label="Gợi ý phim">
                {pending ? (
                  <p className="p-3 text-sm text-muted" role="status">
                    <Loader2 className="inline animate-spin mr-2" size={16} />
                    Đang tìm…
                  </p>
                ) : results.error ? (
                  <p className="p-3 text-sm" role="alert">
                    {results.error}
                  </p>
                ) : results.items.length ? (
                  results.items.map((item) => (
                    <Link
                      className="search-result"
                      key={`${item.source}:${item._id}`}
                      href={getMovieHref(item)}
                      onClick={() => {
                        setShowSearch(false);
                        setQuery("");
                      }}
                    >
                      <div className="relative w-10 h-14 shrink-0 overflow-hidden rounded">
                        <SafeImage
                          src={getImageUrl(item.poster_url || item.thumb_url)}
                          fallbackUrls={getImageFallbackChain(
                            getImageUrl(item.poster_url || item.thumb_url),
                          )}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold line-clamp-2">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted truncate">
                          {item.year > 0 ? item.year : ""}{" "}
                          {item.origin_name !== item.name
                            ? item.origin_name
                            : ""}
                        </p>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="p-3 text-sm text-muted" role="status">
                    Không tìm thấy phim phù hợp.
                  </p>
                )}
                <Link
                  className="text-link px-3"
                  href={`/tim-kiem?keyword=${encodeURIComponent(trimmed)}`}
                  onClick={() => setShowSearch(false)}
                >
                  Xem kết quả tìm kiếm →
                </Link>
              </div>
            )}
          </div>
          <nav
            className="desktop-nav"
            aria-label="Điều hướng chính"
            ref={navRef}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                setDropdown(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setDropdown(null);
                const trigger =
                  e.currentTarget.querySelector<HTMLButtonElement>(
                    '[aria-expanded="true"]',
                  );
                trigger?.focus();
              }
            }}
          >
            {(["country", "category"] as const).map((kind) => (
              <div key={kind} className="relative">
                <button
                  className="nav-link"
                  disabled={!searchEnabled || !hydrated}
                  aria-expanded={dropdown === kind}
                  aria-controls={`nav-${kind}`}
                  onClick={() => setDropdown(dropdown === kind ? null : kind)}
                >
                  {kind === "category" ? "Thể loại" : "Quốc gia"}
                  <ChevronDown size={14} />
                </button>
                {dropdown === kind && (
                  <div className="nav-dropdown" id={`nav-${kind}`}>
                    {(kind === "category" ? categories : countries).map(
                      (item) => (
                        <Link
                          key={item.slug}
                          href={`/${kind === "category" ? "the-loai" : "quoc-gia"}/${item.slug}`}
                          onClick={() => setDropdown(null)}
                        >
                          {item.name}
                        </Link>
                      ),
                    )}
                  </div>
                )}
              </div>
            ))}
            <Link className="nav-link" href="/phim-le">
              Phim lẻ
            </Link>
            <Link className="nav-link" href="/phim-bo">
              Phim bộ
            </Link>
            <Link
              className="nav-link"
              href="/chu-de"
              aria-current={pathname === "/chu-de" ? "page" : undefined}
            >
              Chủ đề
            </Link>
            <Link className="nav-link" href="/lich-chieu">
              Lịch cập nhật
            </Link>
            <Link className="nav-link" href="/tu-phim">
              Yêu thích
            </Link>
          </nav>
          <div className="header-actions">
            <button
              className="icon-button mobile-search-toggle"
              disabled={!searchEnabled || !hydrated}
              aria-label="Mở tìm kiếm"
              onClick={() => setMobileSearch(true)}
            >
              <Search size={19} />
            </button>
            <BookmarkBadge />
            <Link className="member-link" href="/tu-phim">
              <Heart size={16} fill="currentColor" />
              Tủ phim
            </Link>
          </div>
        </div>
      </header>
      <MobileDrawer
        isOpen={drawer}
        onClose={() => setDrawer(false)}
        categories={categories}
        countries={countries}
      />
      <Dialog
        open={mobileSearch}
        onClose={() => setMobileSearch(false)}
        title="Tìm phim"
      >
        <SearchBarForm onNavigate={() => setMobileSearch(false)} />
      </Dialog>
    </>
  );
}
