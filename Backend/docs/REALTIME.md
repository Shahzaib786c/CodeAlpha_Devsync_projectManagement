# Socket.IO contract

## Connect
The API and Socket.IO share port 5000. Socket.IO v4 is configured for the WebSocket transport. Use socket.io-client (included in Backend devDependencies for the test client), not a raw WebSocket client.

```js
import { io } from 'socket.io-client';
const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  auth: { token: 'TOKEN_FROM_LOGIN' }
});
socket.on('connect', () => {
  socket.emit('project:join', { projectId: 'PROJECT_ID' }, reply => {
    if (!reply.success) console.error(reply.message);
  });
  // Reload your authorized project/task/notification data here after every reconnect.
});
socket.on('task:updated', event => console.log(event));
socket.on('notification:new', notification => console.log(notification));
socket.on('connect_error', error => console.error(error.message));
```

Each user automatically joins `user:<userId>`. An authorized `project:join` subscribes to `project:<projectId>` and leaves any previous project room. One active project subscription per socket. `project:leave` takes `{projectId}` and optional acknowledgement. Bad IDs, absent projects and nonmembers receive `{success:false,message:"Project not accessible"}`.

## Server events
| Event | Audience | Contents/action |
|---|---|---|
| workspace:changed | Current members' personal rooms | projectId; refresh project lists, overview and My Tasks |
| project:created / project:updated / project:deleted | Project room | eventId, projectId, actorId, at |
| member:added / member:removed | Project room | Common event fields plus userId |
| task:created / task:updated / task:deleted | Project room | Common event fields plus taskId |
| comment:created / comment:updated / comment:deleted | Project room | Common event fields plus taskId, commentId |
| notification:new | Recipient's personal room | Saved Notification document |
| notification:read | Recipient's personal room | notificationId |
| project:removed | Removed user's personal room | projectId; close/clear that project |
| session:expired | Affected socket/user sessions | Clear login state; server disconnects |

`project:created` generally has no subscribers yet; `workspace:changed` is how an existing session learns about newly accessible projects. Events contain IDs, not the entire project state; HTTP is the authoritative source. Handle repeated invalidations by reloading state rather than appending duplicate cards.

Client writes stay on REST endpoints. Clients cannot emit trusted task/comment updates. Socket events are emitted only by server business logic after the core mutation succeeds. Assignment, comment and status notifications are persisted, then emitted. A storage failure after a core mutation can prevent an alert; this version does not have an outbox or exactly-once delivery.

## Security and lifetime
- JWT signature, expiry and database tokenVersion are checked at connection.
- Browser Origin must match CLIENT_URL. Clients without Origin (for example the CLI) still need a valid token.
- Membership is checked on each project join inside the project queue.
- Removal evicts the member from the room before later queued writes can emit.
- Expiry disconnects an already-connected socket; logout increments tokenVersion and disconnects all that user's sockets.
- 8 KB maximum payload; more than 30 client packets in 10 seconds disconnects the socket.
- Reconnect authenticates again. There is no automatic replay of missed events; reload REST state and saved notifications.

## Two-user check
1. Register owner and member. Create project and add member.
2. Open two socket clients using their respective tokens and same project ID.
3. Owner creates assigned task: member receives task event + assignment alert.
4. Member changes status: owner receives task event + status alert.
5. Member comments: owner receives comment event + comment alert.
6. Disconnect a client; make a change; reconnect and GET data to recover it.
7. Owner removes member: member receives project:removed, then no new project room events. Join is denied and HTTP returns 404.
8. Logout: old token fails HTTP authentication and all of that user's sockets disconnect.


## Profile extensions
`user:updated` broadcasts name/avatarUrl changes to self and current shared-project members. See PROFILE.md. Password change behaves like logout: every prior token is invalidated and all sockets for the user receive `session:expired` then disconnect.

## Run the included socket client

After Postman Setup, copy ownerToken (or memberToken) and projectId from collection variables. In a second PowerShell terminal inside Backend:

```powershell
$env:SOCKET_TOKEN="paste-token-here"
$env:SOCKET_PROJECT_ID="paste-project-id-here"
npm run sockets
```

For macOS/Linux:

```sh
SOCKET_TOKEN='paste-token-here' SOCKET_PROJECT_ID='paste-project-id-here' npm run sockets
```

Keep it open while updating tasks/comments/profile through Postman. It prints server events, including `user:updated` and `session:expired`. Open another terminal with the member token to see collaboration between users.
