"use client";
import { Suspense, useId, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { CategoryItem, CountryItem, FilterParams } from "@/types/movie";
import "./catalog.css";
interface Props {
  categories: CategoryItem[];
  countries: CountryItem[];
  currentFilters?: FilterParams;
  baseUrl?: string;
}
type Draft = {
  type: string;
  category: string;
  country: string;
  year: string;
  sort: string;
};
function FilterContent({
  categories,
  countries,
  currentFilters = {},
  baseUrl = "/danh-sach",
}: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const current: Draft = {
    type: String(currentFilters.type || params.get("type") || ""),
    category: String(currentFilters.category || params.get("category") || ""),
    country: String(currentFilters.country || params.get("country") || ""),
    year: String(currentFilters.year || params.get("year") || ""),
    sort: `${currentFilters.sort_field || params.get("sort_field") || "modified.time"}_${currentFilters.sort_type || params.get("sort_type") || "desc"}`,
  };
  const signature = JSON.stringify(current);
  const [previous, setPrevious] = useState(signature);
  const [draft, setDraft] = useState(current);
  if (previous !== signature) {
    setPrevious(signature);
    setDraft(current);
  }
  const navigate = (values: Draft) => {
    const query = new URLSearchParams(params.toString());
    for (const key of ["type", "category", "country", "year"] as const) {
      if (values[key]) query.set(key, values[key]);
      else query.delete(key);
    }
    const split = values.sort.lastIndexOf("_");
    query.set("sort_field", values.sort.slice(0, split));
    query.set("sort_type", values.sort.slice(split + 1));
    query.delete("page");
    startTransition(() => router.push(`${baseUrl}?${query}`));
  };
  const fields = () => {
    const value = draft;
    const prefix = `${id}-filter`;
    const update = (key: keyof Draft, next: string) => {
      const values = { ...value, [key]: next };
      setDraft(values);
    };
    return (
      <div className="filter-fields">
        {(
          [
            [
              "type",
              "Loại phim",
              [
                ["", "Tất cả loại"],
                ["single", "Phim lẻ"],
                ["series", "Phim bộ"],
                ["hoat-hinh", "Hoạt hình"],
                ["phim-chieu-rap", "Chiếu rạp"],
                ["tv-shows", "TV show"],
              ],
            ],
            [
              "category",
              "Thể loại",
              [
                ["", "Tất cả thể loại"],
                ...categories.map((c) => [c.slug, c.name]),
              ],
            ],
            [
              "country",
              "Quốc gia",
              [
                ["", "Tất cả quốc gia"],
                ...countries.map((c) => [c.slug, c.name]),
              ],
            ],
            [
              "year",
              "Năm phát hành",
              [
                ["", "Tất cả năm"],
                ...Array.from(
                  { length: new Date().getFullYear() - 1900 + 1 },
                  (_, i) => {
                    const year = String(new Date().getFullYear() - i);
                    return [year, year];
                  },
                ),
              ],
            ],
            [
              "sort",
              "Sắp xếp",
              [
                ["modified.time_desc", "Mới cập nhật"],
                ["year_desc", "Năm giảm dần"],
                ["year_asc", "Năm tăng dần"],
                ["view_desc", "Lượt xem"],
              ],
            ],
          ] as [keyof Draft, string, string[][]][]
        ).map(([key, label, options]) => (
          <div key={key}>
            <label className="film-label" htmlFor={`${prefix}-${key}`}>
              {label}
            </label>
            <select
              className="film-field"
              id={`${prefix}-${key}`}
              value={value[key]}
              onChange={(e) => update(key, e.target.value)}
              disabled={pending}
            >
              {options.map(([option, text]) => (
                <option key={option} value={option}>
                  {text}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    );
  };
  return (
    <div className="catalog-filter" aria-busy={pending}>
      <button
        type="button"
        className="catalog-filter-toggle"
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => { if (!open) setDraft(current); setOpen(!open); }}
      >
        <SlidersHorizontal size={15} />
        Bộ Lọc
        <ChevronDown size={14} style={{ transform: open ? "rotate(180deg)" : undefined }} />
      </button>
      {open && (
        <form
          id={`${id}-panel`}
          className="catalog-filter-panel"
          aria-label="Bộ lọc phim"
          onSubmit={(e) => { e.preventDefault(); navigate(draft); setOpen(false); }}
        >
          {fields()}
          <div className="catalog-filter-actions">
            <button className="film-button catalog-filter-apply" disabled={pending}>Lọc kết quả</button>
            <button
              type="button"
              className="text-link"
              disabled={pending}
              onClick={() => {
                const reset = { type: "", category: "", country: "", year: "", sort: "modified.time_desc" };
                setDraft(reset);
                navigate(reset);
              }}
            >
              Đặt lại
            </button>
            <p className="filter-pending" role="status">{pending ? "Đang cập nhật kết quả…" : ""}</p>
          </div>
        </form>
      )}
    </div>
  );
}

export default function FilterBar(props: Props) {
  return (
    <Suspense fallback={<div className="h-32 animate-pulse bg-surface" />}>
      <FilterContent {...props} />
    </Suspense>
  );
}
