export interface LyricLine {
  time: number; // seconds
  text: string;
  textAr?: string;
}

export interface Track {
  id: string;
  title: string;
  titleAr?: string;
  artist: string;
  artistAr?: string;
  album: string;
  albumAr?: string;
  duration: number; // seconds
  /** Object URL of the embedded cover art. Empty string when the file has none. */
  cover: string;
  genre?: string;
  genreAr?: string;
  year?: number;
  lyrics?: LyricLine[];
  /** Original file. Persisted in IndexedDB. */
  audioBlob?: Blob;
  /** Runtime-only object URL created from `audioBlob`. Never persisted. */
  audioUrl?: string;
  /** Used to keep the library order stable across restarts (newest first). */
  addedAt: number;
  /** name|size|lastModified of the source file, used to skip duplicate imports. */
  fileKey?: string;
}

export interface Playlist {
  id: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  trackIds: string[];
  isCustom?: boolean;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type EQPresetName = 'Flat' | 'Bass Boost' | 'Pop' | 'Rock' | 'Electronic' | 'Vocal Boost' | 'Acoustic';

export interface PlayerSettings {
  volume: number;
  isMuted: boolean;
  eqPreset: EQPresetName;
  eqGains: number[];
  isRightPanelOpen: boolean;
}

export type ViewMode = 'home' | 'search' | 'library' | 'liked' | 'playlist' | 'localFiles';
export type Language = 'ar' | 'en';

export interface ElectronAPI {
  isElectron: true;
  platform: string;
  sendPlaybackState: (state: { isPlaying: boolean; title: string; artist: string }) => void;
  onMediaKeyAction: (callback: (action: 'play-pause' | 'next' | 'prev') => void) => () => void;
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
  isMaximized: () => Promise<boolean>;
  onMaximizeChange: (callback: (maximized: boolean) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
