import React from 'react';
import { Disc } from 'lucide-react';
import { cleanTag } from '../utils/text';
import { Track, Language } from '../types/music';
import { TrackTable } from './TrackTable';

interface SearchViewProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
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

export const SearchView: React.FC<SearchViewProps> = ({
  searchQuery,
  onSearchChange,
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
  const q = searchQuery.toLowerCase().trim();

  // Browse shortcuts come from the real tags of the imported files only.
  const countBy = (pick: (t: Track) => string | undefined) => {
    const map = new Map<string, number>();
    tracks.forEach((t) => {
      const v = cleanTag(pick(t));
      if (v && v !== 'Unknown Artist') map.set(v, (map.get(v) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12);
  };
  const artistChips = countBy((t) => t.artist);
  const genreChips = countBy((t) => t.genre);

  const matchingTracks = q.length === 0
    ? []
    : tracks.filter(t => 
        t.title.toLowerCase().includes(q) ||
        (t.titleAr && t.titleAr.toLowerCase().includes(q)) ||
        t.artist.toLowerCase().includes(q) ||
        (t.artistAr && t.artistAr.toLowerCase().includes(q)) ||
        (t.genre && t.genre.toLowerCase().includes(q)) ||
        (t.genreAr && t.genreAr.toLowerCase().includes(q)) ||
        (t.album && t.album.toLowerCase().includes(q)) ||
        (t.albumAr && t.albumAr.toLowerCase().includes(q))
      );

  return (
    <div className="space-y-8 pb-12 select-none" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-bold text-white tracking-tight">
        {lang === 'ar' ? 'بحث' : 'Search'}
      </h1>

      {/* If Search is Active */}
      {searchQuery.trim().length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">
              {lang === 'ar' ? `نتائج البحث عن "${searchQuery}":` : `Results for "${searchQuery}":`}
            </h2>
            <span className="text-xs text-[#a7a7a7]">
              {matchingTracks.length} {lang === 'ar' ? 'مسار تم العثور عليه' : 'tracks found'}
            </span>
          </div>

          {matchingTracks.length > 0 ? (
            <div className="bg-[#181818] border border-[#282828] rounded-lg overflow-hidden p-2">
              <TrackTable
                tracks={matchingTracks}
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
            </div>
          ) : (
            <div className="text-center py-16 bg-[#181818] rounded-lg">
              <Disc className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
              <p className="text-sm font-semibold text-white">
                {lang === 'ar' ? 'لم يتم العثور على نتائج مطابقة' : 'No matching tracks found'}
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                {lang === 'ar' ? 'جرّب كلمات أخرى أو تحقق من الإملاء' : 'Try different keywords or check the spelling'}
              </p>
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-6">
          {[
            { key: 'artists', title: lang === 'ar' ? 'الفنانون' : 'Artists', chips: artistChips },
            { key: 'genres', title: lang === 'ar' ? 'الأنواع' : 'Genres', chips: genreChips },
          ]
            .filter((g) => g.chips.length > 0)
            .map((g) => (
              <div key={g.key} className="space-y-3">
                <h2 className="text-base font-bold text-white">{g.title}</h2>
                <div className="flex flex-wrap gap-2">
                  {g.chips.map(([name, count]) => (
                    <button
                      key={name}
                      onClick={() => onSearchChange(name)}
                      className="px-4 py-2 rounded-full bg-[#181818] hover:bg-[#282828] text-xs font-semibold text-white transition-colors cursor-pointer"
                    >
                      {name} <span className="text-[#a7a7a7] font-normal">· {count}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}

          {artistChips.length === 0 && genreChips.length === 0 && (
            <p className="text-sm text-[#a7a7a7]">
              {lang === 'ar'
                ? 'اكتب في شريط البحث للعثور على أغنية أو فنان أو ألبوم.'
                : 'Type in the search bar to find a song, artist or album.'}
            </p>
          )}
        </section>
      )}
    </div>
  );
};
