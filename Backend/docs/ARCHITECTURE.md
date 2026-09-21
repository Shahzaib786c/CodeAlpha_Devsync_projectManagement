# Architecture and schema relationships

## Pattern adopted from your reference
| Folder/file | Responsibility |
|---|---|
| Backend/server.js | Environment checks, MongoDB startup, HTTP + Socket.IO lifecycle |
| Backend/app.js | Express setup and injectable application factory for tests |
| config/ | Database, Cloudinary and environment configuration |
| controllers/ | authController, profileController, projectController, taskController, commentController, notificationController |
| middleware/ | verifyToken, avatar upload and validation, JSON error handler |
| models/ | Separate userModel, projectModel, taskModel, commentModel, notificationModel |
| routes/ | Separate route files per resource |
| validators/ | Allowed body fields, IDs, pagination and filters |
| services/ | Authentication, membership checks, storage operations, event/notification publishing, per-project coordination |
| sockets/ | Socket authentication, authorized room joins, expiration and packet limits |
| scripts/ | Socket test client, Mongo integration runner |
| tests/ | Workflow tests and temporary memory adapter |
| postman/ | Importable request collection |

Controllers use named exported async functions. Express 5 forwards errors to one middleware instead of duplicating try/catch and exposing internal messages in every controller. Domain checks are shared by reads, writes and socket joins.

## Data relationships
| Model | Essential fields | Relationship |
|---|---|---|
| User | name, email (unique), password hash, tokenVersion, avatar {url, publicId} | Owns projects; joins projects; authors comments |
| Project | name, description, owner, members[], deletedAt | One owner; many members; many tasks |
| Task | project, title, description, createdBy, assignee, status, priority, dueDate, deletedAt | One project; one creator; optional assignee from current members |
| Comment | project, task, author, body | Belongs to one task; written by one user |
| Notification | recipient, project, task (optional), kind, message, readAt | Belongs to a recipient and an accessible project |

All models have timestamps. A board is a grouped view of tasks, not a separate model. Status values deliberately match your reference: `pending`, `in-progress`, `completed`. UI labels: To do, In progress, Completed.

## Request example: Bilal starts a task
1. Postman sends PATCH `/api/projects/:projectId/tasks/:taskId/status` with `{ "status": "in-progress" }` and a Bearer token.
2. verifyToken checks signature, expiry and current user.tokenVersion.
3. Request validation accepts only the allowed fields and status.
4. Inside the project queue, the controller checks current membership and the task/project relationship.
5. The task model is updated in MongoDB during normal startup.
6. Socket.IO emits `task:updated` to authenticated subscribers of that project. `workspace:changed` invalidates project lists/counters for current members. Personal notifications are stored and sent.
7. A connected client can refetch authorized REST data. The React/Redux/Framer Motion frontend will be built separately.

## Permissions
| Action | Who can do it |
|---|---|
| Create project | Any authenticated user |
| View project/tasks/comments | Current project members |
| Edit/delete project, add/remove members | Project owner |
| Create/assign/update task | Any current project member |
| Delete task | Task creator or project owner |
| Add comments | Current members |
| Edit comment | Comment author, while still a member |
| Delete comment | Author or owner, while a member |
| Read/mark notifications | Their recipient |
| Update profile | The account owner |

The owner cannot be removed. Only registered users can be added, with a maximum of 100 members per project. Removed users lose project access; their assignments are cleared and relevant notifications removed. Project/task deletion is soft deletion; dependent records may remain in MongoDB but cannot be read through active task/project routes. No restoration endpoint.

## Why the storage adapter exists
`mongoStore()` uses Mongoose queries in normal operation. Automated tests explicitly inject a temporary memory adapter. Both pass through the same business logic and Mongoose schema definitions. Memory testing does not prove MongoDB connection, query planner, durability or unique-index behavior; `npm run test:mongo` runs checks against the normal adapter when a temporary MongoDB can start on your machine.

## Operational boundaries
This release targets a **single Node process**. A per-project queue serializes writes and socket joins so removal cannot race a local room join or task assignment. Horizontal scaling requires distributed coordination and a Socket.IO adapter; an in-process queue alone is insufficient.

Multi-document actions (for example removing a member, clearing assignments and deleting alerts) are not database transactions. A process crash or storage failure mid-action can leave cleanup unfinished. Core access checks always verify current membership, but strict crash atomicity and notification delivery guarantees require transactions/outbox/retry work before a production service. Live socket messages are not a durable event log. Fetch state and notifications after reconnect.

Auth uses short-lived Bearer tokens plus tokenVersion revocation. Password reset, email verification, attachment uploads, refresh tokens and account deletion are outside this milestone. Roles are per-project owner/member, not a global administrator.

## Official implementation references
- [Socket.IO middleware](https://socket.io/docs/v4/middlewares/)
- [Socket.IO rooms](https://socket.io/docs/v4/rooms/)
- [Socket.IO delivery guarantees](https://socket.io/docs/v4/delivery-guarantees/)
- [Express error handling](https://expressjs.com/en/guide/error-handling/)
