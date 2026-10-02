import assert from 'node:assert/strict';
import { test } from 'node:test';
import { filterArtworks, getArtworkEra, getArtworkType } from '../src/utils/filterArtworks.ts';

const artwork = (id, type, start, end = null, classification = null) => ({
  id, artwork_type_title: type, classification_title: classification, date_start: start, date_end: end,
});
const artworks = [artwork(1, 'Painting', 1799), artwork(2, 'Painting', 1800),
  artwork(3, 'Sculpture', 1899), artwork(4, 'Painting', 1900), artwork(5, null, null, null, 'Print')];

test('era boundaries, BCE, year zero, and missing dates are handled correctly', () => {
  const cases = [[-500, 'before-1800'], [0, 'before-1800'], [1799, 'before-1800'],
    [1800, '1800-1899'], [1899, '1800-1899'], [1900, '1900-1949'],
    [1949, '1900-1949'], [1950, '1950-present'], [2026, '1950-present'], [null, 'unknown']];
  for (const [year, era] of cases) assert.equal(getArtworkEra(artwork(1, null, year)), era);
  assert.equal(getArtworkEra(artwork(1, null, null, 1850)), '1800-1899');
  assert.equal(getArtworkEra(artwork(1, null, 1899, 1901)), '1800-1899');
});

test('type uses classification as a fallback and tolerates missing or blank values', () => {
  assert.equal(getArtworkType(artworks[4]), 'Print');
  assert.equal(getArtworkType(artwork(1, '  ', null, null, null)), 'Unknown type');
  assert.equal(getArtworkType(artwork(1, ' Painting ', null)), 'Painting');
});

test('filters intersect, reset independently, and do not mutate the collection', () => {
  assert.deepEqual(filterArtworks(artworks, null, 'all'), artworks);
  assert.deepEqual(filterArtworks(artworks, 'Painting', '1800-1899').map(a => a.id), [2]);
  assert.deepEqual(filterArtworks(artworks, null, '1800-1899').map(a => a.id), [2, 3]);
  assert.deepEqual(filterArtworks(artworks, 'Painting', 'all').map(a => a.id), [1, 2, 4]);
  assert.deepEqual(filterArtworks(artworks, 'Print', 'unknown').map(a => a.id), [5]);
  assert.deepEqual(filterArtworks(artworks, 'Sculpture', '1950-present'), []);
  assert.equal(artworks.length, 5);
});
