"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Safe desktop API exposed to the renderer.
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    isElectron: true,
    platform: process.platform,
    openAudioFileDialog: () => electron_1.ipcRenderer.invoke('dialog:openAudioFile'),
    sendPlaybackState: (state) => {
        electron_1.ipcRenderer.send('playback:stateChanged', state);
    },
    onMediaKeyAction: (callback) => {
        const listener = (_event, action) => callback(action);
        electron_1.ipcRenderer.on('media-key-action', listener);
        return () => {
            electron_1.ipcRenderer.removeListener('media-key-action', listener);
        };
    },
    minimizeWindow: () => electron_1.ipcRenderer.send('window:minimize'),
    maximizeWindow: () => electron_1.ipcRenderer.send('window:maximize'),
    closeWindow: () => electron_1.ipcRenderer.send('window:close'),
    isMaximized: () => electron_1.ipcRenderer.invoke('window:isMaximized'),
    onMaximizeChange: (callback) => {
        const listener = (_event, value) => callback(value);
        electron_1.ipcRenderer.on('window:maximized-changed', listener);
        return () => {
            electron_1.ipcRenderer.removeListener('window:maximized-changed', listener);
        };
    },
});
