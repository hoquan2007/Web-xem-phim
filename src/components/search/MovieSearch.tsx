"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { getImageFallbackChain, getImageUrl, getMovieHref } from "@/lib/api/helpers";
import type { MovieListItem } from "@/types/movie";

type Props = {
  initialKeyword?: string;
  variant?: "header" | "dialog" | "page";
  enabled?: boolean;
  onNavigate?: () => void;
};

/** Hallmark · component-scope · design-system: design.md · P5 H4 E4 S5 R5 V4 */
export function MovieSearch({ initialKeyword = "", variant = "page", enabled = true, onNavigate }: Props) {
  const router = useRouter();
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(initialKeyword);
  const [previous, setPrevious] = useState(initialKeyword);
  const [open, setOpen] = useState(variant === "dialog");
  const [active, setActive] = useState(-1);
  const [retry, setRetry] = useState(0);
  const [navigating, startTransition] = useTransition();
  const [results, setResults] = useState<{ query: string; items: MovieListItem[]; error?: string }>({ query: "", items: [] });
  if (previous !== initialKeyword) {
    setPrevious(initialKeyword); setQuery(initialKeyword); setActive(-1); setOpen(false);
  }
  const keyword = query.trim();
  const pending = Boolean(keyword) && keyword !== results.query;
  const expanded = open && Boolean(keyword) && enabled;
  const items = pending ? [] : results.items;
  const selected = active >= 0 && active < items.length ? active : -1;
  const searchHref = `/tim-kiem?${new URLSearchParams({ keyword })}`;

  useEffect(() => {
    if (!keyword || !enabled) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?${new URLSearchParams({ keyword, limit: "6" })}`, { signal: controller.signal });
        if (!response.ok) throw new Error("search");
        const data = await response.json();
        if (data.status === false) throw new Error("search");
        if (!controller.signal.aborted) setResults({ query: keyword, items: data.items || [] });
      } catch {
        if (!controller.signal.aborted) setResults({ query: keyword, items: [], error: "Chưa tải được gợi ý. Bạn vẫn có thể tìm toàn bộ phim." });
      }
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [keyword, enabled, retry]);

  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, []);

  useEffect(() => {
    if (!expanded || !root.current) return;
    const update = () => {
      const viewport = window.visualViewport;
      const bottom = (viewport?.height ?? window.innerHeight) + (viewport?.offsetTop ?? 0);
      const rect = root.current!.getBoundingClientRect();
      const available = variant === "dialog" ? bottom - rect.top - 88 : bottom - rect.bottom - 24;
      root.current!.style.setProperty("--search-space", `${Math.max(100, available)}px`);
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    window.visualViewport?.addEventListener("resize", update);
    window.visualViewport?.addEventListener("scroll", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.visualViewport?.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("scroll", update);
    };
  }, [expanded, variant]);

  useEffect(() => {
    const container = list.current;
    const option = selected >= 0 ? document.getElementById(`${id}-option-${selected}`) : null;
    if (!container || !option) return;
    const top = option.offsetTop;
    if (top < container.scrollTop) container.scrollTop = top;
    else if (top + option.offsetHeight > container.scrollTop + container.clientHeight)
      container.scrollTop = top + option.offsetHeight - container.clientHeight;
  }, [selected, id]);

  const navigate = (href: string) => {
    setOpen(false); setActive(-1);
    startTransition(() => router.push(href));
    onNavigate?.();
  };

  return (
    <div ref={root} className={`movie-search movie-search--${variant}`} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <form className="search-form" role="search" aria-label="Tìm phim" onSubmit={(event) => {
        event.preventDefault();
        if (keyword && !navigating) navigate(selected >= 0 ? getMovieHref(items[selected]) : searchHref);
      }}>
        <div className="search-input-wrap">
          <Search size={19} className="search-icon" aria-hidden="true" />
          <input
            ref={input} id={`${id}-input`} className="film-field" role="combobox"
            aria-label="Tìm kiếm phim" aria-autocomplete="list" aria-expanded={expanded}
            aria-controls={`${id}-results`}
            aria-activedescendant={expanded && selected >= 0 ? `${id}-option-${selected}` : undefined}
            aria-describedby={expanded ? `${id}-status` : undefined}
            autoComplete="off" spellCheck={false} enterKeyHint="search" disabled={!enabled}
            value={query} placeholder="Tìm kiếm phim..."
            data-dialog-autofocus={variant === "dialog" || undefined}
            onChange={(event) => { setQuery(event.target.value); setActive(-1); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing) return;
              if (event.key === "Escape" && expanded) {
                event.preventDefault(); event.stopPropagation(); setOpen(false); setActive(-1);
              } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault(); setOpen(true);
                if (items.length) setActive(event.key === "ArrowDown" ? (selected + 1) % items.length : (selected <= 0 ? items.length - 1 : selected - 1));
              }
            }}
          />
          {query && <button type="button" className="search-clear" aria-label="Xóa từ khóa" disabled={!enabled} onClick={() => {
            setQuery(""); setActive(-1); setOpen(true); input.current?.focus();
          }}><X size={17} /></button>}
        </div>
        {variant !== "header" && <button className="film-button primary search-submit" type="submit" disabled={!enabled || !keyword || navigating}>
          {navigating ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : "Tìm"}
          {navigating && <span className="sr-only">Đang mở kết quả</span>}
        </button>}
      </form>
      {variant === "dialog" && !keyword && <p className="search-hint">Tìm theo tên phim tiếng Việt hoặc tên gốc.</p>}
      {expanded && <div className="search-suggestions">
        <div id={`${id}-status`} className="search-feedback" role="status" aria-live="polite">
          {pending ? <><Loader2 size={16} className="animate-spin" aria-hidden="true" />Đang tìm phim…</> : results.error ? results.error : items.length ? `${items.length} gợi ý phim` : "Không tìm thấy phim phù hợp. Thử tên khác hoặc tìm toàn bộ."}
        </div>
        {results.error && !pending && <button className="search-retry" type="button" onClick={() => {
          setResults({ query: "", items: [] }); setRetry((value) => value + 1); input.current?.focus();
        }}>Thử lại</button>}
        <div ref={list} className="search-result-list" role="listbox" aria-label="Gợi ý phim" id={`${id}-results`} aria-busy={pending}>
          {items.map((item, index) => <Link
            key={`${item.source}:${item._id}`} href={getMovieHref(item)} prefetch={false}
            className="search-result" role="option" id={`${id}-option-${index}`} aria-selected={selected === index}
            aria-label={`${item.name}${item.year > 0 ? `, ${item.year}` : ""}${item.origin_name !== item.name ? `, ${item.origin_name}` : ""}`}
            tabIndex={-1} onMouseDown={(event) => event.preventDefault()}
            onClick={() => { setOpen(false); setActive(-1); onNavigate?.(); }}
          >
            <span className="search-result-poster"><SafeImage src={getImageUrl(item.poster_url || item.thumb_url)} fallbackUrls={getImageFallbackChain(getImageUrl(item.poster_url || item.thumb_url))} alt="" fill sizes="44px" className="object-cover" /></span>
            <span className="search-result-copy">
              <span className="search-result-title">{item.name}</span>
              {item.origin_name && item.origin_name !== item.name && <span className="search-result-original">{item.origin_name}</span>}
              {item.year > 0 && <span className="search-result-year">{item.year}</span>}
            </span>
          </Link>)}
        </div>
        <Link className="search-all" href={searchHref} onClick={() => { setOpen(false); onNavigate?.(); }}>Xem tất cả kết quả<ArrowRight size={16} aria-hidden="true" /></Link>
      </div>}
      <span className="sr-only" role="status">{navigating ? "Đang mở kết quả tìm kiếm…" : ""}</span>
    </div>
  );
}
