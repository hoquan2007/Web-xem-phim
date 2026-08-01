import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MEDIA_LIMIT = 3;
const DEFAULT_SLUG = 'lat-mat-8-vong-tay-nang';
const USER_AGENT = 'HNQ-Film-Provider-Probe/1.0 (+manual-health-check)';

type ProviderId = 'kkphim' | 'ophim' | 'nguonc' | 'vsmov';
type EndpointKind = 'list' | 'search' | 'categories' | 'countries' | 'detail';
type JsonRecord = Record<string, unknown>;

interface CliOptions {
  timeoutMs: number;
  mediaLimit: number;
  slug?: string;
  output?: string;
}

interface SchemaResult {
  valid: boolean;
  completenessPercent: number;
  required: string[];
  present: string[];
  issues: string[];
}

interface MediaCheck {
  url: string;
  kind: 'image' | 'hls' | 'embed';
  ok: boolean;
  status?: number;
  latencyMs: number;
  contentType?: string;
  error?: string;
}

interface MediaResult {
  applicable: boolean;
  candidates: number;
  checked: number;
  available: number;
  availabilityPercent: number | null;
  samples: MediaCheck[];
}

interface EndpointResult {
  name: string;
  kind: EndpointKind;
  url: string;
  latencyMs: number;
  http: {
    ok: boolean;
    status?: number;
    contentType?: string;
  };
  schema: SchemaResult;
  media: MediaResult;
  error?: string;
}

interface ProviderResult {
  id: ProviderId;
  baseUrl: string;
  endpoints: EndpointResult[];
  summary: ReturnType<typeof summarizeEndpoints>;
}

interface EndpointDefinition {
  provider: ProviderId;
  baseUrl: string;
  name: string;
  kind: EndpointKind;
  url: string;
}

function parsePositiveInteger(value: string | undefined, flag: string, minimum = 1): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    throw new Error(`${flag} must be an integer >= ${minimum}`);
  }
  return parsed;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    timeoutMs: DEFAULT_TIMEOUT_MS,
    mediaLimit: DEFAULT_MEDIA_LIMIT,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    const value = argv[index + 1];
    if (argument === '--timeout-ms') {
      options.timeoutMs = parsePositiveInteger(value, argument, 100);
      index += 1;
    } else if (argument === '--media-limit') {
      options.mediaLimit = parsePositiveInteger(value, argument);
      index += 1;
    } else if (argument === '--slug') {
      if (!value?.trim()) throw new Error('--slug requires a non-empty value');
      options.slug = value.trim();
      index += 1;
    } else if (argument === '--output') {
      if (!value?.trim()) throw new Error('--output requires a file path');
      options.output = value.trim();
      index += 1;
    } else if (argument === '--help') {
      console.log([
        'Usage: npm run test:probe -- [options]',
        '',
        'Options:',
        '  --slug <slug>          Detail slug (default: discovered from KKPhim list)',
        '  --timeout-ms <number>  Timeout per API/media request (default: 10000)',
        '  --media-limit <number> Maximum media URLs checked per endpoint (default: 3)',
        '  --output <path>        Artifact path (default: probe-results/YYYY-MM-DD.json)',
      ].join('\n'));
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return options;
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function getPath(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!isRecord(current)) return undefined;
    return current[key];
  }, value);
}

function firstArray(value: unknown, paths: string[]): unknown[] | undefined {
  for (const path of paths) {
    const candidate = getPath(value, path);
    if (Array.isArray(candidate)) return candidate;
  }
  return undefined;
}

function schema(required: string[], checks: Array<[string, boolean]>, issues: string[] = []): SchemaResult {
  const present = checks.filter(([, ok]) => ok).map(([field]) => field);
  const missing = required.filter((field) => !present.includes(field));
  return {
    valid: missing.length === 0 && issues.length === 0,
    completenessPercent: required.length === 0 ? 100 : Math.round((present.length / required.length) * 100),
    required,
    present,
    issues: [...issues, ...missing.map((field) => `Missing or invalid: ${field}`)],
  };
}

