import { readEnv } from './config/env.js';
import { connectDB } from './config/db.js';
import { mongoStore } from './services/store.js';
import { createApplication } from './app.js';
import mongoose from 'mongoose';
try {
  const env = readEnv(); await connectDB(process.env.MONGODB_URI);
  const { server, io } = createApplication({ store: mongoStore(), ...env });
  server.listen(env.port, () => console.log(`DevSync API + Socket.IO: http://localhost:${env.port}`));
  server.on('error', () => { console.error('Port unavailable'); process.exit(1); });
  const stop = () => { io.close(async () => { await mongoose.disconnect(); process.exit(0); }); setTimeout(() => process.exit(1), 10000).unref(); };
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
} catch (error) { console.error(error.message.startsWith('Set ') ? error.message : 'Startup failed. Check MongoDB URI, credentials and network access.'); process.exit(1); }
