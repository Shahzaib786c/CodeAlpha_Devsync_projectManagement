import { MongoMemoryServer } from 'mongodb-memory-server';
import { spawn } from 'node:child_process';
let mongo;
try {
  mongo = await MongoMemoryServer.create();
  const child = spawn(process.execPath, ['--test', 'tests/workflow.test.js'], { stdio: 'inherit', env: { ...process.env, TEST_MONGO_URI: mongo.getUri() } });
  const code = await new Promise(resolve => child.on('exit', resolve)); process.exitCode = code || 0;
} catch { console.error('Temporary MongoDB could not start. Check the supported MongoDB binary and local execution permissions.'); process.exitCode = 1; }
finally { if (mongo) await mongo.stop(); }
