import { contextBridge, ipcRenderer } from 'electron';

type MediaKeyAction = 'play-pause' | 'next' | 'prev';

// Safe desktop API exposed to the renderer.
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  platform: process.platform,
  openAudioFileDialog: () => ipcRenderer.invoke('dialog:openAudioFile'),
  sendPlaybackState: (state: { isPlaying: boolean; title: string; artist: string }) => {
    ipcRenderer.send('playback:stateChanged', state);
  },
  onMediaKeyAction: (callback: (action: MediaKeyAction) => void) => {
    const listener = (_event: unknown, action: MediaKeyAction) => callback(action);
    ipcRenderer.on('media-key-action', listener);
    return () => {
      ipcRenderer.removeListener('media-key-action', listener);
    };
  },
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),
  onMaximizeChange: (callback: (maximized: boolean) => void) => {
    const listener = (_event: unknown, value: boolean) => callback(value);
    ipcRenderer.on('window:maximized-changed', listener);
    return () => {
      ipcRenderer.removeListener('window:maximized-changed', listener);
    };
  },
});
