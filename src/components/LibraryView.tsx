import React from 'react';
import { Plus, Library, Heart } from 'lucide-react';
import { Playlist, Language } from '../types/music';
import { CoverArt } from './CoverArt';

interface LibraryViewProps {
  playlists: Playlist[];
  likedCount: number;
  onSelectPlaylist: (id: string) => void;
  onOpenLiked: () => void;
  onCreatePlaylist: () => void;
  lang: Language;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  playlists,
  likedCount,
  onSelectPlaylist,
  onOpenLiked,
  onCreatePlaylist,
  lang,
}) => {
  return (
    <div className="space-y-8 pb-12 select-none" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-[#181818] border border-[#282828] rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#242424] flex items-center justify-center text-[#1DB954]">
            <Library className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {lang === 'ar' ? 'مكتبتك الموسيقية' : 'Your Library'}
            </h1>
            <p className="text-xs text-[#a7a7a7]">
              {playlists.length + 1} {lang === 'ar' ? 'قوائم ومجموعات محفوظة' : 'playlists and saved collections'}
            </p>
          </div>
        </div>

        <button
          onClick={onCreatePlaylist}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold bg-[#1DB954] hover:scale-105 active:scale-95 text-black rounded-full transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>{lang === 'ar' ? 'إنشاء قائمة جديدة' : 'New Playlist'}</span>
        </button>
      </div>

      {/* Grid of collections */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Liked songs */}
        <div
          onClick={onOpenLiked}
          className="group p-3.5 bg-[#181818] hover:bg-[#282828] rounded-lg cursor-pointer transition-colors"
        >
          <CoverArt icon="heart" className="aspect-square w-full rounded-md mb-3 shadow-md" />
          <h3 className="text-sm font-bold text-white truncate">
            {lang === 'ar' ? 'المقاطع المفضلة' : 'Liked Songs'}
          </h3>
          <p className="text-[11px] text-[#a7a7a7] mt-0.5">
            {likedCount} {lang === 'ar' ? 'أغنية مفضلة' : 'liked songs'}
          </p>
        </div>

        {/* Playlists */}
        {playlists.map((pl) => (
          <div
            key={pl.id}
            onClick={() => onSelectPlaylist(pl.id)}
            className="group p-3.5 bg-[#181818] hover:bg-[#282828] border border-transparent hover:border-[#282828] rounded-lg cursor-pointer transition-colors flex flex-col justify-between"
          >
            <CoverArt icon="playlist" alt={pl.name} className="aspect-square w-full rounded-md mb-3 shadow-md" />

            <div>
              <h3 className="text-sm font-bold text-white truncate group-hover:text-[#1DB954] transition-colors">
                {lang === 'ar' && pl.nameAr ? pl.nameAr : pl.name}
              </h3>
              <p className="text-[11px] text-[#a7a7a7] truncate mt-0.5">
                {lang === 'ar' ? 'قائمة تشغيل' : 'Playlist'} · {pl.trackIds.length} {lang === 'ar' ? 'مسار' : 'tracks'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
