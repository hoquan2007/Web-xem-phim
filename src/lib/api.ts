import {
  MovieListResponse,
  CategoryItem,
  CategoryListResponse,
  CountryItem,
  CountryListResponse,
  MovieDetailResponse,
  MovieListItem,
  EpisodeServer,
  FilterParams,
} from '@/types/movie';

const API_KKPHIM_URL = 'https://phimapi.com';
const API_CDN_IMAGE = 'https://phimimg.com';

/**
 * Image URL helper: converts relative API image paths to full CDN URLs
 */
export function getImageUrl(url?: any, fallback: string = '/images/placeholder.svg'): string {
  if (!url || typeof url !== 'string') return fallback;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `${API_CDN_IMAGE}/${url.startsWith('/') ? url.slice(1) : url}`;
}

/**
 * Normalize raw movie items from KKPhim API into standard MovieListItem
 */
export function normalizeMovieItem(item: any): MovieListItem {
  if (!item) return {} as MovieListItem;
  return {
    _id: item._id || item.id || '',
    name: item.name || '',
    origin_name: item.origin_name || item.name || '',
    slug: item.slug || '',
    poster_url: getImageUrl(item.poster_url),
    thumb_url: getImageUrl(item.thumb_url || item.poster_url),
    year: typeof item.year === 'number' ? item.year : parseInt(item.year || '2024', 10) || 2024,
    content: item.content || '',
    episode_current: item.episode_current || '',
    quality: item.quality || 'HD',
    lang: item.lang || 'Vietsub',
    type: item.type || 'single',
    modified: item.modified,
    tmdb: item.tmdb,
    imdb: item.imdb,
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
    let url = '';

    if (params.category) {
      url = `${API_KKPHIM_URL}/v1/api/the-loai/${params.category}?page=${page}&limit=${limit}`;
    } else if (params.country) {
      url = `${API_KKPHIM_URL}/v1/api/quoc-gia/${params.country}?page=${page}&limit=${limit}`;
    } else if (params.type) {
      let typeStr = params.type;
      if (typeStr === 'series') typeStr = 'phim-bo';
      if (typeStr === 'single') typeStr = 'phim-le';
      if (typeStr === 'hoathinh') typeStr = 'hoat-hinh';
      if (typeStr === 'tvshows') typeStr = 'tv-shows';
      url = `${API_KKPHIM_URL}/v1/api/danh-sach/${typeStr}?page=${page}&limit=${limit}`;
    } else if (params.keyword) {
      url = `${API_KKPHIM_URL}/v1/api/tim-kiem?keyword=${encodeURIComponent(params.keyword)}&page=${page}&limit=${limit}`;
    } else {
      url = `${API_KKPHIM_URL}/danh-sach/phim-moi-cap-nhat?page=${page}`;
    }

    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();

    let rawItems: any[] = [];
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

    const items = rawItems.map(normalizeMovieItem);
    return {
      status: true,
      items,
      pagination,
    };
  } catch (error) {
    console.error('Error filtering movies from KKPhim:', error);
    return {
      status: false,
      items: [],
      pagination: { totalItems: 0, totalItemsPerPage: 24, currentPage: 1, totalPages: 1 },
    };
  }
}

/**
 * Fetch list of all genres from KKPhim
 */
export async function getCategories(): Promise<CategoryItem[]> {
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
}

/**
 * Fetch list of all countries from KKPhim
 */
export async function getCountries(): Promise<CountryItem[]> {
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
}

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
    return {
      status: true,
      items: [],
      pagination: { totalItems: 0, totalItemsPerPage: limit, currentPage: 1, totalPages: 1 },
    };
  }
  return getFilteredMovies({ keyword, page, limit });
}

/**
 * Multi-Provider Fetchers for KKPhim, Ophim, NguonC & International Servers
 */
async function fetchKKPhimDetail(slug: string): Promise<{ movie: any; servers: EpisodeServer[] } | null> {
  try {
    const res = await fetch(`${API_KKPHIM_URL}/phim/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.status || !data.movie) return null;

    const movie = {
      ...data.movie,
      poster_url: getImageUrl(data.movie.poster_url),
      thumb_url: getImageUrl(data.movie.thumb_url || data.movie.poster_url),
    };

    const servers: EpisodeServer[] = (data.episodes || []).map((srv: any) => ({
      server_name: `Server VIP 1 (KKPhim - ${srv.server_name || 'HLS Direct'})`,
      server_type: 'hls',
      server_data: (srv.server_data || []).map((ep: any) => ({
        name: ep.name,
        slug: ep.slug || ep.name,
        filename: ep.filename,
        link_embed: ep.link_embed,
        link_m3u8: ep.link_m3u8,
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
    const data = await res.json();
    const item = data.data?.item;
    if (!item || !item.episodes?.length) return null;
    return item.episodes.map((srv: any) => ({
      server_name: `Server VIP 2 (Ophim - ${srv.server_name || 'HLS'})`,
      server_type: 'hls',
      server_data: (srv.server_data || []).map((ep: any) => ({
        name: ep.name,
        slug: ep.slug || ep.name,
        filename: ep.filename,
        link_embed: ep.link_embed,
        link_m3u8: ep.link_m3u8,
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
    const data = await res.json();
    const eps = data.movie?.episodes || data.episodes;
    if (!eps?.length) return null;
    return eps.map((srv: any) => ({
      server_name: `Server VIP 3 (NguonC - ${srv.server_name || 'Embed'})`,
      server_type: 'embed',
      server_data: (srv.items || srv.server_data || []).map((ep: any) => ({
        name: ep.name,
        slug: ep.slug || ep.name,
        link_embed: ep.embed || ep.link_embed,
        link_m3u8: ep.m3u8 || ep.link_m3u8,
      })),
    }));
  } catch {
    return null;
  }
}

function generateInternationalServers(movie: any): EpisodeServer[] {
  const servers: EpisodeServer[] = [];
  const imdbId = movie.imdb?.id || (typeof movie.imdb === 'string' ? movie.imdb : null);
  const tmdbId = movie.tmdb?.id || (typeof movie.tmdb === 'string' ? movie.tmdb : null);
  const isSeries = movie.type === 'series';
  const totalEp = parseInt(movie.episode_total || '1', 10) || 1;

  if (imdbId) {
    const epData = [];
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
    const epData = [];
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
 * Fetch movie detail & episodes aggregated from multiple providers (KKPhim Primary, Ophim, NguonC, VidSrc)
 */
export async function getMovieDetail(slug: string): Promise<MovieDetailResponse | null> {
  try {
    const [kkphimResult, ophimServers, nguoncServers] = await Promise.all([
      fetchKKPhimDetail(slug),
      fetchOphimDetail(slug),
      fetchNguonCDetail(slug),
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
        const vsmovRes = await fetch(`https://vsmov.com/api/phim/${slug}`, { next: { revalidate: 300 } });
        if (vsmovRes.ok) {
          const vsmovData = await vsmovRes.json();
          if (vsmovData.movie) {
            movie = {
              ...vsmovData.movie,
              poster_url: getImageUrl(vsmovData.movie.poster_url),
              thumb_url: getImageUrl(vsmovData.movie.thumb_url || vsmovData.movie.poster_url),
            };
            if (vsmovData.episodes?.length) {
              vsmovData.episodes.forEach((srv: any, idx: number) => {
                combinedServers.push({
                  server_name: `Server VSMOV ${idx + 1} (${srv.server_name})`,
                  server_type: 'embed',
                  server_data: srv.server_data,
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
}
