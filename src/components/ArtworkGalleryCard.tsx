import { Link } from 'react-router';
import type { Artwork } from '../types/artwork';
import ArtworkImage from './ArtworkImage';
import type { ArtworkNavigation } from '../utils/artworkNavigation';

export default function ArtworkGalleryCard({ artwork, iiifUrl, navigation }: { artwork: Artwork; iiifUrl: string; navigation: ArtworkNavigation }) {
  const year = artwork.date_start ?? artwork.date_end;
  const date = artwork.date_display
    || (year === null ? null : year < 0 ? `${Math.abs(year)} BCE` : String(year));

  return (
    <li className="gallery-item">
      <Link className="gallery-artwork-link" to={`/artwork/${artwork.id}`} state={{ artworkNavigation: navigation }}>
        <figure>
          <ArtworkImage artwork={artwork} iiifUrl={iiifUrl} />
          <figcaption className="gallery-caption">
            <h2>{artwork.title || 'Untitled artwork'}</h2>
            <p>{artwork.artist_title || artwork.artist_display || 'Unknown artist'}</p>
            {date && <p className="gallery-date">{date}</p>}
          </figcaption>
        </figure>
      </Link>
    </li>
  );
}
