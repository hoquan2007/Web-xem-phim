"use client";

import { Suspense, useId, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Loader2, SlidersHorizontal, X } from "lucide-react";
import { CategoryItem, CountryItem, FilterParams } from "@/types/movie";
import { Dialog } from "@/components/ui/Dialog";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { FilterSelect, type FilterOption } from "./FilterSelect";
import "./catalog.css";

interface Props {
  categories: CategoryItem[];
  countries: CountryItem[];
  currentFilters?: FilterParams;
  baseUrl?: string;
}
type Draft = { type: string; category: string; country: string; year: string; sort: string };
const types: FilterOption[] = [
  { value: "", label: "Tất cả loại" }, { value: "single", label: "Phim lẻ" },
  { value: "series", label: "Phim bộ" }, { value: "hoat-hinh", label: "Hoạt hình" },
  { value: "phim-chieu-rap", label: "Chiếu rạp" }, { value: "tv-shows", label: "TV show" },
];
const sorts: FilterOption[] = [
  { value: "modified.time_desc", label: "Mới cập nhật" }, { value: "year_desc", label: "Năm giảm dần" },
  { value: "year_asc", label: "Năm tăng dần" }, { value: "view_desc", label: "Lượt xem" },
];
const routeTypes: Record<string, string> = {
  "/phim-bo": "series", "/phim-le": "single", "/c/phim-hoat-hinh-anime": "hoat-hinh",
  "/c/tv-shows-chuong-trinh-truyen-hinh": "tv-shows", "/c/phim-chieu-rap-moi": "phim-chieu-rap",
};

