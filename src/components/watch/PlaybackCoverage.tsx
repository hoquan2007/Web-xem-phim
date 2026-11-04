import type { EpisodeServer } from '@/types/movie';
import { episodeIdentity, isPlayableEpisode } from '@/lib/episode-match';

export function PlaybackCoverage({ servers }: { servers: EpisodeServer[] }) {
  const episodes = new Map<string, boolean>();
  for (const server of servers) {
    for (const episode of server.server_data) {
      const key = episodeIdentity(episode.name);
      episodes.set(key, Boolean(episodes.get(key)) || isPlayableEpisode(episode));
    }
  }
  if (!episodes.size) return null;
  const available = [...episodes.values()].filter(Boolean).length;
  return <p role="status" aria-label="Tình trạng nguồn phát" className="notice my-3">
    {available}/{episodes.size} tập có nguồn phát{available < episodes.size && ` · ${episodes.size - available} tập đang chờ nguồn thay thế`}.
  </p>;
}
