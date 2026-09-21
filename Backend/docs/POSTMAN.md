# DevSync — Postman testing guide

Start the backend with MongoDB and import `postman/DevSync.postman_collection.json`. Use **No environment**; collection variables contain the base URL, passwords, tokens and IDs. Default: `http://localhost:5000/api`.

1. Run **00 Setup** once to automatically create three disposable users, a project, membership and an assigned task. Rerunning Setup generates a fresh dataset.
2. Run **01–08** in order. Expected 4xx responses in permission tests are successful checks.
3. Run **09 Profile Pictures** manually after configuring Cloudinary. Select a local image for both upload requests; Postman cannot attach a file from your computer automatically. Do not set Content-Type yourself for these multipart requests.
4. Run all six requests in **10 Password Change** in order. It changes and then restores the owner password, saving fresh tokens. If interrupted, log in using `newPassword` and finish restoration.
5. Run **99 Cleanup** only after inspection. It removes generated project/task/comment data and logs out test users; accounts remain. Deselect this folder in the Runner to keep your test project.

Do not run the entire collection unmodified: folder 09 needs file selection and Cloudinary; folder 99 intentionally cleans up test data. For automated API checking, select 00–08 and 10.

Status: `pending`, `in-progress`, `completed`. Priority: `low`, `medium`, `high`. Dates: ISO timestamp with timezone. Lists use `page` and `limit` (maximum 100). JWTs expire after one hour. Use folder 01 to refresh tokens. Email is read-only. See `REALTIME.md` for Socket.IO testing.

## Every request and body

## 00 Setup - RUN FIRST

Run this whole folder once. Creates NEW disposable users, one project, membership and one assigned task. Tokens and IDs are saved automatically. Rerunning starts a fresh dataset; previous data is not erased.

### 01 Start fresh test session + health

`GET {{baseUrl}}/health`

Authentication: none.

Body: none.

### 02 Register owner

`POST {{baseUrl}}/auth/register`

Authentication: none.

```json
{
  "name": "Shahzaib - Test Owner",
  "email": "{{ownerEmail}}",
  "password": "{{testPassword}}"
}
```

### 03 Register member

`POST {{baseUrl}}/auth/register`

Authentication: none.

```json
{
  "name": "Bilal - Test Member",
  "email": "{{memberEmail}}",
  "password": "{{testPassword}}"
}
```

### 04 Register outsider

`POST {{baseUrl}}/auth/register`

Authentication: none.

```json
{
  "name": "Mouiz - Outside Project",
  "email": "{{outsiderEmail}}",
  "password": "{{testPassword}}"
}
```

### 05 Create shared project

`POST {{baseUrl}}/projects`

Authentication: {{ownerToken}}.

```json
{
  "name": "DevSync QA {{runId}}",
  "description": "Disposable workspace for API testing"
}
```

### 06 Add member to project

`POST {{baseUrl}}/projects/{{projectId}}/members`

Authentication: {{ownerToken}}.

```json
{
  "email": "{{memberEmail}}"
}
```

### 07 Create task assigned to member

`POST {{baseUrl}}/projects/{{projectId}}/tasks`

Authentication: {{ownerToken}}.

```json
{
  "title": "Build checkout API",
  "description": "Implement checkout validation and responses",
  "assignee": "{{memberId}}",
  "status": "pending",
  "priority": "high",
  "dueDate": "2026-12-01T12:00:00Z"
}
```

## 01 Authentication

Refresh tokens here without rerunning Setup. Current generated emails and password are in collection Variables. Logout is in Cleanup.

### 01 Login owner

`POST {{baseUrl}}/auth/login`

Authentication: none.

```json
{
  "email": "{{ownerEmail}}",
  "password": "{{testPassword}}"
}
```

### 02 Login member

`POST {{baseUrl}}/auth/login`

Authentication: none.

```json
{
  "email": "{{memberEmail}}",
  "password": "{{testPassword}}"
}
```

### 03 Login outsider

`POST {{baseUrl}}/auth/login`

Authentication: none.

```json
{
  "email": "{{outsiderEmail}}",
  "password": "{{testPassword}}"
}
```

### 04 Current owner profile

`GET {{baseUrl}}/auth/me`

Authentication: {{ownerToken}}.

Body: none.

### 05 Current member profile

`GET {{baseUrl}}/auth/me`

Authentication: {{memberToken}}.

Body: none.

### 06 Update owner display name

`PATCH {{baseUrl}}/auth/me`

Authentication: {{ownerToken}}.

```json
{
  "name": "Muhammad Shahzaib - QA Owner"
}
```

## 02 Projects

Main test project is projectId. Create extra project saves extraProjectId without replacing your main project.

### 01 Create extra project

`POST {{baseUrl}}/projects`

Authentication: {{ownerToken}}.

