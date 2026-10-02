import { Link, Route, Routes, useLocation } from 'react-router';
import ArtworkListView from './pages/ArtworkListView';
import ArtworkGalleryView from './pages/ArtworkGalleryView';
import ArtworkDetailView from './pages/ArtworkDetailView';
import { parseArtworkId, readArtworkNavigation } from './utils/artworkNavigation';

export default function App() {
  const location = useLocation();
  const detailId = parseArtworkId(location.pathname.match(/^\/artwork\/([^/]+)$/)?.[1]);
  const detailContext = detailId === null ? null : readArtworkNavigation(location.state, detailId);
  const activeView = location.pathname === '/gallery' || detailContext?.source === 'gallery' ? 'gallery' : 'catalog';
  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="site-identity">
          <Link className="brand" to="/">Museum Time Machine</Link>
          <p>A journey through the Art Institute of Chicago</p>
        </div>
        <nav className="view-navigation" aria-label="Collection views">
          <Link to="/" aria-current={activeView === 'catalog' ? 'page' : undefined}>Catalog</Link>
          <Link to="/gallery" aria-current={activeView === 'gallery' ? 'page' : undefined}>Gallery</Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<ArtworkListView />} />
          <Route path="/gallery" element={<ArtworkGalleryView />} />
          <Route path="/artwork/:id" element={<ArtworkDetailView />} />
          <Route path="*" element={
            <section className="message-panel">
              <h1>Page not found</h1>
              <Link to="/">Back to artworks</Link>
            </section>
          } />
        </Routes>
      </main>
    </div>
  );
}
