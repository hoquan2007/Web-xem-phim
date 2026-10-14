import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMovieDetailResult, getMoviesByCategory, getLatestMovies, getImageUrl } from '@/lib/api';
import { createPageRequestSignal } from '@/lib/api/providers';
import { toMetaDescription } from '@/lib/sanitize';
import { sanitizeSlug } from '@/lib/validate';
import { ApiUnavailable } from '@/components/ui/ApiUnavailable';
import { MovieListItem, ProviderId } from '@/types/movie';
import { WatchContainer } from '@/components/watch/WatchContainer';

interface MoviePageProps {
  searchParams: Promise<{ source?: string; identity?: string; title?: string }>;

  params: Promise<{
    slug: string;
  }> | { slug: string };
}

/**
 * Generate SEO Dynamic Metadata
 */
export async function generateMetadata({ params, searchParams }: MoviePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  // FIX-10.5: validate slug before passing to upstream — reject control
  // chars, path traversal, oversized strings, unicode. If invalid, return
  // generic "not found" metadata without hitting upstream.
  const slug = sanitizeSlug(resolvedParams.slug);
  if (!slug) {
    return {
      title: 'Phim Không Tồn Tại',
      description: 'Rất tiếc, bộ phim bạn tìm kiếm hiện không tồn tại hoặc đã bị gỡ bỏ.',
    };
  }

  // API-REDESIGN-6: bound metadata fetch so a stuck /phim/<slug> can't pin
  // a worker while waiting on upstream before streaming the page HTML.
  const query = await searchParams;
  const rawSource = query.source;
  const source = ['kkphim', 'ophim', 'nguonc'].includes(rawSource ?? '') ? rawSource as ProviderId : undefined;
  const detailResult = await getMovieDetailResult(slug, source, query.identity, query.title);
  const data = detailResult.data;

  if (!data || !data.movie) {
    return {
      title: detailResult.errorCode === 'not_found' ? 'Phim Không Tồn Tại' : 'Nguồn Phim Tạm Không Khả Dụng',
      description: 'Vui lòng thử lại sau.',
    };
  }

  const movie = data.movie;
  const cleanDescription = toMetaDescription(movie.content)
    || `Xem phim ${movie.name} (${movie.origin_name}) vietsub thuyết minh chất lượng cao HD 4K trên HNQ.`;

  const posterUrl = getImageUrl(movie.poster_url || movie.thumb_url);

  return {
    title: `${movie.name} (${movie.origin_name}) - Xem Phim HD`,
    description: cleanDescription,
    keywords: [movie.name, movie.origin_name, 'xem phim online', 'phim hay', 'vsmov', 'hnq', 'hồ ngọc quân'],
    openGraph: {
      title: `${movie.name} (${movie.origin_name}) | HNQ`,
      description: cleanDescription,
      siteName: 'HNQ - Hồ Ngọc Quân',
      locale: 'vi_VN',
      images: [
        {
          url: posterUrl,
          width: 800,
          height: 1200,
          alt: movie.name,
        },
      ],
      type: 'video.movie',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${movie.name} (${movie.origin_name})`,
      description: cleanDescription,
      images: [posterUrl],
    },
  };
}

/**
 * Server Component - Movie Detail & Watch Page
 */
export default async function MoviePage({ params, searchParams }: MoviePageProps) {
  const resolvedParams = await params;
  // FIX-10.5: validate slug before passing to upstream.
  const slug = sanitizeSlug(resolvedParams.slug);
  if (!slug) {
    notFound();
  }

  // API-REDESIGN-6: one signal per page render covers the detail fetch and
  // the related-movies fan-out (`getMoviesByCategory` + `getLatestMovies`).
  const query = await searchParams;
  const rawSource = query.source;
  const source = ['kkphim', 'ophim', 'nguonc'].includes(rawSource ?? '') ? rawSource as ProviderId : undefined;
  const detailResult = await getMovieDetailResult(slug, source, query.identity, query.title);
  const data = detailResult.data;

  if (!data || !data.movie) {
    if (detailResult.errorCode === 'not_found') notFound();
    return <div className="min-h-screen px-6 pt-28"><ApiUnavailable /></div>;
  }

  const { movie, episodes } = data;

  const { signal } = createPageRequestSignal();
  const primaryCatSlug = movie.category?.[0]?.slug;
  const [categoryResult, latestResult] = await Promise.allSettled([
    primaryCatSlug ? getMoviesByCategory(primaryCatSlug, 1, signal) : Promise.resolve(null),
    getLatestMovies(1, signal),
  ]);

  const categoryItems = categoryResult.status === 'fulfilled'
    ? categoryResult.value?.items || []
    : [];
  const latestItems = latestResult.status === 'fulfilled'
    ? latestResult.value.items || []
    : [];
  const relatedItems: MovieListItem[] = categoryItems.length > 0 ? categoryItems : latestItems;

  // Exclude current movie from related list
  const filteredRelated = relatedItems.filter((item) => item.slug !== movie.slug);

  return (
    <main className="min-h-screen bg-slate-950 pt-24 pb-16 w-full px-4 sm:px-6 lg:px-10 xl:px-12">
      <Suspense
        fallback={
          <div className="flex h-96 w-full flex-col items-center justify-center text-cyan-400">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent shadow-lg shadow-cyan-500/20" />
            <p className="mt-4 text-sm font-medium text-slate-300">Đang tải phim...</p>
          </div>
        }
      >
        <WatchContainer
          movie={movie}
          episodes={episodes || []}
          relatedMovies={filteredRelated}
        />
      </Suspense>
    </main>
  );
}
