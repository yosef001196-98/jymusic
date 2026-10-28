/**
 * Offline IndexedDB storage: imported audio files (+ embedded covers),
 * playlists, liked tracks and player settings.
 */

import { Track, Playlist, PlayerSettings } from '../types/music';
import { cleanTag } from '../utils/text';

// Name kept as-is so libraries imported with earlier builds are still found.
const DB_NAME = 'SpotifyDesktopOfflineDB';
const DB_VERSION = 1;

/** Shape persisted for a track: no runtime object URLs, covers stored as Blobs. */
type StoredTrack = Omit<Track, 'audioUrl' | 'cover'> & {
  audioBlob: Blob;
  coverBlob?: Blob;
};

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error);
    tx.onerror = () => reject(tx.error);
  });
}

function requestResult<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

class StorageDB {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('tracks')) db.createObjectStore('tracks', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('playlists')) db.createObjectStore('playlists', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('likedTracks')) db.createObjectStore('likedTracks', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' });
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // --- Tracks ---

  public async saveLocalTrack(track: Track, coverBlob?: Blob): Promise<void> {
    try {
      if (!track.audioBlob) return;
      const { audioUrl: _audioUrl, cover: _cover, ...rest } = track;
      const stored: StoredTrack = { ...rest, audioBlob: track.audioBlob, coverBlob };

      const db = await this.getDB();
      const tx = db.transaction('tracks', 'readwrite');
      tx.objectStore('tracks').put(stored);
      await txDone(tx);
    } catch (err) {
      console.warn('Failed to save track to IndexedDB', err);
    }
  }

  public async getLocalTracks(): Promise<Track[]> {
    try {
      const db = await this.getDB();
      const stored = await requestResult(db.transaction('tracks', 'readonly').objectStore('tracks').getAll());

      return (stored as StoredTrack[])
        .filter((item) => item.audioBlob)
        .map((item): Track => {
          const { coverBlob, ...rest } = item;
          return {
            ...rest,
            album: cleanTag(rest.album),
            genre: cleanTag(rest.genre),
            addedAt: rest.addedAt ?? 0,
            // Object URLs are only valid for one session: always rebuild them.
            audioUrl: URL.createObjectURL(item.audioBlob),
            cover: coverBlob ? URL.createObjectURL(coverBlob) : '',
          };
        })
        .sort((a, b) => b.addedAt - a.addedAt);
    } catch {
      return [];
    }
  }

  public async deleteLocalTrack(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('tracks', 'readwrite');
      tx.objectStore('tracks').delete(id);
      await txDone(tx);
    } catch (err) {
      console.warn('Failed to delete track', err);
    }
  }

  // --- Playlists ---

  public async savePlaylists(playlists: Playlist[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('playlists', 'readwrite');
      const store = tx.objectStore('playlists');
      store.clear();
      playlists.forEach((p) => store.put(p));
      await txDone(tx);
    } catch (err) {
      console.warn('Failed to save playlists', err);
    }
  }

  public async getPlaylists(): Promise<Playlist[] | null> {
    try {
      const db = await this.getDB();
      const res = await requestResult(db.transaction('playlists', 'readonly').objectStore('playlists').getAll());
      return (res as Playlist[]).length > 0 ? (res as Playlist[]) : null;
    } catch {
      return null;
    }
  }

  // --- Liked tracks ---

  public async saveLikedIds(ids: string[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('likedTracks', 'readwrite');
      const store = tx.objectStore('likedTracks');
      store.clear();
      ids.forEach((id) => store.put({ id }));
      await txDone(tx);
    } catch (err) {
      console.warn('Failed to save liked IDs', err);
    }
  }

  public async getLikedIds(): Promise<string[] | null> {
    try {
      const db = await this.getDB();
      const res = await requestResult(db.transaction('likedTracks', 'readonly').objectStore('likedTracks').getAll());
      return (res as { id: string }[]).map((r) => r.id);
    } catch {
      return null;
    }
  }

  // --- Settings ---

  /** Merges `settings` into the stored record (a plain put would wipe other keys). */
  public async saveSettings(settings: Partial<PlayerSettings>): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const existing = (await requestResult(store.get('player_settings'))) || {};
      store.put({ ...existing, ...settings, key: 'player_settings' });
      await txDone(tx);
    } catch (err) {
      console.warn('Failed to save settings', err);
    }
  }

  public async getSettings(): Promise<Partial<PlayerSettings> | null> {
    try {
      const db = await this.getDB();
      return (await requestResult(db.transaction('settings', 'readonly').objectStore('settings').get('player_settings'))) || null;
    } catch {
      return null;
    }
  }
}

export const storageDB = new StorageDB();
