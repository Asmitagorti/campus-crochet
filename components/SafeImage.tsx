"use client";

import { useState } from 'react';

/**
 * Image with graceful fallback — never shows a broken-image icon.
 * Used for all product / order / reference images across the site.
 */
export default function SafeImage({
  src,
  alt,
  style,
}: {
  src?: string | null;
  alt: string;
  style?: React.CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          backgroundColor: '#F7F3EC',
          color: '#B88080',
          fontSize: '1.4rem',
          ...style,
        }}
      >
        <span>🧶</span>
        <span style={{ fontSize: '0.65rem', fontWeight: 500 }}>Campus Crochet</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }}
      onError={() => setFailed(true)}
    />
  );
}
