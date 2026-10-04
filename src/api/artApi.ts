import axios from 'axios';
import type { Artwork } from '../types/artwork';

export interface ApiPagination {
  total: number;
  limit: number;
  offset: number;
  current_page: number;
  total_pages: number;
  // Search responses may omit these links.
  prev_url?: string | null;
  next_url?: string | null;
}

export interface ApiConfig {
  iiif_url: string;
}

export interface ArtworkCollectionResponse {
  data: Artwork[];
  pagination: ApiPagination;
  config: ApiConfig;
}

export interface ArtworkDetailResponse {
  data: Artwork;
  config: ApiConfig;
}

export interface ArtworkQueryOptions {
  page?: number;
  limit?: number;
  /** Defaults to true; false includes all public-domain statuses. */
  publicDomainOnly?: boolean;
  /** Allows callers to cancel outdated searches or unmounted requests. */
  signal?: AbortSignal;
}

// The API normally sends null, but tolerate omitted metadata as well.
type ApiArtwork = Pick<Artwork, 'id'> & Partial<Omit<Artwork, 'id'>>;

const ARTWORK_FIELDS = [
  'id', 'title', 'artist_title', 'artist_display', 'date_start', 'date_end',
  'date_display', 'image_id', 'artwork_type_title', 'classification_title',
  'department_title', 'place_of_origin', 'medium_display', 'dimensions',
  'is_public_domain',
] as const satisfies readonly (keyof Artwork)[];

const client = axios.create({
  baseURL: 'https://api.artic.edu/api/v1',
  timeout: 15_000,
});

function normalizeArtwork(artwork: ApiArtwork): Artwork {
  return {
    id: artwork.id,
    title: artwork.title ?? null,
    artist_title: artwork.artist_title ?? null,
    artist_display: artwork.artist_display ?? null,
    date_start: artwork.date_start ?? null,
    date_end: artwork.date_end ?? null,
    date_display: artwork.date_display ?? null,
    image_id: artwork.image_id ?? null,
    artwork_type_title: artwork.artwork_type_title ?? null,
    classification_title: artwork.classification_title ?? null,
    department_title: artwork.department_title ?? null,
    place_of_origin: artwork.place_of_origin ?? null,
    medium_display: artwork.medium_display ?? null,
    dimensions: artwork.dimensions ?? null,
    is_public_domain: artwork.is_public_domain ?? null,
  };
}

function getPagination(options: ArtworkQueryOptions) {
  const page = options.page ?? 1;
  const limit = options.limit ?? 24;
  if (!Number.isInteger(page) || page < 1) {
    throw new RangeError('page must be a positive integer.');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new RangeError('limit must be an integer between 1 and 100.');
  }
  return { page, limit };
}

/** Fetch one page, preferring public-domain works through the search endpoint. */
export async function fetchArtworks(
  options: ArtworkQueryOptions = {},
): Promise<ArtworkCollectionResponse> {
  if (options.publicDomainOnly ?? true) {
    return searchArtworks('', options);
  }

  const response = await client.get<{
    data: ApiArtwork[];
    pagination: ApiPagination;
    config: ApiConfig;
  }>('/artworks', {
    params: { ...getPagination(options), fields: ARTWORK_FIELDS.join(',') },
    signal: options.signal,
  });
  return {
    data: response.data.data.map(normalizeArtwork),
    pagination: response.data.pagination,
    config: response.data.config,
  };
}

/** Search title and artist metadata; an empty query browses without a text restriction. */
export async function searchArtworks(
  query: string,
  options: ArtworkQueryOptions = {},
): Promise<ArtworkCollectionResponse> {
  const pagination = getPagination(options);
  if (pagination.page * pagination.limit > 10_000) {
    throw new RangeError('Search pagination cannot extend beyond 10,000 results.');
  }
  const text = query.trim();
  const publicDomainOnly = options.publicDomainOnly ?? true;
  const textQuery = {
    multi_match: {
      query: text,
      // Match an unfinished final word while the user is still typing.
      type: 'bool_prefix',
      fields: ['title^3', 'artist_title^2', 'artist_display'],
      operator: 'and',
    },
  };
  // Combine the text and rights constraints in one DSL query: a separate `q`
  // parameter can be overridden by the API's explicit `query` parameter.
  const searchQuery = text
    ? { bool: {
        must: [textQuery],
        ...(publicDomainOnly ? { filter: [{ term: { is_public_domain: true } }] } : {}),
      } }
    : publicDomainOnly ? { term: { is_public_domain: true } } : undefined;
  const params = {
    ...pagination,
    fields: ARTWORK_FIELDS.join(','),
    ...(searchQuery ? { query: searchQuery } : {}),
  };
  const response = await client.get<{
    data: ApiArtwork[];
    pagination: ApiPagination;
    config: ApiConfig;
  }>('/artworks/search', {
    // Official recommended encoding for GET search queries.
    params: { params: JSON.stringify(params) },
    signal: options.signal,
  });
  return {
    data: response.data.data.map(normalizeArtwork),
    pagination: response.data.pagination,
    config: response.data.config,
  };
}

/** Fetch by ID regardless of public-domain status, supporting direct detail links. */
export async function fetchArtworkById(
  id: number,
  signal?: AbortSignal,
): Promise<ArtworkDetailResponse> {
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new RangeError('Artwork ID must be a positive safe integer.');
  }
  const response = await client.get<{ data: ApiArtwork; config: ApiConfig }>(
    `/artworks/${id}`,
    { params: { fields: ARTWORK_FIELDS.join(',') }, signal },
  );
  return { data: normalizeArtwork(response.data.data), config: response.data.config };
}

/** Pass config.iiif_url from an API response; null means no image is available. */
export function getArtworkImageUrl(
  imageId: Artwork['image_id'],
  iiifUrl: ApiConfig['iiif_url'],
): string | null {
  if (!imageId) return null;
  return `${iiifUrl.replace(/\/+$/, '')}/${encodeURIComponent(imageId)}/full/843,/0/default.jpg`;
}
