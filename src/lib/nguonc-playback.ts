import type { EpisodeServer } from '@/types/movie';

// These embed origins returned 403 / SAMEORIGIN in browser verification.
// Keep catalogue metadata, but require explicit operator opt-in for frames.
export function usableNguoncServers(servers: EpisodeServer[]): EpisodeServer[] {
  if (process.env.API_ENABLE_NGUONC_EMBEDS === '1') return servers;
  return servers.flatMap(server => {
    const server_data = server.server_data.flatMap(episode => {
      try {
        if (!new URL(episode.link_embed).hostname.endsWith('.streamc.xyz')) return [episode];
      } catch {
        // HLS-only episodes have no embed URL.
      }
      return episode.link_m3u8 ? [{ ...episode, link_embed: '' }] : [];
    });
    return server_data.length ? [{ ...server, server_data }] : [];
  });
}
