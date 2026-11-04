// Origins observed in provider responses; keep permissions and CSP in sync.
export const PLAYER_FRAME_ORIGINS = [
  'https://player.phimapi.com',
  'https://embed1.streamc.xyz',
  'https://embed15.streamc.xyz',
  'https://embed18.streamc.xyz',
  'https://embed2.streamc.xyz',
  'https://embed13.streamc.xyz',
] as const;

export const playerPermission = (feature: string) =>
  `${feature}=(self ${PLAYER_FRAME_ORIGINS.map(origin => `"${origin}"`).join(' ')})`;
