/**
 * Reads ID3 / MP4 / FLAC tags (title, artist, album, year, genre, embedded
 * cover) from an imported audio file using `jsmediatags`.
 */

import * as jsmediatagsModule from 'jsmediatags';
import { cleanTag } from '../utils/text';

interface RawPicture {
  format?: string;
  data: ArrayLike<number>;
}

interface RawTags {
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  genre?: string;
  picture?: RawPicture;
}

interface JsMediaTagsApi {
  read: (
    file: Blob | File | string,
    callbacks: {
      onSuccess: (result: { tags: RawTags }) => void;
      onError: (error: { type: string; info: string }) => void;
    }
  ) => void;
}

// jsmediatags ships as CommonJS/UMD: depending on the bundler the API is either
// the namespace itself or its `default` export.
const jsmediatags: JsMediaTagsApi = ((jsmediatagsModule as unknown as { default?: JsMediaTagsApi }).default ??
  (jsmediatagsModule as unknown as JsMediaTagsApi)) as JsMediaTagsApi;

export interface ParsedAudioMeta {
  title: string;
  artist: string;
  album: string;
  duration: number;
  year?: number;
  genre?: string;
  /** Object URL for the embedded cover, '' when the file has none. */
  coverUrl: string;
  coverBlob?: Blob;
}

function readTags(file: File): Promise<RawTags | null> {
  return new Promise((resolve) => {
    try {
      jsmediatags.read(file, {
        onSuccess: (result) => resolve(result.tags ?? null),
        onError: (err) => {
          console.warn('jsmediatags could not read tags:', err?.type, err?.info);
          resolve(null);
        },
      });
    } catch (err) {
      console.warn('jsmediatags threw:', err);
      resolve(null);
    }
  });
}

function pictureToBlob(picture?: RawPicture): Blob | undefined {
  if (!picture || !picture.data || picture.data.length === 0) return undefined;
  let mime = (picture.format || '').toLowerCase();
  if (!mime) mime = 'image/jpeg';
  else if (!mime.includes('/')) mime = `image/${mime}`;
  return new Blob([new Uint8Array(Array.from(picture.data))], { type: mime });
}

function probeDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const probe = new Audio();
    let settled = false;
    const finish = (value: number) => {
      if (settled) return;
      settled = true;
      probe.removeAttribute('src');
      URL.revokeObjectURL(url);
      resolve(value);
    };
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => finish(isFinite(probe.duration) ? probe.duration : 0);
    probe.onerror = () => finish(0);
    window.setTimeout(() => finish(0), 4000);
    probe.src = url;
  });
}

export async function parseAudioMetadata(file: File): Promise<ParsedAudioMeta> {
  const baseName = file.name.replace(/\.[^/.]+$/, '');

  const [tags, duration] = await Promise.all([readTags(file), probeDuration(file)]);

  let title = cleanTag(tags?.title);
  let artist = cleanTag(tags?.artist);

  // Fall back to the file name ("Artist - Title") only for what the tags lack.
  if (!title) {
    const parts = baseName.split(' - ');
    if (!artist && parts.length >= 2) {
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    } else {
      title = baseName.trim();
    }
  }

  const album = cleanTag(tags?.album);

  // ID3v1 genres can be numeric codes such as "(13)" or "13": not useful to show.
  let genre: string | undefined = cleanTag(tags?.genre);
  if (!genre || /^\(?\d+\)?$/.test(genre)) genre = undefined;

  const yearMatch = cleanTag(tags?.year).match(/\d{4}/);
  const year = yearMatch ? parseInt(yearMatch[0], 10) : undefined;

  const coverBlob = pictureToBlob(tags?.picture);

  return {
    title,
    artist: artist || 'Unknown Artist',
    album,
    duration,
    year,
    genre,
    coverUrl: coverBlob ? URL.createObjectURL(coverBlob) : '',
    coverBlob,
  };
}
