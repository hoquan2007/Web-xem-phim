/**
 * Fixture responses captured from real provider API snapshots for offline testing.
 *
 * These JSON-like constants let the contract tests exercise provider
 * normalization, pagination, error handling, and orchestration without
 * hitting any upstream. They are intentionally minimal (not 1:1 with the
 * live API surface) — they only cover the *shape* the adapters must accept.
 *
 * If the real API changes schema, update these fixtures alongside the
 * adapter changes and rerun `npm run test:unit`.
 *
 * FIX-18: Removed `fixtureVsmovDetail` (VSMOV provider removed). Added
 * `fixtureOphimList`, `fixtureOphimSearch` for the upgraded Ophim
 * catalogue adapter.
 */
import type {
  CategoryItem,
  CountryItem,
  EpisodeServer,
  MovieDetailResponse,
  MovieListItem,
  MovieListResponse,
} from '@/types/movie';

export interface FixtureList {
  /** Top-level response wrapper shape returned by `getFilteredMovies` / `getLatestMovies`. */
  status: boolean;
  items: MovieListItem[];
  pagination: MovieListResponse['pagination'];
}

export interface FixtureCategoryList {
  status: string;
  data: { items: CategoryItem[] };
}

export interface FixtureCountryList {
  status: string;
  data: { items: CountryItem[] };
}

export interface FixtureKKPhimDetail {
  status: boolean;
  movie: MovieDetailResponse['movie'] | null;
  episodes: EpisodeServer[];
}

export const fixtureMovie = (
  partial: Partial<MovieListItem> = {},
): MovieListItem => ({
  _id: 'fixture-1',
  name: 'Avengers: Endgame',
  origin_name: 'Avengers: Endgame',
  slug: 'avengers-endgame',
  poster_url: 'upload/poster/2024/01/avengers.jpg',
  thumb_url: 'upload/thumb/2024/01/avengers.jpg',
  year: 2019,
  content: '<p>Mô tả phim.</p>',
  episode_current: 'HD',
  quality: 'HD',
  lang: 'Vietsub',
  type: 'single',
  ...partial,
});

export const fixtureListFull: FixtureList = {
  status: true,
  items: [
    fixtureMovie({ _id: 'fixture-list-full-a', slug: 'a', name: 'A' }),
    fixtureMovie({ _id: 'fixture-list-full-b', slug: 'b', name: 'B', type: 'series' }),
  ],
  pagination: {
    totalItems: 24,
    totalItemsPerPage: 24,
    currentPage: 1,
    totalPages: 5,
  },
};

export const fixtureListEmpty: FixtureList = {
  status: true,
  items: [],
  pagination: {
    totalItems: 0,
    totalItemsPerPage: 24,
    currentPage: 1,
    totalPages: 1,
  },
};

export const fixtureListMissingItems: { status: boolean; pagination: FixtureList['pagination'] } = {
  status: true,
  pagination: {
    totalItems: 0,
    totalItemsPerPage: 24,
    currentPage: 1,
    totalPages: 1,
  },
};

export const fixtureListWrappedInData: {
  status: string;
  data: { items: MovieListItem[]; params: { pagination: FixtureList['pagination'] } };
} = {
  status: 'success',
  data: {
    items: [fixtureMovie({ slug: 'wrapped', name: 'Wrapped' })],
    params: {
      pagination: {
        totalItems: 12,
        totalItemsPerPage: 24,
        currentPage: 1,
        totalPages: 1,
      },
    },
  },
};

export const fixtureCategories: FixtureCategoryList = {
  status: 'success',
  data: {
    items: [
      { _id: 1, name: 'Hành Động', slug: 'hanh-dong' },
      { _id: 2, name: 'Tình Cảm', slug: 'tinh-cam' },
    ],
  },
};

export const fixtureCountries: FixtureCountryList = {
  status: 'success',
  data: {
    items: [
      { _id: 1, name: 'Hàn Quốc', slug: 'han-quoc' },
      { _id: 2, name: 'Trung Quốc', slug: 'trung-quoc' },
    ],
  },
};

