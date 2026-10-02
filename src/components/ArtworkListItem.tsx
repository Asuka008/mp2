import { Link } from 'react-router';
import type { Artwork } from '../types/artwork';
import type { ArtworkNavigation } from '../utils/artworkNavigation';

export default function ArtworkListItem({ artwork, navigation }: { artwork: Artwork; navigation: ArtworkNavigation }) {
  const year = artwork.date_start;
  const date = artwork.date_display ?? (year === null ? 'Date unknown' : year < 0 ? `${Math.abs(year)} BCE` : String(year));
  return (
    <li>
      <Link className="artwork-link" to={`/artwork/${artwork.id}`} state={{ artworkNavigation: navigation }}>
        <div className="catalog-identification">
          <h2>{artwork.title || 'Untitled artwork'}</h2>
          <p className="artist">{artwork.artist_title || artwork.artist_display || 'Unknown artist'}</p>
        </div>
        <dl className="artwork-meta">
          <div><dt>Date</dt><dd>{date}</dd></div>
          <div><dt>Type</dt><dd>{artwork.artwork_type_title || 'Unknown type'}</dd></div>
        </dl>
        <span className="open-artwork" aria-hidden="true">View artwork →</span>
      </Link>
    </li>
  );
}
