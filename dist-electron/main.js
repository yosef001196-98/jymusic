"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
let mainWindow = null;
let tray = null;
const isDev = process.env.NODE_ENV === 'development' || !electron_1.app.isPackaged;
const isMac = process.platform === 'darwin';
// public/icon.png is copied into dist/ by Vite, which is what ships in the package.
const iconPath = path.join(__dirname, electron_1.app.isPackaged ? '../dist/icon.png' : '../public/icon.png');
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 840,
        minWidth: 900,
        minHeight: 600,
        backgroundColor: '#000000',
        title: 'JY Music',
        icon: iconPath,
        // Frameless: the renderer draws the title bar and the (-  []  X) controls.
        frame: false,
        ...(isMac ? { titleBarStyle: 'hidden' } : {}),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
        },
    });
    if (isDev) {
        mainWindow.loadURL('http://localhost:3000');
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
    mainWindow.on('maximize', () => mainWindow?.webContents.send('window:maximized-changed', true));
    mainWindow.on('unmaximize', () => mainWindow?.webContents.send('window:maximized-changed', false));
    // Register Global Media Shortcuts
    electron_1.globalShortcut.register('MediaPlayPause', () => {
        mainWindow?.webContents.send('media-key-action', 'play-pause');
    });
    electron_1.globalShortcut.register('MediaNextTrack', () => {
        mainWindow?.webContents.send('media-key-action', 'next');
    });
    electron_1.globalShortcut.register('MediaPreviousTrack', () => {
        mainWindow?.webContents.send('media-key-action', 'prev');
    });
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
function createTray() {
    const icon = fs.existsSync(iconPath) ? electron_1.nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 }) : electron_1.nativeImage.createEmpty();
    tray = new electron_1.Tray(icon);
    const contextMenu = electron_1.Menu.buildFromTemplate([
        {
            label: 'Play / Pause',
            click: () => mainWindow?.webContents.send('media-key-action', 'play-pause'),
        },
        {
            label: 'Next Track',
            click: () => mainWindow?.webContents.send('media-key-action', 'next'),
        },
        {
            label: 'Previous Track',
            click: () => mainWindow?.webContents.send('media-key-action', 'prev'),
        },
        { type: 'separator' },
        {
            label: 'Open JY Music',
            click: () => mainWindow?.show(),
        },
        {
            label: 'Quit',
            click: () => electron_1.app.quit(),
        },
    ]);
    tray.setToolTip('JY Music Desktop');
    tray.setContextMenu(contextMenu);
}
// IPC Handlers
electron_1.ipcMain.handle('dialog:openAudioFile', async () => {
    if (!mainWindow)
        return null;
    const result = await electron_1.dialog.showOpenDialog(mainWindow, {
        title: 'Select Audio Files',
        properties: ['openFile', 'multiSelections'],
        filters: [
            { name: 'Audio Files', extensions: ['mp3', 'wav', 'flac', 'ogg', 'm4a'] },
            { name: 'All Files', extensions: ['*'] },
        ],
    });
    if (result.canceled || result.filePaths.length === 0) {
        return null;
    }
    // Read files and return metadata & base64
    return result.filePaths.map((filePath) => {
        const baseName = path.basename(filePath);
        const ext = path.extname(filePath).replace('.', '');
        const data = fs.readFileSync(filePath);
        return {
            name: baseName,
            extension: ext,
            path: filePath,
            size: data.length,
            base64: `data:audio/${ext};base64,${data.toString('base64')}`,
        };
    });
});
electron_1.ipcMain.on('playback:stateChanged', (_event, state) => {
    if (tray) {
        tray.setToolTip(`JY Music: ${state.title} - ${state.artist} (${state.isPlaying ? 'Playing' : 'Paused'})`);
    }
});
electron_1.ipcMain.on('window:minimize', () => mainWindow?.minimize());
electron_1.ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow.unmaximize();
    }
    else {
        mainWindow?.maximize();
    }
});
electron_1.ipcMain.on('window:close', () => mainWindow?.close());
electron_1.ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);
electron_1.app.whenReady().then(() => {
    electron_1.Menu.setApplicationMenu(null);
    createWindow();
    try {
        createTray();
    }
    catch {
        // Graceful fallback if headless
    }
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('will-quit', () => {
    electron_1.globalShortcut.unregisterAll();
});
