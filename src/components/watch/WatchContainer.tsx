'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MovieDetail, EpisodeServer, MovieListItem } from '@/types/movie';
import { VideoPlayer } from './VideoPlayer';
import { EpisodeSelector } from './EpisodeSelector';
import { MovieDetailInfo } from './MovieDetailInfo';
import { RelatedMovies } from './RelatedMovies';

interface WatchContainerProps {
  movie: MovieDetail;
  episodes: EpisodeServer[];
  relatedMovies: MovieListItem[];
}

export const WatchContainer: React.FC<WatchContainerProps> = ({
  movie,
  episodes,
  relatedMovies,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerRef = useRef<HTMLDivElement>(null);

  const initialServer = parseInt(searchParams.get('sv') || '0', 10);
  const initialEp = parseInt(searchParams.get('ep') || '0', 10);

  const [activeServerIndex, setActiveServerIndex] = useState<number>(
    isNaN(initialServer) || initialServer < 0 || initialServer >= episodes.length ? 0 : initialServer
  );

  const currentServerData = episodes[activeServerIndex]?.server_data || [];
  const [activeEpisodeIndex, setActiveEpisodeIndex] = useState<number>(
    isNaN(initialEp) || initialEp < 0 || initialEp >= currentServerData.length ? 0 : initialEp
  );

  const [isLightOff, setIsLightOff] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Update URL query params on server/episode selection
  const updateUrlParams = (serverIdx: number, epIdx: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sv', String(serverIdx));
    params.set('ep', String(epIdx));
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleServerChange = (index: number) => {
    setActiveServerIndex(index);
    setActiveEpisodeIndex(0);
    updateUrlParams(index, 0);
  };

  const handleEpisodeChange = (index: number) => {
    setActiveEpisodeIndex(index);
    updateUrlParams(activeServerIndex, index);
    scrollToPlayer();
  };

  const scrollToPlayer = () => {
    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Save to Watch History in LocalStorage
  useEffect(() => {
    try {
      if (!movie || !episodes.length) return;
      const currentEp = episodes[activeServerIndex]?.server_data[activeEpisodeIndex];
      const historyItem = {
        _id: movie._id,
        name: movie.name,
        origin_name: movie.origin_name,
        slug: movie.slug,
        poster_url: movie.poster_url,
        thumb_url: movie.thumb_url,
        episode_name: currentEp?.name || 'Tập 1',
        server_name: episodes[activeServerIndex]?.server_name || 'Server 1',
        active_server_index: activeServerIndex,
        active_episode_index: activeEpisodeIndex,
        watched_at: new Date().toISOString(),
      };

      const stored = localStorage.getItem('hnq_watch_history');
      let historyList: any[] = stored ? JSON.parse(stored) : [];
      // Remove duplicate movie
      historyList = historyList.filter((item) => item.slug !== movie.slug);
      historyList.unshift(historyItem);
      // Keep last 30 items
      if (historyList.length > 30) historyList.pop();

      localStorage.setItem('hnq_watch_history', JSON.stringify(historyList));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('hnq_history_updated'));
      }
    } catch (e) {
      console.error('Error saving watch history:', e);
    }
  }, [movie, activeServerIndex, activeEpisodeIndex, episodes]);


  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-12">
      {/* Video Player Section */}
      <div ref={playerRef} className="scroll-mt-24">
        <div
          className={`mx-auto transition-all duration-300 ${
            isExpanded ? 'w-full max-w-full' : 'w-full max-w-6xl'
          }`}
        >
          <VideoPlayer
            movieTitle={movie.name}
            servers={episodes}
            activeServerIndex={activeServerIndex}
            activeEpisodeIndex={activeEpisodeIndex}
            onServerChange={handleServerChange}
            onEpisodeChange={handleEpisodeChange}
            isLightOff={isLightOff}
            onToggleLightOff={() => setIsLightOff(!isLightOff)}
            isExpanded={isExpanded}
            onToggleExpanded={() => setIsExpanded(!isExpanded)}
          />
        </div>
      </div>

      {/* Episodes Selector Grid */}
      <div className="w-full max-w-6xl mx-auto">
        <EpisodeSelector
          servers={episodes}
          activeServerIndex={activeServerIndex}
          activeEpisodeIndex={activeEpisodeIndex}
          onSelectServer={handleServerChange}
          onSelectEpisode={handleEpisodeChange}
        />
      </div>

      {/* Movie Details Info */}
      <div className="w-full max-w-6xl mx-auto">
        <MovieDetailInfo movie={movie} onWatchClick={scrollToPlayer} />
      </div>

      {/* Related Recommendations */}
      {relatedMovies && relatedMovies.length > 0 && (
        <div className="w-full max-w-6xl mx-auto">
          <RelatedMovies movies={relatedMovies} title="Phim tương tự bạn có thể xem" />
        </div>
      )}
    </div>
  );
};
