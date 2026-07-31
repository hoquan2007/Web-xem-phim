import { cache } from 'react';
import {
  MovieListResponse,
  CategoryItem,
  CountryItem,
  MovieDetailResponse,
  EpisodeServer,
  EpisodeItem,
  FilterParams,
  MovieListItem,
} from '@/types/movie';

const API_KKPHIM_URL = 'https://phimapi.com';
const API_CDN_IMAGE = 'https://phimimg.com';

/**
 * Image URL helper: converts relative API image paths to full CDN URLs
 */
export function getImageUrl(url: unknown, fallback: string = '/images/placeholder.svg'): string {
  if (typeof url !== 'string') return fallback;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_CDN_IMAGE}/${url.startsWith('/') ? url.slice(1) : url}`;
}

/**
 * Embed URL helper: Chuẩn hoá link embed thành absolute URL.
 * Một số provider (Ophim/NguonC) thỉnh thoảng trả về path tương đối (vd `/embed/...`)
 * hoặc protocol-relative (//example.com/...). Nếu để relative, iframe sẽ load
 * trên domain của HNQ Film chứ không phải domain gốc → 404 hoặc trang trắng.
 * - Trim whitespace
 * - Nếu đã có http/https → trả về nguyên
 * - Nếu protocol-relative `//...` → thêm `https:`
 * - Nếu relative path `/...` hoặc `path` → KHÔNG thể xác định origin → trả về
 *   chuỗi rỗng để caller fallback sang HLS.
 */
export function normalizeEmbedUrl(url: unknown): string {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  // Relative path (vd '/embed/abc' hoặc 'embed/abc') → không có origin info
  // trả về chuỗi rỗng để caller fallback sang HLS thay vì iframe trắng.
  return '';
}

/**
 * M3U8 URL helper: tương tự normalizeEmbedUrl nhưng giữ nguyên relative path
 * vì một số provider cố tình dùng relative để CDN tự chọn domain.
 * Nếu relative mà không có origin hint → trả về chuỗi rỗng.
 */
