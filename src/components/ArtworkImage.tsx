import { useState } from 'react';
import { getArtworkImageUrl } from '../api/artApi';
import type { Artwork } from '../types/artwork';

interface ArtworkImageProps {
  artwork: Artwork;
  iiifUrl: string;
  variant?: 'gallery' | 'detail';
}

export default function ArtworkImage({ artwork, iiifUrl, variant = 'gallery' }: ArtworkImageProps) {
  const imageUrl = getArtworkImageUrl(artwork.image_id, iiifUrl);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return (
    <div className={`gallery-image-frame${variant === 'detail' ? ' detail-image-frame' : ''}`}>
      {imageUrl && failedUrl !== imageUrl ? (
        <img src={imageUrl} alt={artwork.title || 'Untitled artwork'}
          loading={variant === 'detail' ? 'eager' : 'lazy'} decoding="async" crossOrigin="anonymous" referrerPolicy="no-referrer"
          onError={() => setFailedUrl(imageUrl)} />
      ) : (
        <div className="gallery-image-placeholder">
          <span className="placeholder-mark" aria-hidden="true">◇</span>
          <span>Image unavailable</span>
          <span className="placeholder-note">The artwork’s story is still part of the collection.</span>
        </div>
      )}
    </div>
  );
}
