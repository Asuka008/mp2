import assert from 'node:assert/strict';
import { test } from 'node:test';
import { sortArtworks } from '../src/utils/sortArtworks.ts';

const artworks = [
  { id: 1, title: null, date_start: null },
  { id: 2, title: 'zebra', date_start: 1900 },
  { id: 3, title: 'Apple', date_start: -100 },
  { id: 4, title: 'apple', date_start: 0 },
  { id: 5, title: '   ', date_start: null },
];
const ids = (items) => items.map((item) => item.id);

test('title sorting ignores case, puts unknown titles last, and has deterministic ties', () => {
  assert.deepEqual(ids(sortArtworks(artworks, 'title', 'asc')), [3, 4, 2, 1, 5]);
  assert.deepEqual(ids(sortArtworks(artworks, 'title', 'desc')), [2, 3, 4, 1, 5]);
});

test('year sorting preserves BCE and year zero and puts unknown dates last in both directions', () => {
  assert.deepEqual(ids(sortArtworks(artworks, 'year', 'asc')), [3, 4, 2, 1, 5]);
  assert.deepEqual(ids(sortArtworks(artworks, 'year', 'desc')), [2, 4, 3, 1, 5]);
});

test('sorting never changes the API result array', () => {
  const originalOrder = ids(artworks);
  const sorted = sortArtworks(artworks, 'title', 'asc');
  assert.notEqual(sorted, artworks);
  assert.deepEqual(ids(artworks), originalOrder);
  assert.deepEqual(sortArtworks([], 'year', 'desc'), []);
});

test('year sorting falls back to the end year consistently with gallery and details', () => {
  const items = [{ id: 1, title: 'A', date_start: null, date_end: 1850 },
    { id: 2, title: 'B', date_start: 1800, date_end: 1900 },
    { id: 3, title: 'C', date_start: null, date_end: null }];
  assert.deepEqual(ids(sortArtworks(items, 'year', 'asc')), [2, 1, 3]);
  assert.deepEqual(ids(sortArtworks(items, 'year', 'desc')), [1, 2, 3]);
});
