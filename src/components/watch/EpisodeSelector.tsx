"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Search, Play, ListVideo } from "lucide-react";
import { episodeLabel } from "@/lib/movie-presentation";
import { EpisodeServer } from "@/types/movie";
import { FilterSelect } from "@/components/filter/FilterSelect";
import "@/components/filter/catalog.css";

interface EpisodeSelectorProps {
  servers: EpisodeServer[];
  activeServerIndex: number;
  activeEpisodeIndex: number;
  onSelectServer: (index: number) => void;
  onSelectEpisode: (index: number) => void;
}

function languageLabel(name: string) {
  if (/thuyết\s*minh/i.test(name)) return "Thuyết minh";
  if (/lồng\s*tiếng/i.test(name)) return "Lồng tiếng";
  if (/vietsub|phụ\s*đề/i.test(name)) return "Vietsub";
  return name.replace(/^Server(?:\s+VIP)?\s*\([^()]*?\s-\s*/i, "").replace(/\)$/, "").trim();
}

export function EpisodeSelector({ servers, activeServerIndex, activeEpisodeIndex, onSelectServer, onSelectEpisode }: EpisodeSelectorProps) {
  const list = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const groupSize = 50;
  const [rangeIndex, setRangeIndex] = useState(() => Math.floor(activeEpisodeIndex / groupSize));
  const currentServer = servers[activeServerIndex] || servers[0];
  const episodes = currentServer?.server_data || [];
  const totalGroups = Math.ceil(episodes.length / groupSize);
  const selectedRange = Math.min(rangeIndex, Math.max(0, totalGroups - 1));
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const entries = episodes.map((episode, index) => ({ episode, index }));
  const displayed = searchTerm.trim()
    ? entries.filter(({ episode }) => normalize(episodeLabel(episode.name)).includes(normalize(searchTerm.trim())))
    : entries.slice(selectedRange * groupSize, (selectedRange + 1) * groupSize);
  const options = servers.map((server, index) => {
    const raw = server.server_name || "Nguồn " + (index + 1);
    const language = languageLabel(raw);
    const repeated = servers.filter((item) => languageLabel(item.server_name) === language).length > 1;
    const provider = raw.match(/kkphim|ophim|nguonc/i)?.[0];
    const base = repeated ? language + " · " + (provider || "Nguồn " + (index + 1)) : language;
    const same = servers.map((item, position) => ({ position, language: languageLabel(item.server_name), provider: item.server_name.match(/kkphim|ophim|nguonc/i)?.[0]?.toLowerCase() }))
      .filter(item => item.language === language && provider && item.provider === provider.toLowerCase());
    return { value: String(index), title: raw, label: base + (same.length > 1 ? " · " + (same.findIndex(item => item.position === index) + 1) : "") };
  });
  useLayoutEffect(() => {
    const container = list.current;
    const selected = container?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!container || !selected) return;
    const top = selected.offsetTop;
    if (top < container.scrollTop) container.scrollTop = top;
    else if (top + selected.offsetHeight > container.scrollTop + container.clientHeight)
      container.scrollTop = top + selected.offsetHeight - container.clientHeight;
  }, [activeEpisodeIndex, rangeIndex, searchTerm]);

  return <section className="watch-episode-section" aria-labelledby="watch-episodes-heading">
    <div className="watch-episodes-heading">
      <h2 id="watch-episodes-heading" tabIndex={-1}><ListVideo size={20} />Danh sách tập<span>{episodes.length} tập</span></h2>
      {servers.length > 1 ? <div className="watch-source-choice" title={currentServer?.server_name}>
        <FilterSelect id="watch-source" label="Nguồn phát" value={String(activeServerIndex)} options={options}
          onChange={(value) => onSelectServer(Number(value))} searchable={servers.length > 6} />
      </div> : currentServer && <span className="watch-single-source" title={currentServer.server_name}>{options[0]?.label}</span>}
    </div>
    {(totalGroups > 1 || episodes.length > 20) && <div className="watch-episode-filters">
      {totalGroups > 1 && <div className="watch-ranges" aria-label="Nhóm tập">
        {Array.from({ length: totalGroups }, (_, index) => <button type="button" key={index} aria-pressed={selectedRange === index && !searchTerm.trim()} onClick={() => { setRangeIndex(index); setSearchTerm(""); }}>
          {index * groupSize + 1}–{Math.min((index + 1) * groupSize, episodes.length)}
        </button>)}
      </div>}
      {episodes.length > 20 && <label className="watch-episode-search"><Search size={16} /><input className="film-field" type="search" aria-label="Tìm tập phim" placeholder="Tìm tập…" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label>}
    </div>}
    <div className="watch-episode-list" ref={list}>
      {!displayed.length ? <p className="watch-episode-empty">{!episodes.length ? "Nguồn này chưa có tập phim. Vui lòng chọn nguồn khác hoặc quay lại sau." : "Không tìm thấy tập phù hợp."}</p>
        : <div className="episode-grid">
          {displayed.map(({ episode, index }) => <button type="button" key={index} aria-pressed={index === activeEpisodeIndex} aria-current={index === activeEpisodeIndex ? "true" : undefined} title={episodeLabel(episode.name)} onClick={() => onSelectEpisode(index)}>
            {index === activeEpisodeIndex && <Play size={12} fill="currentColor" />}<span>{episodeLabel(episode.name)}</span>
          </button>)}
        </div>}
    </div>
  </section>;
}
