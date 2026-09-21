# DevSync Backend

Backend-only project management API with Express, MongoDB/Mongoose, JWT authentication, Socket.IO realtime collaboration and Cloudinary avatars. No frontend or demo UI is included.

## Run locally

Install Node.js 22 or newer and have a running local MongoDB or MongoDB Atlas connection.

```sh
cd Backend
npm ci
```

Create `.env` by copying `.env.example`:

- Windows PowerShell: `Copy-Item .env.example .env`
- macOS/Linux: `cp .env.example .env`

Edit `.env`: set `MONGODB_URI`, a strong `JWT_SECRET` and your three Cloudinary credentials. Generate a secret with:

```sh
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Then run:

```sh
npm run dev
```

API health: `GET http://localhost:5000/api/health`. Use `npm start` without watch mode.
MongoDB must be reachable; the server never substitutes an in-memory database. Cloudinary is required for avatar upload, but other API features can run without it. Missing media configuration returns 503 on upload. Never put API secrets in frontend code.

## What is included

- Register, login, current profile, edit name, logout, change password with current-password verification.
- Upload, replace and remove your profile picture; Cloudinary stores images, MongoDB stores the asset reference. JPEG/PNG/WebP, maximum 2 MB and 16 million pixels; normalized to 512×512 WebP with metadata removed.
- Projects, owner-managed membership, task CRUD, assignments, priorities, due dates, board, task filters and personal dashboard.
- Task comments and persisted personal notifications, mark-as-read.
- Authenticated Socket.IO over WebSocket: project rooms, live project/task/comment updates, personal notifications and profile updates. Removing a member evicts their project subscription. Logout/password changes revoke all of that user's existing tokens and sockets.
- Foldered Postman collection: 82 prefilled requests, automatic setup and ID/token capture.

## Folder structure

All files belong inside this `Backend/` directory:

```text
Backend/
  config/          MongoDB, environment and Cloudinary configuration
  controllers/     HTTP request handlers
  middleware/      Authentication, validation, image upload, errors
  models/          Mongoose schemas
  routes/          API endpoint definitions
  services/        Storage, permissions, sessions, media and events
  sockets/         Authenticated Socket.IO connections and project rooms
  validators/      Strict request schemas
  utils/           Shared API errors
  scripts/         Socket client and temporary MongoDB test runner
  tests/           HTTP, Postman, upload and realtime tests
  postman/         Importable DevSync API collection
  docs/            API, Postman, realtime and verification guides
  .env.example
  .gitignore
  app.js
  server.js
  package.json
  package-lock.json
  README.md
```

## Test in Postman

Import `postman/DevSync.postman_collection.json` and follow `docs/POSTMAN.md`. Run Setup to create test users and data automatically. Avatar requests require choosing a local file. Cleanup is optional and deletes generated project data.

## Automated checks

```sh
npm test
npm run test:mongo
```

`npm test` runs real HTTP and Socket.IO interactions against an explicit nonpersistent test adapter, plus a simulated media provider. It does not validate a live MongoDB or Cloudinary account. `test:mongo` downloads/starts a temporary MongoDB and runs collaboration tests against it; it requires a supported local binary environment. See `docs/VERIFICATION.md` for actual results and remaining checks.

## Existing data and deployment scope

Existing users remain compatible: users without an avatar return `avatarUrl: null`. Password hashes and existing project records are retained. Restart the previous backend with this code and the same database URI/JWT secret. Back up your database before replacing a deployed version; test with a separate database first.

This version targets one Node process. Locks and Socket.IO rooms are in process; multiple replicas need distributed coordination and a Socket.IO adapter. Multi-document writes are not transactional. Realtime events are invalidation hints, not a durable replay stream: refetch REST data after reconnecting. Failed Cloudinary cleanup is logged for an operator to retry, not automatically queued. See the profile guide for recovery behavior.
