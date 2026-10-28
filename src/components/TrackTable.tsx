import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Play, Pause, Heart, Clock3, MoreHorizontal, Trash2, ListPlus } from 'lucide-react';
import { Track, Language } from '../types/music';
import { cleanTag, formatDuration } from '../utils/text';
import { CoverArt } from './CoverArt';

interface TrackTableProps {
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

interface MenuState {
  trackId: string;
  x: number;
  y: number;
  /** Right edge of the anchor (the "..." button) or the cursor x for right-click. */
  anchorRight: boolean;
}

const MENU_WIDTH = 224;

// Album / Genre / Like columns appear only when the table itself is wide enough
// (the right-hand panel can shrink the content area a lot).
const GRID_NARROW = 'grid-cols-[32px_minmax(0,1fr)_72px_36px]';
const GRID_WIDE = '@3xl:grid-cols-[40px_minmax(0,4fr)_minmax(0,3fr)_minmax(0,2fr)_50px_80px_36px]';

export const TrackTable: React.FC<TrackTableProps> = ({
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
  const [menu, setMenu] = useState<MenuState | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuPos, setMenuPos] = useState<{ left: number; top: number } | null>(null);

  const closeMenu = () => setMenu(null);

  // Close on outside click, Escape, scroll or resize.
  useEffect(() => {
    if (!menu) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // The "..." button toggles the menu itself; don't close-then-reopen it.
      if (target.closest?.('[aria-haspopup="menu"]')) return;
      if (menuRef.current && !menuRef.current.contains(target)) closeMenu();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', closeMenu);
    window.addEventListener('scroll', closeMenu, true);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', closeMenu);
      window.removeEventListener('scroll', closeMenu, true);
    };
  }, [menu]);

  // Position the menu next to its anchor, flipping so it never leaves the window.
  useLayoutEffect(() => {
    if (!menu || !menuRef.current) {
      setMenuPos(null);
      return;
    }
    const { height } = menuRef.current.getBoundingClientRect();
    const margin = 8;
    let left = menu.anchorRight ? menu.x - MENU_WIDTH : menu.x;
    let top = menu.y;
    if (left + MENU_WIDTH > window.innerWidth - margin) left = window.innerWidth - MENU_WIDTH - margin;
    if (left < margin) left = margin;
    if (top + height > window.innerHeight - margin) top = Math.max(margin, menu.y - height);
    setMenuPos({ left, top });
  }, [menu]);

