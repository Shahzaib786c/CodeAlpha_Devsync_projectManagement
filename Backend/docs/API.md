# REST API

Base: `http://localhost:5000/api`. Bearer token required except health/register/login. Resource responses use `{success:true,data}`; lists add page, limit, total. Auth uses token/expiresIn/user. Deletes and logout return 204. Errors use success:false, message and optional validation errors.

| Method | Path | Purpose |
|---|---|---|
| GET | /health | Health |
| POST | /auth/register | Register owner |
| POST | /auth/register | Register member |
| POST | /auth/login | Login owner |
| POST | /auth/login | Login member |
| GET | /auth/me | My profile |
| PATCH | /auth/me | Update my name |
| POST | /projects | Create project |
| GET | /projects?page=1&limit=20 | List projects |
| GET | /projects/:projectId | Project details and team |
| PATCH | /projects/:projectId | Edit project |
| POST | /projects/:projectId/members | Add registered member |
| POST | /projects/:projectId/tasks | Create assigned task |
| GET | /projects/:projectId/tasks?search=checkout&priority=high&page=1&limit=20 | Task list with search |
| GET | /projects/:projectId/tasks/:taskId | Task detail |
| PATCH | /projects/:projectId/tasks/:taskId/status | Member starts task |
| PATCH | /projects/:projectId/tasks/:taskId | Update task details |
| GET | /projects/:projectId/board | Project board |
| GET | /tasks/mine | Member assignments |
| GET | /overview | Overview counters |
| POST | /projects/:projectId/tasks/:taskId/comments | Member comments |
| GET | /projects/:projectId/tasks/:taskId/comments | Read discussion |
| PATCH | /projects/:projectId/tasks/:taskId/comments/:commentId | Edit own comment |
| PATCH | /projects/:projectId/tasks/:taskId/status | Complete task |
| GET | /notifications | Member notifications |
| PATCH | /notifications/:notificationId/read | Mark own notification read |
| GET | /notifications?unread=true | Unread notifications |
| PATCH | /projects/:projectId | Owner-only edit rejected |
| GET | /projects | Unauthenticated request rejected |
| DELETE | /projects/:projectId/tasks/:taskId/comments/:commentId | Delete comment |
| DELETE | /projects/:projectId/members/:userId | Remove member |
| GET | /projects/:projectId | Removed member blocked |
| DELETE | /projects/:projectId/tasks/:taskId | Delete task |
| DELETE | /projects/:projectId | Delete project |
| POST | /auth/logout | Logout all owner sessions |
| GET | /auth/me | Revoked token rejected |

## Write bodies
- Register: name, email, password (8 characters minimum, 72 UTF-8 bytes maximum).
- Login: email, password. Profile PATCH: name.
- Project: name required on create; description optional. PATCH accepts a nonempty subset.
- Add member: email of a registered user.
- Task: title required on create; optional description, assignee (ObjectId or null), status, priority, dueDate (ISO datetime with timezone or null).
- Status PATCH: status only. Valid values: pending / in-progress / completed.
- Priorities: low / medium / high.
- Comments: body.
- Unknown write fields are rejected.

## Queries
- page: default 1; limit: default 20, maximum 100.
- Project tasks and My Tasks: status, priority, search. Project tasks also allow assignee. My Tasks always restricts assignee to the logged-in user.
- search is a case-insensitive literal substring; regex metacharacters are escaped.
- Board returns a bucket for each status with total and tasks, paginated independently.
- Notifications: unread=true filters unread records. Response includes total unread count. unread=false leaves the list unfiltered.

## Status codes
200 success; 201 created; 204 removed/logout; 400 invalid input; 401 authentication; 403 role restriction; 404 absent/inaccessible; 409 duplicate email; 413 body too large; 429 rate limit; 500 unexpected failure; 503 disconnected MongoDB health.


## Profile extensions
See [PROFILE.md](PROFILE.md) for avatar upload/removal, password change and avatarUrl response fields. See [POSTMAN.md](POSTMAN.md) for every prefilled request.
