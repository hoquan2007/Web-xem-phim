import {
  MovieListResponse,
  CategoryItem,
  CategoryListResponse,
  CountryItem,
  CountryListResponse,
  MovieDetailResponse,
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
 * Fetch movie detail & episodes by movie slug
 */
export async function getMovieDetail(slug: string): Promise<MovieDetailResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/phim/${slug}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data: MovieDetailResponse = await res.json();
    if (!data.movie) return null;
    return data;
  } catch (error) {
    console.error(`Error fetching movie detail for '${slug}':`, error);
    return null;
  }
}

/**
 * Image URL helper
 */
export function getImageUrl(url?: any, fallback: string = '/images/placeholder.webp'): string {
  if (!url || typeof url !== 'string') return fallback;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://vsmov.com/${url.startsWith('/') ? url.slice(1) : url}`;
}
