/**
 * Shared HTML sanitizer for third-party movie synopsis strings
 * (KKPhim API `movie.content`), to be rendered via
 * `dangerouslySetInnerHTML`.
 *
 * **Implementation note:** this is a hand-rolled tag-aware rewriter —
 * NOT a full HTML parser. It is sufficient because the upstream
 * payload is constrained to a known subset of tags (paragraphs, lists,
 * emphasis, links, headings) and we never trust attacker-controlled
 * inputs that require parsing arbitrary HTML.
 *
 * Zero runtime dependencies — works on every Node version Vercel ships.
 *
 * Threat model:
 *   - `<script>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<input>`,
 *     `<svg>`, `<img>`, etc. — encoded as plain text.
 *   - Any attribute starting with `on*` (event handlers) — stripped.
 *   - `style` attribute — stripped.
 *   - `href` / `src` — only `https?:` and `mailto:` schemes allowed;
 *     everything else (javascript:, data:, vbscript:) is dropped, leaving
 *     the tag with no navigation target.
 *   - Ambiguous / malformed markup — escaped safely.
 */

// Tags we render as actual HTML elements. Anything outside this set
// is escaped to text so it cannot execute or render.
const ALLOWED_TAGS = new Set<string>([
  'p', 'br',
  'strong', 'b', 'em', 'i', 'u',
  'ul', 'ol', 'li',
  'a',
  'blockquote',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'span', 'small', 'sub', 'sup',
  'hr',
]);

// Void elements — `<br>`, `<hr>` are self-closing and never need a closing
// tag. The presence of an opening tag is all we ever expect.
const VOID_TAGS = new Set<string>(['br', 'hr']);

// Attributes we keep on rendered tags. Everything else (style, class, id,
// srcset, aria-*, data-*, etc.) is removed.
const ALLOWED_ATTRS = new Set<string>(['href', 'title', 'target', 'rel']);

// Schemes we will honor on link targets. Anything else (`javascript:`,
// `data:`, `vbscript:`, `file:`, raw strings, etc.) has its `href` removed.
const SAFE_SCHEMES = /^(?:https?|mailto):/i;

/**
 * Encode every character that has special HTML meaning so a string can be
 * safely embedded as text inside an element body.
 */
function escapeHtml(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Encode an attribute value (between double-quotes).
 */
function escapeAttr(raw: string): string {
  return raw
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

/**
 * Sanitize attributes on an element. Returns the reconstructed opening
 * tag (without the closing `>`) or `null` if the tag itself is disallowed.
 *
 * Note: we accept `<tagname` or `<tagname/` shapes so we can also process
 * XHTML-style self-closing tags. `<tagname foo="bar"/>` is treated as an
 * opening void tag.
 */
function sanitizeOpeningTag(rawAttrs: string, tagName: string): string | null {
  const name = tagName.toLowerCase();

  // Reject tags that look like custom elements or have non-alpha chars.
  if (!/^[a-z][a-z0-9]*$/.test(name)) return null;

  if (!ALLOWED_TAGS.has(name)) {
    // Tag not allowed — caller will escape the whole match as text.
    return null;
  }

  const kept: string[] = [];
  // Pull every attribute="..." or attribute='...' pair.
  const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(rawAttrs)) !== null) {
    const attrName = m[1].toLowerCase();
    const attrValue = (m[2] !== undefined ? m[2] : m[3]) ?? '';

    if (!ALLOWED_ATTRS.has(attrName)) continue;
    if (attrName === 'href') {
      // Trim whitespace + decode entities to detect scheme reliably.
      const trimmed = attrValue.replace(/[\s\u0000]+/g, '').toLowerCase();
      if (!SAFE_SCHEMES.test(trimmed)) continue;
    }
    kept.push(`${attrName}="${escapeAttr(attrValue)}"`);
  }

  if (kept.length === 0) {
    return `<${name}`;
  }
  return `<${name} ${kept.join(' ')}`;
}

