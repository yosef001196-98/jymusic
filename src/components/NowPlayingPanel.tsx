import React from 'react';
import { X, Heart, Disc3 } from 'lucide-react';
import { Track, Language } from '../types/music';
import { CoverArt } from './CoverArt';
import { cleanTag } from '../utils/text';

interface NowPlayingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  isPlaying: boolean;
  isLiked: boolean;
  onToggleLike: (trackId: string) => void;
  nextTrack: Track | null;
  onPlayNextTrack: () => void;
  lang: Language;
}

export const NowPlayingPanel: React.FC<NowPlayingPanelProps> = ({
  isOpen,
  onClose,
  track,
  isPlaying,
  isLiked,
  onToggleLike,
  nextTrack,
  onPlayNextTrack,
  lang,
}) => {
  if (!isOpen) return null;

  return (
    <aside 
      className="w-80 bg-[#121212] rounded-lg flex flex-col h-full overflow-y-auto shrink-0 select-none"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Top Bar Header */}
      <div className="flex items-center justify-between px-5 py-4 sticky top-0 bg-[#121212] z-10">
        <h3 className="text-sm font-bold text-white tracking-tight">
          {lang === 'ar' ? 'قيد التشغيل' : 'Now Playing'}
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 text-[#a7a7a7] hover:text-white rounded-full hover:bg-white/10 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {track ? (
        <div className="p-5 space-y-6">
          {/* Main Large Artwork */}
          <CoverArt src={track.cover} alt={track.title} className="aspect-square w-full rounded-lg shadow-2xl" />

          {/* Track Details & Heart */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-white truncate">
                {track.title}
              </h2>
              <p className="text-sm text-[#a7a7a7] truncate mt-0.5 font-medium">
                {track.artist}
              </p>
              {(cleanTag(track.album) || track.year) && (
                <p className="text-xs text-[#71717a] truncate mt-1">
                  {[cleanTag(track.album), track.year].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <button
              onClick={() => onToggleLike(track.id)}
              className={`p-2 rounded-full transition-transform active:scale-125 ${
                isLiked ? 'text-[#1DB954]' : 'text-[#a7a7a7] hover:text-white'
              }`}
              title={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-[#1DB954]' : ''}`} />
            </button>
          </div>

          {/* Up Next / Queue Preview */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#a7a7a7] uppercase tracking-wider">
                {lang === 'ar' ? 'التالي في قائمة الانتظار' : 'Next in Queue'}
              </span>
            </div>

            {nextTrack ? (
              <div 
                onClick={onPlayNextTrack}
                className="flex items-center gap-3 p-2.5 bg-[#181818] hover:bg-[#282828] rounded-md cursor-pointer group transition-colors"
              >
                <CoverArt src={nextTrack.cover} alt={nextTrack.title} className="w-11 h-11 rounded shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate group-hover:text-[#1DB954] transition-colors">
                    {nextTrack.title}
                  </p>
                  <p className="text-[11px] text-[#a7a7a7] truncate mt-0.5">
                    {nextTrack.artist}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#71717a] italic">
                {lang === 'ar' ? 'لا توجد أغانٍ تالية في قائمة الانتظار' : 'No upcoming tracks in queue'}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-[#71717a]">
          <Disc3 className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">{lang === 'ar' ? 'لا يوجد مسار نشط' : 'No track active'}</p>
        </div>
      )}
    </aside>
  );
};
