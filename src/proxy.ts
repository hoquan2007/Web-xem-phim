import { PLAYER_FRAME_ORIGINS, playerPermission } from './lib/player-policy';
import { NextRequest, NextResponse } from 'next/server';

/**
 * CSP and browser security headers for PTQ Film.
 * Provider APIs, media and frames use explicit origin allowlists.
 * Inline scripts/styles support Next.js hydration and component styling;
 * production excludes unsafe-eval. Upstream synopsis HTML is sanitized.
 * Runtime CSP enforcement and response headers are covered by browser tests.
 */
function buildCsp(): string {
  const isDev = process.env.NODE_ENV !== 'production';

  /**
   * FIX-11: Player CDN allowlist shared across frame-src, connect-src,
   * media-src, and img-src.
   *
   * The KKPhim API (`phimapi.com`) returns embed/HLS URLs hosted on
   * rotating subdomains of these player CDNs, e.g.:
   *   - https://v.skbphimplayer.com/  (primary iframe embed shown in
   *     the screenshot error)
   *   - https://v7.kkphimplayer7.com/20260722/H4DYlzXV/index.m3u8
   *     (HLS manifest)
   *   - https://s1.phim1280.tv/20240119/01UbAB9M/index.m3u8  (HLS)
   *
   * Without these in the CSP allowlist, the browser blocks the iframe
   * (and the HLS `fetch`/XHR from the parent page), causing the
   * "This content is blocked. Contact the site owner to fix the issue."
   * overlay that the user reported.
   */
  const playerCdn = [
    'https://a.kvp726.com',
    'https://*.kkphimplayer.com',
    'https://*.kkphimplayer7.com',
    'https://*.kkphimplayer.org',
    'https://*.skbphimplayer.com',
    'https://*.phim1280.tv',
  ];

  const scriptSrc = [
    "'self'",
    "'unsafe-inline'", // Next.js inline boot scripts (necessary trade-off).
    isDev ? "'unsafe-eval'" : '', // Next dev needs eval for HMR; prod forbids it.
  ]
    .filter(Boolean)
    .join(' ');

  const styleSrc = [
    "'self'",
    "'unsafe-inline'", // Tailwind v4 + Next.js inline styles are unavoidable.
    'https://fonts.googleapis.com',
  ].join(' ');

  const imgSrc = [
    'https://i.ex-cdn.com/danviet.vn/files/content/',
    'https://img.nguonc.com',
    'https://img.ophim.live',
    "'self'",
    'data:',
    'blob:',
    'https://phimimg.com',
    'https://image.phimapi.com',
    'https://phim.nguonc.com',
    'https://*.phimapi.com',
    'https://oplihd.com', // OPhim/OpliHD video CDN — poster + thumbs
    'https://*.oplihd.com',
    ...playerCdn,
  ].join(' ');

  const mediaSrc = [
    "'self'",
    'blob:',
    'https://*.phimapi.com',
    'https://phimapi.com',
    'https://phim.nguonc.com',
    'https://*.nguonc.com',
    'https://oplihd.com', // OPhim/OpliHD video CDN — HLS segments
    'https://*.oplihd.com',
    ...playerCdn,
  ].join(' ');

  const frameSrc = [
    ...PLAYER_FRAME_ORIGINS,
    "'self'",
    'https://*.kkphim.com',
    'https://*.ophim.cc',
    'https://*.ophim.com',
    'https://phim.nguonc.com',
    'https://vidsrc.to',
    'https://vidsrc.me',
    'https://vidsrc.xyz',
    'https://2embed.cc',
    'https://www.2embed.cc',
    'https://*.google.com',
    'https://oplihd.com', // OPhim/OpliHD player iframe
    'https://*.oplihd.com',
    ...playerCdn,
  ].join(' ');

  const connectSrc = [
    "'self'",
    'https://phimapi.com',
    'https://*.phimapi.com',
    'https://phim.nguonc.com',
    'https://*.ophim.cc',
    'https://*.kkphim.com',
    'https://oplihd.com', // OPhim/OpliHD API (playlist + metadata fetch)
    'https://*.oplihd.com',
    ...playerCdn,
    isDev ? 'ws:' : '',
    isDev ? 'http://localhost:*' : '',
    isDev ? 'http://127.0.0.1:*' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const fontSrc = ["'self'", 'data:', 'https://fonts.gstatic.com'].join(' ');

  return [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src ${styleSrc}`,
    `img-src ${imgSrc}`,
    `font-src ${fontSrc}`,
    `media-src ${mediaSrc}`,
    `frame-src ${frameSrc}`,
    `child-src ${frameSrc}`,
    `worker-src 'self' blob:`,
    `connect-src ${connectSrc}`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `manifest-src 'self'`,
    isDev ? '' : `upgrade-insecure-requests`,
  ]
    .filter(Boolean)
    .join('; ');
}

export function proxy(request: NextRequest) {
  const cspHeader = buildCsp();
  const isProd = process.env.NODE_ENV === 'production';

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  // ─── Content-Security-Policy ─────────────────────────────────────────
  response.headers.set('Content-Security-Policy', cspHeader);

  // ─── X-Frame-Options ─────────────────────────────────────────────────
  // Legacy header for IE / older browsers; CSP `frame-ancestors` is the
  // modern equivalent and wins for modern browsers.
  response.headers.set('X-Frame-Options', 'DENY');

  // ─── X-Content-Type-Options ──────────────────────────────────────────
  // Prevent MIME sniffing — attackers can't trick the browser into
  // executing an image as JavaScript.
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // ─── Referrer-Policy ─────────────────────────────────────────────────
  // Same-origin full URL, cross-origin only the origin (no path leakage).
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // ─── Permissions-Policy ──────────────────────────────────────────────
  // Disable powerful features we don't use; allow self for camera/mic
  // just in case (we don't use them but the directive documents intent).
  response.headers.set(
    'Permissions-Policy',
    [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'gyroscope=(self)',
      'accelerometer=(self)',
      'magnetometer=()',
      'payment=()',
      'usb=()',
      playerPermission('fullscreen'),
      playerPermission('autoplay'),
      playerPermission('picture-in-picture'),
      'clipboard-write=(self)',
      'clipboard-read=(self)',
    ].join(', ')
  );

  // ─── Cross-Origin-*-Policy (FIX-10.2 hardening, FIX-18 relaxed) ────
  // COOP: isolate browsing context from other origins.
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  // This site embeds third-party players that do not publish a matching
  // COEP policy. It does not need SharedArrayBuffer/crossOriginIsolated.
  // CSP still limits which players and streams may load.
  response.headers.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
  // Protect this site's own resources from cross-origin reuse.
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');

  // ─── Strict-Transport-Security (FIX-10.2 hardening, prod only) ───────
  // max-age 1 year, include subdomains, preload-eligible.
  if (isProd) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

/**
 * Apply proxy to all routes EXCEPT static assets and image optimizer paths.
 *
 * Match list excludes:
 *  - `api` (we have no API routes; FIX-1 removed them)
 *  - `_next/static` (static JS/CSS bundles)
 *  - `_next/image` (image optimizer output)
 *  - `favicon.ico`, `robots.txt`, `sitemap.xml` (metadata)
 *  - File extensions (svg, png, jpg, etc.) — already on CDN.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - file extensions like .svg, .png, .jpg, .webp, .avif, .ico, .css, .js
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|woff|woff2|ttf)$).*)',
    // Always run on the home page explicitly (no path).
    '/',
  ],
};
