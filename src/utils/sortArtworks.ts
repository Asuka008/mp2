import type { Artwork } from '../types/artwork';

export type ArtworkSortField = 'title' | 'year';
export type SortDirection = 'asc' | 'desc';

const titleCollator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

/** Sort a copy; unknown values stay last in both directions and ties use IDs. */
export function sortArtworks(
  artworks: Artwork[],
  field: ArtworkSortField,
  direction: SortDirection,
): Artwork[] {
  return [...artworks].sort((a, b) => {
    const left = field === 'year' ? a.date_start : a.title?.trim() || null;
    const right = field === 'year' ? b.date_start : b.title?.trim() || null;
    if (left === null && right === null) return a.id - b.id;
    if (left === null) return 1;
    if (right === null) return -1;
    const comparison = typeof left === 'number' && typeof right === 'number'
      ? left - right
      : titleCollator.compare(String(left), String(right));
    return comparison === 0 ? a.id - b.id : comparison * (direction === 'asc' ? 1 : -1);
  });
}