  const openFromButton = (e: React.MouseEvent<HTMLButtonElement>, trackId: string) => {
    e.stopPropagation();
    if (menu?.trackId === trackId) {
      closeMenu();
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    setMenuPos(null);
    setMenu({ trackId, x: r.right, y: r.bottom + 4, anchorRight: true });
  };

  const openFromContextMenu = (e: React.MouseEvent, trackId: string) => {
    e.preventDefault();
    setMenuPos(null);
    setMenu({ trackId, x: e.clientX, y: e.clientY, anchorRight: false });
  };

  const menuTrack = menu ? tracks.find((t) => t.id === menu.trackId) : undefined;
  const menuLiked = menuTrack ? likedTrackIds.has(menuTrack.id) : false;
  const rtl = lang === 'ar';

  return (
    <div className="@container w-full text-xs select-none">
      {/* Header */}
      <div
        className={`grid ${GRID_NARROW} ${GRID_WIDE} px-4 py-2 border-b border-[#282828] text-[#a7a7a7] font-medium text-[11px] uppercase tracking-wider`}
        dir={rtl ? 'rtl' : 'ltr'}
      >
        <span className="text-center">#</span>
        <span>{rtl ? 'العنوان' : 'Title'}</span>
        <span className="hidden @3xl:block">{rtl ? 'الألبوم' : 'Album'}</span>
        <span className="hidden @3xl:block">{rtl ? 'النوع' : 'Genre'}</span>
        <span className="text-center hidden @3xl:block">{rtl ? 'إعجاب' : 'Like'}</span>
        <span className="flex items-center justify-end">
          <Clock3 className="w-3.5 h-3.5" />
        </span>
        <span />
      </div>

      {/* Rows */}
      <div className="mt-1">
        {tracks.map((track, idx) => {
          const isCurrent = currentTrackId === track.id;
          const isThisPlaying = isCurrent && isPlaying;
          const isLiked = likedTrackIds.has(track.id);
          const isMenuOpen = menu?.trackId === track.id;

          // Album / Genre stay empty when the file has no real value.
          const album = cleanTag(rtl && track.albumAr ? track.albumAr : track.album);
          const genre = cleanTag(rtl && track.genreAr ? track.genreAr : track.genre);

          return (
            <div
              key={track.id}
              onContextMenu={(e) => openFromContextMenu(e, track.id)}
              onDoubleClick={() => onPlayTrack(track)}
              className={`group grid ${GRID_NARROW} ${GRID_WIDE} items-center px-4 py-2 rounded-md transition-colors ${
                isCurrent || isMenuOpen ? 'bg-[#1f1f1f]' : 'hover:bg-[#1f1f1f]'
              } ${isCurrent ? 'text-[#1DB954]' : 'text-[#a7a7a7] hover:text-white'}`}
              dir={rtl ? 'rtl' : 'ltr'}
            >
              {/* # / play toggle */}
              <div className="flex items-center justify-center">
                <button
                  onClick={() => (isCurrent ? onTogglePlay() : onPlayTrack(track))}
                  className="w-6 h-6 flex items-center justify-center cursor-pointer"
                  aria-label={isThisPlaying ? 'Pause' : 'Play'}
                >
                  {isThisPlaying ? (
                    <span className="flex group-hover:hidden items-end gap-[2px] h-3" aria-hidden>
                      <i className="w-[3px] h-full bg-[#1DB954] animate-pulse" />
                      <i className="w-[3px] h-2/3 bg-[#1DB954] animate-pulse" />
                      <i className="w-[3px] h-full bg-[#1DB954] animate-pulse" />
                    </span>
                  ) : (
                    <span className={`group-hover:hidden font-mono text-xs ${isCurrent ? 'text-[#1DB954] font-bold' : 'text-[#a7a7a7]'}`}>
                      {idx + 1}
                    </span>
                  )}
                  <span className="hidden group-hover:flex items-center justify-center text-white">
                    {isThisPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                  </span>
                </button>
              </div>

              {/* Cover + title + artist */}
              <div
                className="flex items-center gap-3 min-w-0 cursor-pointer pr-2"
                onClick={() => (isCurrent ? onTogglePlay() : onPlayTrack(track))}
              >
                <CoverArt src={track.cover} alt={track.title} className="w-10 h-10 rounded shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate text-sm leading-tight ${isCurrent ? 'text-[#1DB954]' : 'text-white'}`}>
                    {rtl && track.titleAr ? track.titleAr : track.title}
                  </p>
                  <p className="text-[12px] text-[#a7a7a7] truncate mt-0.5">
                    {rtl && track.artistAr ? track.artistAr : track.artist}
                  </p>
                </div>
              </div>

              {/* Album */}
              <div className="hidden @3xl:block truncate text-[#a7a7a7] text-xs pr-2">{album}</div>

              {/* Genre */}
              <div className="hidden @3xl:block truncate text-[#a7a7a7] text-xs pr-2">{genre}</div>

              {/* Like */}
              <div className="hidden @3xl:flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLike(track.id);
                  }}
                  className={`p-1.5 transition-transform active:scale-125 cursor-pointer ${
                    isLiked ? 'text-[#1DB954]' : 'text-[#a7a7a7] opacity-0 group-hover:opacity-100 hover:text-white'
                  }`}
                  title={isLiked ? 'Unlike' : 'Like'}
                >
                  <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-[#1DB954]' : ''}`} />
                </button>
              </div>

              {/* Duration */}
              <div className="flex items-center justify-end text-[#a7a7a7] font-mono text-[11px] tabular-nums">
                {formatDuration(track.duration)}
              </div>

              {/* Three-dots menu: always visible, far right of the row */}
              <div className="flex items-center justify-center">
                <button
                  onClick={(e) => openFromButton(e, track.id)}
                  aria-haspopup="menu"
                  aria-expanded={isMenuOpen}
                  className={`p-1.5 rounded-full transition-colors cursor-pointer hover:text-white hover:bg-white/10 ${
                    isMenuOpen ? 'text-white bg-white/10' : 'text-[#a7a7a7]'
                  }`}
                  title={rtl ? 'خيارات إضافية' : 'More options'}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dropdown (portal: never clipped by rounded / overflow-hidden cards) */}
      {menu &&
        menuTrack &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            dir={rtl ? 'rtl' : 'ltr'}
            style={{
              position: 'fixed',
              width: MENU_WIDTH,
              left: menuPos?.left ?? -9999,
              top: menuPos?.top ?? -9999,
              visibility: menuPos ? 'visible' : 'hidden',
            }}
            className="z-[80] bg-[#282828] border border-white/10 rounded-md shadow-2xl py-1 text-xs select-none"
          >
            <button
              role="menuitem"
              onClick={() => {
                onAddToQueue(menuTrack);
                closeMenu();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-[#e0e0e0] hover:bg-white/10 hover:text-white transition-colors text-start"
            >
              <ListPlus className="w-4 h-4 text-[#a7a7a7]" />
              <span>{rtl ? 'إضافة إلى قائمة الانتظار' : 'Add to Queue'}</span>
            </button>

            <button
              role="menuitem"
              onClick={() => {
                onToggleLike(menuTrack.id);
                closeMenu();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-[#e0e0e0] hover:bg-white/10 hover:text-white transition-colors text-start"
            >
              <Heart className={`w-4 h-4 ${menuLiked ? 'text-[#1DB954] fill-[#1DB954]' : 'text-[#a7a7a7]'}`} />
              <span>
                {menuLiked
                  ? rtl ? 'إزالة من المفضلة' : 'Remove from Liked Songs'
                  : rtl ? 'إضافة إلى المفضلة' : 'Save to Liked Songs'}
              </span>
            </button>

            {onDeleteTrack && (
              <>
                <div className="h-px bg-white/10 my-1" />
                <button
                  role="menuitem"
                  onClick={() => {
                    onDeleteTrack(menuTrack.id);
                    closeMenu();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-rose-400 hover:bg-white/10 hover:text-rose-300 transition-colors text-start"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{rtl ? 'حذف من المكتبة' : 'Delete / Remove from Library'}</span>
                </button>
              </>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