```json
{
  "name": "Second project {{runId}}",
  "description": "Separate project for access-boundary testing"
}
```

### 02 List owner projects

`GET {{baseUrl}}/projects?page=1&limit=20`

Authentication: {{ownerToken}}.

Body: none.

### 03 List member projects

`GET {{baseUrl}}/projects?page=1&limit=20`

Authentication: {{memberToken}}.

Body: none.

### 04 Project details and team

`GET {{baseUrl}}/projects/{{projectId}}`

Authentication: {{ownerToken}}.

Body: none.

### 05 Update project

`PATCH {{baseUrl}}/projects/{{projectId}}`

Authentication: {{ownerToken}}.

```json
{
  "name": "DevSync API Review {{runId}}",
  "description": "Testing tasks, permissions, comments and live updates"
}
```

### 06 Board grouped by status

`GET {{baseUrl}}/projects/{{projectId}}/board?page=1&limit=20`

Authentication: {{ownerToken}}.

Body: none.

## 03 Members

The owner adds registered users by email. Running add again is safe and does not duplicate membership. Removal is in Cleanup.

### 01 Add existing member (safe repeat)

`POST {{baseUrl}}/projects/{{projectId}}/members`

Authentication: {{ownerToken}}.

```json
{
  "email": "{{memberEmail}}"
}
```

### 02 Read project members

`GET {{baseUrl}}/projects/{{projectId}}`

Authentication: {{ownerToken}}.

Body: none.

## 04 Tasks

Use the assigned task from Setup. Create extra task saves extraTaskId. No manual IDs are needed.

### 01 Create extra task

`POST {{baseUrl}}/projects/{{projectId}}/tasks`

Authentication: {{ownerToken}}.

```json
{
  "title": "Write API documentation",
  "description": "List request bodies and responses",
  "assignee": "{{ownerId}}",
  "priority": "low",
  "status": "pending",
  "dueDate": null
}
```

### 02 List tasks

`GET {{baseUrl}}/projects/{{projectId}}/tasks?page=1&limit=20`

Authentication: {{ownerToken}}.

Body: none.

### 03 Search title

`GET {{baseUrl}}/projects/{{projectId}}/tasks?search=checkout`

Authentication: {{ownerToken}}.

Body: none.

### 04 Filter priority

`GET {{baseUrl}}/projects/{{projectId}}/tasks?priority=high`

Authentication: {{ownerToken}}.

Body: none.

### 05 Filter assignee

`GET {{baseUrl}}/projects/{{projectId}}/tasks?assignee={{memberId}}`

Authentication: {{ownerToken}}.

Body: none.

### 06 Task details

`GET {{baseUrl}}/projects/{{projectId}}/tasks/{{taskId}}`

Authentication: {{ownerToken}}.

Body: none.

### 07 Update task fields

`PATCH {{baseUrl}}/projects/{{projectId}}/tasks/{{taskId}}`

Authentication: {{ownerToken}}.

```json
{
  "title": "Build checkout API",
  "description": "Validate products, totals and confirmation",
  "priority": "high",
  "dueDate": "2026-12-05T12:00:00Z"
}
```

### 08 Unassign and clear deadline

`PATCH {{baseUrl}}/projects/{{projectId}}/tasks/{{taskId}}`

Authentication: {{ownerToken}}.

```json
{
  "assignee": null,
  "dueDate": null
}
```

### 09 Assign back to member

`PATCH {{baseUrl}}/projects/{{projectId}}/tasks/{{taskId}}`

Authentication: {{ownerToken}}.

```json
{
  "assignee": "{{memberId}}",
  "dueDate": "2026-12-05T12:00:00Z"
}
```

### 10 Member starts task

`PATCH {{baseUrl}}/projects/{{projectId}}/tasks/{{taskId}}/status`

Authentication: {{memberToken}}.

```json
{
  "status": "in-progress"
}
```

### 11 Filter in-progress tasks

`GET {{baseUrl}}/projects/{{projectId}}/tasks?status=in-progress`

Authentication: {{ownerToken}}.

Body: none.

### 12 Member completes task

`PATCH {{baseUrl}}/projects/{{projectId}}/tasks/{{taskId}}/status`

Authentication: {{memberToken}}.

```json
{
  "status": "completed"
}
```

## 05 Comments

Task discussion. Run create first; its script captures commentId.

### 01 Member adds comment

`POST {{baseUrl}}/projects/{{projectId}}/tasks/{{taskId}}/comments`

Authentication: {{memberToken}}.

```json
{
  "body": "Checkout API is ready. Please review the validation."
}
```

### 02 List task discussion

`GET {{baseUrl}}/projects/{{projectId}}/tasks/{{taskId}}/comments?page=1&limit=20`

Authentication: {{ownerToken}}.

