/**
 * Sandbox tests for src/lib/sanitize.ts.
 *
 * Run with:
 *   node --experimental-strip-types --experimental-transform-types \
 *        scripts/test-sanitize.ts
 *
 * No new dev dependencies required. Exercises every XSS payload the audit
 * called out (script, onerror, javascript:, data:, iframe, <base> injection,
 * <form>, case-insensitive bypass, <svg><script>) plus positive cases that
 * prove benign formatting from the API still survives.
 *
 * Convention: tags that are NOT in the allowlist are HTML-escaped into
 * inert text (so the browser sees `&lt;script&gt;` rather than a live
 * `<script>`). Allowed tags keep their markup, but disallowed attributes
 * are stripped (e.g. an `<a>` tag with a `javascript:` `href` becomes
 * `<a>...</a>` with no navigation target).
 */
import { sanitizeHtml, stripAllHtml, toMetaDescription } from '../src/lib/sanitize.ts';

let failed = 0;
let passed = 0;

function expect(name: string, cond: boolean, detail?: string): void {
  if (cond) {
    passed += 1;
    console.log(`  \u2713 ${name}`);
  } else {
    failed += 1;
    console.log(`  \u2717 ${name}` + (detail ? `  -> ${detail}` : ''));
  }
}

console.log('\n[test-sanitize] src/lib/sanitize.ts (native rewriter)\n');

// 1. Script tags escaped to text (no live script element reaches DOM).
{
  const input = '<p>Hello</p><script>alert(1)</script><p>World</p>';
  const out = sanitizeHtml(input);
  expect('escapes <script> as inert text', !out.includes('<script') && out.includes('&lt;script'));
  expect('no live script element', !/<script[\s>]/i.test(out));
  expect('keeps benign text', out.includes('Hello') && out.includes('World'));
}

// 2. <img> tag with onerror handler fully escaped (no live <img>).
{
  const input = '<img src="x" onerror="alert(1)">';
  const out = sanitizeHtml(input);
  expect('escapes <img> as inert text', !out.includes('<img') && out.includes('&lt;img'));
  // No live tag of any kind with an onerror= attribute.
  expect('no live tag with onerror=', !/<[a-z][a-z0-9]*[\s>][^>]*\bonerror\s*=/i.test(out));
}

// 3. javascript: URL stripped from allowed <a> tag (href attr dropped).
{
  const input = '<a href="javascript:alert(1)">click</a>';
  const out = sanitizeHtml(input);
  expect('no javascript: scheme', !out.toLowerCase().includes('javascript:'));
  expect('keeps link element open', /<a[\s>]/i.test(out));
  expect('href attribute removed', !/href=/i.test(out));
  expect('keeps link text', out.includes('click'));
}

// 4. data: URL stripped.
{
  const input = '<a href="data:text/html,<script>alert(1)</script>">bad</a>';
  const out = sanitizeHtml(input);
  expect('no data:text/html', !out.toLowerCase().includes('data:text'));
  expect('no script payload', !out.includes('alert(1)'));
}

// 5. <iframe> escaped entirely.
{
  const input = '<iframe src="https://evil.com"></iframe><p>ok</p>';
  const out = sanitizeHtml(input);
  expect('escapes <iframe>', !out.includes('<iframe') && out.includes('&lt;iframe'));
  expect('keeps <p>ok</p>', out.includes('<p>ok</p>'));
}

// 6. Disallowed attributes stripped.
{
  const input = '<p style="background:url(javascript:alert(1))" onclick="x">hi</p>';
  const out = sanitizeHtml(input);
  expect('strips inline style', !out.includes('background:'));
  expect('strips onclick attribute', !/onclick=/i.test(out));
  expect('keeps <p> open', /<p[\s>]/i.test(out));
  expect('keeps visible text', out.includes('hi'));
}

// 7. <form> / <input> escaped.
{
  const input = '<form action="https://evil.com"><input name="x"></form><p>safe</p>';
  const out = sanitizeHtml(input);
  expect('escapes <form>', !out.includes('<form') && out.includes('&lt;form'));
  expect('escapes <input>', !out.includes('<input') && out.includes('&lt;input'));
  expect('keeps safe content', out.includes('safe'));
}

