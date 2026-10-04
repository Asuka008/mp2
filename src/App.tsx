import { useEffect, useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router';
import ArtworkListView from './pages/ArtworkListView';
import ArtworkGalleryView from './pages/ArtworkGalleryView';
import ArtworkDetailView from './pages/ArtworkDetailView';

export default function App() {
  const location = useLocation();
  const showHeader = location.pathname === '/' || location.pathname === '/gallery';
  const activeView = location.pathname === '/gallery' ? 'gallery' : 'catalog';
  const [compactHeader, setCompactHeader] = useState(false);

  useEffect(() => {
    if (!showHeader) return;
    // Separate thresholds prevent flickering as the header changes height.
    function updateHeader() {
      setCompactHeader((compact) => compact ? window.scrollY > 16 : window.scrollY > 96);
    }
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    return () => window.removeEventListener('scroll', updateHeader);
  }, [showHeader]);
  return (
    <div className="app-shell">
      {showHeader && <header className={`site-header${compactHeader ? ' site-header--compact' : ''}`}>
        <div className="site-identity">
          <Link className="brand" to="/">Museum Time Machine</Link>
          <p>A journey through the Art Institute of Chicago</p>
        </div>
        <nav className="view-navigation" aria-label="Collection views">
          <Link to="/" aria-current={activeView === 'catalog' ? 'page' : undefined}>Catalog</Link>
          <Link to="/gallery" aria-current={activeView === 'gallery' ? 'page' : undefined}>Gallery</Link>
        </nav>
      </header>}
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
