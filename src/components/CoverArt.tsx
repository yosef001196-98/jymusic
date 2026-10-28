import React, { useEffect, useState } from 'react';
import { Music, Heart, HardDrive, ListMusic } from 'lucide-react';

type CoverIcon = 'music' | 'heart' | 'drive' | 'playlist';

interface CoverArtProps {
  /** Embedded artwork URL. Falsy => minimal dark music icon (no stock images). */
  src?: string | null;
  alt?: string;
  className?: string;
  icon?: CoverIcon;
}

const ICONS = {
  music: Music,
  heart: Heart,
  drive: HardDrive,
  playlist: ListMusic,
} as const;

/**
 * Renders the real embedded cover when there is one, otherwise a flat dark tile
 * with a simple icon. `className` must define the size (and rounding).
 */
export const CoverArt: React.FC<CoverArtProps> = ({ src, alt = '', className = '', icon = 'music' }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        draggable={false}
        onError={() => setFailed(true)}
        className={`object-cover bg-[#282828] ${className}`}
      />
    );
  }

  const Icon = ICONS[icon];
  return (
    <div
      role="img"
      aria-label={alt}
      className={`bg-[#282828] flex items-center justify-center overflow-hidden ${className}`}
    >
      <Icon className={`w-[42%] h-[42%] ${icon === 'heart' ? 'text-[#1DB954] fill-[#1DB954]' : 'text-[#7a7a7a]'}`} />
    </div>
  );
};