Body: none.

### 03 Author edits comment

`PATCH {{baseUrl}}/projects/{{projectId}}/tasks/{{taskId}}/comments/{{commentId}}`

Authentication: {{memberToken}}.

```json
{
  "body": "Checkout API is ready, including invalid-input responses."
}
```

## 06 Notifications

Saved personal alerts. Membership and assignments create member alerts; member comments/status changes create owner alerts. List captures an ID for mark-read.

### 01 Member notifications + capture ID

`GET {{baseUrl}}/notifications?page=1&limit=20`

Authentication: {{memberToken}}.

Body: none.

### 02 Member unread notifications

`GET {{baseUrl}}/notifications?unread=true`

Authentication: {{memberToken}}.

Body: none.

### 03 Mark member notification read

`PATCH {{baseUrl}}/notifications/{{notificationId}}/read`

Authentication: {{memberToken}}.

Body: none.

### 04 Owner notifications

`GET {{baseUrl}}/notifications`

Authentication: {{ownerToken}}.

Body: none.

## 07 Dashboard and My Tasks

Counts and assignments are scoped to the authenticated user.

### 01 Owner overview

`GET {{baseUrl}}/overview`

Authentication: {{ownerToken}}.

Body: none.

### 02 Member overview

`GET {{baseUrl}}/overview`

Authentication: {{memberToken}}.

Body: none.

### 03 Member assigned tasks

`GET {{baseUrl}}/tasks/mine?page=1&limit=20`

Authentication: {{memberToken}}.

Body: none.

### 04 Member completed assignments

`GET {{baseUrl}}/tasks/mine?status=completed&priority=high`

Authentication: {{memberToken}}.

Body: none.

## 08 Permission and Validation Checks

Expected 4xx responses are successful tests of protections. Run after folders 00–06 so captured IDs exist.

### 01 Missing token - expect 401

`GET {{baseUrl}}/projects`

Authentication: none.

Body: none.

### 02 Wrong password - expect 401

`POST {{baseUrl}}/auth/login`

Authentication: none.

```json
{
  "email": "{{ownerEmail}}",
  "password": "WrongPassword987!"
}
```

### 03 Outsider cannot read project

`GET {{baseUrl}}/projects/{{projectId}}`

Authentication: {{outsiderToken}}.

Body: none.

### 04 Member cannot rename project

`PATCH {{baseUrl}}/projects/{{projectId}}`

Authentication: {{memberToken}}.

```json
{
  "name": "Unauthorized change"
}
```

### 05 Member cannot add outsiders

`POST {{baseUrl}}/projects/{{projectId}}/members`

Authentication: {{memberToken}}.

```json
{
  "email": "{{outsiderEmail}}"
}
```

### 06 Cannot assign task to outsider

`PATCH {{baseUrl}}/projects/{{projectId}}/tasks/{{taskId}}`

Authentication: {{ownerToken}}.

```json
{
  "assignee": "{{outsiderId}}"
}
```

### 07 Invalid status rejected

`PATCH {{baseUrl}}/projects/{{projectId}}/tasks/{{taskId}}/status`

Authentication: {{ownerToken}}.

```json
{
  "status": "done"
}
```

### 08 Protected task fields rejected

`PATCH {{baseUrl}}/projects/{{projectId}}/tasks/{{taskId}}`

Authentication: {{ownerToken}}.

```json
{
  "project": "{{extraProjectId}}"
}
```

### 09 Empty update rejected

`PATCH {{baseUrl}}/projects/{{projectId}}/tasks/{{taskId}}`

Authentication: {{ownerToken}}.

```json
{}
```

### 10 Owner cannot edit member comment

`PATCH {{baseUrl}}/projects/{{projectId}}/tasks/{{taskId}}/comments/{{commentId}}`

Authentication: {{ownerToken}}.

```json
{
  "body": "Not my comment"
}
```

### 11 Outsider cannot read notification

`PATCH {{baseUrl}}/notifications/{{notificationId}}/read`

Authentication: {{outsiderToken}}.

Body: none.

### 12 Task cannot be read under wrong project

`GET {{baseUrl}}/projects/{{extraProjectId}}/tasks/{{taskId}}`

Authentication: {{ownerToken}}.

Body: none.

### 13 Owner cannot be removed

`DELETE {{baseUrl}}/projects/{{projectId}}/members/{{ownerId}}`

Authentication: {{ownerToken}}.

Body: none.

### 14 Malformed project ID

`GET {{baseUrl}}/projects/not-an-id`

Authentication: {{ownerToken}}.

Body: none.

### 15 Invalid pagination

`GET {{baseUrl}}/projects/{{projectId}}/tasks?limit=0`

Authentication: {{ownerToken}}.

Body: none.

## 09 Profile Pictures — MANUAL FILE SELECTION

