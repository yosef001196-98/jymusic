/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Track, Playlist, ViewMode, RepeatMode, Language, EQPresetName } from './types/music';
import { audioEngine, EQ_PRESETS } from './services/audioEngine';
import { storageDB } from './services/db';
import { parseAudioMetadata } from './services/metadataParser';
import { Sidebar } from './components/Sidebar';
import { TitleBar } from './components/TitleBar';
import { PlayerBar } from './components/PlayerBar';
import { HomeView } from './components/HomeView';
import { SearchView } from './components/SearchView';
import { PlaylistView } from './components/PlaylistView';
import { LikedView } from './components/LikedView';
import { LibraryView } from './components/LibraryView';
import { LocalFilesView } from './components/LocalFilesView';
import { NowPlayingPanel } from './components/NowPlayingPanel';
import { EqualizerModal } from './components/EqualizerModal';
import { LyricsView } from './components/LyricsView';
import { VisualizerModal } from './components/VisualizerModal';
import { QueueDrawer } from './components/QueueDrawer';
import { CreatePlaylistModal } from './components/CreatePlaylistModal';
import { UploadCloud } from 'lucide-react';

const AUDIO_EXT = /\.(mp3|wav|flac|ogg|oga|opus|m4a|aac)$/i;
const isAudioFile = (f: File) => f.type.startsWith('audio/') || AUDIO_EXT.test(f.name);
const fileKey = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;

