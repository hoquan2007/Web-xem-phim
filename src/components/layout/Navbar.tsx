"use client";
import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Menu, ChevronDown, Heart } from "lucide-react";
import { CategoryItem, CountryItem } from "@/types/movie";
import { Dialog } from "@/components/ui/Dialog";
import { MovieSearch } from "@/components/search/MovieSearch";
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
  const pathname = usePathname();
  const [atTop, setAtTop] = useState(true);
  useEffect(() => {
    const update = () => setAtTop(window.scrollY < 50);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  const [dropdown, setDropdown] = useState<"category" | "country" | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [mobileSearch, setMobileSearch] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setDropdown(null);
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
          <div className="header-search">
            <MovieSearch variant="header" enabled={searchEnabled && hydrated} />
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
        className="search-dialog"
      >
        <MovieSearch variant="dialog" enabled={searchEnabled && hydrated} onNavigate={() => setMobileSearch(false)} />
      </Dialog>
    </>
  );
}
