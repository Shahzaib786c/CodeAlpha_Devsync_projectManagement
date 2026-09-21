# DevSync Frontend

React + Vite application that connects to the DevSync backend. Built with Redux Toolkit, RTK Query, Framer Motion, React Router, Socket.IO Client, dnd-kit, Lucide icons and Sonner toasts. DM Sans is bundled locally; the UI does not require a font CDN.

## Run

Requires Node 22.12+, the backend on port 5000 and its `CLIENT_URL=http://localhost:5173`.

```sh
npm ci
npm run dev
```

Open http://localhost:5173. Vite proxies the API and WebSocket transport to Backend. If using http://127.0.0.1:5173 instead, set the backend's CLIENT_URL to that exact origin and restart it.

## Source organization

| Folder | Responsibility |
|---|---|
| src/app | Redux store, session slice, session persistence and cache reset |
| src/components | Shared UI, forms, dialogs, task board and member controls |
| src/layout | Authenticated sidebar, topbar, responsive navigation |
| src/pages | Auth, overview, projects, project detail, My Tasks, Team, Notifications, Profile |
| src/routes | Protected layout routing and lazy-loaded screens |
| src/services | RTK Query API transport, WebSocket lifecycle, cache invalidation |
| src/styles | Pearl & Mulberry design tokens, responsive CSS and interaction states |
| src/utils | Task statuses, date conversion, initials and due-date helpers |
| tests | Browser workflows and explicit test-only backend adapter |

## Available commands

- `npm run dev`: local Vite server, API + Socket.IO proxy.
- `npm run build`: static production build in `dist/`.
- `npm run preview`: inspect the built frontend locally; a production build must have a reachable API URL or reverse proxy. The development proxy is not a production server.
- `npm run format` / `npm run format:check`: source formatting.
- `npm run test:e2e`: Playwright integration checks using the sibling Backend package.

## Connection settings

Copy `.env.example` to `.env` only if overriding defaults. Restart Vite after changing it.

| Variable | Local default | Purpose |
|---|---|---|
| API_PROXY_TARGET | http://127.0.0.1:5000 | Development-only proxy destination |
| VITE_API_URL | /api | Browser API base path including /api |
| VITE_SOCKET_URL | current browser origin | Socket.IO server origin, without /api |

For separately hosted frontend/backend domains, use `.env.production` **before building**:

```dotenv
VITE_API_URL=https://your-backend.example/api
VITE_SOCKET_URL=https://your-backend.example
```

Set Backend `CLIENT_URL` to your exact frontend HTTPS origin. The backend host must support a persistent Node process and WebSocket upgrades. Configure your frontend host to serve `index.html` for client routes such as `/projects/<id>`; otherwise refresh/deep links return 404. An alternative is a same-origin reverse proxy for both `/api` and `/socket.io`.

Do not put JWT signing secrets, MongoDB URIs or Cloudinary API secrets in any `VITE_` variable. These variables are public build-time values.

## Session and realtime behavior

A JWT and public user summary are kept in sessionStorage, scoped to the browser tab/session. There is no permanent remember-me option. The protected layout verifies the session with `/auth/me`. RTK Query attaches the Bearer token, clears the session on protected 401 responses and resets the cache on sign-out. Backend tokens expire after one hour; sign in again when prompted.

The application opens one authenticated Socket.IO connection. Entering a project joins its room. Changes trigger debounced RTK Query cache invalidation; reconnect refetches authoritative REST data. Writes remain HTTP operations. Profile changes refresh names/avatars and member removal removes project access. Events are not a durable replay stream, so disconnected clients reload on reconnect.

## Scope

Profile email editing, forgotten-password emails, file attachments, calendar scheduling, global administrator roles and account deletion have no backend API in this milestone and are not exposed as pretend controls. Team management is scoped to project membership. A user must register before being added; there is no email invitation delivery.

The backend's documented single-process and nontransactional-operation limits still apply. Refer to `../Backend/docs/ARCHITECTURE.md`.
