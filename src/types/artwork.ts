/** Selected artwork metadata. Unknown or absent metadata is represented by null. */
export interface Artwork {
  id: number;
  title: string | null;
  artist_title: string | null;
  artist_display: string | null;
  date_start: number | null;
  date_end: number | null;
  date_display: string | null;
  image_id: string | null;
  artwork_type_title: string | null;
  classification_title: string | null;
  department_title: string | null;
  place_of_origin: string | null;
  medium_display: string | null;
  dimensions: string | null;
  is_public_domain: boolean | null;
}