function validateSchema(provider: ProviderId, kind: EndpointKind, payload: unknown): SchemaResult {
  if (!isRecord(payload)) {
    return schema(['object'], [['object', false]], ['Response body is not a JSON object']);
  }

  if (kind === 'list' || kind === 'search') {
    const items = firstArray(payload, ['items', 'data.items']);
    const first = items?.find(isRecord);
    return schema(
      ['items', 'item.name', 'item.slug', 'item.poster_or_thumb'],
      [
        ['items', Array.isArray(items)],
        ['item.name', Boolean(first && typeof first.name === 'string' && first.name)],
        ['item.slug', Boolean(first && typeof first.slug === 'string' && first.slug)],
        ['item.poster_or_thumb', Boolean(first && (typeof first.poster_url === 'string' || typeof first.thumb_url === 'string'))],
      ],
      items?.length === 0 ? ['Catalogue returned no items'] : [],
    );
  }

  if (kind === 'categories' || kind === 'countries') {
    const items = firstArray(payload, ['items', 'data.items']);
    const first = items?.find(isRecord);
    return schema(
      ['items', 'item.name', 'item.slug'],
      [
        ['items', Array.isArray(items)],
        ['item.name', Boolean(first && typeof first.name === 'string' && first.name)],
        ['item.slug', Boolean(first && typeof first.slug === 'string' && first.slug)],
      ],
      items?.length === 0 ? [`${kind} returned no items`] : [],
    );
  }

  if (provider === 'kkphim') {
    const movie = getPath(payload, 'movie');
    const episodes = firstArray(payload, ['episodes']);
    return validateDetail(movie, episodes, 'server_data');
  }

  if (provider === 'ophim') {
    const movie = getPath(payload, 'data.item');
    const episodes = firstArray(payload, ['data.item.episodes']);
    return validateDetail(movie, episodes, 'server_data');
  }

  if (provider === 'nguonc') {
    const movie = getPath(payload, 'movie');
    const episodes = firstArray(payload, ['movie.episodes', 'episodes']);
    return validateDetail(movie, episodes, 'items_or_server_data');
  }

  const movie = getPath(payload, 'movie');
  const episodes = firstArray(payload, ['episodes']);
  return validateDetail(movie, episodes, 'server_data');
}

function validateDetail(movie: unknown, episodes: unknown[] | undefined, episodeField: string): SchemaResult {
  const firstServer = episodes?.find(isRecord);
  const episodeItems = firstServer
    ? firstArray(firstServer, episodeField === 'items_or_server_data' ? ['items', 'server_data'] : ['server_data'])
    : undefined;
  const firstEpisode = episodeItems?.find(isRecord);
  const hasMediaLink = Boolean(firstEpisode && ['link_m3u8', 'link_embed', 'm3u8', 'embed'].some((key) => typeof firstEpisode[key] === 'string' && firstEpisode[key]));

  return schema(
    ['movie', 'movie.name_or_slug', 'episodes', 'episode_items', 'episode_media_link'],
    [
      ['movie', isRecord(movie)],
      ['movie.name_or_slug', Boolean(isRecord(movie) && (typeof movie.name === 'string' || typeof movie.slug === 'string'))],
      ['episodes', Array.isArray(episodes)],
      ['episode_items', Array.isArray(episodeItems) && episodeItems.length > 0],
      ['episode_media_link', hasMediaLink],
    ],
    episodes?.length === 0 ? ['Detail returned no episode servers'] : [],
  );
}

function normalizeMediaUrl(raw: string, provider: ProviderId, kind: MediaCheck['kind']): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith('//')) return `https:${value}`;
  try {
    return new URL(value).toString();
  } catch {
    if (kind === 'image' && provider === 'kkphim') {
      try {
        return new URL(value.replace(/^\/+/, ''), 'https://phimimg.com/').toString();
      } catch {
        return null;
      }
    }
    return null;
  }
}

