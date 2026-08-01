import { NextRequest, NextResponse } from 'next/server';

/**
 * FIX-10.1: Content Security Policy (CSP) + security headers via Next.js 16
 * `proxy.ts` (formerly `middleware.ts` in Next.js ≤15).
 *
 * Why NO nonce: Next.js docs explicitly warn that nonce-based CSP forces
 * ALL pages to be dynamically rendered, which would break our 9 static
 * prerendered routes (`/`, `/_not-found`, `/chu-de`, `/lich-chieu`, `/tu-phim`).
 * Instead, we use hash-less CSP with `'self'` + a curated allowlist of
 * third-party origins we trust (image CDNs, embed providers, Google Fonts).
 * XSS surface is already mitigated by:
 *   - `src/lib/sanitize.ts` (FIX-2bis) — strips `<script>`, `onerror`,
 *     `javascript:` URLs from any `dangerouslySetInnerHTML` payload.
 *   - No `eval`/`Function()`/inline scripts anywhere in our source.
 *
 * The CSP is strict (default-src 'self') but allows:
 *  - `script-src 'self' 'unsafe-inline'` — Next.js hydration scripts are
 *    inline by default; we accept this trade-off since we control all
 *    script content (no user input flows into `<script>`).
 *  - `style-src 'self' 'unsafe-inline'` — Tailwind v4 + Next.js inline
 *    styles are unavoidable; we mitigate via nonce strategy NOT being
 *    used (the trade-off is documented above).
 *  - `img-src` allows our known image CDNs (phimimg, phimapi, nguonc,
 *    oplihd) + `data:` (Next.js placeholder SVGs) + `blob:` (HLS
 *    thumbnails) + the KKPhim player CDN prefix (poster thumbs served
 *    from `v*.kkphimplayer*.com`, `*.phim1280.tv`, `*.skbphimplayer.com`).
 *  - `media-src` allows HLS streams from KKPhim/PhimAPI/NguonC/OpliHD
 *    plus `blob:` (hls.js creates blob URLs for segments) plus the
 *    KKPhim player CDN prefix mentioned above.
 *  - `frame-src` allowlists the video embed providers we actually use:
 *    KKPhim, Ophim, NguonC, VidSrc, 2Embed, OpliHD, plus the KKPhim
 *    player CDN prefix (these players serve both HLS manifests and
 *    iframe fallback for embed_url). Other origins are blocked.
 *  - `connect-src` allows upstream APIs (KKPhim, Ophim, NguonC, OpliHD)
 *    + same-origin + the KKPhim player CDN prefix (HLS `.m3u8` files
 *    are fetched via XHR, and the iframe embed also triggers
 *    sub-resource requests that need to be allowed).
 *  - `frame-ancestors 'none'` — equivalent to `X-Frame-Options: DENY` but
 *    CSP-native; we set both for legacy browser coverage.
 *  - `form-action 'self'` — only same-origin form submissions allowed.
 *  - `base-uri 'self'` — defense-in-depth against <base href> injection
 *    (see FIX-2bis sanitize.ts).
 *  - `object-src 'none'` — kill `<object>`, `<embed>`, `<applet>`.
 *
 * FIX-10.2 also adds: HSTS, COOP, COEP, CORP, Permissions-Policy,
 * Referrer-Policy, X-Content-Type-Options.
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
      'fullscreen=(self)',
      'autoplay=(self)',
      'picture-in-picture=(self)',
      'clipboard-write=(self)',
      'clipboard-read=(self)',
    ].join(', ')
  );

  // ─── Cross-Origin-*-Policy (FIX-10.2 hardening) ──────────────────────
  // COOP: isolate browsing context from other origins.
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  // COEP: only load resources explicitly opted-in via CORP/CORS. We disable
  // this in development to avoid breaking Vercel's HMR; in production we
  // enable it to lock down side-channel attacks (Spectre-class).
  if (isProd) {
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp');
  }
  // CORP: third-party (cross-origin) resources must be explicitly loaded.
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