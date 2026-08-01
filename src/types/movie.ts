export interface TMDBInfo {
  type?: string;
  id?: string;
  season?: number | null;
  vote_average?: string;
  vote_count?: number;
}

export interface IMDBInfo {
  id?: string;
}

export interface ModifiedInfo {
  time?: string;
}

export interface MovieListItem {
  _id: string | number;
  name: string;
  origin_name: string;
  slug: string;
  poster_url: string;
  thumb_url: string;
  year: number;
  content?: string;
  episode_current?: string;
  quality?: string;
  lang?: string;
  type?: string;
  modified?: ModifiedInfo;
  tmdb?: TMDBInfo;
  imdb?: IMDBInfo;
}

export interface Pagination {
  totalItems: number;
  totalItemsPerPage: number;
  currentPage: number;
  totalPages: number;
}

export interface MovieListResponse {
  status: boolean | string;
  msg?: string;
  items: MovieListItem[];
  pathImage?: string;
  pagination: Pagination;
}

export interface CategoryItem {
  _id: string | number;
  name: string;
  slug: string;
}

export interface CountryItem {
  _id: string | number;
  name: string;
  slug: string;
}

export interface CategoryListResponse {
  status: string;
  message?: string;
  data: {
    items: CategoryItem[];
  };
}

export interface CountryListResponse {
  status: string;
  message?: string;
  data: {
    items: CountryItem[];
  };
}

export interface EpisodeItem {
  name: string;
  slug: string;
  filename?: string;
  link_embed: string;
  link_m3u8?: string;
}

export interface EpisodeServer {
  server_name: string;
  server_type?: 'hls' | 'embed' | 'vidsrc' | string;
  server_data: EpisodeItem[];
}

export interface MovieDetail {
  _id: string | number;
  name: string;
  origin_name: string;
  slug: string;
  content: string;
  type: 'single' | 'series' | string;
  status: string;
  poster_url: string;
  thumb_url: string;
  is_copyright?: boolean;
  trailer_url?: string | null;
  time?: string;
  episode_current?: string;
  episode_total?: string | null;
  quality?: string;
  lang?: string;
  notify?: string | null;
  showtimes?: string | null;
  year: number;
  keywords?: string;
  view?: number;
  chieurap?: boolean;
  sub_docquyen?: boolean;
  actor?: string[];
  director?: string[];
  category?: CategoryItem[];
  country?: CountryItem[];
  tmdb?: TMDBInfo;
  imdb?: IMDBInfo;
  created?: ModifiedInfo;
  modified?: ModifiedInfo;
}

export interface MovieDetailResponse {
  status: boolean;
  msg?: string;
  movie: MovieDetail;
  episodes: EpisodeServer[];
}

export interface FilterParams {
  category?: string;
  country?: string;
  year?: string | number;
  type?: 'single' | 'series' | string;
  sort_field?: string;
  sort_type?: 'asc' | 'desc' | string;
  page?: number | string;
  limit?: number | string;
  keyword?: string;
}

export interface BookmarkItem {
  _id: string | number;
  name: string;
  origin_name?: string;
  slug: string;
  poster_url: string;
  thumb_url: string;
  year?: number;
  quality?: string;
  lang?: string;
  episode_current?: string;
  saved_at?: string;
}

export interface WatchHistoryItem {
  _id: string | number;
  name: string;
  origin_name?: string;
  slug: string;
  poster_url: string;
  thumb_url: string;
  episode_name?: string;
  server_name?: string;
  active_server_index?: number;
  active_episode_index?: number;
  watched_at: string;
  // FIX-9.3.1: ghi lại cách user bắt đầu xem ('click' = intent, 'play' = HLS auto).
  // Optional để tương thích ngược với history cũ trong localStorage.
  started_via?: 'click' | 'play';
}

/**
 * Runtime marker so the file isn't empty after Node's
 * `--experimental-strip-types` transform. Interfaces and `type`
 * aliases are erased at runtime, which makes
 * `import { CategoryItem } from '@/types/movie'` fail in the
 * sandbox test runner (where loader hooks map `@/` → ./src/).
 *
 * No-op for production: Next.js tree-shakes the marker out and
 * TypeScript erases it during type-checking. The marker is not
 * intended to be consumed by any module — it only exists so the
 * file has at least one runtime export after type-stripping.
 */
export const __typesRuntimeMarker = true;

