import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Repeat1, 
  Heart, 
  Mic2, 
  ListMusic, 
  Volume2, 
  VolumeX, 
  Volume1,
  Sliders,
  PanelRight
} from 'lucide-react';
import { Track, RepeatMode, Language } from '../types/music';
import { CoverArt } from './CoverArt';

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isLiked: boolean;
  isLyricsOpen: boolean;
  isVisualizerOpen: boolean;
  isQueueOpen: boolean;
  isEQOpen: boolean;
  isRightPanelOpen: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleLike: (trackId: string) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleLyrics: () => void;
  onToggleVisualizer: () => void;
  onToggleQueue: () => void;
  onToggleEQ: () => void;
  onToggleRightPanel: () => void;
  lang: Language;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffle,
  repeatMode,
  isLiked,
  isLyricsOpen,
  isQueueOpen,
  isEQOpen,
  isRightPanelOpen,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onToggleShuffle,
  onToggleRepeat,
  onToggleLike,
  onVolumeChange,
  onToggleMute,
  onToggleLyrics,
  onToggleQueue,
  onToggleEQ,
  onToggleRightPanel,
  lang,
}) => {
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentDuration = duration > 0 ? duration : currentTrack ? currentTrack.duration : 0;
  const progressPercent = currentDuration > 0 ? Math.min(100, Math.max(0, (currentTime / currentDuration) * 100)) : 0;
  const currentVolume = isMuted ? 0 : volume;
  const volumePercent = Math.min(100, Math.max(0, currentVolume * 100));

  return (
    <footer 
      className="relative z-40 h-20 shrink-0 bg-black px-4 flex items-center justify-between gap-4 select-none"
      dir="ltr"
    >
      {/* Left Zone: Current Track Details & Cover Artwork */}
      <div className="flex items-center gap-3.5 w-1/4 min-w-[180px] max-w-[320px]">
        {currentTrack ? (
          <>
            <CoverArt
              src={currentTrack.cover}
              alt={currentTrack.title}
              className="w-14 h-14 rounded-md shrink-0 shadow-md"
            />

            <div className="flex-1 min-w-0 pr-1">
              <p className="text-sm font-medium text-white truncate leading-tight">
                {currentTrack.title}
              </p>
              <p className="text-xs text-[#a7a7a7] truncate mt-1">
                {currentTrack.artist}
              </p>
            </div>

            <button
              onClick={() => onToggleLike(currentTrack.id)}
              className={`p-1.5 rounded-full transition-transform active:scale-125 cursor-pointer shrink-0 ${
                isLiked ? 'text-[#1DB954]' : 'text-[#a7a7a7] hover:text-white'
              }`}
              title={isLiked ? 'Unlike' : 'Like'}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#1DB954]' : ''}`} />
            </button>
          </>
        ) : (
          <div className="text-xs text-[#a7a7a7] italic">
            {lang === 'ar' ? 'اختر أغنية للتشغيل' : 'Select a song to play'}
          </div>
        )}
      </div>

      {/* Center Zone: playback controls & progress bar */}
      <div className="flex-1 max-w-2xl flex flex-col items-center gap-1.5 px-2">
        <div className="flex items-center gap-5">
          <button
            onClick={onToggleShuffle}
            className={`p-1 transition-colors cursor-pointer ${
              isShuffle ? 'text-[#1DB954]' : 'text-[#a7a7a7] hover:text-white'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={onPrev}
            className="text-[#a7a7a7] hover:text-white transition-colors active:scale-95 cursor-pointer"
            title="Previous"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          {/* Pure white circular play / pause button */}
          <button
            onClick={onTogglePlay}
            disabled={!currentTrack}
            className="w-9 h-9 rounded-full bg-white hover:scale-105 active:scale-95 disabled:opacity-40 text-black flex items-center justify-center transition-all shadow-md cursor-pointer"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-black text-black" />
            ) : (
              <Play className="w-4 h-4 fill-black text-black translate-x-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            className="text-[#a7a7a7] hover:text-white transition-colors active:scale-95 cursor-pointer"
            title="Next"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={onToggleRepeat}
            className={`p-1 transition-colors cursor-pointer ${
              repeatMode !== 'off' ? 'text-[#1DB954]' : 'text-[#a7a7a7] hover:text-white'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 className="w-4 h-4" />
            ) : (
              <Repeat className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Progress bar with timestamps */}
        <div className="w-full flex items-center gap-2.5">
          <span className="text-[11px] text-[#a7a7a7] font-mono w-9 text-right tabular-nums select-none">
            {formatTime(currentTime)}
          </span>

          <div className="relative flex-1 group flex items-center h-4 cursor-pointer">
            <input
              type="range"
              min={0}
              max={currentDuration || 1}
              step={0.5}
              value={Math.min(currentTime, currentDuration || 1)}
              onChange={(e) => onSeek(parseFloat(e.target.value))}
              disabled={!currentTrack}
              style={{
                background: `linear-gradient(to right, #1DB954 ${progressPercent}%, #4d4d4d ${progressPercent}%)`,
              }}
              className="w-full h-1 group-hover:h-1.5 rounded-full appearance-none cursor-pointer outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:opacity-0 group-hover:[&::-webkit-slider-thumb]:opacity-100 [&::-webkit-slider-thumb]:transition-opacity [&::-webkit-slider-thumb]:shadow-md"
            />
          </div>

          <span className="text-[11px] text-[#a7a7a7] font-mono w-9 text-left tabular-nums select-none">
            {formatTime(currentDuration)}
          </span>
        </div>
      </div>

      {/* Right Zone: Lyrics, EQ, Queue, Now Playing Panel, and Tight Volume Slider */}
      <div className="flex items-center justify-end gap-2.5 w-1/4 min-w-[180px] max-w-[320px]">
        <button
          onClick={onToggleLyrics}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            isLyricsOpen ? 'text-[#1DB954]' : 'text-[#a7a7a7] hover:text-white'
          }`}
          title="Lyrics"
        >
          <Mic2 className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleEQ}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            isEQOpen ? 'text-[#1DB954]' : 'text-[#a7a7a7] hover:text-white'
          }`}
          title="Equalizer"
        >
          <Sliders className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleQueue}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            isQueueOpen ? 'text-[#1DB954]' : 'text-[#a7a7a7] hover:text-white'
          }`}
          title="Queue"
        >
          <ListMusic className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleRightPanel}
          className={`p-1.5 rounded transition-colors cursor-pointer hidden lg:block ${
            isRightPanelOpen ? 'text-[#1DB954]' : 'text-[#a7a7a7] hover:text-white'
          }`}
          title="Now Playing View"
        >
          <PanelRight className="w-4 h-4" />
        </button>

        {/* Volume */}
        <div className="flex items-center gap-2 group ml-1">
          <button
            onClick={onToggleMute}
            className="text-[#a7a7a7] hover:text-white transition-colors cursor-pointer p-0.5"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-[#1DB954]" />
            ) : volume < 0.5 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          
          <div className="relative flex items-center h-4 w-20 md:w-24 cursor-pointer">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={currentVolume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              style={{
                background: `linear-gradient(to right, #1DB954 ${volumePercent}%, #4d4d4d ${volumePercent}%)`,
              }}
              className="w-full h-1 group-hover:h-1.5 rounded-full appearance-none cursor-pointer outline-none transition-all [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:opacity-0 group-hover:[&::-webkit-slider-thumb]:opacity-100 [&::-webkit-slider-thumb]:transition-opacity [&::-webkit-slider-thumb]:shadow"
            />
          </div>
        </div>
      </div>
    </footer>
  );
};
