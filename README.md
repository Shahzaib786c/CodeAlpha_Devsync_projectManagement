# DevSync

Project management with a Pearl & Mulberry interface, React, Redux Toolkit/RTK Query, Framer Motion, Express, MongoDB, Socket.IO and Cloudinary.

This package contains the complete frontend and the previously delivered backend:

```text
DevSync/
  Backend/     API, MongoDB models, Cloudinary uploads, Socket.IO, Postman requests
  Frontend/    React application, source styles, browser tests and package lock
  docs/        Setup, architecture, verification and actual UI screenshots
  README.md
```

The app starts empty and uses your backend data. There are no hardcoded users, projects or tasks in the product. Screenshots show test fixtures created through the API during browser testing; they are not preloaded into your database.

## Start locally — Windows PowerShell

Use Node.js **22.12 or newer**. Start MongoDB locally or prepare your MongoDB Atlas URI.

### Terminal 1 — backend

From the extracted `DevSync` folder:

```powershell
cd Backend
npm ci
Copy-Item .env.example .env
```

Edit `Backend/.env`:

```dotenv
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/devsync
JWT_SECRET=your-random-secret-at-least-32-characters
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Generate a JWT secret rather than using the placeholder:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Then:

```powershell
npm run dev
```

If you already have the backend working, keep your existing `Backend/.env` and database. **Do not overwrite your configured `.env` with the example.** You can add this package's `Frontend` folder next to your existing `Backend` folder.

### Terminal 2 — frontend

Open another terminal in the extracted `DevSync` folder:

```powershell
cd Frontend
npm ci
npm run dev
```

Open **http://localhost:5173**. Register an account or sign in with an account you already created through Postman. Keep both terminals running.

The frontend needs no `.env` for this local setup: Vite forwards `/api` and `/socket.io` to `http://127.0.0.1:5000`. If your backend port differs, copy `Frontend/.env.example` to `.env`, change `API_PROXY_TARGET`, then restart Vite.

macOS/Linux: use `cp .env.example .env` in place of PowerShell's `Copy-Item`.

## First project, step by step

1. Register/sign in. Create a project from Overview or Projects.
2. Open the project's **Members** tab. Add another registered user's email. Only the project owner can manage membership.
3. Use **New task** to set a title, description, assignee, priority, status and due date.
4. Drag a task by its handle to another board column, or open it and use **Move to**. List view is available too.
5. Open a task to read/post comments. Authors can edit their comments; authors and project owners can delete them.
6. Use **My tasks** for your assignments across projects, with search/status/priority filters.
7. Visit **Notifications** to read project updates and mark individual items as read.
8. Visit **Profile & settings** to change your name, upload/remove a profile picture or change your password. Email is read-only.

To see live collaboration, sign in as a second project member in a different browser profile or private window. Change a task or post a comment in one window; the other window updates through Socket.IO. Ordinary duplicated browser tabs can inherit sessionStorage, so use a private window when testing different users.

## Features

- Responsive overview, projects, board/list views, My Tasks, project teams, notifications, profile and auth pages.
- Search, status/priority/assignee filters where supported, and pagination without silently dropping tasks.
- Draggable Kanban cards plus a select-based status control usable without dragging.
- Real member/owner permissions, confirmations for destructive actions, validation, loading/error/empty states.
- Subtle animated DevSync logo, page/dialog transitions and styled toasts. Reduced-motion preferences are respected.
- Server-backed profile photo selection/preview, upload, replacement and removal. Cloudinary secrets stay in Backend.
- Redux owns session state; RTK Query owns request/cache state; WebSocket events invalidate and reload authorized data.
- Expired/revoked sessions return to sign-in. Password changes and logout revoke all existing sessions for the account.

## Test and build

Backend:

```powershell
cd Backend
npm test
```

Frontend (separate terminal):

```powershell
cd Frontend
npm run build
npm run format:check
npx playwright install chromium
npm run test:e2e
```

Stop the ordinary frontend first: the browser test runner uses port 5173. E2E tests automatically start a separate test backend on port 5001 with nonpersistent storage and simulated media. They do not connect to your MongoDB or Cloudinary account. Both Backend and Frontend dependencies must be installed before running E2E tests.

See `docs/VERIFICATION.md` for the actual results and limitations. See `Frontend/README.md` for deployment configuration and `Backend/docs/POSTMAN.md` for all 82 API requests.
