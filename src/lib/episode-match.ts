import type { EpisodeItem, EpisodeServer } from '@/types/movie';

export function episodeIdentity(name: string): string {
  const value = name.toLocaleLowerCase('vi').trim().replace(/^tập\s*/i, '').trim();
  if (/^(full|hoàn tất|trọn bộ)$/.test(value)) return 'full';
  return value.replace(/^0+(?=\d)/, '');
}

export function matchingEpisode(episode: EpisodeItem, server: EpisodeServer): number {
  const identity = episodeIdentity(episode.name);
  if (!identity) return -1;
  return server.server_data.findIndex(candidate =>
    episodeIdentity(candidate.name) === identity && Boolean(candidate.link_embed || candidate.link_m3u8));
}

/** Preserve native URL indexes, including gaps in replacement coverage. */
export function alignEpisodeServers(native: EpisodeItem[], servers: EpisodeServer[]): EpisodeServer[] {
  if (!native.length) return servers;
  const templateKeys = new Set(native.map(episode => episodeIdentity(episode.name)));
  const sources = servers.length ? servers : [{ server_name: 'Nguồn phát tạm gián đoạn', server_data: [] }];
  const seen = new Set<string>();
  return sources.map(server => ({
    ...server,
    server_data: [
      ...native.map(episode => {
        const index = matchingEpisode(episode, server);
        const replacement = server.server_data[index];
        return { ...episode, link_embed: replacement?.link_embed ?? '', link_m3u8: replacement?.link_m3u8 ?? '' };
      }),
      ...server.server_data.filter(episode => !templateKeys.has(episodeIdentity(episode.name))),
    ],
  })).filter(server => {
    const key = JSON.stringify(server.server_data.map(episode => [episodeIdentity(episode.name), episode.link_m3u8 || episode.link_embed]));
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function isPlayableEpisode(episode?: EpisodeItem): boolean {
  return Boolean(episode?.link_embed || episode?.link_m3u8);
}
