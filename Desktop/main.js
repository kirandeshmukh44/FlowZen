const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

const PORT = 5000;
const isPackaged = app.isPackaged;

// Server + built client live next to each other:
//   dev:      <repo>/Server/server.js  + <repo>/Client/dist
//   packaged: <resources>/Server/...   + <resources>/Client/dist
const base = isPackaged ? process.resourcesPath : path.join(__dirname, '..');
const serverEntry = path.join(base, 'Server', 'server.js');

process.env.PORT = String(PORT);
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const CONFIG_KEYS = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
];

const configPath = () => path.join(app.getPath('userData'), 'flowzen-config.json');

function readSavedConfig() {
  try {
    return JSON.parse(fs.readFileSync(configPath(), 'utf8'));
  } catch {
    return null;
  }
}

function applyConfig(cfg) {
  for (const k of CONFIG_KEYS) {
    if (cfg[k] && !process.env[k]) process.env[k] = cfg[k];
  }
  // dotenv would read cwd/.env; bundled Server/.env may not exist, so we
  // inject values directly — dotenv.config() with a missing path is a no-op.
}

function configComplete() {
  return !!(process.env.MONGODB_URI && process.env.JWT_SECRET);
}

function openSetupWindow() {
  return new Promise((resolve) => {
    const win = new BrowserWindow({
      width: 520,
      height: 640,
      resizable: false,
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    win.loadFile(path.join(__dirname, 'setup.html'));
    win.on('closed', () => resolve(false));
  });
}

function waitForServer(tries = 0) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${PORT}/api/health`, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => {
      if (tries > 120) return resolve(false); // ~60s max
      setTimeout(() => waitForServer(tries + 1).then(resolve), 500);
    });
    req.setTimeout(2000, () => {
      req.destroy();
      setTimeout(() => waitForServer(tries + 1).then(resolve), 500);
    });
  });
}

async function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'FlowZen',
    backgroundColor: '#0b1020',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  const ok = await waitForServer();
  if (ok) {
    mainWindow.loadURL(`http://localhost:${PORT}`);
  } else {
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(
      '<body style="font-family:sans-serif;background:#0b1020;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh"><div style="text-align:center"><h2>FlowZen</h2><p>Backend failed to start. Check your saved configuration (MongoDB URI / JWT secret).</p></div></body>'
    )}`);
  }
}

app.whenReady().then(async () => {
  // 1) Credentials: real env vars > saved userData config > setup prompt.
  if (!configComplete()) {
    const saved = readSavedConfig();
    if (saved) applyConfig(saved);
  }

  ipcMain.handle('config:get', () => {
    const saved = readSavedConfig() || {};
    return {
      mongo: saved.MONGODB_URI || '',
      jwt: saved.JWT_SECRET || '',
    };
  });
  ipcMain.handle('config:needsSetup', () => !configComplete());
  ipcMain.handle('config:save', (e, cfg) => {
    if (!cfg || !cfg.MONGODB_URI || !cfg.JWT_SECRET) {
      throw new Error('MongoDB URI and JWT secret are required');
    }
    fs.writeFileSync(configPath(), JSON.stringify(cfg, null, 2));
    applyConfig(cfg);
    BrowserWindow.fromWebContents(e.sender)?.close();
    return true;
  });

  // Dev mode still uses the repo's Server/.env via DOTENV_CONFIG_PATH.
  if (!isPackaged) {
    process.env.DOTENV_CONFIG_PATH = path.join(base, 'Server', '.env');
  }

  if (!configComplete()) {
    await openSetupWindow();
    if (!configComplete()) {
      app.quit();
      return;
    }
  }

  // 2) Start the Express backend inside Electron's Node runtime.
  require(serverEntry);

  // 3) Open the app window once the API is healthy.
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
