# FlowZen Frontend ↔ Backend Integration Report

Date: 2026-11-11
Scope: `Client/` (React + Vite) wired to `Server/` (Express + MongoDB) at `http://localhost:5000/api`.
No backend routes, controllers, models, or schemas were modified.

## Configuration

- `Client/.env.example` — documents `VITE_API_URL` and `VITE_USE_MOCK` (default `false`).
- `Client/.env` — created locally with `VITE_API_URL=http://localhost:5000/api`, `VITE_USE_MOCK=false`. Git-ignored (root `.gitignore` has `.env`).
- `Client/vite.config.js` — added `server.strictPort: true` (port 5173).
- CORS: backend already allows `http://localhost:5173` / `127.0.0.1:5173` (`Server/server.js`). Verified — no preflight failures observed.

## Endpoints wired (verified against `Server/Router/*` and `Server/Controllers/*`)

| UI action | Method & path | Request body | Response used |
|---|---|---|---|
| Login | `POST /api/auth/login` | `{email, password}` | `data.token`, `data.user.{id,name,email,role}` |
| Register | `POST /api/auth/register` | `{name, email, password}` | `data.success`; then auto-login for JWT |
| List tasks | `GET /api/tasks` | — (Bearer) | `data.tasks[]` |
| List assignments | `GET /api/task-assignments` | — (Admin/Manager only) | `data.assignments[]` (populated `taskId`, `employeeId`) |
| Create task | `POST /api/tasks` | `{title, description, priority, deadline}` | `data.task._id` |
| Assign task | `POST /api/task-assignments` | `{taskId, employeeId}` per assignee | `data.assignment` |
| Admin/Manager status change | `PUT /api/tasks/:id` | `{status}` | `data.task` |
| Employee status change | `PATCH /api/task-updates` | `{taskId, newStatus}` | `data.task` |
| Team members | `GET /api/users` | — (Admin/Manager only) | `data.users[]` |

Not wired (backend exists, UI still mock): `GET /api/task-assignments/employee/:id`, `GET /api/task-updates/...`, `DELETE /api/tasks/:id`, `/api/notifications`, `/api/comments`, `/api/chat`, `/api/ai-suggestions`. See `BACKEND_GAPS.md`.

## Field mapping (`src/api/adapters.js`)

| Backend (Mongo) | UI (existing components) | Notes |
|---|---|---|
| `_id` | `id` | |
| `title`, `description` | same | |
| `status` | `backendStatus` (raw) + `status` (label) + `column` + `completed` | `Pending→backlog`, `In Progress→in_progress`, `On Hold→review`, `Completed→done`, `Cancelled→backlog` (raw `Cancelled` preserved in `backendStatus`/`status`) |
| `deadline` | `deadline` (`YYYY-MM-DD`) | |
| `priority` (Low/Medium/High/Critical) | `priority` + derived `importance` (3/5/8/10) | `importance` is only used for client-side AI score |
| `createdBy` | `createdBy` | ObjectId; not populated by `GET /tasks` |
| `createdAt`, `updatedAt` | `createdAt` | |
| — (no field) | `urgency`, `effort`, `tags`, `tagColor`, `progress` | `urgency` derived from deadline by `computeAIScore`; `effort` defaults to 3; `tags`/`tagColor` default `'General'`/`'rose'`; `progress` derived from column |
| — (no field) | `aiScore` | Always computed client-side via `utils/aiScore.js` + `weights` |
| `TaskAssignment.employeeId` | `assignees[]`, `assignee` | Populated `{name,email,role}` → normalized member; Employee users get themselves as assignee |
| `User.{_id,name,email,role}` | team member `{id,name,email,role,avatar,...}` | Gamification fields (`xp`, `level`, `capacity`, `online`) have no backend source → defaults |

Column → backend status (`COLUMN_TO_STATUS`): `backlog→Pending`, `in_progress→In Progress`, `review→On Hold`, `done→Completed`. The backend has **no** `Cancelled`-producing UI path and no `Review` status — `review` maps to `On Hold`. This is a semantic approximation, documented here and in `BACKEND_GAPS.md`.

## Auth behavior

