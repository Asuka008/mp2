import { useState } from 'react';
import { getArtworkImageUrl } from '../api/artApi';
import type { Artwork } from '../types/artwork';

interface ArtworkImageProps {
  artwork: Artwork;
  iiifUrl: string;
  variant?: 'gallery' | 'detail' | 'thumbnail';
}

export default function ArtworkImage({ artwork, iiifUrl, variant = 'gallery' }: ArtworkImageProps) {
  const imageUrl = getArtworkImageUrl(artwork.image_id, iiifUrl, variant === 'thumbnail' ? 200 : 843);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return (
    <div className={`gallery-image-frame${variant === 'detail' ? ' detail-image-frame' : variant === 'thumbnail' ? ' catalog-thumbnail' : ''}`}>
      {imageUrl && failedUrl !== imageUrl ? (
        <img src={imageUrl} alt={artwork.title || 'Untitled artwork'}
          loading={variant === 'detail' ? 'eager' : 'lazy'} decoding="async" crossOrigin="anonymous" referrerPolicy="no-referrer"
          onError={() => setFailedUrl(imageUrl)} />
      ) : (
        <div className="gallery-image-placeholder">
          <span className="placeholder-mark" aria-hidden="true">◇</span>
          <span>Image unavailable</span>
          {variant !== 'thumbnail' && <span className="placeholder-note">The artwork’s story is still part of the collection.</span>}
        </div>
      )}
    </div>
  );
}
