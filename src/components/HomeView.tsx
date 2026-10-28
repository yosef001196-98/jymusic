import React from 'react';
import { Play, Pause, FolderPlus, Music } from 'lucide-react';
import { Track, Playlist, Language } from '../types/music';
import { TrackTable } from './TrackTable';
import { CoverArt } from './CoverArt';

interface HomeViewProps {
  tracks: Track[];
  playlists: Playlist[];
  currentTrackId: string | null;
  isPlaying: boolean;
  likedTrackIds: Set<string>;
  onPlayTrack: (track: Track) => void;
  onTogglePlay: () => void;
  onToggleLike: (trackId: string) => void;
  onAddToQueue: (track: Track) => void;
  onDeleteTrack?: (trackId: string) => void;
  onSelectPlaylist: (id: string) => void;
  onOpenLiked: () => void;
  onOpenLocalFiles: () => void;
  onImportClick: () => void;
  lang: Language;
}

export const HomeView: React.FC<HomeViewProps> = ({
  tracks,
  playlists,
  currentTrackId,
  isPlaying,
  likedTrackIds,
  onPlayTrack,
  onTogglePlay,
  onToggleLike,
  onAddToQueue,
  onDeleteTrack,
  onSelectPlaylist,
  onOpenLiked,
  onOpenLocalFiles,
  onImportClick,
  lang,
}) => {
  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return lang === 'ar' ? 'صباح الخير' : 'Good morning';
    if (hour < 18) return lang === 'ar' ? 'مساء الخير' : 'Good afternoon';
    return lang === 'ar' ? 'مساء الخير' : 'Good evening';
  };

  // Quick access cards
  const quickAccessItems = [
    {
      id: 'quick-liked',
      title: lang === 'ar' ? 'المقاطع المفضلة' : 'Liked Songs',
      icon: 'heart' as const,
      onClick: onOpenLiked,
      trackToPlay: tracks.find(t => likedTrackIds.has(t.id)),
    },
    {
      id: 'quick-library',
      title: lang === 'ar' ? 'مكتبة الأغاني' : 'Library',
      icon: 'drive' as const,
      onClick: onOpenLocalFiles,
      trackToPlay: tracks[0],
    },
    ...playlists.slice(0, 4).map(pl => ({
      id: pl.id,
      title: pl.name,
      icon: 'playlist' as const,
      onClick: () => onSelectPlaylist(pl.id),
      trackToPlay: tracks.find(t => pl.trackIds.includes(t.id)),
    })),
  ].slice(0, 6);

  return (
    <div className="space-y-8 pb-14 select-none" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Greeting Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
          {getGreeting()}
        </h1>
        <button
          onClick={onImportClick}
          className="flex items-center gap-2 px-4 py-2 bg-[#181818] hover:bg-[#282828] border border-[#282828] rounded-full text-xs font-semibold text-white transition-colors cursor-pointer"
        >
          <FolderPlus className="w-3.5 h-3.5 text-[#1DB954]" />
          <span>{lang === 'ar' ? 'استيراد أغانٍ' : 'Import Songs'}</span>
        </button>
      </div>

      {/* Quick access cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {quickAccessItems.map((item) => {
          const isItemActive = item.trackToPlay && item.trackToPlay.id === currentTrackId && isPlaying;

          return (
            <div
              key={item.id}
              onClick={item.onClick}
              className="group flex items-center justify-between bg-[#181818] hover:bg-[#282828] border border-white/5 rounded-md overflow-hidden cursor-pointer transition-colors shadow-sm"
            >
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <CoverArt icon={item.icon} alt={item.title} className="w-14 h-14 shrink-0" />
                <span className="font-bold text-sm text-white truncate pr-2">
                  {item.title}
                </span>
              </div>

              {item.trackToPlay && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isItemActive) {
                      onTogglePlay();
                    } else if (item.trackToPlay) {
                      onPlayTrack(item.trackToPlay);
                    }
                  }}
                  className={`w-10 h-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-lg transition-all shrink-0 mr-3.5 cursor-pointer ${
                    isItemActive
                      ? 'opacity-100 scale-100 shadow-[0_0_12px_rgba(29,185,84,0.4)]'
                      : 'opacity-0 group-hover:opacity-100 hover:scale-105'
                  }`}
                  title="Play"
                >
                  {isItemActive ? (
                    <Pause className="w-4 h-4 fill-black text-black" />
                  ) : (
                    <Play className="w-4 h-4 fill-black text-black translate-x-0.5" />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </section>

      {/* Playlists grid */}
      {playlists.length > 0 && (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {lang === 'ar' ? 'قوائم التشغيل' : 'Playlists'}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => onSelectPlaylist(pl.id)}
              className="group p-3.5 bg-[#181818] hover:bg-[#282828] border border-transparent hover:border-[#282828] rounded-md cursor-pointer transition-colors flex flex-col justify-between"
            >
              <div className="relative aspect-square w-full rounded-md overflow-hidden mb-3 bg-[#121212] shadow-md">
                <CoverArt icon="playlist" alt={pl.name} className="w-full h-full" />
                <div className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-[#1DB954] text-black flex items-center justify-center shadow-lg shadow-black/50 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 cursor-pointer">
                  <Play className="w-4 h-4 fill-black text-black translate-x-0.5" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-white truncate">
                  {pl.name}
                </h3>
                <p className="text-xs text-[#a7a7a7] truncate mt-1">
                  {pl.description || (lang === 'ar' ? 'قائمة تشغيل' : 'Playlist')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* Tracks Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {lang === 'ar' ? 'جميع الأغاني والمقاطع' : 'Songs in Library'}
          </h2>
          <span className="text-xs text-[#a7a7a7]">
            {tracks.length} {lang === 'ar' ? 'مسار' : 'tracks'}
          </span>
        </div>

        <div className="bg-[#181818] border border-[#282828] rounded-lg overflow-hidden p-2">
          {tracks.length > 0 ? (
            <TrackTable
              tracks={tracks}
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
              <Music className="w-10 h-10 mx-auto mb-2 opacity-40 text-[#1DB954]" />
              <h3 className="text-sm font-bold text-white mb-1">
                {lang === 'ar' ? 'لا توجد أغانٍ في المكتبة بعد' : 'No songs in your library yet'}
              </h3>
              <p className="text-xs text-[#a7a7a7] max-w-sm mx-auto mb-4">
                {lang === 'ar'
                  ? 'قم بإفلات ملفاتك الموسيقية أو انقر على استيراد لإضافتها مباشرة.'
                  : 'Drop your audio files or click Import Songs above to add local tracks.'}
              </p>
              <button
                onClick={onImportClick}
                className="px-5 py-2 bg-[#1DB954] text-black font-bold text-xs rounded-full shadow hover:scale-105 transition-all cursor-pointer"
              >
                {lang === 'ar' ? 'استيراد ملفات الآن' : 'Import Music Files'}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
