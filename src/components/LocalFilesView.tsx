import React, { useRef } from 'react';
import { HardDrive, Upload, Music, FolderOpen } from 'lucide-react';
import { Track, Language } from '../types/music';
import { TrackTable } from './TrackTable';

interface LocalFilesViewProps {
  localTracks: Track[];
  currentTrackId: string | null;
  isPlaying: boolean;
  likedTrackIds: Set<string>;
  onPlayTrack: (track: Track) => void;
  onTogglePlay: () => void;
  onToggleLike: (trackId: string) => void;
  onAddToQueue: (track: Track) => void;
  onImportFiles: (files: FileList | File[]) => void;
  onDeleteLocalTrack: (trackId: string) => void;
  lang: Language;
}

export const LocalFilesView: React.FC<LocalFilesViewProps> = ({
  localTracks,
  currentTrackId,
  isPlaying,
  likedTrackIds,
  onPlayTrack,
  onTogglePlay,
  onToggleLike,
  onAddToQueue,
  onImportFiles,
  onDeleteLocalTrack,
  lang,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImportFiles(e.target.files);
    }
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-12 select-none" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.flac,.ogg,.oga,.opus,.m4a,.aac"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-[#181818] border border-white/5 rounded-lg shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-md bg-[#282828] text-[#1DB954] flex items-center justify-center">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {lang === 'ar' ? 'مكتبة الأغاني' : 'Library'}
            </h1>
            <p className="text-xs text-[#a7a7a7] mt-0.5">
              {localTracks.length} {lang === 'ar' ? 'أغنية' : 'songs'}
            </p>
          </div>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1DB954] hover:scale-105 text-black font-bold text-xs rounded-full shadow transition-all active:scale-95 cursor-pointer"
        >
          <Upload className="w-4 h-4 stroke-[2.5]" />
          <span>{lang === 'ar' ? 'استيراد ملفات صوتية' : 'Import Audio Files'}</span>
        </button>
      </div>

      {/* Drag & Drop Visual Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-[#282828] hover:border-[#1DB954]/50 rounded-lg p-6 text-center cursor-pointer transition-colors bg-[#181818]/40 hover:bg-[#181818] space-y-1.5"
      >
        <FolderOpen className="w-8 h-8 text-[#1DB954] mx-auto opacity-80" />
        <h3 className="text-xs font-bold text-white">
          {lang === 'ar'
            ? 'اسحب وأفلت ملفاتك الصوتية هنا أو انقر للاستعراض'
            : 'Drag & Drop audio files here or click to browse'}
        </h3>
        <p className="text-[11px] text-[#a7a7a7]">
          MP3, WAV, FLAC, OGG, M4A
        </p>
      </div>

      {/* Tracks listing */}
      <div className="bg-[#181818] border border-[#282828] rounded-lg overflow-hidden p-2">
        {localTracks.length > 0 ? (
          <TrackTable
            tracks={localTracks}
            currentTrackId={currentTrackId}
            isPlaying={isPlaying}
            likedTrackIds={likedTrackIds}
            onPlayTrack={onPlayTrack}
            onTogglePlay={onTogglePlay}
            onToggleLike={onToggleLike}
            onAddToQueue={onAddToQueue}
            onDeleteTrack={onDeleteLocalTrack}
            lang={lang}
          />
        ) : (
          <div className="text-center py-16 text-[#a7a7a7]">
            <Music className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#1DB954]" />
            <h4 className="text-sm font-bold text-white mb-1">
              {lang === 'ar' ? 'لم يتم استيراد أي أغانٍ بعد' : 'No songs imported yet'}
            </h4>
            <p className="text-xs text-[#a7a7a7] max-w-sm mx-auto">
              {lang === 'ar'
                ? 'استورد أغانيك المفضلة من حاسوبك لتشغيلها والتحكم بها بمعدل الصوت المتقدم.'
                : 'Click "Import Audio Files" above to load tracks from your PC.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