export function normalizeM3u8Url(url: unknown): string {
  if (typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  return '';
}

/**
 * Read a string from an unknown object field with optional fallback.
 */
function readString(value: unknown, fallback: string = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

/**
 * Normalize raw movie items from KKPhim API into standard MovieListItem
 */
export function normalizeMovieItem(item: unknown): MovieListItem {
  if (!item || typeof item !== 'object') return {} as MovieListItem;
  const raw = item as Record<string, unknown>;
  return {
    _id: readString(raw._id) || readString(raw.id),
    name: readString(raw.name),
    origin_name: readString(raw.origin_name, readString(raw.name)),
    slug: readString(raw.slug),
    poster_url: getImageUrl(raw.poster_url),
    thumb_url: getImageUrl(raw.thumb_url || raw.poster_url),
    year: readNumber(raw.year, 2024) || 2024,
    content: readString(raw.content),
    episode_current: readString(raw.episode_current),
    quality: readString(raw.quality, 'HD'),
    lang: readString(raw.lang, 'Vietsub'),
    type: readString(raw.type, 'single'),
    modified: raw.modified as MovieListItem['modified'],
    tmdb: raw.tmdb as MovieListItem['tmdb'],
    imdb: raw.imdb as MovieListItem['imdb'],
  };
}

/**
 * Fetch latest updated movies from KKPhim API
 */
export async function getLatestMovies(page: number = 1): Promise<MovieListResponse> {
  try {
    const res = await fetch(`${API_KKPHIM_URL}/danh-sach/phim-moi-cap-nhat?page=${page}`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    const items = (data.items || []).map(normalizeMovieItem);
    return {
      status: true,
      items,
      pagination: data.pagination || {
        totalItems: items.length,
        totalItemsPerPage: 24,
        currentPage: page,
        totalPages: 1,
      },
    };
  } catch (error) {
    console.error('Error fetching latest movies from KKPhim:', error);
    return {
      status: false,
      items: [],
      pagination: { totalItems: 0, totalItemsPerPage: 24, currentPage: 1, totalPages: 1 },
    };
  }
}

/**
 * Filter movies using dynamic parameters (category, country, type, keyword, page, limit)
 */
export async function getFilteredMovies(params: FilterParams): Promise<MovieListResponse> {
  try {
    const page = Number(params.page || 1);
    const limit = Number(params.limit || 24);
    const query = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    const addOptionalParam = (key: string, value: string | number | undefined) => {
      if (value !== undefined && String(value).trim()) query.set(key, String(value));
    };

    addOptionalParam('year', params.year);
    addOptionalParam('sort_field', params.sort_field);
    addOptionalParam('sort_type', params.sort_type);

    let pathname: string;
    let isPrivateSearch = false;

    if (params.keyword?.trim()) {
      pathname = '/v1/api/tim-kiem';
      query.set('keyword', params.keyword.trim());
      isPrivateSearch = true;
    } else if (params.category) {
      pathname = `/v1/api/the-loai/${encodeURIComponent(params.category)}`;
      addOptionalParam('country', params.country);
      addOptionalParam('type', params.type);
    } else if (params.country) {
      pathname = `/v1/api/quoc-gia/${encodeURIComponent(params.country)}`;
      addOptionalParam('category', params.category);
      addOptionalParam('type', params.type);
    } else if (params.type) {
      const typeMap: Record<string, string> = {
        series: 'phim-bo',
        single: 'phim-le',
        hoathinh: 'hoat-hinh',
        tvshows: 'tv-shows',
      };
      pathname = `/v1/api/danh-sach/${typeMap[params.type] || encodeURIComponent(params.type)}`;
    } else {
      pathname = '/danh-sach/phim-moi-cap-nhat';
    }

    const url = `${API_KKPHIM_URL}${pathname}?${query.toString()}`;
    const res = await fetch(
      url,
      isPrivateSearch ? { cache: 'no-store' } : { next: { revalidate: 300 } }
    );
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();

    let rawItems: unknown[] = [];
    let pagination = { totalItems: 0, totalItemsPerPage: limit, currentPage: page, totalPages: 1 };

    if (data.data?.items) {
      rawItems = data.data.items;
      if (data.data?.params?.pagination) {
        pagination = {
          totalItems: Number(data.data.params.pagination.totalItems) || rawItems.length,
          totalItemsPerPage: Number(data.data.params.pagination.totalItemsPerPage) || limit,
          currentPage: Number(data.data.params.pagination.currentPage) || page,
          totalPages: Number(data.data.params.pagination.totalPages) || 1,
        };
      }
    } else if (data.items) {
      rawItems = data.items;
      if (data.pagination) {
        pagination = {
          totalItems: Number(data.pagination.totalItems) || rawItems.length,
          totalItemsPerPage: Number(data.pagination.totalItemsPerPage) || limit,
          currentPage: Number(data.pagination.currentPage) || page,
          totalPages: Number(data.pagination.totalPages) || 1,
        };
      }
    }

    const items = (rawItems as unknown[]).map(normalizeMovieItem);
    return {
      status: true,
      items,
      pagination,
    };
  } catch (error) {
    console.error('Error filtering movies from KKPhim:', error);
    const page = Number(params.page || 1);
    const limit = Number(params.limit || 24);
    return {
      status: false,
      items: [],
      pagination: { totalItems: 0, totalItemsPerPage: limit, currentPage: page, totalPages: 1 },
    };
  }
}

/**
 * Fetch list of all genres from KKPhim
 */
export const getCategories = cache(async function getCategories(): Promise<CategoryItem[]> {
  try {
    const res = await fetch(`${API_KKPHIM_URL}/v1/api/the-loai`, {
      next: { revalidate: 3600 }, // Cache 1 hour
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.data?.items || [];
  } catch (error) {
    console.error('Error fetching categories from KKPhim:', error);
    return [];
  }
});

/**
 * Fetch list of all countries from KKPhim
 */
export const getCountries = cache(async function getCountries(): Promise<CountryItem[]> {
  try {
    const res = await fetch(`${API_KKPHIM_URL}/v1/api/quoc-gia`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.data?.items || [];
  } catch (error) {
    console.error('Error fetching countries from KKPhim:', error);
    return [];
  }
});

/**
 * Fetch movies by category slug from KKPhim
 */
export async function getMoviesByCategory(slug: string, page: number = 1): Promise<MovieListResponse> {
  return getFilteredMovies({ category: slug, page, limit: 24 });
}

/**
 * Fetch movies by country slug from KKPhim
 */
export async function getMoviesByCountry(slug: string, page: number = 1): Promise<MovieListResponse> {
  return getFilteredMovies({ country: slug, page, limit: 24 });
}

/**
 * Search movies by keyword from KKPhim
 */
export async function searchMovies(keyword: string, page: number = 1, limit: number = 24): Promise<MovieListResponse> {
  if (!keyword.trim()) {
    // FIX-9.1a.5: trả status:false để UI phân biệt "chưa nhập từ khóa" với
    // "đã tìm kiếm nhưng không có kết quả". Trước fix, status:true + items:[]
    // khiến trang kết quả render skeleton giả trước khi user gõ.
    return {
      status: false,
      msg: 'Vui lòng nhập từ khóa để tìm kiếm',
      items: [],
      pagination: { totalItems: 0, totalItemsPerPage: limit, currentPage: 1, totalPages: 1 },
    };
  }
  return getFilteredMovies({ keyword, page, limit });
}

/**
 * Multi-Provider Fetchers for KKPhim, Ophim, NguonC & International Servers
 */
interface KKPhimEpisodeServerRaw {
  server_name?: string;
  server_data?: Array<{
    name?: string;
    slug?: string;
    filename?: string;
    link_embed?: string;
    link_m3u8?: string;
  }>;
}

interface KKPhimMovieRaw {
  poster_url?: string;
  thumb_url?: string;
  [key: string]: unknown;
}

interface KKPhimDetailResponse {
  status?: boolean;
  movie?: KKPhimMovieRaw;
  episodes?: KKPhimEpisodeServerRaw[];
}

interface OphimEpisodeItemRaw {
  name?: string;
  slug?: string;
  filename?: string;
  link_embed?: string;
  link_m3u8?: string;
}

interface OphimEpisodeServerRaw {
  server_name?: string;
  server_data?: OphimEpisodeItemRaw[];
}

interface OphimDetailResponse {
  data?: {
    item?: {
      episodes?: OphimEpisodeServerRaw[];
    };
  };
}

interface NguonCEpisodeItemRaw {
  name?: string;
  slug?: string;
  embed?: string;
  link_embed?: string;
  m3u8?: string;
  link_m3u8?: string;
}

interface NguonCEpisodeServerRaw {
  server_name?: string;
  items?: NguonCEpisodeItemRaw[];
  server_data?: NguonCEpisodeItemRaw[];
}

interface NguonCDetailResponse {
  movie?: { episodes?: NguonCEpisodeServerRaw[] };
  episodes?: NguonCEpisodeServerRaw[];
}

interface VsmovEpisodeServerRaw {
  server_name: string;
  server_data?: EpisodeItem[];
}

interface VsmovDetailResponse {
  movie?: MovieDetailResponse['movie'];
  episodes?: VsmovEpisodeServerRaw[];
}

async function fetchKKPhimDetail(
  slug: string
): Promise<{ movie: MovieDetailResponse['movie']; servers: EpisodeServer[] } | null> {
  try {
    const res = await fetch(`${API_KKPHIM_URL}/phim/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = (await res.json()) as KKPhimDetailResponse;
    if (!data.status || !data.movie) return null;

    const movie = {
      ...data.movie,
      poster_url: getImageUrl(data.movie.poster_url),
      thumb_url: getImageUrl(data.movie.thumb_url || data.movie.poster_url),
    } as MovieDetailResponse['movie'];

    const servers: EpisodeServer[] = (data.episodes || []).map((srv) => ({
      server_name: `Server VIP 1 (KKPhim - ${srv.server_name || 'HLS Direct'})`,
      server_type: 'hls',
      server_data: (srv.server_data || []).map((ep) => ({
        name: readString(ep.name),
        slug: readString(ep.slug, readString(ep.name)),
        filename: ep.filename,
        link_embed: normalizeEmbedUrl(ep.link_embed),
        link_m3u8: normalizeM3u8Url(ep.link_m3u8 || ''),
      })),
    }));

    return { movie, servers };
  } catch {
    return null;
  }
}

async function fetchOphimDetail(slug: string): Promise<EpisodeServer[] | null> {
  try {
    const res = await fetch(`https://ophim1.com/v1/api/phim/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = (await res.json()) as OphimDetailResponse;
    const item = data.data?.item;
    if (!item || !item.episodes?.length) return null;
    return item.episodes.map((srv) => ({
      server_name: `Server VIP 2 (Ophim - ${srv.server_name || 'HLS'})`,
      server_type: 'hls',
      server_data: (srv.server_data || []).map((ep) => ({
        name: readString(ep.name),
        slug: readString(ep.slug, readString(ep.name)),
        filename: ep.filename,
        link_embed: normalizeEmbedUrl(ep.link_embed),
        link_m3u8: normalizeM3u8Url(ep.link_m3u8 || ''),
      })),
    }));
  } catch {
    return null;
  }
}

async function fetchNguonCDetail(slug: string): Promise<EpisodeServer[] | null> {
  try {
    const res = await fetch(`https://phim.nguonc.com/api/film/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = (await res.json()) as NguonCDetailResponse;
    const eps = data.movie?.episodes || data.episodes;
    if (!eps?.length) return null;
    return eps.map((srv) => ({
      server_name: `Server VIP 3 (NguonC - ${srv.server_name || 'Embed'})`,
      server_type: 'embed',
      server_data: (srv.items || srv.server_data || []).map((ep) => ({
        name: readString(ep.name),
        slug: readString(ep.slug, readString(ep.name)),
        link_embed: normalizeEmbedUrl(ep.embed || ep.link_embed),
        link_m3u8: normalizeM3u8Url(ep.m3u8 || ep.link_m3u8 || ''),
      })),
    }));
  } catch {
    return null;
  }
}

function generateInternationalServers(movie: MovieDetailResponse['movie']): EpisodeServer[] {
  const servers: EpisodeServer[] = [];
  const imdbId =
    movie.imdb?.id || (typeof movie.imdb === 'string' ? movie.imdb : null);
  const tmdbId =
    movie.tmdb?.id || (typeof movie.tmdb === 'string' ? movie.tmdb : null);
  const isSeries = movie.type === 'series';
  const totalEp = parseInt(movie.episode_total || '1', 10) || 1;

  if (imdbId) {
    const epData: EpisodeItem[] = [];
    if (isSeries) {
      for (let i = 1; i <= Math.min(totalEp, 24); i++) {
        epData.push({
          name: `${i}`,
          slug: `tap-${i}`,
          link_embed: `https://vidsrc.to/embed/tv/${imdbId}/1/${i}`,
        });
      }
    } else {
      epData.push({
        name: 'Full',
        slug: 'full',
        link_embed: `https://vidsrc.to/embed/movie/${imdbId}`,
      });
    }
    servers.push({
      server_name: 'Server Quốc Tế 1 (VidSrc - SubEng/Vietsub)',
      server_type: 'vidsrc',
      server_data: epData,
    });
  }

  if (tmdbId) {
    const epData: EpisodeItem[] = [];
    if (isSeries) {
      for (let i = 1; i <= Math.min(totalEp, 24); i++) {
        epData.push({
          name: `${i}`,
          slug: `tap-${i}`,
          link_embed: `https://www.2embed.cc/embedtv/${tmdbId}&s=1&e=${i}`,
        });
      }
    } else {
      epData.push({
        name: 'Full',
        slug: 'full',
        link_embed: `https://www.2embed.cc/embed/${tmdbId}`,
      });
    }
    servers.push({
      server_name: 'Server Quốc Tế 2 (2Embed - Full HD)',
      server_type: 'vidsrc',
      server_data: epData,
    });
  }

  return servers;
}

/**
 * Race một Promise<T> với timeout. Nếu timeout quay trước, trả về `fallback`
 * (mặc định `null`) thay vì throw — caller không phải xử lý AbortError.
 * Dùng để giới hạn thời gian chờ khi gọi nhiều upstream provider cùng lúc
 * trong `getMovieDetail` — tránh 1 provider chậm kéo dài thời gian response
 * của cả trang (FIX-9.1b).
 */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

/**
 * Fetch movie detail & episodes aggregated from multiple providers (KKPhim Primary, Ophim, NguonC, VidSrc)
 */
export const getMovieDetail = cache(async function getMovieDetail(slug: string): Promise<MovieDetailResponse | null> {
  try {
    // FIX-9.1b: timeout 8s cho mỗi upstream provider. Trước fix, nếu 1 provider
    // (thường Ophim/NguonC) chậm 30s+ thì cả `Promise.all` chờ theo → user thấy
    // trang `/phim/[slug]` xoay mãi rồi mới nhận notFound. Sau fix, provider chậm
    // bị coi như trả null, các provider còn lại vẫn gom được servers bình thường.
    const UPSTREAM_TIMEOUT_MS = 8000;

    const [kkphimResult, ophimServers, nguoncServers] = await Promise.all([
      withTimeout(fetchKKPhimDetail(slug), UPSTREAM_TIMEOUT_MS, null),
      withTimeout(fetchOphimDetail(slug), UPSTREAM_TIMEOUT_MS, null),
      withTimeout(fetchNguonCDetail(slug), UPSTREAM_TIMEOUT_MS, null),
    ]);

    let movie = kkphimResult?.movie || null;
    const combinedServers: EpisodeServer[] = [];

    if (kkphimResult?.servers) {
      combinedServers.push(...kkphimResult.servers);
    }
    if (ophimServers) {
      combinedServers.push(...ophimServers);
    }
    if (nguoncServers) {
      combinedServers.push(...nguoncServers);
    }

    // Fallback movie metadata if KKPhim primary missed it
    if (!movie) {
      try {
        // FIX-9.1b: cùng timeout 8s cho VSMOV fallback — tránh kéo dài thời gian
        // response khi upstream này chậm.
        const vsmovRes = await withTimeout(
          fetch(`https://vsmov.com/api/phim/${slug}`, { next: { revalidate: 300 } }),
          8000,
          // Trả Response giả với ok=false để skip block bên dưới
          new Response(null, { status: 504 })
        );
        if (vsmovRes.ok) {
          const vsmovData = (await vsmovRes.json()) as VsmovDetailResponse;
          if (vsmovData.movie) {
            movie = {
              ...vsmovData.movie,
              poster_url: getImageUrl(vsmovData.movie.poster_url),
              thumb_url: getImageUrl(vsmovData.movie.thumb_url || vsmovData.movie.poster_url),
            } as MovieDetailResponse['movie'];
            if (vsmovData.episodes?.length) {
              vsmovData.episodes.forEach((srv, idx) => {
                combinedServers.push({
                  server_name: `Server VSMOV ${idx + 1} (${srv.server_name})`,
                  server_type: 'embed',
                  server_data: (srv.server_data || []).map((ep) => ({
                    name: readString(ep.name),
                    slug: readString(ep.slug, readString(ep.name)),
                    filename: ep.filename,
                    link_embed: normalizeEmbedUrl(ep.link_embed),
                    link_m3u8: normalizeM3u8Url(ep.link_m3u8 || ''),
                  })),
                });
              });
            }
          }
        }
      } catch {}
    }

    if (!movie) return null;

    const intServers = generateInternationalServers(movie);
    if (intServers.length > 0) {
      combinedServers.push(...intServers);
    }

    return {
      status: true,
      movie,
      episodes: combinedServers,
    };
  } catch (error) {
    console.error(`Error fetching movie detail for '${slug}':`, error);
    return null;
  }
});
