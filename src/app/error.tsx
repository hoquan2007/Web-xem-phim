'use client';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div role="alert" className="min-h-screen px-6 pt-28 text-center text-slate-200"><p>Không thể tải trang lúc này. Vui lòng thử lại.</p><button onClick={reset} className="mt-4 rounded-xl bg-amber-400 px-5 py-2 text-slate-950">Thử lại</button></div>;
}