Optional manual folder. Requires configured Cloudinary. Run before Cleanup.

### 01 Upload profile picture

`PUT {{baseUrl}}/auth/me/avatar`

Authentication: {{ownerToken}}.

Body: **form-data** → key `avatar` → type **File** → choose an image.

### 02 Replace profile picture — select another image

`PUT {{baseUrl}}/auth/me/avatar`

Authentication: {{ownerToken}}.

Body: **form-data** → key `avatar` → type **File** → choose an image.

### 03 Read profile and avatar URL

`GET {{baseUrl}}/auth/me`

Authentication: {{ownerToken}}.

Body: none.

### 04 Remove profile picture

`DELETE {{baseUrl}}/auth/me/avatar`

Authentication: {{ownerToken}}.

Body: none.

## 10 Password Change — RUN IN ORDER

Changes and restores owner password; disconnects all owner sockets twice. Complete all six steps.

### 01 Reject incorrect current password

`PATCH {{baseUrl}}/auth/change-password`

Authentication: {{ownerToken}}.

```json
{
  "currentPassword": "incorrect",
  "newPassword": "{{newPassword}}",
  "confirmPassword": "{{newPassword}}"
}
```

### 02 Change password — signs out all owner sessions

`PATCH {{baseUrl}}/auth/change-password`

Authentication: {{ownerToken}}.

```json
{
  "currentPassword": "{{testPassword}}",
  "newPassword": "{{newPassword}}",
  "confirmPassword": "{{newPassword}}"
}
```

### 03 Old token is rejected

`GET {{baseUrl}}/auth/me`

Authentication: {{ownerToken}}.

Body: none.

### 04 Login with new password

`POST {{baseUrl}}/auth/login`

Authentication: none.

```json
{
  "email": "{{ownerEmail}}",
  "password": "{{newPassword}}"
}
```

### 05 Restore original test password

`PATCH {{baseUrl}}/auth/change-password`

Authentication: {{ownerToken}}.

```json
{
  "currentPassword": "{{newPassword}}",
  "newPassword": "{{testPassword}}",
  "confirmPassword": "{{testPassword}}"
}
```

### 06 Login again for remaining requests

`POST {{baseUrl}}/auth/login`

Authentication: none.

```json
{
  "email": "{{ownerEmail}}",
  "password": "{{testPassword}}"
}
```

## 99 Cleanup - DESTRUCTIVE - RUN LAST

Run only when finished inspecting your test data. Deletes comments and soft-deletes tasks/projects, removes membership, then logs out each test user. Running the entire collection includes this folder. Users remain registered because this backend has no account-delete endpoint.

### 01 Owner deletes member comment

`DELETE {{baseUrl}}/projects/{{projectId}}/tasks/{{taskId}}/comments/{{commentId}}`

Authentication: {{ownerToken}}.

Body: none.

### 02 Remove member

`DELETE {{baseUrl}}/projects/{{projectId}}/members/{{memberId}}`

Authentication: {{ownerToken}}.

Body: none.

### 03 Removed member blocked

`GET {{baseUrl}}/projects/{{projectId}}`

Authentication: {{memberToken}}.

Body: none.

### 04 Check cleared assignee

`GET {{baseUrl}}/projects/{{projectId}}/tasks/{{taskId}}`

Authentication: {{ownerToken}}.

Body: none.

### 05 Delete extra task

`DELETE {{baseUrl}}/projects/{{projectId}}/tasks/{{extraTaskId}}`

Authentication: {{ownerToken}}.

Body: none.

### 06 Delete main task

`DELETE {{baseUrl}}/projects/{{projectId}}/tasks/{{taskId}}`

Authentication: {{ownerToken}}.

Body: none.

### 07 Deleted task unavailable

`GET {{baseUrl}}/projects/{{projectId}}/tasks/{{taskId}}`

Authentication: {{ownerToken}}.

Body: none.

### 08 Delete extra project

`DELETE {{baseUrl}}/projects/{{extraProjectId}}`

Authentication: {{ownerToken}}.

Body: none.

### 09 Delete main project

`DELETE {{baseUrl}}/projects/{{projectId}}`

Authentication: {{ownerToken}}.

Body: none.

### 10 Logout owner (all sessions)

`POST {{baseUrl}}/auth/logout`

Authentication: {{ownerToken}}.

Body: none.

### 11 Logout member (all sessions)

`POST {{baseUrl}}/auth/logout`

Authentication: {{memberToken}}.

Body: none.

### 12 Logout outsider (all sessions)

`POST {{baseUrl}}/auth/logout`

Authentication: {{outsiderToken}}.

Body: none.

### 13 Revoked owner token blocked

`GET {{baseUrl}}/auth/me`

Authentication: {{ownerToken}}.

Body: none.
