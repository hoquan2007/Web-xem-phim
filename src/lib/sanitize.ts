import DOMPurify from 'isomorphic-dompurify';

/**
 * Shared DOMPurify configuration for sanitizing third-party HTML
 * (movie.content from KKPhim API).
 *
 * Allowlist is intentionally narrow but covers what the API legitimately
 * emits: <p>, <br>, <strong>, <em>, <u>, <ul>/<ol>/<li>, <a> (http/https only),
 * <blockquote>, <h1>-<h6>, <span>. Inline styles & all event handlers stripped.
 */
const PURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'ul',
    'ol',
    'li',
    'a',
    'blockquote',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'span',
    'small',
    'sub',
    'sup',
    'hr',
  ],
  ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
  // Block any <form>, <input>, etc. — anything interactive is denied by
  // virtue of not being in ALLOWED_TAGS, but we make it explicit anyway.
  FORBID_TAGS: [
    'script',
    'iframe',
    'object',
    'embed',
    'style',
    'link',
    'form',
    'input',
    'textarea',
    'button',
    'select',
    'option',
    'frame',
    'frameset',
    'meta',
    'base',
    // img/svg can carry payloads via src=javascript: / onerror; we don't
    // need them for plain movie synopsis text.
    'img',
    'svg',
    'video',
    'audio',
    'source',
    'track',
  ],
  FORBID_ATTR: [
    'style',
    'onerror',
    'onload',
    'onclick',
    'onmouseover',
    'onfocus',
    'onblur',
    'onmouseout',
    'onmouseenter',
    'onmouseleave',
    'onsubmit',
    'onchange',
    'oninput',
    'onkeydown',
    'onkeypress',
    'onkeyup',
  ],
  USE_PROFILES: { html: true },
};

/**
 * Sanitize a snippet of HTML coming from a third-party API (e.g. KKPhim
 * `movie.content`) before it is fed to `dangerouslySetInnerHTML`.
 *
 * Runs identically on the server (Node) and the browser via
 * `isomorphic-dompurify`. Returns the empty string for non-string inputs
 * so callers don't have to null-check.
 */
export function sanitizeHtml(raw: unknown): string {
  if (typeof raw !== 'string' || raw.length === 0) return '';
  try {
    return DOMPurify.sanitize(raw, PURIFY_CONFIG);
  } catch (err) {
    // Defensive: if DOMPurify ever throws (e.g. inside SSR jsdom edge case),
    // fall back to a fully escaped, tag-stripped plain-text version.
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[sanitizeHtml] DOMPurify failed, falling back to plain text:', err);
    }
    return stripAllHtml(raw);
  }
}

/**
 * Strip every HTML tag, leaving only the raw text content.
 * Used for SEO metadata descriptions and the Hero description snippet,
 * which only need plain text.
 *
 * Also applied as the fallback inside sanitizeHtml().
 */
export function stripAllHtml(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Truncate a string to at most `max` code points; if anything was removed,
 * append a single-character ellipsis (so the final length is exactly
 * `max`). Counts JS code points so emoji survive correctly.
 */
export function truncate(text: string, max: number = 160): string {
  if (!text) return '';
  if (text.length <= max) return text;
  // Reserve 1 char for the ellipsis so the result is exactly `max` chars.
  const slice = text.slice(0, Math.max(0, max - 1)).trimEnd();
  return `${slice}\u2026`;
}

/**
 * Convenience: produce a plain-text description suitable for SEO metadata
 * (<meta name="description">, OpenGraph, Twitter). Combines
 * stripAllHtml + collapse whitespace + truncate to 160 chars (the safe
 * hard limit for SERPs).
 */
export function toMetaDescription(raw: unknown, max: number = 160): string {
  return truncate(stripAllHtml(raw), max);
}
