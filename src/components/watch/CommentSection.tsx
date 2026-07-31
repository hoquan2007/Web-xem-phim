'use client';

import React, { useCallback, useState, useSyncExternalStore } from 'react';
import {
  MessageSquare,
  Send,
  ThumbsUp,
  Reply,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export interface CommentItem {
  id: string;
  userName: string;
  avatar: string;
  content: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
  isVip?: boolean;
  replies?: CommentItem[];
}

interface CommentSectionProps {
  movieSlug: string;
  movieTitle: string;
}

const DEFAULT_AVATARS = [
  '⚡', '🎬', '🍿', '🔥', '👑', '🐉', '🦸', '⭐', '🚀', '💎'
];

const EMPTY_COMMENTS: CommentItem[] = [];

const buildSeedComments = (movieTitle: string): CommentItem[] => [
  {
    id: 'c1',
    userName: 'PhimThudict_HNQ',
    avatar: '👑',
    content: `Phim ${movieTitle} chất lượng âm thanh hình ảnh quá đỉnh luôn! HNQ Phim cập nhật tập mới nhanh quá, hóng tập tiếp theo quá đi! 🔥`,
    createdAt: '15 phút trước',
    likes: 24,
    isVip: true,
    replies: [
      {
        id: 'r1',
        userName: 'HNQ Support',
        avatar: '⚡',
        content: 'Cảm ơn bạn đã ủng hộ HNQ Movie! Tập mới sẽ được phát sóng đúng lịch nhé ❤️',
        createdAt: '10 phút trước',
        likes: 8,
        isVip: true,
      },
    ],
  },
  {
    id: 'c2',
    userName: 'MinhQuan_Cinema',
    avatar: '🍿',
    content: 'Vietsub dịch chuẩn, mượt mà không bị trễ tiếng. Server vsmov chạy cực nhanh 4K không lag.',
    createdAt: '1 giờ trước',
    likes: 12,
  },
  {
    id: 'c3',
    userName: 'BaoNgoc_Anime',
    avatar: '⭐',
    content: 'Đoạn kết tập này kịch tính dã man! Ai chưa xem thì vào xem ngay nha!',
    createdAt: '3 giờ trước',
    likes: 19,
  },
];

// Module-level cache cho từng storageKey — tránh re-parse JSON mỗi lần subscribe() bắn.
const commentsCache = new Map<string, { raw: string | null; list: CommentItem[] }>();
const commentsListeners = new Map<string, Set<() => void>>();

function getStorageKey(slug: string) {
  return `hnq_comments_${slug}`;
}

function ensureCacheEntry(slug: string): { raw: string | null; list: CommentItem[] } {
  let entry = commentsCache.get(slug);
  if (entry) return entry;
  entry = { raw: null, list: EMPTY_COMMENTS };
  commentsCache.set(slug, entry);
  return entry;
}

function readCommentsSnapshot(slug: string): CommentItem[] {
  if (typeof window === 'undefined') return EMPTY_COMMENTS;
  const entry = ensureCacheEntry(slug);
  const raw = window.localStorage.getItem(getStorageKey(slug));
  if (raw === entry.raw) return entry.list;

  entry.raw = raw;
  if (!raw) {
    entry.list = EMPTY_COMMENTS;
    return entry.list;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    entry.list = Array.isArray(parsed) ? (parsed as CommentItem[]) : EMPTY_COMMENTS;
  } catch {
    entry.list = EMPTY_COMMENTS;
  }
  return entry.list;
}

function subscribeComments(slug: string, onStoreChange: () => void) {
  let listeners = commentsListeners.get(slug);
  if (!listeners) {
    listeners = new Set();
    commentsListeners.set(slug, listeners);
  }
  listeners.add(onStoreChange);

  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === getStorageKey(slug)) {
      onStoreChange();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners?.delete(onStoreChange);
    window.removeEventListener('storage', onStorage);
  };
}

