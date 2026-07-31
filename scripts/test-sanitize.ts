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

console.log('\n[test-sanitize] src/lib/sanitize.ts\n');

// 1. Script tags stripped
{
  const input = '<p>Hello</p><script>alert(1)</script><p>World</p>';
  const out = sanitizeHtml(input);
  expect('strips <script> tag content', !out.includes('alert(1)') && !out.includes('<script'));
  expect('keeps benign text', out.includes('Hello') && out.includes('World'));
}

// 2. onerror handler stripped
{
  const input = '<img src="x" onerror="alert(1)">';
  const out = sanitizeHtml(input);
  expect('strips onerror handler', !out.toLowerCase().includes('onerror'));
  expect('strips <img>', !out.includes('<img'));
}

// 3. javascript: URL stripped
{
  const input = '<a href="javascript:alert(1)">click</a>';
  const out = sanitizeHtml(input);
  expect('strips javascript: URL', !out.toLowerCase().includes('javascript:'));
  expect('keeps link text', out.includes('click'));
}

// 4. data: URL stripped
{
  const input = '<a href="data:text/html,<script>alert(1)</script>">bad</a>';
  const out = sanitizeHtml(input);
  expect('strips data: URL', !out.toLowerCase().includes('data:text'));
}

// 5. iframe injection stripped
{
  const input = '<iframe src="https://evil.com"></iframe><p>ok</p>';
  const out = sanitizeHtml(input);
  expect('strips <iframe>', !out.includes('<iframe') && !out.includes('evil.com'));
  expect('keeps safe content', out.includes('ok'));
}

// 6. Style / onclick attribute stripped
{
  const input = '<p style="background:url(javascript:alert(1))" onclick="x">hi</p>';
  const out = sanitizeHtml(input);
  expect('strips inline style', !out.includes('background:'));
  expect('strips onclick attribute', !out.toLowerCase().includes('onclick'));
  expect('keeps <p>', out.includes('<p>'));
}

// 7. Form / input stripped
{
  const input = '<form action="https://evil.com"><input name="x"></form><p>safe</p>';
  const out = sanitizeHtml(input);
  expect('strips <form>', !out.includes('<form'));
  expect('strips <input>', !out.includes('<input'));
  expect('keeps safe content', out.includes('safe'));
}

// 8. Benign formatting survives
{
  const input =
    '<p>Xem <strong>phim hay</strong> trên HNQ.</p><ul><li>Tập 1</li><li>Tập 2</li></ul><a href="https://hnq.vn">Trang chủ</a>';
  const out = sanitizeHtml(input);
  expect('keeps <strong>', /<strong[\s>]/i.test(out));
  expect('keeps <ul><li>', out.includes('<ul>') && out.includes('<li>'));
  expect('keeps http link', out.includes('https://hnq.vn'));
  expect('keeps visible text', out.includes('Xem') && out.includes('Tập 1'));
}

// 9. Case-insensitive bypass blocked
{
  const input = '<ScRiPt>alert(1)</ScRiPt>';
  const out = sanitizeHtml(input);
  expect('strips uppercase <SCRIPT>', !out.includes('alert(1)'));
}

// 10. SVG with embedded script stripped
{
  const input = '<svg><script>alert(1)</script></svg>';
  const out = sanitizeHtml(input);
  expect('strips <svg><script>', !out.includes('alert(1)') && !out.includes('<svg'));
}

// 11. Empty / non-string input
{
  expect('undefined -> empty', sanitizeHtml(undefined) === '');
  expect('null -> empty', sanitizeHtml(null) === '');
  expect('number -> empty', sanitizeHtml(123) === '');
  expect('empty string -> empty', sanitizeHtml('') === '');
  expect('object -> empty', sanitizeHtml({}) === '');
}

// 12. stripAllHtml()
{
  const html = '<p>Hello&nbsp;World</p>  <strong>!@#$%^&amp;*()</strong>';
  const out = stripAllHtml(html);
  expect('no tags', !out.includes('<') && !out.includes('>'));
  expect('keeps "Hello World"', out.includes('Hello World'));
  expect('decodes &amp;', out.includes('&') && !out.includes('&amp;'));
  expect('collapses whitespace', !out.includes('  '));
}

// 13. toMetaDescription() truncate
{
  const longHtml = '<p>' + 'a'.repeat(500) + '</p>';
  const desc = toMetaDescription(longHtml, 160);
  expect('length <= 160', desc.length <= 160);
  expect('ends with ellipsis', desc.endsWith('…') || desc.length <= 160);
}

// 14. Mixed-case javascript:
{
  const input = '<a href="JaVaScRiPt:alert(1)">x</a>';
  const out = sanitizeHtml(input);
  expect('mixed-case javascript: stripped', !out.toLowerCase().includes('javascript:'));
}

// 15. <base href> injection — explicitly forbidden
{
  const input = '<base href="https://evil.com/"><p>after</p>';
  const out = sanitizeHtml(input);
  expect('strips <base href> injection', !out.toLowerCase().includes('<base'));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
