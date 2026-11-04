import type { Metadata } from 'next';
export function pageSeo(path: string, index = true): Metadata {
  const url = new URL(path, process.env.NEXT_PUBLIC_SITE_URL || 'https://hnqfilm.vercel.app').href;
  return { alternates: { canonical: url }, robots: { index, follow: true }, openGraph: { url } };
}
