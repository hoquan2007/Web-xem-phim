import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sameStoredMovie, storedMovieKey, type StoredMovieReference } from '../src/lib/storage.ts';

const movie: StoredMovieReference = { _id: 'movie-a', slug: 'shared-slug', source: 'kkphim', tmdb: { id: '101', type: 'movie' } };

test('provider and native slug distinguish records even when upstream IDs match', () => {
  assert.equal(sameStoredMovie(movie, { ...movie, source: 'nguonc' }), false);
  assert.notEqual(storedMovieKey(movie), storedMovieKey({ ...movie, source: 'nguonc' }));
});
test('same provider/native slug remains stable across metadata refreshes', () => {
  assert.equal(sameStoredMovie(movie, { ...movie, _id: 'updated-id' }), true);
  assert.equal(sameStoredMovie(movie, { ...movie, slug: 'different-slug' }), false);
});
test('legacy bookmarks without a source still match their original upstream ID', () => {
  assert.equal(sameStoredMovie({ ...movie, source: undefined, tmdb: undefined }, movie), true);
});
test('legacy entries with a different ID and identity do not match by slug', () => {
  assert.equal(sameStoredMovie({ ...movie, source: undefined, _id: 'movie-b', tmdb: { id: '202', type: 'movie' } }, movie), false);
});
test('a verified TMDB movie identity can match a legacy record after ID changes', () => {
  assert.equal(sameStoredMovie({ ...movie, source: undefined, _id: 'old-id' }, movie), true);
});
test('legacy TV identity requires the same known season', () => {
  const series: StoredMovieReference = { ...movie, tmdb: { id: '101', type: 'tv', season: 1 } };
  assert.equal(sameStoredMovie(series, { ...series, source: undefined, _id: 'old', tmdb: { id: '101', type: 'tv', season: 1 } }), true);
  assert.equal(sameStoredMovie(series, { ...series, source: undefined, tmdb: { id: '101', type: 'tv', season: 2 } }), false);
  assert.equal(sameStoredMovie(series, { ...series, source: undefined, _id: 'old', tmdb: { id: '101', type: 'tv' } }), false);
});
test('conflicting known legacy TMDB identities are not merged despite equal IDs', () => {
  assert.equal(sameStoredMovie(movie, { ...movie, source: undefined, tmdb: { id: '202', type: 'movie' } }), false);
});
test('legacy React keys distinguish IDs sharing a slug', () => {
  assert.notEqual(storedMovieKey({ ...movie, source: undefined }), storedMovieKey({ ...movie, source: undefined, _id: 'other' }));
});
