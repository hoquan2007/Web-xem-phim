import { searchMovies } from '@/lib/api';
import { sanitizeKeyword, clampPage, clampLimit } from '@/lib/validate';

const clients = new Map<string, { count: number; until: number }>();
export async function GET(request: Request): Promise<Response> {
  const now = Date.now();
  for (const [key, value] of clients) if (value.until <= now) clients.delete(key);
  const key = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
  const bucket = clients.get(key) ?? { count: 0, until: now + 60000 };
  if (bucket.count >= 60 || (!clients.has(key) && clients.size >= 1000)) return Response.json({ status: false, items: [], msg: 'Bạn tìm kiếm quá nhanh. Vui lòng thử lại sau.' }, { status: 429, headers: { 'Retry-After': '60', 'Cache-Control': 'no-store' } });
  bucket.count++; clients.set(key, bucket);
  const url = new URL(request.url);
  const keyword = sanitizeKeyword(url.searchParams.get('keyword'));
  const result = await searchMovies(keyword, clampPage(url.searchParams.get('page')), clampLimit(url.searchParams.get('limit'), 6), request.signal);
  return Response.json(result, { status: result.status === false ? 503 : 200, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
