import {
  MovieListResponse,
  CategoryItem,
  CategoryListResponse,
  CountryItem,
  CountryListResponse,
  MovieDetailResponse,
  EpisodeServer,
  FilterParams,
} from '@/types/movie';

const API_BASE_URL = 'https://vsmov.com/api';

/**
 * Fetch latest updated movies
 */
export async function getLatestMovies(page: number = 1): Promise<MovieListResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/danh-sach/phim-moi-cap-nhat?page=${page}`, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error fetching latest movies:', error);
    return {
      status: false,
      items: [],
      pagination: { totalItems: 0, totalItemsPerPage: 24, currentPage: 1, totalPages: 1 },
    };
  }
}

/**
 * Filter movies using dynamic parameters
 */
export async function getFilteredMovies(params: FilterParams): Promise<MovieListResponse> {
  try {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.country) query.append('country', params.country);
    if (params.year) query.append('year', String(params.year));
    if (params.type) query.append('type', params.type);
    if (params.sort_field) query.append('sort_field', params.sort_field);
    if (params.sort_type) query.append('sort_type', params.sort_type);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));

    const res = await fetch(`${API_BASE_URL}/danh-sach?${query.toString()}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Error filtering movies:', error);
    return {
      status: false,
      items: [],
      pagination: { totalItems: 0, totalItemsPerPage: 24, currentPage: 1, totalPages: 1 },
    };
  }
}

/**
 * Fetch list of all genres
 */
export async function getCategories(): Promise<CategoryItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/the-loai`, {
      next: { revalidate: 3600 }, // Cache 1 hour
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data: CategoryListResponse = await res.json();
    return data.data?.items || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Fetch list of all countries
 */
export async function getCountries(): Promise<CountryItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/quoc-gia`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data: CountryListResponse = await res.json();
    return data.data?.items || [];
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
  }
}

/**
 * Fetch movies by category slug
 */
export async function getMoviesByCategory(slug: string, page: number = 1): Promise<MovieListResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/the-loai/${slug}?page=${page}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`Error fetching category ${slug}:`, error);
    return {
      status: false,
      items: [],
      pagination: { totalItems: 0, totalItemsPerPage: 24, currentPage: 1, totalPages: 1 },
    };
  }
}

/**
 * Fetch movies by country slug
 */
export async function getMoviesByCountry(slug: string, page: number = 1): Promise<MovieListResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/quoc-gia/${slug}?page=${page}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`Error fetching country ${slug}:`, error);
    return {
      status: false,
      items: [],
      pagination: { totalItems: 0, totalItemsPerPage: 24, currentPage: 1, totalPages: 1 },
    };
  }
}

/**
 * Search movies by keyword
 */
export async function searchMovies(keyword: string, page: number = 1, limit: number = 24): Promise<MovieListResponse> {
  try {
    if (!keyword.trim()) {
      return {
        status: true,
        items: [],
        pagination: { totalItems: 0, totalItemsPerPage: limit, currentPage: 1, totalPages: 1 },
      };
    }
    const res = await fetch(
      `${API_BASE_URL}/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}&limit=${limit}`,
      { cache: 'no-store' }
    );
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error(`Error searching movies for '${keyword}':`, error);
    return {
      status: false,
      items: [],
      pagination: { totalItems: 0, totalItemsPerPage: limit, currentPage: 1, totalPages: 1 },
    };
  }
}

/**
 * Multi-Provider Fetchers for KKPhim, Ophim, NguonC & International Servers
 */
async function fetchKKPhimDetail(slug: string): Promise<EpisodeServer[] | null> {
  try {
    const res = await fetch(`https://phimapi.com/phim/${slug}`, { next: { revalidate: 300 } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.status || !data.episodes?.length) return null;
    return data.episodes.map((srv: any) => ({
      server_name: `Server VIP 1 (KKPhim - ${srv.server_name || 'HLS'})`,
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
 * Fetch movie detail & episodes aggregated from multiple providers (VSMOV, KKPhim, Ophim, NguonC, VidSrc)
 */
export async function getMovieDetail(slug: string): Promise<MovieDetailResponse | null> {
  try {
    const [vsmovRes, kkphimServers, ophimServers, nguoncServers] = await Promise.all([
      fetch(`${API_BASE_URL}/phim/${slug}`, { next: { revalidate: 300 } })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetchKKPhimDetail(slug),
      fetchOphimDetail(slug),
      fetchNguonCDetail(slug),
    ]);

    let movie = vsmovRes?.movie || null;
    const baseEpisodes: EpisodeServer[] = vsmovRes?.episodes || [];

    // Fallback movie metadata if VSMOV doesn't have it
    if (!movie && (kkphimServers || ophimServers || nguoncServers)) {
      try {
        const kkRes = await fetch(`https://phimapi.com/phim/${slug}`);
        if (kkRes.ok) {
          const kkData = await kkRes.json();
          if (kkData.movie) movie = kkData.movie;
        }
      } catch {}
    }

    if (!movie) return null;

    const combinedServers: EpisodeServer[] = [];

    if (kkphimServers) combinedServers.push(...kkphimServers);
    if (ophimServers) combinedServers.push(...ophimServers);
    if (nguoncServers) combinedServers.push(...nguoncServers);

    if (baseEpisodes && baseEpisodes.length > 0) {
      baseEpisodes.forEach((srv, idx) => {
        combinedServers.push({
          server_name: srv.server_name.includes('Server')
            ? srv.server_name
            : `Server VSMOV ${idx + 1} (${srv.server_name})`,
          server_type: 'embed',
          server_data: srv.server_data,
        });
      });
    }

    const intServers = generateInternationalServers(movie);
    if (intServers.length > 0) {
      combinedServers.push(...intServers);
    }

    return {
      status: true,
      movie,
      episodes: combinedServers.length > 0 ? combinedServers : baseEpisodes,
    };
  } catch (error) {
    console.error(`Error fetching movie detail for '${slug}':`, error);
    return null;
  }
}

/**
 * Image URL helper
 */
export function getImageUrl(url?: any, fallback: string = '/images/placeholder.svg'): string {
  if (!url || typeof url !== 'string') return fallback;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://vsmov.com/${url.startsWith('/') ? url.slice(1) : url}`;
}
