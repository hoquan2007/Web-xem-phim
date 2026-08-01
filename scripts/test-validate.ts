/**
 * Sandbox tests for src/lib/validate.ts.
 *
 * Run with:
 *   node --experimental-strip-types --experimental-transform-types \
 *        scripts/test-validate.ts
 *
 * No new dev dependencies. Covers FIX-10.5 input-validation hardening.
 */
import {
  sanitizeSlug,
  sanitizeKeyword,
  clampPage,
  clampLimit,
  sanitizeYear,
  sanitizeSortField,
  sanitizeSortType,
  sanitizeMovieType,
} from '../src/lib/validate.ts';

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

console.log('\n[test-validate] src/lib/validate.ts');
console.log('\n--- sanitizeSlug ---');

// 1. Valid slug
{
  const out = sanitizeSlug('avengers-endgame-2019');
  expect('valid slug passes', out === 'avengers-endgame-2019');
}

// 2. Valid slug with dots and underscores
{
  const out = sanitizeSlug('my_movie.v2');
  expect('slug with dots and underscores', out === 'my_movie.v2');
}

// 3. Empty / null returns null
{
  expect('empty string -> null', sanitizeSlug('') === null);
  expect('null -> null', sanitizeSlug(null) === null);
  expect('undefined -> null', sanitizeSlug(undefined) === null);
  expect('number -> null', sanitizeSlug(123) === null);
}

// 4. Too long (>120 chars) returns null
{
  const long = 'a'.repeat(121);
  expect('too long -> null', sanitizeSlug(long) === null);
}

// 5. Special chars blocked
{
  expect('path traversal blocked', sanitizeSlug('../etc/passwd') === null);
  expect('space blocked', sanitizeSlug('avengers endgame') === null);
  expect('slash blocked', sanitizeSlug('foo/bar') === null);
  expect('query blocked', sanitizeSlug('foo?bar=1') === null);
  expect('fragment blocked', sanitizeSlug('foo#bar') === null);
  expect('unicode blocked', sanitizeSlug('phim-hay-日本') === null);
}

// 6. Trim whitespace
{
  expect('leading/trailing whitespace trimmed', sanitizeSlug('  foo  ') === 'foo');
}

console.log('\n--- sanitizeKeyword ---');

// 7. Valid keyword
{
  expect('valid keyword', sanitizeKeyword('avengers') === 'avengers');
  expect('vietnamese diacritics kept', sanitizeKeyword('Phim Hàn Quốc') === 'Phim Hàn Quốc');
}

// 8. Empty / null safe
{
  expect('empty -> empty', sanitizeKeyword('') === '');
  expect('null -> empty', sanitizeKeyword(null) === '');
  expect('undefined -> empty', sanitizeKeyword(undefined) === '');
  expect('number -> empty', sanitizeKeyword(123) === '');
}

// 9. HTML sensitive chars stripped (defense in depth)
{
  const out = sanitizeKeyword('<script>alert</script>');
  expect('angle brackets stripped', !out.includes('<') && !out.includes('>'));
}

// 10. Control chars stripped
{
  const out = sanitizeKeyword('foo\x00\x01bar');
  expect('control chars stripped', out === 'foobar');
}

// 11. Truncate to 100 chars
{
  const long = 'a'.repeat(150);
  expect('truncated to 100 chars', sanitizeKeyword(long).length === 100);
}

console.log('\n--- clampPage ---');

// 12. Valid number passes
{
  expect('5 stays 5', clampPage(5) === 5);
  expect('1 stays 1', clampPage(1) === 1);
}

// 13. Negative / zero → 1
{
  expect('0 -> 1', clampPage(0) === 1);
  expect('-5 -> 1', clampPage(-5) === 1);
}

// 14. NaN / non-numeric → fallback
{
  expect('NaN -> 1', clampPage(NaN) === 1);
  expect('undefined -> 1', clampPage(undefined) === 1);
  expect('"abc" -> 1', clampPage('abc') === 1);
}

// 15. Above max → max
{
  expect('99999 -> 999', clampPage(99999) === 999);
  expect('99999 (string) -> 999', clampPage('99999') === 999);
}

// 16. String numeric parses
{
  expect('"42" -> 42', clampPage('42') === 42);
}

console.log('\n--- clampLimit ---');

// 17. Default 24
{
  expect('default 24', clampLimit(undefined) === 24);
  expect('default 24 for null', clampLimit(null) === 24);
}

// 18. Max 50
{
  expect('100 -> 50', clampLimit(100) === 50);
}

console.log('\n--- sanitizeYear ---');

// 19. Valid year
{
  expect('2024 -> "2024"', sanitizeYear(2024) === '2024');
  expect('"2024" -> "2024"', sanitizeYear('2024') === '2024');
}

// 20. Invalid year
{
  expect('1899 -> null', sanitizeYear(1899) === null);
  expect('9999 -> null', sanitizeYear(9999) === null);
  expect('"abc" -> null', sanitizeYear('abc') === null);
  expect('null -> null', sanitizeYear(null) === null);
}

console.log('\n--- sanitizeSortField ---');

// 21. Allowed values
{
  expect('"modified.time" ok', sanitizeSortField('modified.time') === 'modified.time');
  expect('"year" ok', sanitizeSortField('year') === 'year');
  expect('"_id" ok', sanitizeSortField('_id') === '_id');
  expect('"view" ok', sanitizeSortField('view') === 'view');
}

// 22. Disallowed values
{
  expect('desc -> undefined (no field)', sanitizeSortField('desc') === undefined);
  expect('"slug" -> undefined', sanitizeSortField('slug') === undefined);
  expect('null -> undefined', sanitizeSortField(null) === undefined);
}

console.log('\n--- sanitizeSortType ---');

// 23. Allowed values
{
  expect('"asc" ok', sanitizeSortType('asc') === 'asc');
  expect('"desc" ok', sanitizeSortType('desc') === 'desc');
}

// 24. Disallowed values
{
  expect('"ascending" -> undefined', sanitizeSortType('ascending') === undefined);
  expect('null -> undefined', sanitizeSortType(null) === undefined);
  expect('5 -> undefined', sanitizeSortType(5) === undefined);
}

console.log('\n--- sanitizeMovieType ---');

// 25. Allowed values
{
  expect('"single" ok', sanitizeMovieType('single') === 'single');
  expect('"series" ok', sanitizeMovieType('series') === 'series');
  expect('"hoat-hinh" ok', sanitizeMovieType('hoat-hinh') === 'hoat-hinh');
  expect('"tv-shows" ok', sanitizeMovieType('tv-shows') === 'tv-shows');
}

// 26. Disallowed values
{
  expect('"doc" -> undefined', sanitizeMovieType('doc') === undefined);
  expect('null -> undefined', sanitizeMovieType(null) === undefined);
  expect('1 -> undefined', sanitizeMovieType(1) === undefined);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);