const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const http = require('http');

const PORT = 5000;
const isPackaged = app.isPackaged;

// Server + built client live next to each other:
//   dev:      <repo>/Server/server.js  + <repo>/Client/dist
//   packaged: <resources>/Server/...   + <resources>/Client/dist
const base = isPackaged ? process.resourcesPath : path.join(__dirname, '..');
const serverEntry = path.join(base, 'Server', 'server.js');

process.env.PORT = String(PORT);
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
// dotenv reads .env from cwd — point it at the bundled Server/.env instead.
process.env.DOTENV_CONFIG_PATH = path.join(base, 'Server', '.env');

let mainWindow = null;

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

async function createWindow() {
  mainWindow = new BrowserWindow({
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
      '<body style="font-family:sans-serif;background:#0b1020;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh"><div style="text-align:center"><h2>FlowZen</h2><p>Backend failed to start. Check that Server/.env has MONGODB_URI and JWT_SECRET.</p></div></body>'
    )}`);
  }
}

app.whenReady().then(() => {
  // Start the Express backend inside Electron's Node runtime.
  require(serverEntry);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