function publishComments(slug: string, list: CommentItem[]) {
  const raw = JSON.stringify(list);
  window.localStorage.setItem(getStorageKey(slug), raw);
  const entry = ensureCacheEntry(slug);
  entry.raw = raw;
  entry.list = list;
  commentsListeners.get(slug)?.forEach((listener) => listener());
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  movieSlug,
  movieTitle,
}) => {
  const comments = useSyncExternalStore(
    useCallback((onStoreChange) => subscribeComments(movieSlug, onStoreChange), [movieSlug]),
    () => readCommentsSnapshot(movieSlug),
    () => EMPTY_COMMENTS
  );

  const [userName, setUserName] = useState('');
  const [userAvatar, setUserAvatar] = useState('🍿');
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Seed comments nếu user chưa từng bình luận — chạy 1 lần sau mount để tránh
  // hydration mismatch. Đăng ký qua `storage` event khi init để comment mới được
  // publish sẽ tự re-render component.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(getStorageKey(movieSlug));
    if (!raw) {
      publishComments(movieSlug, buildSeedComments(movieTitle));
    }
    // movieSlug/movieTitle intentionally omitted: chỉ seed 1 lần cho mỗi slug.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieSlug]);

  // Save comments helper
  const saveComments = (updated: CommentItem[]) => {
    publishComments(movieSlug, updated);
  };

  // Submit main comment
  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const authorName = userName.trim() || 'Thành viên HNQ';
    const item: CommentItem = {
      id: Date.now().toString(),
      userName: authorName,
      avatar: userAvatar,
      content: newComment.trim(),
      createdAt: 'Vừa xong',
      likes: 0,
      replies: [],
    };

    const updated = [item, ...comments];
    saveComments(updated);
    setNewComment('');
  };

  // Submit reply
  const handleSubmitReply = (parentCommentId: string) => {
    if (!replyContent.trim()) return;

    const authorName = userName.trim() || 'Thành viên HNQ';
    const replyItem: CommentItem = {
      id: Date.now().toString(),
      userName: authorName,
      avatar: userAvatar,
      content: replyContent.trim(),
      createdAt: 'Vừa xong',
      likes: 0,
    };

    const updated = comments.map((c) => {
      if (c.id === parentCommentId) {
        return {
          ...c,
          replies: [...(c.replies || []), replyItem],
        };
      }
      return c;
    });

    saveComments(updated);
    setReplyContent('');
    setReplyingTo(null);
  };

  // Toggle Like
  const handleToggleLike = (commentId: string, parentId?: string) => {
    const updated = comments.map((c) => {
      if (parentId && c.id === parentId) {
        const updatedReplies = (c.replies || []).map((r) => {
          if (r.id === commentId) {
            const isLiked = !r.isLiked;
            return { ...r, isLiked, likes: isLiked ? r.likes + 1 : r.likes - 1 };
          }
          return r;
        });
        return { ...c, replies: updatedReplies };
      } else if (c.id === commentId) {
        const isLiked = !c.isLiked;
        return { ...c, isLiked, likes: isLiked ? c.likes + 1 : c.likes - 1 };
      }
      return c;
    });

    saveComments(updated);
  };

  return (
    <div className="w-full bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl backdrop-blur-xl space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-2xl text-slate-950 shadow-lg shadow-amber-500/20">
            <MessageSquare className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              Bình Luận & Thảo Luận
              <span className="text-xs bg-amber-400/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-400/30">
                {comments.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              Chia sẻ cảm nhận về bộ phim cùng cộng đồng HNQ Phim
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cộng đồng văn minh</span>
        </div>
      </div>

      {/* Write Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Avatar Selector */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium px-2 hidden sm:inline">Avatar:</span>
            {DEFAULT_AVATARS.slice(0, 6).map((emoji) => (
              <button
                type="button"
                key={emoji}
                onClick={() => setUserAvatar(emoji)}
                className={`w-7 h-7 text-sm rounded-xl flex items-center justify-center transition-all ${
                  userAvatar === emoji
                    ? 'bg-amber-400 text-slate-950 font-bold scale-110 shadow-md'
                    : 'hover:bg-slate-800 text-slate-300'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* User Name Input */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Tên hiển thị của bạn (Tùy chọn)..."
              className="w-full py-2 px-3.5 text-xs bg-slate-950/80 text-slate-200 placeholder-slate-500 rounded-2xl border border-slate-800 focus:border-amber-400 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Comment Textarea */}
        <div className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            placeholder={`Viết nhận xét của bạn về phim ${movieTitle}...`}
            className="w-full p-3.5 text-xs sm:text-sm bg-slate-950/80 text-slate-200 placeholder-slate-500 rounded-2xl border border-slate-800 focus:border-amber-400 focus:outline-none transition-all resize-none"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="absolute bottom-3 right-3 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi bình luận</span>
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4 pt-2">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="p-4 bg-slate-950/60 rounded-2xl border border-white/5 space-y-3 transition-all hover:border-white/10"
          >
            {/* Header: User Avatar + Name + VIP Badge + Timestamp */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shadow-md shrink-0">
                  {comment.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-200">
                      {comment.userName}
                    </span>
                    {comment.isVip && (
                      <span className="flex items-center gap-0.5 px-1.5 py-0.2 text-[9px] font-black bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 rounded-md shadow-sm">
                        <Sparkles className="w-2.5 h-2.5" /> HNQ VIP
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {comment.createdAt}
                  </span>
                </div>
              </div>

              {/* Action: Like & Reply */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleLike(comment.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all ${
                    comment.isLiked
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${comment.isLiked ? 'fill-amber-400' : ''}`} />
                  <span>{comment.likes}</span>
                </button>

                <button
                  onClick={() =>
                    setReplyingTo(replyingTo === comment.id ? null : comment.id)
                  }
                  className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-all"
                >
                  <Reply className="w-3.5 h-3.5" />
                  <span>Trả lời</span>
                </button>
              </div>
            </div>

            {/* Comment Content */}
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal pl-11">
              {comment.content}
            </p>

            {/* Reply Input Form */}
            {replyingTo === comment.id && (
              <div className="pl-11 pt-2 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Trả lời ${comment.userName}...`}
                    className="flex-1 py-1.5 px-3 text-xs bg-slate-900 text-slate-200 placeholder-slate-500 rounded-xl border border-slate-700 focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSubmitReply(comment.id)}
                    className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl"
                  >
                    Gửi
                  </button>
                </div>
              </div>
            )}

            {/* Nested Replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="pl-8 sm:pl-11 pt-2 space-y-2 border-l-2 border-slate-800 ml-4 mt-2">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="p-3 bg-slate-900/90 rounded-xl border border-white/5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{reply.avatar}</span>
                        <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                          {reply.userName}
                          {reply.isVip && (
                            <CheckCircle2 className="w-3 h-3 text-amber-400" />
                          )}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {reply.createdAt}
                        </span>
                      </div>

                      <button
                        onClick={() => handleToggleLike(reply.id, comment.id)}
                        className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded ${
                          reply.isLiked ? 'text-amber-400' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>{reply.likes}</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 leading-snug pl-6">
                      {reply.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
