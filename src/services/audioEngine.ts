/**
 * Global audio engine (singleton).
 *
 * Exactly ONE HTMLAudioElement exists for the whole app and it is routed through
 * a 10-band equalizer + analyser. Starting any track re-points that single
 * element at the new file, so two sounds can never play at the same time,
 * no matter which card / row / playlist button triggered playback.
 */

import { Track, EQPresetName } from '../types/music';

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_PRESETS: Record<EQPresetName, number[]> = {
  'Flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Bass Boost': [7, 6, 4, 2, 0, 0, 0, 0, 0, 0],
  'Pop': [-1, 1, 3, 4, 3, 1, 0, 1, 2, 2],
  'Rock': [5, 4, 2, -1, -2, -1, 1, 3, 4, 5],
  'Electronic': [6, 5, 2, 0, -2, 1, 2, 3, 5, 4],
  'Vocal Boost': [-3, -2, -1, 1, 4, 5, 3, 1, 0, -1],
  'Acoustic': [3, 2, 1, 1, 2, 2, 3, 3, 2, 1],
};

type TimeCallback = (time: number) => void;
type VoidCallback = () => void;

interface EngineCallbacks {
  onTimeUpdate?: TimeCallback;
  onEnded?: VoidCallback;
  onDuration?: (duration: number) => void;
  onError?: (message: string) => void;
}

class AudioEngine {
  private readonly audio: HTMLAudioElement;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private eqGains: number[] = [...EQ_PRESETS['Flat']];
  private volume = 0.85;
  private muted = false;

  private callbacks: EngineCallbacks = {};
  private currentTrackId: string | null = null;
  private fallbackUrls = new Map<string, string>();
  private rafId: number | null = null;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = 'auto';

    this.audio.addEventListener('ended', () => this.callbacks.onEnded?.());
    this.audio.addEventListener('timeupdate', () => this.callbacks.onTimeUpdate?.(this.audio.currentTime));
    this.audio.addEventListener('play', () => this.startTicker());
    this.audio.addEventListener('pause', () => this.stopTicker());
    this.audio.addEventListener('loadedmetadata', () => {
      const d = this.audio.duration;
      if (isFinite(d) && d > 0) this.callbacks.onDuration?.(d);
    });
    this.audio.addEventListener('error', () => {
      // An empty src (after stop()) also raises an error event; ignore it.
      if (!this.audio.getAttribute('src')) return;
      this.callbacks.onError?.('Unable to play this audio file');
    });
  }

  // ---- Web Audio graph (built lazily on first user-initiated playback) ----

  private initGraph() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      this.ctx = ctx;

      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.volume;

      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.85;

      this.eqFilters = EQ_FREQUENCIES.map((freq, index) => {
        const filter = ctx.createBiquadFilter();
        if (index === 0) {
          filter.type = 'lowshelf';
        } else if (index === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        filter.gain.value = this.eqGains[index] || 0;
        return filter;
      });

      for (let i = 0; i < this.eqFilters.length - 1; i++) {
        this.eqFilters[i].connect(this.eqFilters[i + 1]);
      }

      // The one and only media element feeds the graph exactly once.
      const source = ctx.createMediaElementSource(this.audio);
      source.connect(this.eqFilters[0]);
      this.eqFilters[this.eqFilters.length - 1].connect(this.analyser);
      this.analyser.connect(this.masterGain);
      this.masterGain.connect(ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  // ---- Public API ----

  public setCallbacks(callbacks: EngineCallbacks) {
    this.callbacks = callbacks;
  }

  /** Stops whatever is playing and starts `track`. */
  public playTrack(track: Track, startTime = 0) {
    const url = this.resolveUrl(track);
    if (!url) {
      this.callbacks.onError?.('This track has no playable audio data');
      return;
    }

    this.initGraph();

    // Stop the previous sound first, then re-point the single element.
    this.audio.pause();
    this.currentTrackId = track.id;
    this.audio.src = url;
    this.audio.load();
    if (startTime > 0) this.audio.currentTime = startTime;

    this.audio.play().catch((err: unknown) => {
      // AbortError = a newer playTrack() superseded this one. Not a real failure.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.warn('Playback failed', err);
      this.callbacks.onError?.('Unable to play this audio file');
    });
  }

  public pause() {
    this.audio.pause();
  }

  public resume() {
    if (!this.currentTrackId) return;
    this.initGraph();
    this.audio.play().catch(() => {});
  }

  /** Stops playback and unloads the current file. */
  public stop() {
    this.audio.pause();
    this.currentTrackId = null;
    this.audio.removeAttribute('src');
    this.audio.load();
  }

  public seek(seconds: number) {
    const d = this.audio.duration;
    const max = isFinite(d) && d > 0 ? d : Math.max(0, seconds);
    this.audio.currentTime = Math.max(0, Math.min(seconds, max));
    this.callbacks.onTimeUpdate?.(this.audio.currentTime);
  }

  public get isPlaying(): boolean {
    return !this.audio.paused && !this.audio.ended;
  }

  public get activeTrackId(): string | null {
    return this.currentTrackId;
  }

  /** Forget cached object URLs for a deleted track. */
  public forgetTrack(trackId: string) {
    const url = this.fallbackUrls.get(trackId);
    if (url) {
      URL.revokeObjectURL(url);
      this.fallbackUrls.delete(trackId);
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.applyGain();
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    this.applyGain();
  }

  private applyGain() {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  public setEQGains(gains: number[]) {
    this.eqGains = [...gains];
    if (this.ctx && this.eqFilters.length === gains.length) {
      this.eqFilters.forEach((filter, i) => {
        filter.gain.cancelScheduledValues(this.ctx!.currentTime);
        filter.gain.setValueAtTime(gains[i], this.ctx!.currentTime);
      });
    }
  }

  public getEQGains(): number[] {
    return [...this.eqGains];
  }

  public getVisualizerData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(64);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    if (this.isPlaying) this.analyser.getByteFrequencyData(data);
    return data;
  }

  // ---- Internals ----

  private resolveUrl(track: Track): string {
    if (track.audioUrl) return track.audioUrl;
    if (!track.audioBlob) return '';
    let url = this.fallbackUrls.get(track.id);
    if (!url) {
      url = URL.createObjectURL(track.audioBlob);
      this.fallbackUrls.set(track.id, url);
    }
    return url;
  }

  // `timeupdate` only fires ~4x/s; tick every frame while playing for a smooth bar.
  private startTicker() {
    if (this.rafId !== null) return;
    const tick = () => {
      this.callbacks.onTimeUpdate?.(this.audio.currentTime);
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopTicker() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}

// Survives Vite HMR re-evaluation so a second engine (and a second audio
// element) can never be created.
const GLOBAL_KEY = '__jyMusicAudioEngine__';
const globalScope = globalThis as unknown as Record<string, AudioEngine | undefined>;
export const audioEngine: AudioEngine = (globalScope[GLOBAL_KEY] ??= new AudioEngine());
