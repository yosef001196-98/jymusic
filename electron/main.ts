import { app, BrowserWindow, ipcMain, dialog, globalShortcut, Tray, Menu, nativeImage } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const isMac = process.platform === 'darwin';

// public/icon.png is copied into dist/ by Vite, which is what ships in the package.
const iconPath = path.join(__dirname, app.isPackaged ? '../dist/icon.png' : '../public/icon.png');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#000000',
    title: 'JY Music',
    icon: iconPath,
    // Frameless: the renderer draws the title bar and the (-  []  X) controls.
    frame: false,
    ...(isMac ? { titleBarStyle: 'hidden' as const } : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('maximize', () => mainWindow?.webContents.send('window:maximized-changed', true));
  mainWindow.on('unmaximize', () => mainWindow?.webContents.send('window:maximized-changed', false));

  // Register Global Media Shortcuts
  globalShortcut.register('MediaPlayPause', () => {
    mainWindow?.webContents.send('media-key-action', 'play-pause');
  });
  globalShortcut.register('MediaNextTrack', () => {
    mainWindow?.webContents.send('media-key-action', 'next');
  });
  globalShortcut.register('MediaPreviousTrack', () => {
    mainWindow?.webContents.send('media-key-action', 'prev');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const icon = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 }) : nativeImage.createEmpty();
  tray = new Tray(icon);
  
  const contextMenu = Menu.buildFromTemplate([
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
      click: () => app.quit(),
    },
  ]);

  tray.setToolTip('JY Music Desktop');
  tray.setContextMenu(contextMenu);
}

// IPC Handlers
ipcMain.handle('dialog:openAudioFile', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
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

ipcMain.on('playback:stateChanged', (_event, state) => {
  if (tray) {
    tray.setToolTip(`JY Music: ${state.title} - ${state.artist} (${state.isPlaying ? 'Playing' : 'Paused'})`);
  }
});

ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.on('window:close', () => mainWindow?.close());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false);

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();
  try {
    createTray();
  } catch {
    // Graceful fallback if headless
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
