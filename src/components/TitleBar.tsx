import React, { useEffect, useState } from 'react';
import { Search, X, Minus, Square, Copy } from 'lucide-react';
import { Language, ViewMode } from '../types/music';

interface TitleBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  lang: Language;
}

/**
 * Native-style desktop title bar: app name on the left, search in the middle,
 * minimize / maximize / close on the far right. The window controls only render
 * inside Electron, where they are real (the window is frameless).
 */
export const TitleBar: React.FC<TitleBarProps> = ({
  searchQuery,
  onSearchChange,
  currentView,
  onViewChange,
  lang,
}) => {
  const api = typeof window !== 'undefined' ? window.electronAPI : undefined;
  const isMac = api?.platform === 'darwin';
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    if (!api) return;
    let alive = true;
    api.isMaximized().then((m) => alive && setMaximized(m)).catch(() => {});
    const off = api.onMaximizeChange((m) => setMaximized(m));
    return () => {
      alive = false;
      off();
    };
  }, [api]);

  return (
    <header
      dir="ltr"
      className="app-drag relative z-[60] h-10 shrink-0 bg-black flex items-center select-none"
    >
      {/* Left: app name (leaves room for macOS traffic lights) */}
      <div className={`flex items-center gap-2 w-60 shrink-0 ${isMac ? 'pl-20' : 'pl-3'}`}>
        <img src="./icon.png" alt="" draggable={false} className="w-4 h-4 rounded-[3px]" />
        <span className="text-xs font-semibold text-[#b3b3b3]">JY Music</span>
      </div>

      {/* Center: search */}
      <div className="flex-1 flex justify-center px-2 min-w-0">
        <div className="app-no-drag relative w-full max-w-md" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
          <Search
            className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-[#a7a7a7] pointer-events-none ${
              lang === 'ar' ? 'right-3' : 'left-3'
            }`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              onSearchChange(e.target.value);
              if (currentView !== 'search' && e.target.value.trim().length > 0) {
                onViewChange('search');
              }
            }}
            placeholder={lang === 'ar' ? 'ما الذي تريد الاستماع إليه؟' : 'What do you want to play?'}
            className={`w-full h-8 bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] border border-transparent focus:border-white/30 rounded-full text-xs text-white placeholder-[#a7a7a7] outline-none transition-colors ${
              lang === 'ar' ? 'pr-9 pl-8' : 'pl-9 pr-8'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className={`absolute top-1/2 -translate-y-1/2 p-1 text-[#a7a7a7] hover:text-white ${
                lang === 'ar' ? 'left-2' : 'right-2'
              }`}
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: window controls (- [] X) */}
      <div className="w-60 shrink-0 flex justify-end h-full">
        {api && !isMac && (
          <div className="app-no-drag flex h-full text-[#b3b3b3]">
            <button
              onClick={() => api.minimizeWindow()}
              className="w-11 h-full flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors"
              title="Minimize"
              aria-label="Minimize"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={() => api.maximizeWindow()}
              className="w-11 h-full flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors"
              title={maximized ? 'Restore' : 'Maximize'}
              aria-label={maximized ? 'Restore' : 'Maximize'}
            >
              {maximized ? <Copy className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => api.closeWindow()}
              className="w-11 h-full flex items-center justify-center hover:bg-[#e81123] hover:text-white transition-colors"
              title="Close"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
