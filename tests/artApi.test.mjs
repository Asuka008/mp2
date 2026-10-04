import assert from 'node:assert/strict';
import { test } from 'node:test';
import axios from 'axios';

const requests = [];
let responseBody;
let requestError;

// Exercise the public functions without contacting the museum in unit tests.
axios.defaults.adapter = async (config) => {
  requests.push(config);
  if (requestError) throw requestError;
  return { data: responseBody, status: 200, statusText: 'OK', headers: {}, config };
};
const { fetchArtworks, searchArtworks, fetchArtworkById, getArtworkImageUrl } =
  await import('../src/api/artApi.ts');

const pagination = { total: 1, limit: 24, offset: 0, current_page: 1, total_pages: 1 };
const config = { iiif_url: 'https://www.artic.edu/iiif/2' };

function reset(data = [{ id: 42, title: 'Example', is_public_domain: true }]) {
  requests.length = 0;
  requestError = undefined;
  responseBody = { data, pagination, config };
}

test('collection defaults to server-filtered public-domain works and selected fields', async () => {
  reset();
  const result = await fetchArtworks();
  const request = requests[0];
  assert.equal(request.baseURL, 'https://api.artic.edu/api/v1');
  assert.equal(request.url, '/artworks/search');
  const params = JSON.parse(request.params.params);
  assert.deepEqual(params.query, { term: { is_public_domain: true } });
  assert.equal(params.page, 1);
  assert.equal(params.limit, 24);
  assert.equal(params.q, undefined);
  assert.deepEqual(params.fields.split(',').sort(), Object.keys(result.data[0]).sort());
  assert.deepEqual(result.pagination, pagination);
  assert.deepEqual(result.config, config);
  assert.equal(result.data[0].image_id, null);
  assert.equal(result.data[0].artist_title, null);
});

test('unfiltered collection uses listing endpoint and preserves explicit null/false/zero', async () => {
  reset([{ id: 42, title: null, image_id: null, date_start: 0, is_public_domain: false }]);
  const result = await fetchArtworks({ publicDomainOnly: false, page: 2, limit: 10 });
  assert.equal(requests[0].url, '/artworks');
  assert.equal(requests[0].params.page, 2);
  assert.equal(requests[0].params.limit, 10);
  assert.equal(result.data[0].title, null);
  assert.equal(result.data[0].date_start, 0);
  assert.equal(result.data[0].is_public_domain, false);
});

test('search trims text, retains pagination and supports cancellation and opting out', async () => {
  reset();
  const controller = new AbortController();
  await searchArtworks('  Monet & flowers  ', {
    page: 3, limit: 12, publicDomainOnly: false, signal: controller.signal,
  });
  const params = JSON.parse(requests[0].params.params);
  assert.equal(params.query.bool.must[0].multi_match.query, 'Monet & flowers');
  assert.equal(params.page, 3);
  assert.equal(params.limit, 12);
  assert.equal(params.query.bool.filter, undefined);
  assert.equal(requests[0].signal, controller.signal);
});

test('text search and public-domain filtering are combined in one query', async () => {
  reset();
  await searchArtworks('Monet');
  const params = JSON.parse(requests[0].params.params);
  assert.deepEqual(params.query.bool.filter, [{ term: { is_public_domain: true } }]);
  assert.equal(params.query.bool.must[0].multi_match.query, 'Monet');
  assert.equal(params.query.bool.must[0].multi_match.type, 'bool_prefix');
  assert.deepEqual(params.query.bool.must[0].multi_match.fields, ['title^3', 'artist_title^2', 'artist_display']);
});

test('empty search results remain an empty collection', async () => {
  reset([]);
  assert.deepEqual((await searchArtworks('no matches')).data, []);
});

test('detail lookup returns a single artwork without filtering its public-domain status', async () => {
  reset({ id: 42, title: 'Example', is_public_domain: false });
  const result = await fetchArtworkById(42);
  assert.equal(requests[0].url, '/artworks/42');
  assert.equal(requests[0].params.query, undefined);
  assert.equal(result.data.id, 42);
  assert.equal(result.data.is_public_domain, false);
  assert.deepEqual(result.config, config);
});

test('image URLs use response configuration and gracefully handle absent images', () => {
  assert.equal(getArtworkImageUrl(null, config.iiif_url), null);
  assert.equal(getArtworkImageUrl('', config.iiif_url), null);
  assert.equal(
    getArtworkImageUrl('image-id', `${config.iiif_url}/`),
    `${config.iiif_url}/image-id/full/843,/0/default.jpg`,
  );
  assert.equal(
    getArtworkImageUrl('image/id', 'https://example.org/iiif/2'),
    'https://example.org/iiif/2/image%2Fid/full/843,/0/default.jpg',
  );
});

test('invalid IDs and pagination are rejected before making a request', async () => {
  reset();
  for (const id of [0, -1, 1.5, NaN]) {
    await assert.rejects(fetchArtworkById(id), RangeError);
  }
  await assert.rejects(fetchArtworks({ page: 0 }), RangeError);
  await assert.rejects(searchArtworks('x', { limit: 101 }), RangeError);
  await assert.rejects(searchArtworks('x', { page: 101, limit: 100 }), RangeError);
  assert.equal(requests.length, 0);
});

test('request failures reject instead of masquerading as empty results', async () => {
  reset();
  requestError = new axios.AxiosError('Request failed', 'ERR_NETWORK');
  await assert.rejects(fetchArtworks(), (error) => error === requestError);
  await assert.rejects(searchArtworks('Monet'), (error) => error === requestError);
  await assert.rejects(fetchArtworkById(42), (error) => error === requestError);
});
