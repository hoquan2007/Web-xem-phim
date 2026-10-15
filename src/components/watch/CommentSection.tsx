"use client";

import { safeStorageRead, safeStorageWrite } from "@/lib/storage";
import React, {
  useCallback,
  useId,
  useState,
  useSyncExternalStore,
} from "react";

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

const EMPTY_COMMENTS: CommentItem[] = [];

// Module-level cache cho từng storageKey — tránh re-parse JSON mỗi lần subscribe() bắn.
function isComment(value: unknown, depth = 0): value is CommentItem {
  if (!value || typeof value !== "object" || depth > 3) return false;
  const item = value as Record<string, unknown>;
  return (
    ["id", "userName", "avatar", "content", "createdAt"].every(
      (key) => typeof item[key] === "string",
    ) &&
    typeof item.likes === "number" &&
    Number.isFinite(item.likes) &&
    (!item.replies ||
      (Array.isArray(item.replies) &&
        item.replies.length <= 200 &&
        item.replies.every((reply) => isComment(reply, depth + 1))))
  );
}
const commentsCache = new Map<
  string,
  { raw: string | null; list: CommentItem[] }
>();
const commentsListeners = new Map<string, Set<() => void>>();

function getStorageKey(slug: string) {
  return `hnq_comments_${slug}`;
}

function ensureCacheEntry(slug: string): {
  raw: string | null;
  list: CommentItem[];
} {
  let entry = commentsCache.get(slug);
  if (entry) return entry;
  entry = { raw: null, list: EMPTY_COMMENTS };
  commentsCache.set(slug, entry);
  return entry;
}

function readCommentsSnapshot(slug: string): CommentItem[] {
  if (typeof window === "undefined") return EMPTY_COMMENTS;
  const entry = ensureCacheEntry(slug);
  const raw = safeStorageRead(getStorageKey(slug));
  if (raw === entry.raw) return entry.list;

  entry.raw = raw;
  if (!raw) {
    entry.list = EMPTY_COMMENTS;
    return entry.list;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    entry.list = Array.isArray(parsed)
      ? parsed
          .filter(isComment)
          .filter((item) => !["c1", "c2", "c3"].includes(item.id))
          .slice(0, 200)
      : EMPTY_COMMENTS;
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
  window.addEventListener("storage", onStorage);
  return () => {
    listeners?.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function publishComments(slug: string, list: CommentItem[]) {
  const raw = JSON.stringify(list);
  const saved = safeStorageWrite(getStorageKey(slug), raw);
  if (!saved) return false;
  const entry = ensureCacheEntry(slug);
  entry.raw = raw;
  entry.list = list;
  commentsListeners.get(slug)?.forEach((listener) => listener());
  return true;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  movieSlug,
  movieTitle,
}) => {
  const comments = useSyncExternalStore(
    useCallback(
      (onChange) => subscribeComments(movieSlug, onChange),
      [movieSlug],
    ),
    () => readCommentsSnapshot(movieSlug),
    () => EMPTY_COMMENTS,
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState(false);
  const id = useId();
  const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Ghi chú đã lưu"
      : date.toLocaleString("vi-VN");
  };
  return (
    <section className="notes-panel">
      <h2 className="text-xl font-semibold">Ghi chú cá nhân</h2>
      <p className="text-sm text-muted mt-2 mb-5">
        Chỉ lưu trên trình duyệt này, không gửi tới cộng đồng hoặc đội kỹ thuật.
      </p>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!note.trim()) return;
          const saved = publishComments(
            movieSlug,
            [
              {
                id: Date.now().toString(),
                userName: "Bạn",
                avatar: "",
                content: note.trim(),
                createdAt: new Date().toISOString(),
                likes: 0,
                replies: [],
              },
              ...comments,
            ].slice(0, 200),
          );
          setError(!saved);
          if (saved) setNote("");
        }}
      >
        <label className="film-label" htmlFor={id}>
          Ghi chú về {movieTitle}
        </label>
        <textarea
          className="film-field"
          id={id}
          rows={3}
          maxLength={4000}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi lại điều bạn muốn nhớ về bộ phim…"
        />
        <button className="film-button" disabled={!note.trim()}>
          Lưu ghi chú
        </button>
        {error && (
          <p role="alert" className="text-sm text-rose-300">
            Trình duyệt không cho lưu dữ liệu. Hãy sao chép ghi chú trước khi
            rời trang.
          </p>
        )}
      </form>
      <div className="mt-6 space-y-5 max-w-3xl">
        {comments.map((comment) => (
          <article key={comment.id}>
            <p className="text-xs text-muted mb-1">
              {formatDate(comment.createdAt)}
            </p>
            <p className="text-sm whitespace-pre-wrap break-words">
              {comment.content}
            </p>
            {comment.replies?.map((reply) => (
              <p
                className="ml-4 mt-2 text-sm text-muted whitespace-pre-wrap break-words"
                key={reply.id}
              >
                {reply.content}
              </p>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
};
