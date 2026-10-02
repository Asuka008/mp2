import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getArtworkNeighbors, parseArtworkId, readArtworkNavigation } from '../src/utils/artworkNavigation.ts';

test('route IDs reject invalid numbers without partially parsing strings', () => {
  for (const value of [undefined, '', '0', '-1', '1.5', '42abc', '1e3', '9007199254740992']) {
    assert.equal(parseArtworkId(value), null);
  }
  assert.equal(parseArtworkId('28560'), 28560);
});

test('neighbors follow collection order rather than numeric ID order', () => {
  assert.deepEqual(getArtworkNeighbors([500, 8, 200], 8), { index: 1, previous: 500, next: 200 });
  assert.deepEqual(getArtworkNeighbors([500, 8, 200], 500), { index: 0, previous: null, next: 8 });
  assert.deepEqual(getArtworkNeighbors([500, 8, 200], 200), { index: 2, previous: 8, next: null });
  assert.deepEqual(getArtworkNeighbors([8], 8), { index: 0, previous: null, next: null });
  assert.deepEqual(getArtworkNeighbors([8], 99), { index: -1, previous: null, next: null });
});

test('navigation state accepts snapshots and rejects malformed or unrelated collections', () => {
  const artworkNavigation = { ids: [500, 8, 200], source: 'gallery' };
  assert.deepEqual(readArtworkNavigation({ artworkNavigation }, 8), artworkNavigation);
  for (const state of [null, {}, { artworkNavigation: { ids: [8, 8], source: 'list' } },
    { artworkNavigation: { ids: ['8'], source: 'list' } },
    { artworkNavigation: { ids: [8], source: 'invalid' } }, { artworkNavigation }]) {
    assert.equal(readArtworkNavigation(state, 99), null);
  }
});
