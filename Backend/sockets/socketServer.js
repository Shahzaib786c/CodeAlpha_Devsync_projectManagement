import { Server } from 'socket.io';
import { authenticate } from '../services/authService.js';
import { requireProject } from '../services/projectService.js';
import { id } from '../validators/schemas.js';
export function setupSockets(server, context, origin) {
  const io = new Server(server, { cors: { origin }, allowRequest: (req, callback) => callback(null, !req.headers.origin || req.headers.origin === origin), maxHttpBufferSize: 8192, transports: ['websocket'] });
  io.use(async (socket, next) => {
    try {
      const session = await authenticate(context.store, context.secret, socket.handshake.auth?.token);
      socket.data.userId = session.user._id; socket.data.expiresAt = session.expiresAt; next();
    } catch { next(new Error('Unauthorized: log in with a valid token')); }
  });
  io.on('connection', socket => {
    socket.join(`user:${socket.data.userId}`);
    const timer = setTimeout(() => { socket.emit('session:expired'); socket.disconnect(true); }, Math.max(0, socket.data.expiresAt - Date.now()));
    timer.unref(); socket.on('disconnect', () => clearTimeout(timer));
    let bucketStart = Date.now(), calls = 0;
    socket.use((packet, next) => {
      if (Date.now() >= socket.data.expiresAt) return socket.disconnect(true);
      if (Date.now() - bucketStart > 10000) { calls = 0; bucketStart = Date.now(); }
      if (++calls > 30) { socket.disconnect(true); return; }
      next();
    });
    socket.on('project:join', async (payload, callback) => {
      const ack = typeof callback === 'function' ? callback : () => {};
      try {
        const projectId = id.parse(payload?.projectId);
        await context.lock(projectId, async () => {
          // Re-check membership inside the same project queue as member removal.
          await requireProject(context, socket.data.userId, projectId);
          for (const room of socket.rooms) if (room.startsWith('project:')) socket.leave(room);
          await socket.join(`project:${projectId}`);
        });
        ack({ success: true, projectId });
      } catch { ack({ success: false, message: 'Project not accessible' }); }
    });
    socket.on('project:leave', async (payload, callback) => {
      if (id.safeParse(payload?.projectId).success) await socket.leave(`project:${payload.projectId}`);
      if (typeof callback === 'function') callback({ success: true });
    });
  });
  return io;
}