// 8. Benign formatting from the API survives.
{
  const input =
    '<p>Xem <strong>phim hay</strong> trên HNQ.</p><ul><li>Tập 1</li><li>Tập 2</li></ul><a href="https://hnq.vn">Trang chủ</a>';
  const out = sanitizeHtml(input);
  expect('keeps <strong>', /<strong[\s>]/i.test(out));
  expect('keeps <ul><li>', out.includes('<ul>') && out.includes('<li>'));
  expect('keeps http link href', out.includes('href="https://hnq.vn"'));
  expect('keeps visible text', out.includes('Xem') && out.includes('Tập 1'));
}

// 9. Case-insensitive bypass blocked.
{
  const input = '<ScRiPt>alert(1)</ScRiPt>';
  const out = sanitizeHtml(input);
  expect('escapes uppercase <SCRIPT>', !out.includes('<ScRiPt') && out.includes('&lt;ScRiPt'));
  expect('no live script element', !/<ScRiPt/i.test(out));
}

// 10. <svg><script> escaped.
{
  const input = '<svg><script>alert(1)</script></svg>';
  const out = sanitizeHtml(input);
  expect('escapes <svg>', !out.includes('<svg') && out.includes('&lt;svg'));
  expect('escapes inner script opening tag', !/<script[\s>]/i.test(out));
  expect('escapes <script> opening as text', out.includes('&lt;script'));
}

// 11. Empty / non-string input.
{
  expect('undefined -> empty', sanitizeHtml(undefined) === '');
  expect('null -> empty', sanitizeHtml(null) === '');
  expect('number -> empty', sanitizeHtml(123) === '');
  expect('empty string -> empty', sanitizeHtml('') === '');
  expect('object -> empty', sanitizeHtml({}) === '');
}

// 12. stripAllHtml().
{
  const html = '<p>Hello&nbsp;World</p>  <strong>!@#$%^&amp;*()</strong>';
  const out = stripAllHtml(html);
  expect('no tags', !out.includes('<') && !out.includes('>'));
  expect('keeps "Hello World"', out.includes('Hello World'));
  expect('decodes &amp;', out.includes('&') && !out.includes('&amp;'));
  expect('collapses whitespace', !out.includes('  '));
}

// 13. toMetaDescription() truncate.
{
  const longHtml = '<p>' + 'a'.repeat(500) + '</p>';
  const desc = toMetaDescription(longHtml, 160);
  expect('length <= 160', desc.length <= 160);
  expect('ends with ellipsis', desc.endsWith('…') || desc.length <= 160);
}

// 14. Mixed-case javascript: stripped.
{
  const input = '<a href="JaVaScRiPt:alert(1)">x</a>';
  const out = sanitizeHtml(input);
  expect('mixed-case javascript: stripped', !out.toLowerCase().includes('javascript:'));
}

// 15. <base href> injection — explicitly forbidden.
{
  const input = '<base href="https://evil.com/"><p>after</p>';
  const out = sanitizeHtml(input);
  expect('escapes <base href>', !out.includes('<base') && out.includes('&lt;base'));
}

// 16. Void tags self-close safely (no dangling open).
{
  const input = '<br><hr><p>end</p>';
  const out = sanitizeHtml(input);
  expect('keeps <br>', /<br[\s>]/i.test(out));
  expect('keeps <hr>', /<hr[\s>]/i.test(out));
  expect('keeps <p>end</p>', out.includes('<p>end</p>'));
}

// 17. Malformed `&lt;` mid-string is escaped, not parsed.
{
  const input = '5 < 10 & true > false';
  const out = sanitizeHtml(input);
  expect('escapes stray < and >', out.includes('5 &lt; 10 &amp; true &gt; false'));
}

// 18. Nested link with malicious href — both levels escaped.
{
  const input = '<a href="javascript:1"><strong onclick="alert(2)">go</strong></a>';
  const out = sanitizeHtml(input);
  expect('no onclick', !/onclick=/i.test(out));
  expect('no javascript:', !/javascript:/i.test(out));
  expect('keeps <a> open', /<a[\s>]/i.test(out));
  expect('keeps <strong>', /<strong[\s>]/i.test(out));
  expect('keeps visible text', out.includes('go'));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
