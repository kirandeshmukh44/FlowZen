# FlowZen — Windows .exe Installer Build Guide

How to go from source code to a Windows setup file (`FlowZen-Setup-x.x.x.exe`).

The desktop app is an **Electron** wrapper: it starts the Express backend
inside Electron's Node runtime, waits for `/api/health`, then opens the
built React client — all bundled into one installer.

```
Desktop/
├── main.js          # Electron entry: starts Server/server.js, opens window
├── package.json     # electron + electron-builder config
└── release/         # build output (installer lands here)
```

The installer bundles:

- `Server/` — Express backend **including node_modules and .env**
- `Client/dist/` — production React build
- Electron runtime (~85 MB installer total)

---

## 1. Prerequisites (one-time)

- **Node.js 18+** installed
- Repo cloned: `git clone https://github.com/kirandeshmukh44/FlowZen.git`
- `Server/.env` present with `MONGODB_URI`, `JWT_SECRET`, Cloudinary keys
  (it is git-ignored but **is packed into the installer** — see warnings)

## 2. Build the React client

```bash
cd Client
npm install
npm run build        # produces Client/dist/
```

## 3. Install desktop dependencies

```bash
cd ../Desktop
npm install
```

> If `npm install` warns that electron's postinstall script was blocked,
> run it manually:
>
> ```bash
> node node_modules/electron/install.js
> ```
>
> If `node_modules/electron/dist/electron.exe` is still missing afterwards,
> download is cached at
> `%LOCALAPPDATA%\electron\Cache\<hash>\electron-v*-win32-x64.zip` —
> extract it into `Desktop/node_modules/electron/dist/` with
> `Expand-Archive`, then write `electron.exe` into `path.txt` and the
> version into `dist/version`.

## 4. Build the installer

```bash
cd Desktop
npx electron-builder --win nsis
```

Output:

```
Desktop/release/FlowZen-Setup-1.0.0.exe          ← the installer
Desktop/release/win-unpacked/FlowZen.exe        ← portable version (no install)
```

On Windows, if electron-builder fails extracting `winCodeSign-*.7z`
("Cannot create symbolic link : A required privilege is not held"),
the partially extracted folder already contains everything needed —
copy it in the builder cache once:

```bash
cp -r "$LOCALAPPDATA/electron-builder/Cache/winCodeSign/<tmpdir>" \
      "$LOCALAPPDATA/electron-builder/Cache/winCodeSign/winCodeSign-2.6.0"
```

then re-run the build.

## 5. Install & run

1. Run `FlowZen-Setup-1.0.0.exe` → choose install dir → Finish
2. Desktop shortcut **FlowZen** is created
3. Double-click → backend starts silently → app window opens
4. Closing the window stops the backend too

No Node.js, npm, MongoDB, or browser required on the target machine —
only internet access (MongoDB Atlas is cloud-hosted).

---

## ⚠️ Security warnings

- **The installer contains `Server/.env`** — MongoDB credentials, JWT
  secret, Cloudinary keys. Do **not** share the `.exe` publicly or upload
  it anywhere. It is fine for your own machines only.
- If you ever distribute it, remove `.env` from `extraResources` in
  `Desktop/package.json` and have users set env vars instead.

## 🔄 Rebuilding after code changes

```bash
cd Client && npm run build          # 1. rebuild frontend
cd ../Desktop && npx electron-builder --win nsis   # 2. rebuild installer
```

Server-side changes need no extra step — `Server/` is copied as-is.

## 🧪 Quick test without installing

```bash
cd Desktop/release/win-unpacked
./FlowZen.exe
```

Expected console output:

```
injected env (6) from resources\Server\.env
MongoDB Atlas Connected Successfully
Server is running on port 5000
```
