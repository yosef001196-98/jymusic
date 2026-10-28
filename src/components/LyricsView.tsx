import React, { useEffect, useRef } from 'react';
import { X, Mic2, Music } from 'lucide-react';
import { Track, Language } from '../types/music';
import { CoverArt } from './CoverArt';

interface LyricsViewProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  currentTime: number;
  onSeek: (seconds: number) => void;
  lang: Language;
}

export const LyricsView: React.FC<LyricsViewProps> = ({
  isOpen,
  onClose,
  track,
  currentTime,
  onSeek,
  lang,
}) => {
  const activeLineRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll active line into center
  useEffect(() => {
    if (activeLineRef.current && isOpen) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentTime, isOpen]);

  if (!isOpen || !track) return null;

  const lyrics = track.lyrics || [];

  // Determine which line is currently active
  const activeIndex = lyrics.reduce((acc, line, idx) => {
    if (currentTime >= line.time) {
      return idx;
    }
    return acc;
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div 
        className="relative bg-[#121212] border border-white/10 rounded-xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden"
        dir={lang === 'ar' ? 'rtl' : 'ltr'}
      >
        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <CoverArt src={track.cover} alt={track.title} className="w-10 h-10 rounded-md" />
            <div>
              <div className="flex items-center gap-2">
                <Mic2 className="w-3.5 h-3.5 text-[#1DB954]" />
                <h3 className="text-sm font-bold text-white truncate max-w-xs">
                  {lang === 'ar' && track.titleAr ? track.titleAr : track.title}
                </h3>
              </div>
              <p className="text-xs text-neutral-400">
                {lang === 'ar' && track.artistAr ? track.artistAr : track.artist}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lyrics.length > 0 && (
              <span className="text-xs text-[#1DB954] bg-[#1DB954]/10 px-2.5 py-0.5 rounded-full border border-[#1DB954]/25 font-semibold">
                {lang === 'ar' ? 'كلمات متزامنة' : 'Synced Lyrics'}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lyrics scroll container */}
        <div className="relative z-10 flex-1 overflow-y-auto px-8 py-12 space-y-8 text-center scroll-smooth">
          {lyrics.length > 0 ? (
            lyrics.map((line, idx) => {
              const isActive = idx === activeIndex;
              const isPast = idx < activeIndex;

              return (
                <div
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => onSeek(line.time)}
                  className={`cursor-pointer transition-all duration-300 transform select-none py-2 px-4 rounded-xl ${
                    isActive
                      ? 'scale-105 text-[#1DB954] font-black text-xl md:text-2xl drop-shadow-[0_0_24px_rgba(29,185,84,0.5)]'
                      : isPast
                      ? 'text-neutral-400 opacity-60 text-base md:text-lg hover:opacity-90 hover:text-white'
                      : 'text-neutral-500 opacity-40 text-base md:text-lg hover:opacity-80 hover:text-neutral-300'
                  }`}
                >
                  <p className="tracking-wide">
                    {lang === 'ar' && line.textAr ? line.textAr : line.text}
                  </p>
                  {line.textAr && (
                    <p className="text-xs mt-1 text-neutral-400 font-normal opacity-75">
                      {lang === 'ar' ? line.text : line.textAr}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500 space-y-2">
              <Music className="w-8 h-8 opacity-40 text-[#1DB954]" />
              <p className="text-sm">
                {lang === 'ar' ? 'لا توجد كلمات متوفرة لهذا المسار' : 'No lyrics available for this track.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer tip */}
        <div className="relative z-10 px-6 py-3 bg-black/40 border-t border-white/5 text-center text-xs text-neutral-400">
          {lang === 'ar' ? 'اضغط على أي سطر للانتقال المباشر إلى توقيته' : 'Click on any line to seek directly to that timestamp'}
        </div>
      </div>
    </div>
  );
};
