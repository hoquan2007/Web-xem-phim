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
  filename: string;
  link_embed: string;
}

export interface EpisodeServer {
  server_name: string;
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
