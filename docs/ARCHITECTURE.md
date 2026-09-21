# DevSync frontend architecture

## How data travels

1. A page or dialog subscribes to an RTK Query endpoint. The API service attaches the session's Bearer token.
2. During development, Vite forwards API requests to Express. In production, the browser uses a configured backend URL or a reverse proxy.
3. Backend authentication, validators, permissions and services read/write MongoDB. Profile images are decoded by Sharp and stored through Cloudinary.
4. The HTTP response updates Redux's request cache. Mutations invalidate active queries so lists/counters stay consistent.
5. Backend Socket.IO events notify authorized users and project rooms. The frontend debounces those events, invalidates cache entries and refetches server data. It refetches on reconnect too.

A new browser account starts with an empty workspace. Only the browser tests create sample data, via the real API with a test storage adapter.

## State ownership

| Data | Owner |
|---|---|
| Token and public signed-in user | Redux auth slice; persisted to sessionStorage |
| API lists, project details, tasks, comments, notifications | Redux RTK Query cache |
| Forms, open dialogs, filters and current pagination | Local React state / URL task parameter |
| Connection lifecycle and active project subscription | Realtime provider |
| Animation preferences | Framer Motion reduced-motion configuration and CSS |
| Authoritative records and permissions | Backend/MongoDB |

## Screen-to-API mapping

| Screen | Reads | Writes |
|---|---|---|
| Login / Register | — | /auth/login, /auth/register |
| Overview | /overview, /projects, /tasks/mine, /notifications | Create project |
| Projects | /projects (paginated) | Create project |
| Project board/list | /projects/:id, /projects/:id/tasks (per-column status filters) | Project edit/delete; task create/update/status/delete |
| Task dialog | Task detail, paginated comments | Task changes; comment create/edit/delete |
| Members / Team | Project list/details and memberUsers | Add/remove registered project members |
| My Tasks | /tasks/mine with filters | Task-dialog actions |
| Notifications | /notifications, unread count/filter | Mark one item read |
| Profile | /auth/me | Name, avatar upload/removal, password change |

The board loads each status column separately with its own page/total. This supports filters and pagination using the existing task list API; it does not require adding backend endpoints. Dragging changes status only after the server accepts the mutation. Open-task **Move to** provides the same operation without dragging.

## Visual system

Pearl #FAF9F6; paper #FFFEFD; mulberry #713B59; ink #332C32. Dusty rose highlights and restrained sage/amber status colors distinguish task states. DM Sans is self-hosted through the frontend package. Components share spacing, borders, focus states and feedback styling. Framer Motion animates logo entrance/hover, page entry and dialogs; Sonner provides custom-styled accessible toasts. Motion is reduced when the OS requests it.

## Existing backend

The sibling Backend is the delivered DevSync backend, with no frontend-specific API replacement. Its models remain User, Project, Task, Comment and Notification. Cloudinary credentials belong only in Backend/.env. The frontend sends multipart `avatar` data to the backend, never directly to Cloudinary.
