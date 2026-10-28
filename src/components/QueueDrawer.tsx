import React from 'react';
import { X, Play, Trash2, ListMusic, Music } from 'lucide-react';
import { Track, Language } from '../types/music';
import { CoverArt } from './CoverArt';
import { formatDuration } from '../utils/text';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  queue: Track[];
  onPlayTrack: (track: Track) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
  lang: Language;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  isOpen,
  onClose,
  currentTrack,
  queue,
  onPlayTrack,
  onRemoveFromQueue,
  onClearQueue,
  lang,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-10 bottom-20 right-2 z-50 w-96 max-w-full bg-[#121212] border border-white/10 rounded-lg shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#181818] rounded-t-lg">
        <div className="flex items-center gap-2">
          <ListMusic className="w-5 h-5 text-[#1DB954]" />
          <h3 className="text-base font-bold text-white">
            {lang === 'ar' ? 'قائمة الانتظار (Queue)' : 'Play Queue'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <button
              onClick={onClearQueue}
              className="text-xs text-neutral-400 hover:text-red-400 p-1.5 rounded transition-colors"
              title={lang === 'ar' ? 'مسح القائمة' : 'Clear Queue'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Currently playing section */}
        <div>
          <h4 className="text-xs font-semibold text-[#a7a7a7] uppercase tracking-wider mb-2">
            {lang === 'ar' ? 'يعمل الآن' : 'Now Playing'}
          </h4>
          {currentTrack ? (
            <div className="flex items-center gap-3 p-3 bg-[#181818] border border-[#1DB954]/30 rounded-lg">
              <CoverArt src={currentTrack.cover} alt={currentTrack.title} className="w-12 h-12 rounded-md shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[#1DB954] truncate">
                  {lang === 'ar' && currentTrack.titleAr ? currentTrack.titleAr : currentTrack.title}
                </p>
                <p className="text-xs text-[#a7a7a7] truncate">
                  {lang === 'ar' && currentTrack.artistAr ? currentTrack.artistAr : currentTrack.artist}
                </p>
              </div>
              <span className="text-xs text-[#a7a7a7] font-mono">
                {formatDuration(currentTrack.duration)}
              </span>
            </div>
          ) : (
            <p className="text-xs text-[#a7a7a7] italic">
              {lang === 'ar' ? 'لا يوجد مسار قيد التشغيل حالياً' : 'Nothing playing right now'}
            </p>
          )}
        </div>

        {/* Next up queue */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-[#a7a7a7] uppercase tracking-wider">
              {lang === 'ar' ? 'المسارات التالية في الانتظار' : 'Next In Queue'}
            </h4>
            <span className="text-xs text-[#a7a7a7]">{queue.length}</span>
          </div>

          {queue.length > 0 ? (
            <div className="space-y-1.5">
              {queue.map((track, idx) => (
                <div
                  key={`${track.id}-${idx}`}
                  className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                >
                  <div
                    onClick={() => onPlayTrack(track)}
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                  >
                    <div className="relative w-9 h-9 rounded-md overflow-hidden shrink-0">
                      <CoverArt src={track.cover} alt={track.title} className="w-full h-full" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Play className="w-3.5 h-3.5 text-white fill-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate group-hover:text-[#1DB954] transition-colors">
                        {lang === 'ar' && track.titleAr ? track.titleAr : track.title}
                      </p>
                      <p className="text-[11px] text-[#a7a7a7] truncate">
                        {lang === 'ar' && track.artistAr ? track.artistAr : track.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {formatDuration(track.duration)}
                    </span>
                    <button
                      onClick={() => onRemoveFromQueue(idx)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-red-400 rounded transition-all"
                      title={lang === 'ar' ? 'إزالة' : 'Remove'}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-500">
              <Music className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#1DB954]" />
              <p className="text-xs">
                {lang === 'ar'
                  ? 'قائمة الانتظار فارغة. أضف أغاني من قائمة (...) بجانب أي أغنية.'
                  : 'Queue is empty. Add songs to play them next!'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