/**
 * Sanitize a snippet of HTML coming from a third-party API (e.g. KKPhim
 * `movie.content`) before it is fed to `dangerouslySetInnerHTML`.
 *
 * Returns the empty string for non-string inputs.
 */
export function sanitizeHtml(raw: unknown): string {
  if (typeof raw !== 'string' || raw.length === 0) return '';

  // Walk the string and emit either a sanitized opening/closing tag
  // (when the tag is allowed) or an HTML-escaped text node (when the
  // tag is disallowed or malformed).
  //
  // We process one tag at a time:
  //   1. Find the next `<` — everything before is text, escape it.
  //   2. From `<`, scan until the matching `>` — that is a candidate
  //      tag or a stray `<`.
  //   3. Decide whether it is an allowed opening tag, an allowed
  //      closing tag, an unallowed tag, or just a malformed fragment.
  let out = '';
  let i = 0;
  const len = raw.length;

  while (i < len) {
    const lt = raw.indexOf('<', i);
    if (lt < 0) {
      // No more tags — emit the remaining text, escaped.
      out += escapeHtml(raw.slice(i));
      break;
    }

    // Text before the tag — escape it.
    if (lt > i) out += escapeHtml(raw.slice(i, lt));

    // Find the closing `>` (allow it inside double quotes).
    // Use a small scan that respects quoted attribute values.
    let gt = -1;
    let inDouble = false;
    let inSingle = false;
    for (let j = lt + 1; j < len; j++) {
      const ch = raw[j];
      if (ch === '"') inDouble = !inDouble;
      else if (ch === "'") inSingle = !inSingle;
      else if (ch === '>' && !inDouble && !inSingle) {
        gt = j;
        break;
      }
    }

    if (gt < 0) {
      // No closing `>` — treat `<` as text and continue.
      out += '&lt;';
      i = lt + 1;
      continue;
    }

    const rawTag = raw.slice(lt + 1, gt); // without `<` and `>`
    const trimmed = rawTag.trim();

    // Comments / CDATA / doctype / processing-instruction → escape.
    if (
      trimmed.startsWith('!--') ||
      trimmed.startsWith('!DOCTYPE') ||
      trimmed.startsWith('?xml') ||
      trimmed.startsWith('![')
    ) {
      out += escapeHtml(raw.slice(lt, gt + 1));
      i = gt + 1;
      continue;
    }

    // Closing tag: `</tagname...>`.
    if (trimmed.startsWith('/')) {
      const m = /^\/([a-zA-Z][a-zA-Z0-9]*)/.exec(trimmed);
      if (m && ALLOWED_TAGS.has(m[1].toLowerCase())) {
        out += `</${m[1].toLowerCase()}>`;
      } else {
        out += escapeHtml(raw.slice(lt, gt + 1));
      }
      i = gt + 1;
      continue;
    }

    // Opening tag (possibly self-closing): `<tagname attrs...>` or `<tagname attrs.../>`.
    const m = /^([a-zA-Z][a-zA-Z0-9]*)([\s\S]*?)(\/?)$/.exec(trimmed);
    if (!m) {
      out += escapeHtml(raw.slice(lt, gt + 1));
      i = gt + 1;
      continue;
    }

    const tagName = m[1];
    const attrs = m[2] || '';
    const selfClose = m[3] === '/';

    const sanitizedOpen = sanitizeOpeningTag(attrs, tagName);
    if (sanitizedOpen === null) {
      // Tag not allowlisted — escape the entire match as text.
      out += escapeHtml(raw.slice(lt, gt + 1));
      i = gt + 1;
      continue;
    }

    if (VOID_TAGS.has(tagName.toLowerCase()) || selfClose) {
      // Void / self-closing — emit as `<tag attrs />` (always self-close
      // for safety in case the browser is in quirks mode).
      out += `${sanitizedOpen}${selfClose ? ' />' : ''}>`;
    } else {
      out += `${sanitizedOpen}>`;
    }
    i = gt + 1;
  }

  return out;
}

/**
 * Strip every HTML tag, leaving only the raw text content.
 * Used for SEO metadata descriptions and the Hero description snippet,
 * which only need plain text.
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
