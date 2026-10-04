import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { fetchArtworks, fetchArtworkById } from '../api/artApi';
import type { ArtworkDetailResponse } from '../api/artApi';
import ArtworkImage from '../components/ArtworkImage';
import { getArtworkNeighbors, parseArtworkId, readArtworkNavigation } from '../utils/artworkNavigation';
import './ArtworkDetailView.css';

type DetailState =
  | { status: 'loading' }
  | { status: 'error'; id: number }
  | { status: 'success'; id: number; response: ArtworkDetailResponse };

export default function ArtworkDetailView() {
  const { id: routeId } = useParams<{ id: string }>();
  const id = parseArtworkId(routeId);
  const location = useLocation();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<DetailState>({ status: 'loading' });
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [navigationError, setNavigationError] = useState(false);
  const context = id === null ? null : readArtworkNavigation(location.state, id);
  // Use the actual history state as the dependency, rather than a freshly parsed object.
  const hasContext = context !== null;

  useEffect(() => {
    if (id === null) return;
    const controller = new AbortController();
    setDetail({ status: 'loading' });
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetchArtworkById(id, controller.signal);
        if (!controller.signal.aborted) setDetail({ status: 'success', id, response });
      } catch {
        if (!controller.signal.aborted) setDetail({ status: 'error', id });
      }
    }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [id, retryAttempt]);

  useEffect(() => {
    if (id === null || hasContext) return;
    const controller = new AbortController();
    setNavigationError(false);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetchArtworks({ limit: 100, signal: controller.signal });
        const ids = response.data.map((artwork) => artwork.id);
        // A direct-link artwork outside this selection starts its own collection.
        if (!ids.includes(id)) ids.unshift(id);
        if (!controller.signal.aborted) {
          navigate(location.pathname, {
            replace: true,
            state: { artworkNavigation: { ids, source: 'default' } },
          });
        }
      } catch {
        if (!controller.signal.aborted) setNavigationError(true);
      }
    }, 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [id, hasContext, location.pathname, navigate, retryAttempt]);

  if (id === null) return (
    <section className="message-panel" role="alert">
      <h1>Invalid artwork ID</h1>
      <p>Artwork links need a positive numeric ID.</p>
      <Link to="/">Browse artworks</Link>
    </section>
  );
  if (detail.status === 'loading' || detail.id !== id) return <p className="message-panel" role="status">Loading artwork…</p>;
  if (detail.status === 'error') return (
    <section className="message-panel error-panel" role="alert">
      <h1>Artwork unavailable</h1>
      <p>We couldn’t load this artwork. It may no longer be available, or the museum API may be unreachable.</p>
      <button type="button" onClick={() => setRetryAttempt((attempt) => attempt + 1)}>Try again</button>
      <p><Link to="/">Browse artworks</Link></p>
    </section>
  );

  const { data: artwork, config } = detail.response;
  const year = artwork.date_start ?? artwork.date_end;
  const date = artwork.date_display || (year === null ? null : year < 0 ? `${Math.abs(year)} BCE` : String(year));
  const metadata = [
    ['Date', date], ['Artwork type', artwork.artwork_type_title],
    ['Place of origin', artwork.place_of_origin], ['Medium', artwork.medium_display],
    ['Dimensions', artwork.dimensions], ['Department', artwork.department_title],
    ['Classification', artwork.classification_title],
  ].filter(([, value]) => value?.trim());
  const neighbors = getArtworkNeighbors(context?.ids ?? [], id);
  const backPath = context?.returnTo ?? (context?.source === 'gallery' ? '/gallery' : '/');

  function goToArtwork(neighborId: number | null) {
    if (neighborId === null || !context) return;
    navigate(`/artwork/${neighborId}`, { state: { artworkNavigation: context } });
    window.scrollTo({ top: 0 });
  }

  return (
    <article className="artwork-detail" aria-labelledby="detail-title">
      <Link className="detail-back" to={backPath}>← Back to {context?.source === 'gallery' ? 'gallery' : 'artworks'}</Link>
      <div className="detail-layout">
        <ArtworkImage key={artwork.id} artwork={artwork} iiifUrl={config.iiif_url} variant="detail" />
        <div className="detail-information">
          <h1 id="detail-title">{artwork.title || 'Untitled artwork'}</h1>
          <p className="detail-artist">{artwork.artist_title || artwork.artist_display || 'Unknown artist'}</p>
          {artwork.artist_title && artwork.artist_display && artwork.artist_display !== artwork.artist_title
            && <p className="detail-artist-display">{artwork.artist_display}</p>}
          <dl className="detail-metadata">
            {metadata.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
        </div>
      </div>
      <nav className="detail-navigation" aria-label="Artwork navigation">
        <button type="button" disabled={neighbors.previous === null} onClick={() => goToArtwork(neighbors.previous)}>← Previous</button>
        <p role="status">{context ? `${neighbors.index + 1} of ${context.ids.length}`
          : navigationError ? 'Navigation unavailable' : 'Preparing artwork navigation…'}</p>
        <button type="button" disabled={neighbors.next === null} onClick={() => goToArtwork(neighbors.next)}>Next →</button>
      </nav>
      <p className="detail-navigation-note">
        {context?.source === 'default'
          ? 'Direct links use the default public-domain collection. Artworks outside that selection are placed first.'
          : context ? `Following the ${context.source === 'list' ? 'List’s search and sort order' : 'Gallery’s filtered order'} when you opened this artwork.`
          : navigationError ? 'The artwork loaded, but its navigation collection could not be loaded.' : 'Loading the default collection for this direct link.'}
      </p>
      {navigationError && !context && <button type="button" onClick={() => setRetryAttempt((attempt) => attempt + 1)}>Retry navigation</button>}
    </article>
  );
}
