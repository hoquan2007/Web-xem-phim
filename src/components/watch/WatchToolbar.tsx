"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Ellipsis, ListVideo, Moon, Sun, RefreshCw, Tv, Flag } from "lucide-react";
import { episodeLabel } from "@/lib/movie-presentation";

type Props = {
  episodeName?: string;
  episodeIndex: number;
  episodeCount: number;
  onEpisodeChange: (index: number) => void;
  isLightOff: boolean;
  onToggleLightOff: () => void;
  onChooseSource: () => void;
  onReload: () => void;
  onSwitchPlayer?: () => void;
  playerMode: "hls" | "iframe";
  onReportError?: () => void;
};

/** Hallmark · component: watch-toolbar · theme: design.md · P5 H5 E4 S5 R5 V4 */
export function WatchToolbar(props: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const id = useId();
  const close = (restore = true) => {
    setOpen(false);
    if (restore) trigger.current?.focus({ preventScroll: true });
  };
  const run = (action: () => void) => { close(); action(); };

  useLayoutEffect(() => {
    const panel = popup.current;
    if (!open || !panel || !trigger.current) return;
    const position = () => {
      const rect = trigger.current!.getBoundingClientRect();
      const viewport = window.visualViewport;
      const left = viewport?.offsetLeft ?? 0;
      const top = viewport?.offsetTop ?? 0;
      const width = viewport?.width ?? window.innerWidth;
      const bottom = top + (viewport?.height ?? window.innerHeight);
      const panelWidth = Math.min(304, width - 24);
      panel.style.width = `${panelWidth}px`;
      panel.style.left = `${Math.max(left + 12, Math.min(rect.right - panelWidth, left + width - panelWidth - 12))}px`;
      const above = bottom - rect.bottom < 260 && rect.top - top > bottom - rect.bottom;
      panel.style.top = above ? "auto" : `${rect.bottom + 8}px`;
      panel.style.bottom = above ? `${window.innerHeight - rect.top + 8}px` : "auto";
      panel.style.maxHeight = `${Math.max(100, (above ? rect.top - top : bottom - rect.bottom) - 20)}px`;
    };
    position();
    if (typeof panel.showPopover === "function") panel.showPopover();
    else panel.classList.add("watch-options-fallback");
    panel.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
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
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent | FocusEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
    };
  }, [open]);

  return <div className="watch-toolbar" aria-label="Điều khiển xem phim" role="group">
    <div className="watch-episode-nav">
      <button type="button" aria-label="Tập trước" disabled={props.episodeIndex <= 0 || !props.episodeCount} onClick={() => props.onEpisodeChange(props.episodeIndex - 1)} className="watch-tool-button">
        <ChevronLeft size={18} /><span>Trước</span>
      </button>
      <span className="watch-episode-position" aria-live="polite">
        <strong>{props.episodeCount === 1 ? "Bản đầy đủ" : props.episodeCount ? episodeLabel(props.episodeName) : "Chưa có tập"}</strong>
        {props.episodeCount > 1 && <span>· {props.episodeCount} tập</span>}
      </span>
      <button type="button" aria-label="Tập tiếp" disabled={!props.episodeCount || props.episodeIndex >= props.episodeCount - 1} onClick={() => props.onEpisodeChange(props.episodeIndex + 1)} className="watch-tool-button watch-next">
        <span>Tiếp</span><ChevronRight size={18} />
      </button>
    </div>
    <div className="watch-utilities">
      <button type="button" className="watch-tool-button" onClick={props.onChooseSource}><ListVideo size={18} /><span>Chọn tập</span></button>
      <button data-watch-reload type="button" className="watch-tool-button" onClick={props.onReload}><RefreshCw size={18} /><span>Tải lại</span></button>
      <div ref={root} className="watch-options">
        <button ref={trigger} data-watch-options type="button" className="watch-tool-button" aria-label="Tùy chọn xem phim" aria-haspopup="menu" aria-expanded={open} aria-controls={id} onClick={() => open ? close() : setOpen(true)} onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setOpen(true); }
        }}><Ellipsis size={20} /></button>
        {open && <div ref={popup} id={id} popover="manual" className="watch-options-panel" role="menu" aria-label="Tùy chọn xem phim" onKeyDown={(event) => {
          const buttons = [...event.currentTarget.querySelectorAll<HTMLButtonElement>("button")];
          const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
          if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
          else if (event.key === "Tab") { close(); }
          else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
            buttons[next]?.focus();
          }
        }}>
          <button type="button" role="menuitem" tabIndex={-1} onClick={() => run(props.onToggleLightOff)}>{props.isLightOff ? <Sun size={18} /> : <Moon size={18} />}<span>{props.isLightOff ? "Bật đèn" : "Tắt đèn"}</span></button>
          {props.onSwitchPlayer && <button type="button" role="menuitem" tabIndex={-1} onClick={() => run(props.onSwitchPlayer!)}><Tv size={18} /><span>Đổi trình phát<small>{props.playerMode === "hls" ? "Dùng trình phát dự phòng" : "Dùng trình phát chính"}</small></span></button>}
          {props.onReportError && <button type="button" role="menuitem" tabIndex={-1} onClick={() => run(props.onReportError!)}><Flag size={18} /><span>Tạo báo cáo sự cố<small>Tải file báo cáo về máy</small></span></button>}
        </div>}
      </div>
    </div>
  </div>;
}
