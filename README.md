# JY Music

A clean, minimalist offline desktop music player built with Electron, Vite, React and Tailwind CSS.

- Imports local audio (MP3, FLAC, WAV, OGG, M4A) by button or drag & drop
- Reads real ID3 / MP4 / FLAC tags and embedded cover art with [`jsmediatags`](https://github.com/aadsm/jsmediatags)
- One global audio engine: only one track can ever play at a time
- 10-band equalizer, queue, liked songs, playlists
- Library is stored locally in IndexedDB (no network needed)

## Development

```bash
npm install
npm run dev            # renderer in the browser at http://localhost:3000
```

To run inside Electron while the dev server is up:

```bash
npm run build:electron # compiles electron/*.ts into dist-electron/ and builds the renderer
npm run electron:start
```

## Build a Windows installer

```bash
npm run dist:win
```

## Keyboard shortcuts

`Space` play/pause · `←/→` seek 5s · `Ctrl+←/→` previous/next · `↑/↓` volume · `M` mute · `Q` queue · `E` equalizer · `L` lyrics
