import React from 'react';
import { Heart, Play, Pause } from 'lucide-react';
import { CoverArt } from './CoverArt';
import { Track, Language } from '../types/music';
import { TrackTable } from './TrackTable';

interface LikedViewProps {
  tracks: Track[];
  likedTrackIds: Set<string>;
  currentTrackId: string | null;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onTogglePlay: () => void;
  onToggleLike: (trackId: string) => void;
  onAddToQueue: (track: Track) => void;
  onDeleteTrack?: (trackId: string) => void;
  lang: Language;
}

export const LikedView: React.FC<LikedViewProps> = ({
  tracks,
  likedTrackIds,
  currentTrackId,
  isPlaying,
  onPlayTrack,
  onTogglePlay,
  onToggleLike,
  onAddToQueue,
  onDeleteTrack,
  lang,
}) => {
  const likedTracks = tracks.filter((t) => likedTrackIds.has(t.id));
  const isAnyLikedPlaying = likedTracks.some((t) => t.id === currentTrackId) && isPlaying;

  const handlePlayFirst = () => {
    if (likedTracks.length > 0) {
      if (likedTracks.some((t) => t.id === currentTrackId)) {
        onTogglePlay();
      } else {
        onPlayTrack(likedTracks[0]);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 p-6 md:p-8 rounded-xl bg-[#181818]">
        <CoverArt icon="heart" className="w-44 h-44 md:w-52 md:h-52 rounded-lg shadow-2xl shrink-0" />

        <div className="space-y-2 text-center md:text-left flex-1">
          <span className="text-xs font-bold text-[#1DB954] uppercase tracking-widest">
            {lang === 'ar' ? 'قائمة تشغيل خاصة' : 'Personal Collection'}
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            {lang === 'ar' ? 'المقاطع الصوتية المفضلة' : 'Liked Songs'}
          </h1>
          <p className="text-xs md:text-sm text-[#a7a7a7]">
            {lang === 'ar'
              ? 'جميع الأغاني والمسارات التي نقرت على أيقونة القلب للإعجاب بها.'
              : 'All tracks you loved and marked with a heart.'}
          </p>

          <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-[#a7a7a7] pt-2 font-medium">
            <span className="text-white font-bold">JY Music</span>
            <span>·</span>
            <span>{likedTracks.length} {lang === 'ar' ? 'أغنية مفضلة' : 'liked songs'}</span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      {likedTracks.length > 0 && (
        <div className="flex items-center gap-4 px-2">
          <button
            onClick={handlePlayFirst}
            className="w-14 h-14 rounded-full bg-[#1DB954] hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-lg transition-all cursor-pointer"
            title="Play Liked Songs"
          >
            {isAnyLikedPlaying ? (
              <Pause className="w-6 h-6 fill-black text-black" />
            ) : (
              <Play className="w-6 h-6 fill-black text-black translate-x-0.5" />
            )}
          </button>
        </div>
      )}

      {/* Tracks Table */}
      <div className="bg-[#181818] border border-[#282828] rounded-lg overflow-hidden p-2">
        {likedTracks.length > 0 ? (
          <TrackTable
            tracks={likedTracks}
            currentTrackId={currentTrackId}
            isPlaying={isPlaying}
            likedTrackIds={likedTrackIds}
            onPlayTrack={onPlayTrack}
            onTogglePlay={onTogglePlay}
            onToggleLike={onToggleLike}
            onAddToQueue={onAddToQueue}
            onDeleteTrack={onDeleteTrack}
            lang={lang}
          />
        ) : (
          <div className="text-center py-16 text-[#a7a7a7]">
            <Heart className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#1DB954]" />
            <h3 className="text-base font-bold text-white mb-1">
              {lang === 'ar' ? 'لم تقم بالإعجاب بأي أغانٍ بعد' : 'No liked songs yet'}
            </h3>
            <p className="text-xs text-[#a7a7a7] max-w-sm mx-auto">
              {lang === 'ar'
                ? 'اضغط على أيقونة القلب بجانب أي أغنية لإضافتها إلى قائمة مفضلاتك السريعة.'
                : 'Click the heart icon on any song to save it here for easy access.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
