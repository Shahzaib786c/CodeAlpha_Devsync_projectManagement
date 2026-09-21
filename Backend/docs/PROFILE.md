# Profile and avatar API

All paths below have `/api` prefix and require `Authorization: Bearer <token>`.

| Method | Path | Body | Result |
|---|---|---|---|
| GET | /auth/me | None | Public current user |
| PATCH | /auth/me | `{ "name": "Shahzaib" }` | Updated public user |
| PUT | /auth/me/avatar | multipart/form-data file field `avatar` | Upload or replace avatar |
| DELETE | /auth/me/avatar | None | Clear avatar; repeat safely |
| PATCH | /auth/change-password | `currentPassword`, `newPassword`, `confirmPassword` | 200, requiresLogin true |

Email is read-only. The public user contains `_id`, `name`, `email`, `createdAt`, `avatarUrl` (HTTPS URL or null). Password hashes, token versions and Cloudinary public IDs are never in public user responses. Project memberUsers, comment authorUser and task assigneeUser include avatarUrl. Task assigneeUser contains only ID/name/avatarUrl.

Password change example:

```json
{
  "currentPassword": "YourCurrentPassword123!",
  "newPassword": "YourNewPassword456!",
  "confirmPassword": "YourNewPassword456!"
}
```

Passwords require at least 8 characters and at most 72 UTF-8 bytes. A different new password and matching confirmation are required. Success revokes ALL existing sessions, emits `session:expired`, and disconnects sockets. Log in again; no replacement token is returned by this endpoint. No password reset/email verification flow is included.

## Image validation and lifecycle

Only one file and no additional multipart fields are accepted. Supported inputs: nonanimated JPEG, PNG, WebP; maximum 2 MB and 16 megapixels. MIME type is checked and actual image data is decoded independently. Images are rotated according to orientation and cropped to 512×512 WebP; input metadata is not retained. SVG, GIF, malformed and oversized images are rejected. Multer size errors return 413; other image validation errors return 400. Profile mutations are rate-limited to 30 per 15 minutes per client IP.

Upload creates a new random Cloudinary asset, then saves its reference. The previous asset is deleted only after the database update succeeds. If saving fails, the new asset is deleted and the previous profile remains intact. Failed provider uploads return 502; missing credentials return 503. Removal clears the database reference before deleting the asset.

If deletion fails after a committed replacement/removal, the API still returns 200 with `cleanupPending: true`. The server emits an `avatar_cleanup_failed` log containing the public ID for manual cleanup in Cloudinary. There is no background retry queue. A process crash between upload and database update can leave an orphaned asset; periodic asset reconciliation is an operational follow-up. Cloudinary delivery URLs are public, so avatars must not contain private documents.

## Realtime profile updates

`user:updated` is sent to the user and current members of their active projects. Payload:

```json
{ "user": { "_id": "user-id", "name": "Shahzaib", "avatarUrl": "https://..." } }
```

Clients should update/refetch cached profile, members, task assignees and comment authors. Email and Cloudinary management IDs are not broadcast. Shared-project recipients can receive duplicate hints when sharing several projects; updates must be idempotent. Reconnect and refetch authoritative REST data after a disconnection.

Implementation references: [Cloudinary Node upload API](https://cloudinary.com/documentation/node_image_and_video_upload), [Sharp image constructor](https://sharp.pixelplumbing.com/api-constructor/).
