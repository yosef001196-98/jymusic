import React, { useState } from 'react';
import { 
  Home, 
  Search, 
  Library, 
  Plus, 
  Heart, 
  HardDrive, 
  FolderPlus,
  MoreVertical, 
  Edit2, 
  Trash2,
  Languages
} from 'lucide-react';
import { Playlist, ViewMode, Language } from '../types/music';
import { CoverArt } from './CoverArt';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  playlists: Playlist[];
  selectedPlaylistId: string | null;
  onSelectPlaylist: (id: string) => void;
  onCreatePlaylistClick: () => void;
  onRenamePlaylist: (id: string, newName: string) => void;
  onDeletePlaylist: (id: string) => void;
  onImportClick: () => void;
  likedCount: number;
  localFilesCount: number;
  lang: Language;
  onToggleLang: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onViewChange,
  playlists,
  selectedPlaylistId,
  onSelectPlaylist,
  onCreatePlaylistClick,
  onRenamePlaylist,
  onDeletePlaylist,
  onImportClick,
  likedCount,
  localFilesCount,
  lang,
  onToggleLang,
}) => {
  const [activeMenuPlaylistId, setActiveMenuPlaylistId] = useState<string | null>(null);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const startRename = (pl: Playlist) => {
    setEditingPlaylistId(pl.id);
    setEditName(pl.name);
    setActiveMenuPlaylistId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editName.trim()) {
      onRenamePlaylist(id, editName.trim());
    }
    setEditingPlaylistId(null);
  };

  return (
    <aside 
      className="w-64 bg-black flex flex-col shrink-0 gap-2 select-none"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      {/* Top Box: Brand & Navigation */}
      <div className="bg-[#121212] rounded-lg p-3.5 flex flex-col gap-3">
        {/* Brand Lockup */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <img src="./icon.png" alt="" draggable={false} className="w-7 h-7 rounded-md" />
            <span className="font-bold text-sm tracking-tight text-white">
              JY Music
            </span>
          </div>

          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 text-[11px] font-medium text-[#a7a7a7] hover:text-white px-2 py-0.5 rounded hover:bg-white/5 transition-colors"
            title={lang === 'ar' ? 'English' : 'عربي'}
          >
            <Languages className="w-3 h-3 text-[#1DB954]" />
            <span>{lang === 'ar' ? 'EN' : 'عربي'}</span>
          </button>
        </div>

        {/* Primary Nav Links */}
        <nav className="flex flex-col gap-0.5 text-sm font-semibold">
          <button
            onClick={() => onViewChange('home')}
            className={`flex items-center gap-4 px-3 py-2.5 rounded-md transition-colors text-left ${
              currentView === 'home'
                ? 'text-white font-bold bg-[#181818]'
                : 'text-[#a7a7a7] hover:text-white hover:bg-[#181818]/60'
            }`}
          >
            <Home className="w-5 h-5 shrink-0" />
            <span>{lang === 'ar' ? 'الصفحة الرئيسية' : 'Home'}</span>
          </button>

          <button
            onClick={() => onViewChange('search')}
            className={`flex items-center gap-4 px-3 py-2.5 rounded-md transition-colors text-left ${
              currentView === 'search'
                ? 'text-white font-bold bg-[#181818]'
                : 'text-[#a7a7a7] hover:text-white hover:bg-[#181818]/60'
            }`}
          >
            <Search className="w-5 h-5 shrink-0" />
            <span>{lang === 'ar' ? 'بحث واستكشاف' : 'Search'}</span>
          </button>
        </nav>
      </div>

      {/* Library Box */}
      <div className="flex-1 bg-[#121212] rounded-lg p-3 flex flex-col min-h-0">
        {/* Library Header */}
        <div className="flex items-center justify-between px-2 py-1 mb-2">
          <button 
            onClick={() => onViewChange('library')}
            className="flex items-center gap-2.5 text-xs font-bold text-[#a7a7a7] hover:text-white transition-colors"
          >
            <Library className="w-4 h-4" />
            <span>{lang === 'ar' ? 'مكتبتك الموسيقية' : 'Your Library'}</span>
          </button>
          
          <div className="flex items-center gap-1">
            <button
              onClick={onImportClick}
              className="p-1.5 text-[#a7a7a7] hover:text-white hover:bg-white/10 rounded-full transition-colors"
              title={lang === 'ar' ? 'استيراد أغانٍ من الجهاز' : 'Import songs'}
            >
              <FolderPlus className="w-4 h-4 text-[#1DB954]" />
            </button>
            <button
              onClick={onCreatePlaylistClick}
              className="p-1.5 text-[#a7a7a7] hover:text-white hover:bg-white/10 rounded-full transition-colors"
              title={lang === 'ar' ? 'إنشاء قائمة تشغيل' : 'Create Playlist'}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Liked Songs Tile */}
        <button
          onClick={() => onViewChange('liked')}
          className={`flex items-center gap-3 p-2 rounded-md transition-colors text-left mb-1 ${
            currentView === 'liked'
              ? 'bg-[#242424] text-white'
              : 'text-[#a7a7a7] hover:text-white hover:bg-[#181818]'
          }`}
        >
          <CoverArt icon="heart" className="w-9 h-9 rounded shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {lang === 'ar' ? 'المقاطع المفضلة' : 'Liked Songs'}
            </p>
            <p className="text-[11px] text-[#a7a7a7]">
              {likedCount} {lang === 'ar' ? 'أغنية' : 'songs'}
            </p>
          </div>
        </button>

        {/* Local Files Tile */}
        <button
          onClick={() => onViewChange('localFiles')}
          className={`flex items-center gap-3 p-2 rounded-md transition-colors text-left mb-2 ${
            currentView === 'localFiles'
              ? 'bg-[#242424] text-white'
              : 'text-[#a7a7a7] hover:text-white hover:bg-[#181818]'
          }`}
        >
          <CoverArt icon="drive" className="w-9 h-9 rounded shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">
              {lang === 'ar' ? 'مكتبة الأغاني' : 'Library'}
            </p>
            <p className="text-[11px] text-[#a7a7a7]">
              {localFilesCount} {lang === 'ar' ? 'أغنية' : 'songs'}
            </p>
          </div>
        </button>

        <div className="border-t border-white/5 my-1" />

        {/* Playlists List */}
        <div className="flex-1 overflow-y-auto space-y-0.5 pe-1">
          {playlists.map((pl) => {
            const isSelected = currentView === 'playlist' && selectedPlaylistId === pl.id;
            const isEditing = editingPlaylistId === pl.id;

            return (
              <div
                key={pl.id}
                className={`relative group flex items-center justify-between p-2 rounded-md transition-colors ${
                  isSelected
                    ? 'bg-[#242424] text-white font-bold'
                    : 'text-[#a7a7a7] hover:text-white hover:bg-[#181818]'
                }`}
              >
                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleSaveRename(pl.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(pl.id);
                      if (e.key === 'Escape') setEditingPlaylistId(null);
                    }}
                    autoFocus
                    className="w-full px-2 py-1 bg-black/60 border border-[#1DB954] rounded text-xs text-white outline-none"
                  />
                ) : (
                  <div
                    onClick={() => onSelectPlaylist(pl.id)}
                    className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                  >
                    <CoverArt icon="playlist" alt={pl.name} className="w-8 h-8 rounded shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs truncate ${isSelected ? 'text-[#1DB954]' : 'text-white'}`}>
                        {pl.name}
                      </p>
                      <p className="text-[10px] text-[#71717a] truncate">
                        {pl.isCustom ? (lang === 'ar' ? 'قائمتك' : 'Custom') : (lang === 'ar' ? 'قائمة تشغيل' : 'Playlist')} · {pl.trackIds.length}
                      </p>
                    </div>
                  </div>
                )}

                {/* CRUD Dropdown for custom playlists */}
                {pl.isCustom && !isEditing && (
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuPlaylistId(activeMenuPlaylistId === pl.id ? null : pl.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#a7a7a7] hover:text-white rounded"
                    >
                      <MoreVertical className="w-3.5 h-3.5" />
                    </button>

                    {activeMenuPlaylistId === pl.id && (
                      <div 
                        className="absolute right-0 top-6 z-30 w-32 bg-[#222222] border border-white/10 rounded-md shadow-xl py-1 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => startRename(pl)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-neutral-200 hover:bg-white/10 text-left"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'إعادة تسمية' : 'Rename'}</span>
                        </button>
                        <button
                          onClick={() => {
                            onDeletePlaylist(pl.id);
                            setActiveMenuPlaylistId(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-400 hover:bg-rose-500/10 text-left"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'حذف القائمة' : 'Delete'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