export default function App() {
  const [lang, setLang] = useState<Language>('en');

  // Library & collections
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [likedTrackIds, setLikedTrackIds] = useState<Set<string>>(new Set());

  // Navigation
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);

  // Playback
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [queue, setQueue] = useState<Track[]>([]);

  // Equalizer
  const [eqPreset, setEqPreset] = useState<EQPresetName>('Flat');
  const [eqGains, setEqGains] = useState<number[]>([...EQ_PRESETS['Flat']]);

  // Modals
  const [isEQOpen, setIsEQOpen] = useState<boolean>(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState<boolean>(false);
  const [isVisualizerOpen, setIsVisualizerOpen] = useState<boolean>(false);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState<boolean>(false);

  // Drag & drop
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);
  const dragDepth = useRef(0);
  const globalFileInputRef = useRef<HTMLInputElement | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 2800);
  };

  // 1. Restore persisted data
  useEffect(() => {
    async function loadOfflineStorage() {
      const saved = await storageDB.getLocalTracks();
      if (saved.length > 0) setTracks(saved);

      const savedPlaylists = await storageDB.getPlaylists();
      if (savedPlaylists) {
        // Drop the built-in demo playlists written by older builds.
        setPlaylists(savedPlaylists.filter((p) => p.isCustom));
      }

      const savedLiked = await storageDB.getLikedIds();
      if (savedLiked) setLikedTrackIds(new Set(savedLiked));

      const s = await storageDB.getSettings();
      if (s) {
        if (typeof s.volume === 'number') {
          setVolume(s.volume);
          audioEngine.setVolume(s.volume);
        }
        if (typeof s.isMuted === 'boolean') {
          setIsMuted(s.isMuted);
          audioEngine.setMuted(s.isMuted);
        }
        if (s.eqPreset && EQ_PRESETS[s.eqPreset]) setEqPreset(s.eqPreset);
        if (s.eqGains) {
          setEqGains(s.eqGains);
          audioEngine.setEQGains(s.eqGains);
        }
        if (typeof s.isRightPanelOpen === 'boolean') setIsRightPanelOpen(s.isRightPanelOpen);
      }
    }
    loadOfflineStorage();
  }, []);

  // ---------------------------------------------------------------------
  // Playback. Everything goes through the single global `audioEngine`:
  // starting a track always stops whatever was playing before it.
  // ---------------------------------------------------------------------

  const handlePlayTrack = (track: Track) => {
    setCurrentTrack(track);
    setDuration(track.duration);
    setCurrentTime(0);
    setIsPlaying(true);
    audioEngine.playTrack(track, 0);
  };

  const handleTogglePlay = () => {
    if (!currentTrack) {
      if (tracks.length > 0) handlePlayTrack(tracks[0]);
      return;
    }
    if (audioEngine.isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else if (audioEngine.activeTrackId === currentTrack.id) {
      audioEngine.resume();
      setIsPlaying(true);
    } else {
      handlePlayTrack(currentTrack);
    }
  };

  const handleSeek = (seconds: number) => {
    setCurrentTime(seconds);
    audioEngine.seek(seconds);
  };

  /** `auto` = triggered by the track ending rather than by the Next button. */
  const advance = (auto: boolean) => {
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      handlePlayTrack(next);
      return;
    }
    if (tracks.length === 0) return;

    const idx = currentTrack ? tracks.findIndex((t) => t.id === currentTrack.id) : -1;

    if (isShuffle && tracks.length > 1) {
      let r = Math.floor(Math.random() * tracks.length);
      if (r === idx) r = (r + 1) % tracks.length;
      handlePlayTrack(tracks[r]);
      return;
    }

    let nextIdx = idx + 1;
    if (nextIdx >= tracks.length) {
      if (auto && repeatMode !== 'all') {
        // Reached the end of the library: stop.
        setIsPlaying(false);
        setCurrentTime(0);
        return;
      }
      nextIdx = 0;
    }
    handlePlayTrack(tracks[nextIdx]);
  };

  const handleNext = () => advance(false);

  const handlePrev = () => {
    if (currentTime > 3) {
      handleSeek(0);
      return;
    }
    if (!currentTrack || tracks.length === 0) return;
    const idx = tracks.findIndex((t) => t.id === currentTrack.id);
    handlePlayTrack(tracks[(idx - 1 + tracks.length) % tracks.length]);
  };

  const handleTrackEnded = () => {
    if (repeatMode === 'one' && currentTrack) {
      handlePlayTrack(currentTrack);
    } else {
      advance(true);
    }
  };

  // The engine is wired once; it always calls the freshest handlers via this ref.
  const handlersRef = useRef({ onEnded: handleTrackEnded, togglePlay: handleTogglePlay, next: handleNext, prev: handlePrev });
  handlersRef.current = { onEnded: handleTrackEnded, togglePlay: handleTogglePlay, next: handleNext, prev: handlePrev };

  useEffect(() => {
    audioEngine.setCallbacks({
      onTimeUpdate: (time) => setCurrentTime(time),
      onEnded: () => handlersRef.current.onEnded(),
      onDuration: (d) => setDuration(d),
      onError: (message) => {
        setIsPlaying(false);
        showToast(message);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Physical media keys / tray (Electron)
  useEffect(() => {
    const off = window.electronAPI?.onMediaKeyAction((action) => {
      const h = handlersRef.current;
      if (action === 'play-pause') h.togglePlay();
      else if (action === 'next') h.next();
      else if (action === 'prev') h.prev();
    });
    return () => off?.();
  }, []);

  // Tray tooltip
  useEffect(() => {
    if (currentTrack) {
      window.electronAPI?.sendPlaybackState({
        isPlaying,
        title: currentTrack.title,
        artist: currentTrack.artist,
      });
    }
  }, [isPlaying, currentTrack]);

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    setIsMuted(false);
    audioEngine.setVolume(vol);
    audioEngine.setMuted(false);
    storageDB.saveSettings({ volume: vol, isMuted: false });
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    audioEngine.setMuted(next);
    storageDB.saveSettings({ isMuted: next });
  };

  const handleToggleShuffle = () => {
    setIsShuffle(!isShuffle);
    showToast(!isShuffle ? 'Shuffle Enabled' : 'Shuffle Disabled');
  };

  const handleToggleRepeat = () => {
    const next: RepeatMode = repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off';
    setRepeatMode(next);
    showToast(next === 'all' ? 'Repeat All' : next === 'one' ? 'Repeat Current Track' : 'Repeat Off');
  };

  const handleToggleLike = (trackId: string) => {
    const next = new Set(likedTrackIds);
    if (next.has(trackId)) {
      next.delete(trackId);
      showToast('Removed from Liked Songs');
    } else {
      next.add(trackId);
      showToast('Added to Liked Songs');
    }
    setLikedTrackIds(next);
    storageDB.saveLikedIds(Array.from(next));
  };

  const handleAddToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
    showToast(`Added "${track.title}" to Queue`);
  };

  const handleRemoveFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearQueue = () => {
    setQueue([]);
    showToast('Queue cleared');
  };

  // Equalizer
  const handleChangeEQPreset = (preset: EQPresetName) => {
    setEqPreset(preset);
    const gains = [...EQ_PRESETS[preset]];
    setEqGains(gains);
    audioEngine.setEQGains(gains);
    storageDB.saveSettings({ eqPreset: preset, eqGains: gains });
  };

  const handleChangeBandGain = (bandIndex: number, gain: number) => {
    const updated = [...eqGains];
    updated[bandIndex] = gain;
    setEqGains(updated);
    audioEngine.setEQGains(updated);
    storageDB.saveSettings({ eqGains: updated });
  };

  const handleResetEQ = () => {
    handleChangeEQPreset('Flat');
    showToast('Equalizer reset to Flat (0dB)');
  };

  // Playlists
  const handleSelectPlaylist = (id: string) => {
    setSelectedPlaylistId(id);
    setCurrentView('playlist');
  };

  const handleCreatePlaylist = (name: string, description: string) => {
    const newPlaylist: Playlist = {
      id: `pl-${Date.now()}`,
      name,
      description,
      trackIds: tracks.slice(0, 3).map((t) => t.id),
      isCustom: true,
    };
    const updated = [newPlaylist, ...playlists];
    setPlaylists(updated);
    storageDB.savePlaylists(updated);
    setSelectedPlaylistId(newPlaylist.id);
    setCurrentView('playlist');
    showToast(`Playlist "${name}" created!`);
  };

  const handleRenamePlaylist = (id: string, newName: string) => {
    const updated = playlists.map((p) => (p.id === id ? { ...p, name: newName } : p));
    setPlaylists(updated);
    storageDB.savePlaylists(updated);
    showToast('Playlist renamed');
  };

  const handleDeletePlaylist = (id: string) => {
    const updated = playlists.filter((p) => p.id !== id);
    setPlaylists(updated);
    storageDB.savePlaylists(updated);
    if (selectedPlaylistId === id) {
      setCurrentView('home');
      setSelectedPlaylistId(null);
    }
    showToast('Playlist deleted');
  };

  // ---------------------------------------------------------------------
  // Import: real ID3 tags + embedded artwork via jsmediatags
  // ---------------------------------------------------------------------

  const handleImportFiles = async (files: FileList | File[]) => {
    const candidates = Array.from(files).filter(isAudioFile);
    if (candidates.length === 0) {
      showToast('No valid audio files detected (.mp3, .wav, .flac, .ogg, .m4a)');
      return;
    }

    const known = new Set(tracks.map((t) => t.fileKey).filter(Boolean));
    const fresh = candidates.filter((f) => !known.has(fileKey(f)));
    if (fresh.length === 0) {
      showToast('These files are already in your library');
      return;
    }

    showToast(`Importing ${fresh.length} file(s)...`);

    const base = Date.now() * 1000;
    const imported: Track[] = [];

    for (let i = 0; i < fresh.length; i++) {
      const file = fresh[i];
      const meta = await parseAudioMetadata(file);

      const track: Track = {
        id: crypto.randomUUID(),
        title: meta.title,
        artist: meta.artist,
        album: meta.album,
        genre: meta.genre,
        year: meta.year,
        duration: meta.duration,
        cover: meta.coverUrl,
        audioBlob: file,
        audioUrl: URL.createObjectURL(file),
        addedAt: base + (fresh.length - i), // keeps file order, newest batch first
        fileKey: fileKey(file),
      };

      await storageDB.saveLocalTrack(track, meta.coverBlob);
      imported.push(track);
    }

    setTracks((prev) => [...imported, ...prev]);
    setCurrentView('localFiles');
    // Never interrupt something that is already playing.
    if (!audioEngine.isPlaying) handlePlayTrack(imported[0]);

    const skipped = candidates.length - fresh.length;
    showToast(
      `Imported ${imported.length} song(s)` + (skipped > 0 ? ` (${skipped} already in library)` : '')
    );
  };

  const handleDeleteTrack = async (trackId: string) => {
    const target = tracks.find((t) => t.id === trackId);
    if (!target) return;

    if (currentTrack?.id === trackId) {
      audioEngine.stop();
      setIsPlaying(false);
      setCurrentTrack(null);
      setCurrentTime(0);
      setDuration(0);
    }
    audioEngine.forgetTrack(trackId);

    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    setQueue((prev) => prev.filter((t) => t.id !== trackId));

    const nextLiked = new Set(likedTrackIds);
    nextLiked.delete(trackId);
    setLikedTrackIds(nextLiked);
    storageDB.saveLikedIds(Array.from(nextLiked));

    const nextPlaylists = playlists.map((pl) => ({
      ...pl,
      trackIds: pl.trackIds.filter((id) => id !== trackId),
    }));
    setPlaylists(nextPlaylists);
    storageDB.savePlaylists(nextPlaylists);

    await storageDB.deleteLocalTrack(trackId);
    if (target.audioUrl) URL.revokeObjectURL(target.audioUrl);
    if (target.cover) URL.revokeObjectURL(target.cover);
    showToast(lang === 'ar' ? 'تم حذف الأغنية من المكتبة' : 'Track removed from library');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const isEditable = (el: HTMLElement) =>
      el.tagName === 'TEXTAREA' ||
      el.isContentEditable ||
      (el.tagName === 'INPUT' && (el as HTMLInputElement).type !== 'range');

    const handleKeyDown = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (isEditable(el)) return;
      const onRange = el.tagName === 'INPUT';

      switch (e.code) {
        case 'Space':
          e.preventDefault(); // also stops a focused button from being "clicked" too
          handleTogglePlay();
          break;
        case 'ArrowRight':
          if (e.ctrlKey || e.metaKey) handleNext();
          else if (!onRange) handleSeek(currentTime + 5);
          break;
        case 'ArrowLeft':
          if (e.ctrlKey || e.metaKey) handlePrev();
          else if (!onRange) handleSeek(Math.max(0, currentTime - 5));
          break;
        case 'ArrowUp':
          if (onRange) break;
          e.preventDefault();
          handleVolumeChange(Math.min(1, volume + 0.05));
          break;
        case 'ArrowDown':
          if (onRange) break;
          e.preventDefault();
          handleVolumeChange(Math.max(0, volume - 0.05));
          break;
        case 'KeyM':
          handleToggleMute();
          break;
        case 'KeyL':
          setIsLyricsOpen((prev) => !prev);
          break;
        case 'KeyE':
          setIsEQOpen((prev) => !prev);
          break;
        case 'KeyQ':
          setIsQueueOpen((prev) => !prev);
          break;
        default:
          break;
      }
    };

    // Buttons activate on Space *keyup*; swallow it so Space only toggles playback.
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isEditable(e.target as HTMLElement)) e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  });

  // Drag & drop
  const hasFiles = (e: React.DragEvent) => Array.from(e.dataTransfer.types || []).includes('Files');

  const handleDragEnter = (e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth.current += 1;
    setIsDraggingOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    dragDepth.current = 0;
    setIsDraggingOver(false);
    if (e.dataTransfer.files.length > 0) handleImportFiles(e.dataTransfer.files);
  };

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId);
  const currentIndex = currentTrack ? tracks.findIndex((t) => t.id === currentTrack.id) : -1;
  const nextTrack: Track | null =
    queue.length > 0
      ? queue[0]
      : tracks.length > 1 && currentIndex >= 0
      ? tracks[(currentIndex + 1) % tracks.length]
      : null;

  const toggleRightPanel = () => {
    const next = !isRightPanelOpen;
    setIsRightPanelOpen(next);
    storageDB.saveSettings({ isRightPanelOpen: next });
  };

  const currentTrackId = currentTrack ? currentTrack.id : null;
  const trackViewProps = {
    currentTrackId,
    isPlaying,
    likedTrackIds,
    onPlayTrack: handlePlayTrack,
    onTogglePlay: handleTogglePlay,
    onToggleLike: handleToggleLike,
    onAddToQueue: handleAddToQueue,
    onDeleteTrack: handleDeleteTrack,
    lang,
  };

  return (
    <div
      className="flex flex-col h-screen w-full bg-black text-neutral-200 overflow-hidden font-sans select-none relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input for import triggers */}
      <input
        ref={globalFileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.flac,.ogg,.oga,.opus,.m4a,.aac"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) handleImportFiles(e.target.files);
          e.target.value = ''; // allow re-selecting the same files later
        }}
      />

      <TitleBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        currentView={currentView}
        onViewChange={setCurrentView}
        lang={lang}
      />

      {/* Drag & drop overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-black/85 border-2 border-dashed border-[#1DB954] flex items-center justify-center p-8 pointer-events-none">
          <div className="bg-[#181818] p-8 rounded-xl border border-white/10 text-center space-y-3">
            <UploadCloud className="w-14 h-14 text-[#1DB954] mx-auto" />
            <h2 className="text-xl font-bold text-white">
              {lang === 'ar' ? 'أفلت الملفات الصوتية هنا للاستيراد' : 'Drop Audio Files to Import'}
            </h2>
            <p className="text-xs text-[#a7a7a7]">MP3, WAV, FLAC, OGG, M4A</p>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-[70] bg-[#282828] text-white border border-white/10 font-medium text-xs px-5 py-2.5 rounded-full shadow-xl pointer-events-none">
          {toastMessage}
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 min-h-0 gap-2 px-2" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Sidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          playlists={playlists}
          selectedPlaylistId={selectedPlaylistId}
          onSelectPlaylist={handleSelectPlaylist}
          onCreatePlaylistClick={() => setIsCreatePlaylistOpen(true)}
          onRenamePlaylist={handleRenamePlaylist}
          onDeletePlaylist={handleDeletePlaylist}
          onImportClick={() => globalFileInputRef.current?.click()}
          likedCount={likedTrackIds.size}
          localFilesCount={tracks.length}
          lang={lang}
          onToggleLang={() => setLang(lang === 'ar' ? 'en' : 'ar')}
        />

        <main className="flex-1 min-w-0 overflow-y-auto bg-[#121212] rounded-lg px-6 py-6">
          {currentView === 'home' && (
            <HomeView
              tracks={tracks}
              playlists={playlists}
              {...trackViewProps}
              onSelectPlaylist={handleSelectPlaylist}
              onOpenLiked={() => setCurrentView('liked')}
              onOpenLocalFiles={() => setCurrentView('localFiles')}
              onImportClick={() => globalFileInputRef.current?.click()}
            />
          )}

          {currentView === 'search' && (
            <SearchView
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              tracks={tracks}
              {...trackViewProps}
            />
          )}

          {currentView === 'localFiles' && (
            <LocalFilesView
              localTracks={tracks}
              {...trackViewProps}
              onImportFiles={handleImportFiles}
              onDeleteLocalTrack={handleDeleteTrack}
            />
          )}

          {currentView === 'playlist' && selectedPlaylist && (
            <PlaylistView playlist={selectedPlaylist} tracks={tracks} {...trackViewProps} />
          )}

          {currentView === 'liked' && <LikedView tracks={tracks} {...trackViewProps} />}

          {currentView === 'library' && (
            <LibraryView
              playlists={playlists}
              likedCount={likedTrackIds.size}
              onSelectPlaylist={handleSelectPlaylist}
              onOpenLiked={() => setCurrentView('liked')}
              onCreatePlaylist={() => setIsCreatePlaylistOpen(true)}
              lang={lang}
            />
          )}
        </main>

        {isRightPanelOpen && (
          <NowPlayingPanel
            isOpen={isRightPanelOpen}
            onClose={() => {
              setIsRightPanelOpen(false);
              storageDB.saveSettings({ isRightPanelOpen: false });
            }}
            track={currentTrack}
            isPlaying={isPlaying}
            isLiked={currentTrack ? likedTrackIds.has(currentTrack.id) : false}
            onToggleLike={handleToggleLike}
            nextTrack={nextTrack}
            onPlayNextTrack={handleNext}
            lang={lang}
          />
        )}
      </div>

      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        isShuffle={isShuffle}
        repeatMode={repeatMode}
        isLiked={currentTrack ? likedTrackIds.has(currentTrack.id) : false}
        isLyricsOpen={isLyricsOpen}
        isVisualizerOpen={isVisualizerOpen}
        isQueueOpen={isQueueOpen}
        isEQOpen={isEQOpen}
        isRightPanelOpen={isRightPanelOpen}
        onTogglePlay={handleTogglePlay}
        onNext={handleNext}
        onPrev={handlePrev}
        onSeek={handleSeek}
        onToggleShuffle={handleToggleShuffle}
        onToggleRepeat={handleToggleRepeat}
        onToggleLike={handleToggleLike}
        onVolumeChange={handleVolumeChange}
        onToggleMute={handleToggleMute}
        onToggleLyrics={() => setIsLyricsOpen(!isLyricsOpen)}
        onToggleVisualizer={() => setIsVisualizerOpen(!isVisualizerOpen)}
        onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
        onToggleEQ={() => setIsEQOpen(!isEQOpen)}
        onToggleRightPanel={toggleRightPanel}
        lang={lang}
      />

      <EqualizerModal
        isOpen={isEQOpen}
        onClose={() => setIsEQOpen(false)}
        currentPreset={eqPreset}
        gains={eqGains}
        onChangePreset={handleChangeEQPreset}
        onChangeBandGain={handleChangeBandGain}
        onReset={handleResetEQ}
        lang={lang}
      />

      <LyricsView
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
        track={currentTrack}
        currentTime={currentTime}
        onSeek={handleSeek}
        lang={lang}
      />

      <VisualizerModal
        isOpen={isVisualizerOpen}
        onClose={() => setIsVisualizerOpen(false)}
        track={currentTrack}
        isPlaying={isPlaying}
        lang={lang}
      />

      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        currentTrack={currentTrack}
        queue={queue}
        onPlayTrack={handlePlayTrack}
        onRemoveFromQueue={handleRemoveFromQueue}
        onClearQueue={handleClearQueue}
        lang={lang}
      />

      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onCreate={handleCreatePlaylist}
        lang={lang}
      />
    </div>
  );
}
