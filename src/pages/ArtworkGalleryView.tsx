import { useEffect, useState } from 'react';
import { fetchArtworks } from '../api/artApi';
import type { ArtworkCollectionResponse } from '../api/artApi';
import ArtworkGalleryCard from '../components/ArtworkGalleryCard';
import { filterArtworks, getArtworkType } from '../utils/filterArtworks';
import type { HistoricalEra } from '../utils/filterArtworks';
import './ArtworkGalleryView.css';

type GalleryState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; response: ArtworkCollectionResponse };

export default function ArtworkGalleryView() {
  const [gallery, setGallery] = useState<GalleryState>({ status: 'loading' });
  const [artworkType, setArtworkType] = useState<string | null>(null);
  const [era, setEra] = useState<HistoricalEra>('all');
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setGallery({ status: 'loading' });
    // Defer to allow React StrictMode cleanup to cancel its initial effect.
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetchArtworks({ limit: 100, signal: controller.signal });
        if (!controller.signal.aborted) setGallery({ status: 'success', response });
      } catch {
        if (!controller.signal.aborted) setGallery({ status: 'error' });
      }
    }, 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [retryAttempt]);

  const artworks = gallery.status === 'success' ? gallery.response.data : [];
  const types = [...new Set(artworks.map(getArtworkType))].sort((a, b) => a.localeCompare(b));
  const filteredArtworks = filterArtworks(artworks, artworkType, era);
  const navigation = { ids: filteredArtworks.map((artwork) => artwork.id), source: 'gallery' as const };

  return (
    <section aria-labelledby="gallery-title">
      <div className="page-intro gallery-intro">
        <p className="eyebrow">The digital collection</p>
        <h1 id="gallery-title">A gallery through time</h1>
        <p>Look closely. Discover the forms and stories that connect centuries.</p>
      </div>
      <div className="gallery-filters" aria-label="Gallery filters">
        <div>
          <label htmlFor="gallery-type">Artwork type / classification</label>
          <select id="gallery-type" value={artworkType ?? ''}
            disabled={gallery.status !== 'success'}
            onChange={(event) => setArtworkType(event.target.value || null)}>
            <option value="">All types</option>
            {types.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="gallery-era">Historical era</label>
          <select id="gallery-era" value={era} disabled={gallery.status !== 'success'}
            onChange={(event) => setEra(event.target.value as HistoricalEra)}>
            <option value="all">All eras</option>
            <option value="before-1800">Before 1800</option>
            <option value="1800-1899">1800–1899</option>
            <option value="1900-1949">1900–1949</option>
            <option value="1950-present">1950–Present</option>
            <option value="unknown">Date unknown</option>
          </select>
        </div>
      </div>
      <div aria-busy={gallery.status === 'loading'}>
        {gallery.status === 'loading' && <p className="message-panel" role="status">Opening the collection…</p>}
        {gallery.status === 'error' && (
          <div className="message-panel error-panel" role="alert">
            <p>We couldn’t load the gallery. Check your connection and try again.</p>
            <button type="button" onClick={() => setRetryAttempt((attempt) => attempt + 1)}>Try again</button>
          </div>
        )}
        {gallery.status === 'success' && (
          <>
            <p className="results-summary" role="status">
              Showing {filteredArtworks.length} of {artworks.length} artworks in this collection selection.
              {' '}Filters apply to these first 100 public-domain results; eras use the earliest known year.
            </p>
            {filteredArtworks.length ? (
              <ul className="gallery-grid">
                {filteredArtworks.map((artwork) => (
                  <ArtworkGalleryCard key={artwork.id} artwork={artwork} iiifUrl={gallery.response.config.iiif_url}
                    navigation={navigation} />
                ))}
              </ul>
            ) : (
              <div className="message-panel">
                <h2>No artworks match these filters</h2>
                <p>Select All types or All eras to explore more of the collection.</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
