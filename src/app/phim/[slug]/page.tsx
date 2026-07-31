import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getMovieDetail, getMoviesByCategory, getLatestMovies, getImageUrl } from '@/lib/api';
import { toMetaDescription } from '@/lib/sanitize';
import { MovieListItem } from '@/types/movie';
import { WatchContainer } from '@/components/watch/WatchContainer';

interface MoviePageProps {
  params: Promise<{
    slug: string;
  }> | { slug: string };
}

/**
 * Generate SEO Dynamic Metadata
 */
export async function generateMetadata({ params }: MoviePageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getMovieDetail(resolvedParams.slug);

  if (!data || !data.movie) {
    return {
      title: 'Phim Không Tồn Tại',
      description: 'Rất tiếc, bộ phim bạn tìm kiếm hiện không tồn tại hoặc đã bị gỡ bỏ.',
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
export default async function MoviePage({ params }: MoviePageProps) {
  const resolvedParams = await params;
  const data = await getMovieDetail(resolvedParams.slug);

  if (!data || !data.movie) {
    notFound();
  }

  const { movie, episodes } = data;

  const primaryCatSlug = movie.category?.[0]?.slug;
  const [categoryResult, latestResult] = await Promise.allSettled([
    primaryCatSlug ? getMoviesByCategory(primaryCatSlug, 1) : Promise.resolve(null),
    getLatestMovies(1),
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
