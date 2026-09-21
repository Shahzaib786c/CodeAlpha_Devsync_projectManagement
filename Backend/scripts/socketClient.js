import 'dotenv/config';
import { io } from 'socket.io-client';
const token = process.env.SOCKET_TOKEN;
const projectId = process.env.SOCKET_PROJECT_ID;
if (!token || !projectId) { console.error('Set SOCKET_TOKEN and SOCKET_PROJECT_ID first. See README.'); process.exit(1); }
const socket = io(process.env.SOCKET_URL || 'http://localhost:5000', { transports: ['websocket'], auth: { token } });
socket.on('connect', () => {
  console.log('Connected');
  socket.emit('project:join', { projectId }, reply => console.log('Join result:', reply));
});
socket.onAny((event, payload) => console.log(event, JSON.stringify(payload)));
socket.on('connect_error', error => console.error(error.message));
socket.on('disconnect', reason => console.log('Disconnected:', reason));
process.on('SIGINT', () => { socket.disconnect(); process.exit(0); });
