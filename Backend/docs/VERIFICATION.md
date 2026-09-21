# Verification — DevSync backend 3.0.0

Verified on 2026-09-20.

## Passed

`npm test`: 5 test groups, 5 passed, 0 failed.

- 78 Postman requests executed in their documented order with request bodies, authorization, variable capture, response assertions and password change/restoration.
- HTTP input boundaries, strict field validation, unauthorized access and collaboration permissions.
- Real Socket.IO connections: membership authorization, task/comment notifications, removal, reconnect recovery and session revocation.
- Avatar upload/replacement/removal with real multipart parsing and Sharp image decoding, using an injected media test double. Checked invalid image bytes, SVG, oversized upload, wrong file field, absent file and missing authentication.
- Avatar propagation in current profile, project members, task assignees, comment authors and realtime profile updates to a collaborator.
- Failed database update cleans up the new avatar and preserves the previous avatar reference. Failed upload preserves the existing picture. Failed asset deletion returns an explicit cleanupPending flag.
- Password validation, current-password verification, mismatch/same-password rejection, old-token rejection, old-password rejection, fresh login and live socket disconnection.

The tests deliberately simulate storage failures. `Request failed: Error` and `avatar_cleanup_failed` lines in test output are expected failure-path checks, not failed test results.

## Not verified against live infrastructure

- `npm run test:mongo` was attempted, but the temporary MongoDB binary exited with code 100 in this runtime. Real MongoDB integration, durability and index behavior are NOT verified here.
- No live Cloudinary credentials were provided. Actual provider uploads, deletion, delivery and account configuration must be tested locally. Automated avatar tests use a media test double, not Cloudinary.
- Postman requests were executed by the included automated runner, not by the Postman desktop UI. The four manual avatar requests require local file selection and configured Cloudinary. Their backend behavior is covered by the separate profile tests.

## Local acceptance checks

1. Configure `.env`, start MongoDB, then `npm run dev`.
2. GET `/api/health` should return HTTP 200 with `storage: "mongodb"`.
3. Import the collection and run Setup and folders 01–08. Restart the backend and confirm projects/users persist.
4. Run folder 09 with a JPEG or PNG. Inspect the Cloudinary asset, replace it, and verify the previous asset is deleted. Remove the avatar and confirm `avatarUrl: null`.
5. Start two included socket clients with owner/member tokens, change a task/profile through Postman, and confirm events arrive.
6. Run folder 10 to verify password change and fresh login. Old tokens and connected owner sockets must lose access.
7. Run optional Cleanup only after inspecting the test data.

This is a backend delivery for local integration testing. It is not a production security audit, load test or multi-replica deployment certification.