export const fixtureKKPhimDetail: FixtureKKPhimDetail = {
  status: true,
  movie: {
    _id: 'fixture-1',
    name: 'Avengers: Endgame',
    origin_name: 'Avengers: Endgame',
    slug: 'avengers-endgame',
    content: '<p>Mô tả chi tiết.</p>',
    type: 'single',
    status: 'completed',
    poster_url: 'upload/poster/2024/01/avengers.jpg',
    thumb_url: 'upload/thumb/2024/01/avengers.jpg',
    year: 2019,
    quality: 'HD',
    lang: 'Vietsub',
    episode_current: 'Full',
    episode_total: '1',
    tmdb: { type: 'movie', id: '299534' },
    imdb: { id: 'tt4154796' },
  },
  episodes: [
    {
      server_name: 'VIP',
      server_type: 'hls',
      server_data: [
        {
          name: 'Full',
          slug: 'full',
          filename: 'avengers-endgame',
          link_embed: 'https://kkphim.com/embed/abc',
          link_m3u8: 'https://kkphim.com/hls/abc.m3u8',
        },
      ],
    },
  ],
};

export const fixtureKKPhimDetailMissingMovie = {
  status: true,
  movie: null,
  episodes: [],
} as const;

export const fixtureKKPhimDetailStatusFalse = {
  status: false,
  movie: null,
  episodes: [],
} as const;

export const fixtureOphimServers: EpisodeServer[] = [
  {
    server_name: 'Ophim HLS',
    server_type: 'hls',
    server_data: [
      {
        name: 'Full',
        slug: 'full',
        link_embed: 'https://ophim1.com/embed/abc',
        link_m3u8: 'https://ophim1.com/hls/abc.m3u8',
      },
    ],
  },
];

/**
 * FIX-18: Ophim list fixture builder. Returns a deterministic batch of
 * MovieListItem for a given page/limit. Used by mock-handler to feed the
 * upgraded `ophimAdapter.list()` path.
 */
export function fixtureOphimList(page: number, limit: number): MovieListItem[] {
  return Array.from({ length: limit }).map((_, i) =>
    fixtureMovie({
      _id: `ophim-list-${page}-${i}`,
      slug: `ophim-list-${page}-${i}`,
      name: `Ophim List ${page} #${i + 1}`,
      origin_name: `Ophim Origin ${page} #${i + 1}`,
      year: 2024 - (i % 5),
      poster_url: `https://image.ophim1.com/uploads/movies/ophim-${page}-${i}-poster.jpg`,
      thumb_url: `https://image.ophim1.com/uploads/movies/ophim-${page}-${i}-thumb.jpg`,
    }),
  );
}

/**
 * FIX-18: Ophim search fixture builder. Echoes the keyword in the result
 * names so the offline mock mirrors the real upstream behaviour.
 */
export function fixtureOphimSearch(keyword: string): MovieListItem[] {
  return [
    fixtureMovie({
      _id: `ophim-search-${keyword}-1`,
      slug: `ophim-${keyword}-result-1`,
      name: `${keyword} — Ophim Kết quả 1`,
      origin_name: `${keyword} — Ophim Origin 1`,
      poster_url: `https://image.ophim1.com/uploads/movies/ophim-search-1.jpg`,
      thumb_url: `https://image.ophim1.com/uploads/movies/ophim-search-1-thumb.jpg`,
    }),
    fixtureMovie({
      _id: `ophim-search-${keyword}-2`,
      slug: `ophim-${keyword}-result-2`,
      name: `${keyword} — Ophim Kết quả 2`,
      origin_name: `${keyword} — Ophim Origin 2`,
      type: 'series',
      poster_url: `https://image.ophim1.com/uploads/movies/ophim-search-2.jpg`,
      thumb_url: `https://image.ophim1.com/uploads/movies/ophim-search-2-thumb.jpg`,
    }),
  ];
}

export const fixtureNguoncServers: EpisodeServer[] = [
  {
    server_name: 'NguonC Embed',
    server_type: 'embed',
    server_data: [
      {
        name: 'Full',
        slug: 'full',
        link_embed: 'https://phim.nguonc.com/embed/abc',
      },
    ],
  },
];

export const fixtureKKPhimSlowResponse = {
  status: true,
  movie: fixtureKKPhimDetail.movie,
  episodes: fixtureKKPhimDetail.episodes,
};

export const fixtureProviderErrors = {
  timeout: Symbol('timeout'),
  notFound: { status: 404, statusText: 'Not Found' },
  rateLimit: { status: 429, statusText: 'Too Many Requests' },
  serverError: { status: 500, statusText: 'Internal Server Error' },
  invalidJson: '<html>Bad gateway</html>',
} as const;