/** Hallmark · component-scope · design-system: design.md · P5 H4 E4 S5 R5 V4 */
function FilterContent({ categories, countries, currentFilters = {}, baseUrl = "/danh-sach" }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const mobile = useMediaQuery("(max-width: 767px)");
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const implicitType = routeTypes[baseUrl] || "";
  const reset: Draft = { type: implicitType, category: "", country: "", year: "", sort: "modified.time_desc" };
  const current: Draft = {
    type: String(currentFilters.type ?? params.get("type") ?? implicitType),
    category: String(currentFilters.category ?? params.get("category") ?? ""),
    country: String(currentFilters.country ?? params.get("country") ?? ""),
    year: String(currentFilters.year ?? params.get("year") ?? ""),
    sort: `${currentFilters.sort_field || params.get("sort_field") || "modified.time"}_${currentFilters.sort_type || params.get("sort_type") || "desc"}`,
  };
  const signature = JSON.stringify(current);
  const [previous, setPrevious] = useState(signature);
  const [draft, setDraft] = useState(current);
  if (previous !== signature) { setPrevious(signature); setDraft(current); }

  const categoryOptions = [{ value: "", label: "Tất cả thể loại" }, ...categories.map((item) => ({ value: item.slug, label: item.name }))];
  const countryOptions = [{ value: "", label: "Tất cả quốc gia" }, ...countries.map((item) => ({ value: item.slug, label: item.name }))];
  const yearOptions = [{ value: "", label: "Tất cả năm" }, ...Array.from({ length: new Date().getFullYear() - 1899 }, (_, index) => {
    const year = String(new Date().getFullYear() - index);
    return { value: year, label: year };
  })];
  const fields: { key: keyof Draft; label: string; options: FilterOption[]; searchable?: boolean }[] = [
    { key: "type", label: "Loại phim", options: types },
    { key: "category", label: "Thể loại", options: categoryOptions, searchable: true },
    { key: "country", label: "Quốc gia", options: countryOptions, searchable: true },
    { key: "year", label: "Năm phát hành", options: yearOptions, searchable: true },
    { key: "sort", label: "Sắp xếp", options: sorts },
  ];
  const applied = fields.filter(({ key }) => current[key] !== reset[key] && Boolean(current[key]));
  const close = () => { setOpen(false); trigger.current?.focus({ preventScroll: true }); };
  const navigate = (values: Draft) => {
    const query = new URLSearchParams(params.toString());
    for (const key of ["type", "category", "country", "year"] as const) {
      if (values[key] && !(key === "type" && values[key] === implicitType)) query.set(key, values[key]);
      else query.delete(key);
    }
    if (values.sort === reset.sort) { query.delete("sort_field"); query.delete("sort_type"); }
    else {
      const split = values.sort.lastIndexOf("_");
      query.set("sort_field", values.sort.slice(0, split));
      query.set("sort_type", values.sort.slice(split + 1));
    }
    query.delete("page");
    // A type-specific route supplies its own default; "all types" must leave that route.
    const target = implicitType && !values.type ? "/danh-sach" : baseUrl;
    startTransition(() => router.push(`${target}${query.size ? `?${query}` : ""}`, { scroll: false }));
  };
  const form = <form id={`${id}-panel`} className="catalog-filter-panel" aria-label="Bộ lọc phim"
    onKeyDown={(event) => { if (event.key === "Escape" && !mobile && !event.defaultPrevented) close(); }}
    onSubmit={(event) => { event.preventDefault(); if (!pending) { navigate(draft); close(); } }}>
    {!mobile && <div className="filter-panel-heading"><div><h2>Lọc theo sở thích</h2><p>Chọn điều kiện, rồi áp dụng để cập nhật danh sách.</p></div><button type="button" className="icon-button" aria-label="Đóng bộ lọc" onClick={close}><X size={18} /></button></div>}
    <div className="filter-fields">
      {fields.map(({ key, label, options, searchable }) => <FilterSelect key={key} id={`${id}-${key}`} label={label} value={draft[key]} options={options} searchable={searchable} disabled={pending} onChange={(value) => setDraft((before) => ({ ...before, [key]: value }))} />)}
    </div>
    <div className="catalog-filter-actions">
      <button className="film-button primary catalog-filter-apply" disabled={pending}>Áp dụng</button>
      <button type="button" className="filter-reset" disabled={pending} onClick={() => setDraft(reset)}>Đặt lại</button>
    </div>
  </form>;

  return <div className="catalog-filter" aria-busy={pending}>
    <div className="filter-toolbar">
      <button ref={trigger} type="button" className="catalog-filter-toggle" aria-expanded={open} aria-controls={`${id}-panel`} disabled={pending}
        onClick={() => { if (open) close(); else { setDraft(current); setOpen(true); } }}>
        <SlidersHorizontal size={16} aria-hidden="true" />Bộ lọc
        {applied.length > 0 && <span className="filter-count">{applied.length}</span>}
        <ChevronDown size={15} className={open ? "filter-chevron-open" : undefined} aria-hidden="true" />
      </button>
      {applied.length === 0 && <span className="filter-summary">Khám phá theo thể loại, quốc gia, năm</span>}
      {applied.length > 0 && <button type="button" className="filter-clear-all" disabled={pending} onClick={() => navigate(reset)}>Xóa tất cả</button>}
    </div>
    {applied.length > 0 && <div className="filter-applied" aria-label="Bộ lọc đang áp dụng">
      {applied.map(({ key, label, options }) => <button type="button" className="filter-chip" key={key} disabled={pending} aria-label={`Bỏ lọc ${label.toLocaleLowerCase("vi")}`}
        onClick={() => navigate({ ...current, [key]: reset[key] })}>
        <span>{options.find((option) => option.value === current[key])?.label || current[key]}</span><X size={13} aria-hidden="true" />
      </button>)}
    </div>}
    <p className="filter-pending" role="status" aria-live="polite">{pending && <><Loader2 size={15} className="animate-spin" aria-hidden="true" />Đang cập nhật danh sách phim…</>}</p>
    {mobile ? <Dialog open={open} onClose={close} title="Bộ lọc phim" className="filter-dialog">{form}</Dialog> : open && form}
  </div>;
}

export default function FilterBar(props: Props) {
  return <Suspense fallback={<div className="h-12 animate-pulse bg-surface" />}><FilterContent {...props} /></Suspense>;
}
