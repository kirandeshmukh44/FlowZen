# FlowZen — Setup Guide (for a friend)

FlowZen = React frontend + Express/MongoDB backend. You need **Node.js 18+** installed.

## 1. Install dependencies (both folders)

```bash
cd Server
npm install

cd ../Client
npm install
```

## 2. Create environment files

**`Server/.env`** — copy `Server/.env.example` and fill in:

- `MONGODB_URI` — your own MongoDB Atlas connection string
  (free at https://mongodb.com → Database → Connect → Drivers)
- `JWT_SECRET` — any long random string
- `CLOUDINARY_*` — optional, only needed for profile photo upload

**`Client/.env`** — copy `Client/.env.example` (defaults already work):

```
VITE_API_URL=http://localhost:5000/api
VITE_USE_MOCK=false
```

> ⚠️ Do NOT use someone else's `.env` — the MongoDB URI is private to its owner.

## 3. Run

Terminal 1 — backend:
```bash
cd Server
npm run dev
```

Terminal 2 — frontend:
```bash
cd Client
npm run dev
```

Open http://localhost:5173 → **Register** creates a new company + Admin account.

## 4. If Register button "does nothing"

It means the backend isn't reachable. Check:

1. Backend terminal shows `Server is running on port 5000` — if not, read the error (usually bad `MONGODB_URI`).
2. Open http://localhost:5000/api/health — should return `{"success":true,...}`.
3. The login/register page shows an error message under the button — read it.

## Roles

- **Admin** — register-company creates one; full access
- **Manager/Employee** — created from Team page → "Invite Member" (temp password shown once)
