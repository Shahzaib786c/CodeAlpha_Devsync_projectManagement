# Verification — DevSync frontend delivery

Date: 2026-09-21.

## Checks completed

| Check | Result |
|---|---|
| Vite production build (`npm run build`) | Passed |
| Source formatting (`npm run format:check`) | Passed |
| Playwright Chromium workflows | 3 passed, 0 failed |
| Desktop and mobile screenshot inspection | Overview, board, task dialog, profile, sign-in and mobile board reviewed |
| Mobile page overflow | No document-level horizontal overflow at 390px in the checked pages; the board intentionally scrolls horizontally |

The browser tests exercised the actual React application through the Vite proxy and the actual Express/Socket.IO business logic. The test server uses the backend's explicit in-memory test store and an injected media provider. It is separate from normal application startup and cannot run without `DEVSYNC_E2E=1`.

## Browser workflow coverage

1. Register owner through the UI; create a project; add a registered member; create an assigned task with priority and due date.
2. Sign in as the member in a second browser context; verify owner-only edit controls are absent.
3. Drag a task between board columns; verify the other browser updates without refreshing.
4. Post a comment as the member; read it as the owner; change task status and observe the update in the member's open task dialog.
5. Edit the owner's name; upload a valid PNG through the real file input/multipart/image decoding path; remove the avatar. Cloud storage is simulated for this check.
6. Remove the member; verify their currently open project loses access.
7. Change the password; verify sign-out and successful login with the new password.
8. Open notifications and mark a notification read when present.
9. On a 390px viewport with reduced motion: register, inspect the empty workspace, use mobile navigation, open My Tasks, reject an invalid image type, reject mismatched new passwords and close a modal with Escape.
10. Create a representative dataset through the test API and capture six actual UI screenshots.

## Infrastructure limitations

- No live MongoDB or Cloudinary account was used for frontend browser tests. Existing backend verification and its MongoDB binary limitation are documented in `Backend/docs/VERIFICATION.md`.
- Successful mocked-media upload does not prove your Cloudinary credentials or account settings are correct. Run an upload/replacement/removal locally with your configured account.
- The browser's ordinary download endpoint timed out here; the checks ran successfully with a locally unpacked Chromium 153 binary. Users can use the standard `npx playwright install chromium` command. `E2E_CHROMIUM_PATH` is an optional test-runner override only.
- Chromium desktop/mobile emulation was checked; this is not a Safari/Firefox certification, complete accessibility audit, load test or production deployment test.
- The app is delivered as source to run locally. No hosted website or deployment is included.

## Local acceptance checks

1. Start the real backend and frontend using the root README. Log in using an existing Postman account to confirm shared database state.
2. Create a project/task, restart the backend and confirm the records persist in MongoDB.
3. Use two different browser profiles with owner/member accounts to observe live status changes and comments.
4. Upload, replace and remove a picture using real Cloudinary credentials. Check the resulting asset in Cloudinary.
5. Try a member-only session: project settings and member-removal actions should remain restricted.
6. Change the password and confirm other active sessions end.

The screenshots contain test records and example.com test accounts. They are included for visual reference, not loaded by the shipped application.