function collectMedia(payload: unknown, provider: ProviderId): Array<{ url: string; kind: MediaCheck['kind'] }> {
  const candidates = new Map<string, MediaCheck['kind']>();
  const keyKinds: Record<string, MediaCheck['kind']> = {
    poster_url: 'image',
    thumb_url: 'image',
    link_m3u8: 'hls',
    m3u8: 'hls',
    link_embed: 'embed',
    embed: 'embed',
  };

  const visit = (value: unknown, depth: number): void => {
    if (depth > 8 || candidates.size >= 30) return;
    if (Array.isArray(value)) {
      for (const item of value.slice(0, 12)) visit(item, depth + 1);
      return;
    }
    if (!isRecord(value)) return;
    for (const [key, child] of Object.entries(value)) {
      const kind = keyKinds[key];
      if (kind && typeof child === 'string') {
        const url = normalizeMediaUrl(child, provider, kind);
        if (url) candidates.set(url, kind);
      } else if (typeof child === 'object') {
        visit(child, depth + 1);
      }
    }
  };

  visit(payload, 0);
  return Array.from(candidates, ([url, kind]) => ({ url, kind }));
}

function selectMediaCandidates(
  candidates: Array<{ url: string; kind: MediaCheck['kind'] }>,
  limit: number,
): Array<{ url: string; kind: MediaCheck['kind'] }> {
  const selected: Array<{ url: string; kind: MediaCheck['kind'] }> = [];
  for (const kind of ['image', 'hls', 'embed'] as const) {
    const candidate = candidates.find((item) => item.kind === kind);
    if (candidate) selected.push(candidate);
    if (selected.length === limit) return selected;
  }
  for (const candidate of candidates) {
    if (!selected.some((item) => item.url === candidate.url)) selected.push(candidate);
    if (selected.length === limit) break;
  }
  return selected;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.name === 'AbortError' || error.name === 'TimeoutError') return 'Request timed out';
    return error.message;
  }
  return String(error);
}

async function checkMedia(candidate: { url: string; kind: MediaCheck['kind'] }, timeoutMs: number): Promise<MediaCheck> {
  const startedAt = performance.now();
  try {
    const response = await fetch(candidate.url, {
      method: 'GET',
      headers: {
        'user-agent': USER_AGENT,
        range: 'bytes=0-1023',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });
    await response.body?.cancel();
    return {
      ...candidate,
      ok: response.ok,
      status: response.status,
      latencyMs: Math.round(performance.now() - startedAt),
      contentType: response.headers.get('content-type') ?? undefined,
    };
  } catch (error) {
    return {
      ...candidate,
      ok: false,
      latencyMs: Math.round(performance.now() - startedAt),
      error: errorMessage(error),
    };
  }
}

function emptyMedia(): MediaResult {
  return {
    applicable: false,
    candidates: 0,
    checked: 0,
    available: 0,
    availabilityPercent: null,
    samples: [],
  };
}

async function probeEndpoint(definition: EndpointDefinition, options: CliOptions): Promise<{ result: EndpointResult; payload: unknown }> {
  const startedAt = performance.now();
  let payload: unknown = null;
  let status: number | undefined;
  let contentType: string | undefined;

  try {
    const response = await fetch(definition.url, {
      headers: { 'user-agent': USER_AGENT, accept: 'application/json' },
      redirect: 'follow',
      signal: AbortSignal.timeout(options.timeoutMs),
      cache: 'no-store',
    });
    status = response.status;
    contentType = response.headers.get('content-type') ?? undefined;
    const text = await response.text();
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      const invalidSchema = schema(['json'], [['json', false]], ['Response body is not valid JSON']);
      return {
        payload: null,
        result: {
          name: definition.name,
          kind: definition.kind,
          url: definition.url,
          latencyMs: Math.round(performance.now() - startedAt),
          http: { ok: response.ok, status, contentType },
          schema: invalidSchema,
          media: emptyMedia(),
          error: `Invalid JSON response (${text.length} bytes)`,
        },
      };
    }

    const schemaResult = validateSchema(definition.provider, definition.kind, payload);
    const mediaCandidates = collectMedia(payload, definition.provider);
    const samples = await Promise.all(
      selectMediaCandidates(mediaCandidates, options.mediaLimit).map((candidate) =>
        checkMedia(candidate, options.timeoutMs),
      ),
    );
    const available = samples.filter((sample) => sample.ok).length;

    return {
      payload,
      result: {
        name: definition.name,
        kind: definition.kind,
        url: definition.url,
        latencyMs: Math.round(performance.now() - startedAt),
        http: { ok: response.ok, status, contentType },
        schema: schemaResult,
        media: {
          applicable: mediaCandidates.length > 0,
          candidates: mediaCandidates.length,
          checked: samples.length,
          available,
          availabilityPercent: samples.length > 0 ? Math.round((available / samples.length) * 100) : null,
          samples,
        },
        ...(!response.ok ? { error: `HTTP ${response.status}` } : {}),
      },
    };
  } catch (error) {
    return {
      payload: null,
      result: {
        name: definition.name,
        kind: definition.kind,
        url: definition.url,
        latencyMs: Math.round(performance.now() - startedAt),
        http: { ok: false, status, contentType },
        schema: schema(['response'], [['response', false]], ['No usable response received']),
        media: emptyMedia(),
        error: errorMessage(error),
      },
    };
  }
}

