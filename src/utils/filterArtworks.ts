import type { Artwork } from '../types/artwork';

export type HistoricalEra = 'all' | 'before-1800' | '1800-1899' | '1900-1949' | '1950-present' | 'unknown';

export function getArtworkType(artwork: Artwork): string {
  return artwork.artwork_type_title?.trim()
    || artwork.classification_title?.trim()
    || 'Unknown type';
}

/** Use the earliest known date; date_end is a fallback when date_start is absent. */
export function getArtworkEra(artwork: Artwork): Exclude<HistoricalEra, 'all'> {
  const year = artwork.date_start ?? artwork.date_end;
  if (year === null) return 'unknown';
  if (year < 1800) return 'before-1800';
  if (year < 1900) return '1800-1899';
  if (year < 1950) return '1900-1949';
  return '1950-present';
}

/** Both filters must match; null type and "all" era remove their restrictions. */
export function filterArtworks(
  artworks: Artwork[],
  type: string | null,
  era: HistoricalEra,
): Artwork[] {
  return artworks.filter((artwork) =>
    (type === null || getArtworkType(artwork) === type)
    && (era === 'all' || getArtworkEra(artwork) === era),
  );
}
