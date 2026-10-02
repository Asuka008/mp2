import { useEffect, useState } from 'react';
import { fetchArtworks, searchArtworks } from '../api/artApi';
import ArtworkListItem from '../components/ArtworkListItem';
import type { Artwork } from '../types/artwork';
import { sortArtworks } from '../utils/sortArtworks';
import type { ArtworkSortField, SortDirection } from '../utils/sortArtworks';

type ResultsState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; artworks: Artwork[]; total: number };

export default function ArtworkListView() {
  const [query, setQuery] = useState('');
  const [sortField, setSortField] = useState<ArtworkSortField>('title');
  const [direction, setDirection] = useState<SortDirection>('asc');
  const [results, setResults] = useState<ResultsState>({ status: 'loading' });
  const [retryAttempt, setRetryAttempt] = useState(0);
  const searchQuery = query.trim();

  useEffect(() => {
    const controller = new AbortController();
    setResults({ status: 'loading' });
    const timer = window.setTimeout(async () => {
      try {
        const options = { limit: 100, signal: controller.signal };
        const response = searchQuery
          ? await searchArtworks(searchQuery, options)
          : await fetchArtworks(options);
        if (!controller.signal.aborted) {
          setResults({ status: 'success', artworks: response.data, total: response.pagination.total });
        }
      } catch {
        // Cancellation is expected when the query changes or the page unmounts.
        if (!controller.signal.aborted) {
          setResults({ status: 'error', message: 'We couldn’t load artworks. Check your connection and try again.' });
        }
      }
    }, searchQuery ? 350 : 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, retryAttempt]);

  const sortedArtworks = results.status === 'success'
    ? sortArtworks(results.artworks, sortField, direction)
    : [];
  const navigation = { ids: sortedArtworks.map((artwork) => artwork.id), source: 'list' as const };

  return (
    <section aria-labelledby="list-title">
      <div className="page-intro">
        <p className="eyebrow">Art, across the centuries</p>
        <h1 id="list-title">The artwork catalog</h1>
        <p>Travel through the collection’s public-domain artworks.</p>
      </div>
      <div className="list-controls">
        <div className="search-control">
          <label htmlFor="artwork-search">Search artworks or artists</label>
          <input id="artwork-search" type="search" placeholder="Search artworks or artists..."
            value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
        <div>
          <label htmlFor="sort-field">Sort by</label>
          <select id="sort-field" value={sortField}
            onChange={(event) => setSortField(event.target.value as ArtworkSortField)}>
            <option value="title">Title</option>
            <option value="year">Year</option>
          </select>
        </div>
        <div>
          <label htmlFor="sort-direction">Order</label>
          <select id="sort-direction" value={direction}
            onChange={(event) => setDirection(event.target.value as SortDirection)}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>
      <div aria-busy={results.status === 'loading'}>
        {results.status === 'loading' && <p className="message-panel" role="status">Loading artworks…</p>}
        {results.status === 'error' && (
          <div className="message-panel error-panel" role="alert">
            <p>{results.message}</p>
            <button type="button" onClick={() => setRetryAttempt((attempt) => attempt + 1)}>Try again</button>
          </div>
        )}
        {results.status === 'success' && (
          <>
            <p className="results-summary" role="status">
              Showing {results.artworks.length} of {results.total.toLocaleString()} public-domain artworks.
              {' '}Up to 100 results are loaded; sorting applies to these results.
            </p>
            {sortedArtworks.length === 0 ? (
              <div className="message-panel">
                <h2>No artworks found</h2>
                <p>Try another title or artist, or clear your search.</p>
              </div>
            ) : (
              <ul className="artwork-list">
                {sortedArtworks.map((artwork) => <ArtworkListItem key={artwork.id} artwork={artwork}
                  navigation={navigation} />)}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}
