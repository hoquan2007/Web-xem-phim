'use client';

import React, { useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MovieDetail, EpisodeServer, MovieListItem } from '@/types/movie';
import { useWatchHistory } from '@/hooks/useWatchHistory';
import { VideoPlayer } from './VideoPlayer';
import { EpisodeSelector } from './EpisodeSelector';
import { MovieDetailInfo } from './MovieDetailInfo';
import { RelatedMovies } from './RelatedMovies';
import { CommentSection } from './CommentSection';
import { ReportModal } from './ReportModal';

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
  const lastSavedPlaybackRef = useRef<string | null>(null);
  const { saveWatchHistory } = useWatchHistory();

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
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

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

  // FIX-9.3.1: intent-based watch history. Trước fix, history chỉ lưu khi
  // HLS player bắn onPlay event. Với iframe fallback (server NguonC/VSMOV),
  // onPlay không fire → user click play bên trong iframe → KHÔNG lưu history.
  // Tệ hơn: user F5 trang hoặc vào thẳng URL `?sv=...&ep=...` → lastSavedPlaybackRef
  // khởi tạo null → HLS onPlay fires ngay lần đầu là OK, nhưng nếu HLS không fire
  // (vd content blocked) → cũng không lưu.
  //
  // Fix: lưu history khi user chủ động click "Xem Phim Ngay" (intent) HOẶC
  // khi player bắn onPlay (đã có sẵn). Cả 2 cùng dùng handleSaveHistory()
  // với lastSavedPlaybackRef dedupe.
  const handleSaveHistory = (intent: 'click' | 'play') => {
    const currentEp = episodes[activeServerIndex]?.server_data[activeEpisodeIndex];
    if (!currentEp) return;

    const playbackKey = `${movie.slug}:${activeServerIndex}:${activeEpisodeIndex}`;
    if (lastSavedPlaybackRef.current === playbackKey) return;
    lastSavedPlaybackRef.current = playbackKey;

    saveWatchHistory({
      _id: movie._id,
      name: movie.name,
      origin_name: movie.origin_name,
      slug: movie.slug,
      poster_url: movie.poster_url,
      thumb_url: movie.thumb_url,
      episode_name: currentEp.name || 'Tập 1',
      server_name: episodes[activeServerIndex]?.server_name || 'Server 1',
      active_server_index: activeServerIndex,
      active_episode_index: activeEpisodeIndex,
      watched_at: new Date().toISOString(),
      // FIX-9.3.1: ghi lại cách user bắt đầu xem — phục vụ analytics / debug.
      // 'click' = user click "Xem Phim Ngay" (intent), 'play' = HLS player tự bắn.
      started_via: intent,
    });
  };

  // FIX-9.3.1: wrapper cho onWatchClick — vừa save intent history vừa scroll.
  const handleIntentWatch = () => {
    handleSaveHistory('click');
    scrollToPlayer();
  };

  // FIX-9.3.1: đổi tên từ handlePlaybackStarted → handleAutoPlayStarted để rõ ràng
  // đây là auto-fire từ player (không phải intent). Logic giữ nguyên.
  const handleAutoPlayStarted = () => {
    handleSaveHistory('play');
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8 pb-12">
      {/* Video Player Section */}
      <div ref={playerRef} className="scroll-mt-24 w-full">
        <div className="w-full mx-auto transition-all duration-300">
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
            onReportError={() => setIsReportOpen(true)}
            onPlaybackStarted={handleAutoPlayStarted}
          />
        </div>
      </div>

      {/* Episodes Selector Grid */}
      <div className="w-full">
        <EpisodeSelector
          servers={episodes}
          activeServerIndex={activeServerIndex}
          activeEpisodeIndex={activeEpisodeIndex}
          onSelectServer={handleServerChange}
          onSelectEpisode={handleEpisodeChange}
        />
      </div>

      {/* Movie Details Info */}
      <div className="w-full">
        <MovieDetailInfo movie={movie} onWatchClick={handleIntentWatch} />
      </div>

      {/* Interactive Comments Section */}
      <div className="w-full">
        <CommentSection movieSlug={movie.slug} movieTitle={movie.name} />
      </div>

      {/* Related Recommendations */}
      {relatedMovies && relatedMovies.length > 0 && (
        <div className="w-full">
          <RelatedMovies movies={relatedMovies} title="Phim tương tự bạn có thể xem" />
        </div>
      )}

      {/* Report Issue Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        movieTitle={movie.name}
        episodeName={currentServerData[activeEpisodeIndex]?.name || 'Tập 1'}
      />
    </div>
  );
};