function discoverSlug(payload: unknown): string | undefined {
  const items = firstArray(payload, ['items', 'data.items']);
  const item = items?.find((candidate) => isRecord(candidate) && typeof candidate.slug === 'string' && candidate.slug.length > 0);
  return isRecord(item) && typeof item.slug === 'string' ? item.slug : undefined;
}

function summarizeEndpoints(endpoints: EndpointResult[]) {
  const mediaEndpoints = endpoints.filter((endpoint) => endpoint.media.applicable);
  const totalMediaChecked = mediaEndpoints.reduce((sum, endpoint) => sum + endpoint.media.checked, 0);
  const totalMediaAvailable = mediaEndpoints.reduce((sum, endpoint) => sum + endpoint.media.available, 0);
  const sortedLatencies = endpoints.map((endpoint) => endpoint.latencyMs).sort((a, b) => a - b);
  const p95Index = Math.max(0, Math.ceil(sortedLatencies.length * 0.95) - 1);

  return {
    endpointCount: endpoints.length,
    httpSuccessRatePercent: endpoints.length ? Math.round((endpoints.filter((endpoint) => endpoint.http.ok).length / endpoints.length) * 100) : 0,
    schemaValidRatePercent: endpoints.length ? Math.round((endpoints.filter((endpoint) => endpoint.schema.valid).length / endpoints.length) * 100) : 0,
    averageLatencyMs: endpoints.length ? Math.round(endpoints.reduce((sum, endpoint) => sum + endpoint.latencyMs, 0) / endpoints.length) : 0,
    p95LatencyMs: sortedLatencies[p95Index] ?? 0,
    mediaAvailabilityPercent: totalMediaChecked ? Math.round((totalMediaAvailable / totalMediaChecked) * 100) : null,
  };
}