- Session persisted in `localStorage` (`flowzen_token`, `flowzen_user`); restored on reload. Verified: reload keeps session, no redirect.
- `GET /api/users` returns `{_id,...}` for users but login returns `user.id` — `buildUser` accepts both (`id || _id`).
- Mock fallback rules (`VITE_USE_MOCK==='true'` **and** axios network error with no `error.response`): login and register only. HTTP 400/401/403/409/500 always show `res.data.message` and never fall back.
- Axios response interceptor: any 401 clears storage and redirects to `/auth` (expired/invalid token handling).
- `RequireAuth` wrapper in `App.jsx` redirects to `/auth` when no user session exists.
- Register: backend forces `role:'Employee'` and returns **no token**; frontend registers then auto-logs-in with the same credentials → session as Employee. Company/Admin self-registration is **not supported** by the backend (see gaps).

## Status update rules

- Single path: `markComplete` (dashboard checkbox, card Done button) and `moveTaskColumn` (Kanban drag/drop, mobile select) → `persistStatus`.
- `Admin`/`Manager` → `PUT /api/tasks/:id {status}`.
- `Employee` → `PATCH /api/task-updates {taskId, newStatus}` (backend additionally enforces assignment ownership → 403).
- Optimistic update with rollback (`setTasks(prevTasks)`) + `toast.error(backend message)` on failure.

## Create task rules

- `POST /api/tasks` requires non-empty `title`, `description`, `priority`, `deadline` — description falls back to `'No description provided.'` (backend 400s on empty string).
- Client sliders → priority: `importance≥10 & urgency≥8 → Critical`; `importance≥7 or urgency≥8 → High`; `importance≤3 & urgency≤4 → Low`; else `Medium`.
- Then `POST /api/task-assignments` per assignee; **only `role==='Employee'` members are assigned** (backend rejects Admin/Manager assignees with 404). Non-employee selections are skipped with an info toast; per-assignee failures are reported without failing the whole create.
- Create button visibility unchanged: hidden for `Employee` (AppShell + AddTaskModal already gated).

## Files changed

- `Client/.env.example` (new), `Client/.env` (new, git-ignored), `Client/vite.config.js`
- `Client/src/api/client.js` — 401 interceptor (logout + redirect), `USE_MOCK`, `isNetworkError`
- `Client/src/api/adapters.js` (new) — `normalizeTask`, `normalizeTeamMember`, status/column maps
- `Client/src/context/AuthContext.jsx` — id mapping, strict mock-fallback rules, session restore, register→login
- `Client/src/context/TaskContext.jsx` — API fetch (`GET /tasks`, `GET /task-assignments`, `GET /users`), role-aware status persistence, `POST /tasks` + assignments, `tasksLoading/tasksError/refreshTasks`; mock path preserved behind `VITE_USE_MOCK`
- `Client/src/components/ui/AddTaskModal.jsx` — awaits `addTask`, keeps form open on failure
- `Client/src/pages/KanbanPage.jsx` — loading skeleton, error+retry, empty state
- `Client/src/pages/DashboardOverview.jsx` — loading/error/empty states in ranked list
- `Client/src/pages/AuthPage.jsx` — surfaces register errors
- `Client/src/App.jsx` — `RequireAuth` guard

## Verified in browser (headless Chromium, real backend)

| Check | Result |
|---|---|
| `vite build` | ✅ passes |
| Unauthenticated `/dashboard` → redirect `/auth` | ✅ |
| Login (Admin) → `POST /api/auth/login` 200, token+user stored | ✅ |
| Session restore on reload | ✅ stays on route |
| Dashboard/Kanban render real tasks (`GET /tasks`, `GET /task-assignments`, `GET /users` all 200) | ✅ |
| Create task via modal → `POST /api/tasks` 201 + `POST /api/task-assignments` 201 + refetch | ✅ |
| Admin "Done" → `PUT /api/tasks/:id` 200 | ✅ |
| Employee login → sees only assigned tasks; "Done" → `PATCH /api/task-updates` 201 | ✅ |
| Employee `GET /api/users` → 403 → mock member list fallback (by design) | ✅ |
| Invalid login → backend `message` shown, no mock fallback | ✅ (code path; 400/401 verified via curl) |

## Still mock / not wired

