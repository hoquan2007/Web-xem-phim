// Shared by Next's optimizer configuration and the browser image component.
// Keep patterns limited to exact hosts or **.host, with a trailing /** path.
type RemoteImagePattern = {
  protocol: 'http' | 'https';
  hostname: string;
  pathname: string;
  port?: string;
};

export const IMAGE_REMOTE_PATTERNS: RemoteImagePattern[] = [
  { protocol: 'https', hostname: 'img.nguonc.com', pathname: '/images/**' },
  { protocol: 'https', hostname: 'img.ophim.live', pathname: '/uploads/movies/**' },
  { protocol: 'https', hostname: 'phimimg.com', pathname: '/**' },
  { protocol: 'https', hostname: 'image.phimapi.com', pathname: '/**' },
  { protocol: 'https', hostname: '**.phimimg.com', pathname: '/**' },
  { protocol: 'https', hostname: '**.phimapi.com', pathname: '/**' },
  { protocol: 'https', hostname: 'phim.nguonc.com', pathname: '/**' },
  { protocol: 'http', hostname: 'phim.nguonc.com', pathname: '/**' },
  { protocol: 'https', hostname: 'image.ophim1.com', pathname: '/**' },
  { protocol: 'https', hostname: 'phimapi.com', pathname: '/**' },
  { protocol: 'https', hostname: 'i.ex-cdn.com', port: '', pathname: '/danviet.vn/files/content/**' },
];

const DIRECT_IMAGE_HOSTS = new Set([
  'phimimg.com', 'img.phimapi.com', 'img.nguonc.com', 'img.ophim.live', 'phimapi.com',
  'i.ex-cdn.com',
]);

export function isConfiguredRemoteImage(src: string): boolean {
  try {
    const url = new URL(src);
    if (url.username || url.password) return false;
    return IMAGE_REMOTE_PATTERNS.some(pattern => {
      const hostnameMatches = pattern.hostname.startsWith('**.')
        ? url.hostname.endsWith(pattern.hostname.slice(2))
        : url.hostname === pattern.hostname;
      return hostnameMatches && url.protocol === `${pattern.protocol}:` &&
        (pattern.port === undefined || url.port === pattern.port) &&
        url.pathname.startsWith(pattern.pathname.slice(0, -2));
    });
  } catch {
    return false;
  }
}

export function shouldBypassImageOptimizer(src: string): boolean {
  // Unknown upstream URLs must not reach Next's loader: it throws during
  // rendering before onError can run. Direct loading still obeys browser CSP
  // and activates the fallback chain if the request is blocked or fails.
  if (!isConfiguredRemoteImage(src)) return true;
  return DIRECT_IMAGE_HOSTS.has(new URL(src).hostname);
}