function buildDefinitions(slug: string): EndpointDefinition[] {
  return [
    { provider: 'kkphim', baseUrl: 'https://phimapi.com', name: 'latest', kind: 'list', url: 'https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1' },
    { provider: 'kkphim', baseUrl: 'https://phimapi.com', name: 'search', kind: 'search', url: 'https://phimapi.com/v1/api/tim-kiem?keyword=hanh%20dong&page=1&limit=6' },
    { provider: 'kkphim', baseUrl: 'https://phimapi.com', name: 'categories', kind: 'categories', url: 'https://phimapi.com/v1/api/the-loai' },
    { provider: 'kkphim', baseUrl: 'https://phimapi.com', name: 'countries', kind: 'countries', url: 'https://phimapi.com/v1/api/quoc-gia' },
    { provider: 'kkphim', baseUrl: 'https://phimapi.com', name: 'detail', kind: 'detail', url: `https://phimapi.com/phim/${encodeURIComponent(slug)}` },
    { provider: 'ophim', baseUrl: 'https://ophim1.com', name: 'detail', kind: 'detail', url: `https://ophim1.com/v1/api/phim/${encodeURIComponent(slug)}` },
    { provider: 'nguonc', baseUrl: 'https://phim.nguonc.com', name: 'detail', kind: 'detail', url: `https://phim.nguonc.com/api/film/${encodeURIComponent(slug)}` },
    { provider: 'vsmov', baseUrl: 'https://vsmov.com/api', name: 'detail', kind: 'detail', url: `https://vsmov.com/api/phim/${encodeURIComponent(slug)}` },
  ];
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const generatedAt = new Date();
  const initialDefinition: EndpointDefinition = {
    provider: 'kkphim',
    baseUrl: 'https://phimapi.com',
    name: 'latest',
    kind: 'list',
    url: 'https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1',
  };

  console.log(`Probing providers (timeout=${options.timeoutMs}ms, media-limit=${options.mediaLimit})...`);
  const initial = await probeEndpoint(initialDefinition, options);
  const slug = options.slug ?? discoverSlug(initial.payload) ?? DEFAULT_SLUG;
  console.log(`Detail slug: ${slug}${options.slug ? ' (CLI)' : ' (auto-discovered/fallback)'}`);

  const definitions = buildDefinitions(slug);
  const remaining = definitions.filter((definition) => !(definition.provider === 'kkphim' && definition.name === 'latest'));
  const endpointResults = [initial.result, ...(await Promise.all(remaining.map((definition) => probeEndpoint(definition, options)))).map(({ result }) => result)];

  const providerOrder: ProviderId[] = ['kkphim', 'ophim', 'nguonc', 'vsmov'];
  const providers: ProviderResult[] = providerOrder.map((id) => {
    const providerDefinitions = definitions.filter((definition) => definition.provider === id);
    const endpoints = endpointResults.filter((endpoint) => providerDefinitions.some((definition) => definition.name === endpoint.name && definition.url === endpoint.url));
    return {
      id,
      baseUrl: providerDefinitions[0]?.baseUrl ?? '',
      endpoints,
      summary: summarizeEndpoints(endpoints),
    };
  });

  const artifact = {
    version: 1,
    generatedAt: generatedAt.toISOString(),
    mode: 'manual-live-probe',
    config: {
      timeoutMs: options.timeoutMs,
      mediaLimitPerEndpoint: options.mediaLimit,
      detailSlug: slug,
    },
    summary: summarizeEndpoints(endpointResults),
    providers,
  };

  const defaultDate = generatedAt.toISOString().slice(0, 10);
  const outputPath = resolve(options.output ?? `probe-results/${defaultDate}.json`);
  await mkdir(resolve(outputPath, '..'), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');

  for (const provider of providers) {
    const summary = provider.summary;
    console.log(
      `${provider.id.padEnd(8)} HTTP ${String(summary.httpSuccessRatePercent).padStart(3)}% | schema ${String(summary.schemaValidRatePercent).padStart(3)}% | avg ${String(summary.averageLatencyMs).padStart(5)}ms | media ${summary.mediaAvailabilityPercent ?? 'n/a'}%`,
    );
  }
  console.log(`Artifact: ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(`Probe failed: ${errorMessage(error)}`);
  process.exitCode = 1;
});