- `weights`, `aiScore`, `importance/urgency/effort`, `tags`, gamification XP/badges/streak, notifications list, project streams, chat messages — all remain client-side mock (no backend fields/endpoints consumed).
- `teamMembers` for **Employee** role uses mock list (`GET /api/users` is Admin/Manager-only → 403).
- `addTeamMember` is local-only (backend `POST /api/users` requires a password the UI doesn't collect).
- Calendar/Analytics/Chat/Rewards pages render from the same normalized task/member data; chat & rewards have no wired endpoints.

## Test data created in the dev database

- User `devin-test-admin@flowzen.local` (Admin), user `qa-emp@flowzen.local` (Employee), and task "QA Integration Test Task" (assigned to qa-emp, status now `Completed` via the employee PATCH test). Delete them if unwanted.

---

## Backend phases 1–2 — frontend changes needed

Phase 1 (security + user management):
- `POST /api/users` no longer accepts `password`; response includes `tempPassword` (show once) and `user.mustChangePassword`. TeamPage "add member" flow must display the temp password and prompt the new user to change it.
- New `POST /api/auth/change-password {currentPassword,newPassword}` — add a change-password screen/flow; users with `mustChangePassword=true` (in login response) should be routed there.
- `DELETE /api/users/:id` (soft delete) available for Admin/Manager — optional UI.
- Login response `user` now includes `mustChangePassword`, `companyId` (Phase 2).

Phase 2 (multi-tenancy) — BREAKING:
- `POST /api/auth/register` is **removed (404)**. `AuthContext.registerCompany` must call `POST /api/auth/register-company {companyName, adminName, email, password}` which returns `{token, user, company}` directly (no second login call needed).
- Login body accepts optional `company` (name or id) for disambiguation when the same email exists in multiple companies; 409 response should prompt the user to pick a company.
- All list/detail responses are company-scoped automatically via the JWT — no frontend change needed beyond the above.
- Login `user` payload now includes `companyId` — can be stored in `flowzen_user`.

Phase 3 (task model) — frontend changes needed:
- `POST /api/tasks` and `PUT /api/tasks/:id` now accept `importance`, `urgency`, `effort`, `tags`, `category` — the AddTaskModal can send these instead of relying on client-only storage; `task.aiScore` is now returned by the server (client may keep computing its own weighted score).
- Status `'Review'` is now a real backend status — the Kanban `review` column can map to `'Review'` instead of `'On Hold'` (update `COLUMN_TO_STATUS`/`STATUS_TO_COLUMN` in `src/api/adapters.js`).
- `GET /api/tasks` returns `assignees[]` inline — the frontend can drop the separate `GET /api/task-assignments` call (keep it as fallback).

Phase 4 (chat + rewards) — frontend changes needed:
- New `/api/conversations` endpoints for DMs and task threads; ChatPage should migrate from mock/channel chat to these.
- `GET /api/rewards/me` and `/api/rewards/leaderboard` can power GamificationPage/RewardsPage instead of mock `gamification` state.
- Manager "approve completion" = `PUT /tasks/:id {status:'Completed'}` — response includes `rewardsGranted`; UI should surface XP/badge toasts for employees.

---

## Real-data UI pass (2026-11-12)

New/changed endpoints consumed by the frontend:

| Endpoint | Used by |
|---|---|
| `GET /api/conversations` (now returns `id`, `unreadCount`, populated `taskId`) | ChatPage |
| `POST /api/conversations` `{userId}` / `{taskId}` / `{type:'general'}` | ChatPage openers, Kanban "Chat"/"Ask" |
| `GET /api/conversations/:id/messages?after=<ISO>` | ChatPage 5s polling |
| `POST /api/conversations/:id/messages` `{message}` (≤2000 chars) | ChatPage send/retry |
| `POST /api/conversations/:id/read` | ChatPage unread badges |
| `GET /api/users/messageable` | ChatPage DM targets (all roles) |
| `GET /api/rewards/leaderboard`, `GET /api/rewards/me` | Admin dashboard leaderboard, Rewards page, focus-timer XP refresh |
| `POST /api/tasks` now sends `importance/urgency/effort/category/tags` | AddTaskModal → TaskContext |
| `PUT /api/tasks/:id {status}` approve/send-back on dashboards | Admin/Manager dashboards |

Notes:
- `POST /api/conversations` accepts bare `{userId}`/`{taskId}` (type inferred);
  `{type:'dm'|'task'}` still works.
- DM rules enforced server-side: Admin→anyone; Manager→Admins + own created
  Employees; Employee→Admins + creator. Violations → 403.
- Task threads require ≥2 assignees → 400 otherwise; non-participants → 403.
- Login user payload now includes `createdBy` (for "Ask my manager" deep links).
