import React from 'react';
import { Play, Pause, Music } from 'lucide-react';
import { Track, Playlist, Language } from '../types/music';
import { TrackTable } from './TrackTable';
import { CoverArt } from './CoverArt';

interface PlaylistViewProps {
  playlist: Playlist;
  tracks: Track[];
  currentTrackId: string | null;
  isPlaying: boolean;
  likedTrackIds: Set<string>;
  onPlayTrack: (track: Track) => void;
  onTogglePlay: () => void;
  onToggleLike: (trackId: string) => void;
  onAddToQueue: (track: Track) => void;
  onDeleteTrack?: (trackId: string) => void;
  lang: Language;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlist,
  tracks,
  currentTrackId,
  isPlaying,
  likedTrackIds,
  onPlayTrack,
  onTogglePlay,
  onToggleLike,
  onAddToQueue,
  onDeleteTrack,
  lang,
}) => {
  const playlistTracks = tracks.filter((t) => playlist.trackIds.includes(t.id));
  const totalSeconds = playlistTracks.reduce((acc, t) => acc + t.duration, 0);
  const totalMinutes = Math.floor(totalSeconds / 60);

  const isCurrentPlaylistPlaying =
    playlistTracks.some((t) => t.id === currentTrackId) && isPlaying;

  const handlePlayFirst = () => {
    if (playlistTracks.length > 0) {
      if (playlistTracks.some((t) => t.id === currentTrackId)) {
        onTogglePlay();
      } else {
        onPlayTrack(playlistTracks[0]);
      }
    }
  };

  return (
    <div className="space-y-6 pb-12 select-none" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-6 p-6 md:p-8 rounded-xl bg-[#181818]">
        <CoverArt icon="playlist" alt={playlist.name} className="w-44 h-44 md:w-52 md:h-52 rounded-lg shadow-2xl shrink-0" />

        <div className="space-y-2 text-center md:text-left flex-1">
          <span className="text-xs font-bold text-[#1DB954] uppercase tracking-widest">
            {lang === 'ar' ? 'قائمة تشغيل' : 'Playlist'}
          </span>
          <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight">
            {lang === 'ar' && playlist.nameAr ? playlist.nameAr : playlist.name}
          </h1>
          <p className="text-xs md:text-sm text-[#a7a7a7] max-w-xl">
            {lang === 'ar' && playlist.descriptionAr ? playlist.descriptionAr : playlist.description}
          </p>

          <div className="flex items-center justify-center md:justify-start gap-2 text-xs text-[#a7a7a7] pt-2 font-medium">
            <span className="text-white font-bold">JY Music</span>
            <span>·</span>
            <span>{playlistTracks.length} {lang === 'ar' ? 'أغنية' : 'songs'}</span>
            <span>·</span>
            <span>{totalMinutes} {lang === 'ar' ? 'دقيقة تقريباً' : 'min approx'}</span>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-4 px-2">
        <button
          onClick={handlePlayFirst}
          disabled={playlistTracks.length === 0}
          className="w-14 h-14 rounded-full bg-[#1DB954] hover:scale-105 active:scale-95 text-black flex items-center justify-center shadow-lg transition-all disabled:opacity-40 cursor-pointer"
          title="Play Playlist"
        >
          {isCurrentPlaylistPlaying ? (
            <Pause className="w-6 h-6 fill-black text-black" />
          ) : (
            <Play className="w-6 h-6 fill-black text-black translate-x-0.5" />
          )}
        </button>
      </div>

      {/* Tracks Table */}
      <div className="bg-[#181818] border border-[#282828] rounded-lg overflow-hidden p-2">
        {playlistTracks.length > 0 ? (
          <TrackTable
            tracks={playlistTracks}
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
          <div className="text-center py-12 text-[#a7a7a7]">
            <Music className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#1DB954]" />
            <p className="text-sm">
              {lang === 'ar' ? 'لا توجد أغانٍ في هذه القائمة بعد.' : 'No songs in this playlist yet.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
