"use client";

import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export type FilterOption = { value: string; label: string; title?: string };
type Props = { id: string; label: string; value: string; options: FilterOption[]; onChange: (value: string) => void; disabled?: boolean; searchable?: boolean };
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLocaleLowerCase("vi");

/** Hallmark · component-scope · design-system: design.md · P5 H4 E4 S5 R5 V4 */
export function FilterSelect({ id, label, value, options, onChange, disabled, searchable }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const typeahead = useRef({ text: "", time: 0 });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const filtered = options.filter((option) => normalize(option.label).includes(normalize(query)));
  const selected = options.find((option) => option.value === value) ?? options[0];
  const close = (restore = true) => { setOpen(false); if (restore) trigger.current?.focus({ preventScroll: true }); };
  const show = (last = false) => {
    setQuery("");
    const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
    setActive(last ? options.length - 1 : selectedIndex);
    setOpen(true);
  };
  const choose = (option: FilterOption) => { onChange(option.value); close(); };

  useLayoutEffect(() => {
    const panel = popup.current;
    if (!open || !panel || !trigger.current) return;
    const position = () => {
      const rect = trigger.current!.getBoundingClientRect();
      const viewport = window.visualViewport;
      const leftEdge = viewport?.offsetLeft ?? 0;
      const topEdge = viewport?.offsetTop ?? 0;
      const width = viewport?.width ?? window.innerWidth;
      const bottom = topEdge + (viewport?.height ?? window.innerHeight);
      const below = bottom - rect.bottom - 16;
      const above = rect.top - topEdge - 16;
      const upward = below < 220 && above > below;
      const height = Math.min(344, Math.max(100, upward ? above : below));
      const panelWidth = Math.min(Math.max(rect.width, 240), width - 24);
      panel.style.width = `${panelWidth}px`;
      panel.style.left = `${Math.max(leftEdge + 12, Math.min(rect.left, leftEdge + width - panelWidth - 12))}px`;
      panel.style.top = upward ? "auto" : `${rect.bottom + 6}px`;
      panel.style.bottom = upward ? `${window.innerHeight - rect.top + 6}px` : "auto";
      panel.style.maxHeight = `${height}px`;
    };
    position();
    if (typeof panel.showPopover === "function") panel.showPopover();
    else panel.classList.add("filter-select-fallback");
    (searchable ? search.current : list.current)?.focus({ preventScroll: true });
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    window.visualViewport?.addEventListener("resize", position);
    window.visualViewport?.addEventListener("scroll", position);
    return () => {
      if (panel.matches(":popover-open")) panel.hidePopover();
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
      window.visualViewport?.removeEventListener("resize", position);
      window.visualViewport?.removeEventListener("scroll", position);
    };
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const blur = (event: FocusEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", blur);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("focusin", blur); };
  }, [open]);

  useLayoutEffect(() => {
    const container = list.current;
    const option = container?.children[active] as HTMLElement | undefined;
    if (!container || !option) return;
    const top = option.offsetTop;
    if (top < container.scrollTop) container.scrollTop = top;
    else if (top + option.offsetHeight > container.scrollTop + container.clientHeight)
      container.scrollTop = top + option.offsetHeight - container.clientHeight;
  }, [active, open, query]);

  const keyboard = (event: KeyboardEvent) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
    else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      if (searchable && (event.key === "Home" || event.key === "End")) return;
      event.preventDefault();
      const last = Math.max(0, filtered.length - 1);
      setActive(event.key === "Home" ? 0 : event.key === "End" ? last : event.key === "ArrowDown" ? Math.min(active + 1, last) : Math.max(active - 1, 0));
    } else if (event.key === "Enter" || (!searchable && event.key === " ")) {
      event.preventDefault(); if (filtered[active]) choose(filtered[active]);
    } else if (!searchable && event.key.length === 1 && !event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault();
      const now = event.timeStamp;
      typeahead.current = { text: (now - typeahead.current.time > 600 ? "" : typeahead.current.text) + event.key, time: now };
      const index = filtered.findIndex((option) => normalize(option.label).startsWith(normalize(typeahead.current.text)));
      if (index >= 0) setActive(index);
    }
  };

  return <div className="filter-choice" ref={root}>
    <label className="film-label" id={`${id}-label`} htmlFor={id}>{label}</label>
    <button ref={trigger} id={id} className="filter-select-trigger" type="button" disabled={disabled}
      role="combobox" aria-labelledby={`${id}-label ${id}-value`} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`}
      onClick={() => open ? close() : show()}
      onKeyDown={(event) => { if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); show(event.key === "ArrowUp"); } }}>
      <span id={`${id}-value`}>{selected?.label ?? "Tất cả"}</span><ChevronDown size={16} aria-hidden="true" />
    </button>
    {open && <div ref={popup} className="filter-select-popover" popover="manual" onKeyDown={keyboard}>
      {searchable && <div className="filter-select-search"><Search size={16} aria-hidden="true" /><input ref={search} className="film-field" role="combobox" aria-label={`Tìm ${label.toLocaleLowerCase("vi")}`} aria-expanded="true" aria-controls={`${id}-list`} aria-autocomplete="list" aria-activedescendant={filtered[active] ? `${id}-option-${active}` : undefined} value={query} placeholder={`Tìm ${label.toLocaleLowerCase("vi")}…`} autoComplete="off" onChange={(event) => { setQuery(event.target.value); setActive(0); }} /></div>}
      <div ref={list} className="filter-select-options" id={`${id}-list`} role="listbox" aria-label={label} tabIndex={searchable ? -1 : 0} aria-activedescendant={filtered[active] ? `${id}-option-${active}` : undefined}>
        {filtered.map((option, index) => <div id={`${id}-option-${index}`} key={option.value} role="option" title={option.title ?? option.label} aria-selected={option.value === value} data-active={index === active || undefined} className="filter-select-option" onPointerDown={(event) => event.preventDefault()} onClick={() => choose(option)}>
          <span>{option.label}</span>{option.value === value && <Check size={16} aria-hidden="true" />}
        </div>)}
      </div>
      {!filtered.length && <p className="filter-select-empty" role="status">Không có lựa chọn phù hợp.</p>}
    </div>}
  </div>;
}
