import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { io as connect } from 'socket.io-client';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApplication } from '../app.js';
import { memoryStore } from './helpers/memoryStore.js';
import { mongoStore } from '../services/store.js';
import models from '../models/index.js';
import { taskFilter } from '../services/projectService.js';
const secret = 'test-only-secret-with-at-least-32-characters';
let system, url; const sockets = [];
before(async () => {
  if (process.env.TEST_MONGO_URI) {
    await mongoose.connect(process.env.TEST_MONGO_URI);
    for (const model of Object.values(models)) await model.init();
  }
  system = createApplication({ store: process.env.TEST_MONGO_URI ? mongoStore() : memoryStore(), secret });
  await new Promise(resolve => system.server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${system.server.address().port}`;
});
after(async () => { sockets.forEach(s => s.disconnect()); if (system) await new Promise(resolve => system.io.close(resolve)); await mongoose.disconnect(); });
function socket(token) {
  const s = connect(url, { auth: { token }, transports: ['websocket'], reconnection: false, autoConnect: false });
  sockets.push(s); return s;
}
function event(s, name, timeout = 3000) {
  return new Promise((resolve,reject) => { const timer = setTimeout(() => { s.off(name, done); reject(new Error('Missing event ' + name)); }, timeout); const done = data => { clearTimeout(timer); resolve(data); }; s.once(name, done); });
}
const join = (s, projectId) => new Promise(resolve => s.emit('project:join', { projectId }, resolve));
test('HTTP validation protects input boundaries', async () => {
  const pattern = new RegExp(taskFilter({search:'[API].*'}).title.$regex);
  assert.ok(pattern.test('Build [API].*')); assert.equal(pattern.test('Build API'), false);
  await request(url).get('/api/projects').expect(401);
  await request(url).post('/api/auth/register').send({ name:'A', email:'a@example.com', password:'Password123', role:'admin' }).expect(400);
  await request(url).post('/api/auth/register').set('Content-Type','application/json').send('{bad').expect(400);
  await request(url).post('/api/auth/register').send({ name:'a'.repeat(40000) }).expect(413);
});
test('complete collaboration workflow, real sockets, revocation and recovery', async () => {
  const register = async name => (await request(url).post('/api/auth/register').send({ name, email: `${name}@example.com`, password: 'Password123!' }).expect(201)).body;
  const owner = await register('Owner'), member = await register('Member'), outsider = await register('Outsider');
  const api = (method, path, who = owner) => request(url)[method]('/api' + path).set('Authorization', `Bearer ${who.token}`);
  await request(url).post('/api/auth/register').send({ name:'Duplicate', email:'owner@example.com', password:'Password123!' }).expect(409);
  await request(url).post('/api/auth/login').send({ email:'owner@example.com', password:'wrong' }).expect(401);
  assert.equal((await api('get','/auth/me')).body.data.password, undefined);
  const so = socket(owner.token), sm = socket(member.token), sx = socket(outsider.token);
  for (const s of [so,sm,sx]) { const ready = event(s,'connect'); s.connect(); await ready; }
  const invalid = socket('bad'); const bad = event(invalid,'connect_error'); invalid.connect(); await bad;
  const expired = socket(jwt.sign({ version:0 },secret,{subject:owner.user._id,expiresIn:-1})); const expiredError = event(expired,'connect_error'); expired.connect(); await expiredError;
  const project = (await api('post','/projects').send({ name:'Launch', description:'Team project' }).expect(201)).body.data;
  const p = '/projects/' + project._id;
  assert.equal((await join(sx,project._id)).success,false);
  assert.equal((await join(so,project._id)).success,true);
  await api('get',p,outsider).expect(404);
  const invited = event(sm,'notification:new');
  await api('post',p+'/members').send({email:'member@example.com'}).expect(200);
  assert.equal((await invited).kind,'membership');
  assert.equal((await join(sm,project._id)).success,true);
  await api('patch',p,member).send({ name:'No permission' }).expect(403);
  await api('post',p+'/tasks').send({title:'Bad',assignee:outsider.user._id}).expect(400);
  let outsiderEvents = 0; sx.on('task:created',()=>outsiderEvents++); sx.on('task:updated',()=>outsiderEvents++);
  const created = event(sm,'task:created'), assigned = event(sm,'notification:new');
  const task = (await api('post',p+'/tasks').send({ title:'Build [API]', assignee:member.user._id, priority:'high' }).expect(201)).body.data;
  const t = p+'/tasks/'+task._id;
  assert.equal((await created).taskId,task._id); assert.equal((await assigned).kind,'assignment');
  assert.equal((await api('get',p+'/tasks?search=%5BAPI%5D')).body.total,1);
  assert.equal((await api('get','/tasks/mine',member)).body.total,1);
  const updated = event(so,'task:updated');
  await api('patch',t+'/status',member).send({status:'in-progress'}).expect(200);
  await updated;
  assert.equal((await api('get',p+'/board')).body.data['in-progress'].total,1);
  await api('patch',t).send({status:'done'}).expect(400);
  await api('patch',t).send({project:project._id}).expect(400);
  const commentEvent = event(so,'comment:created');
  const comment = (await api('post',t+'/comments',member).send({body:'Ready for review'}).expect(201)).body.data;
  await commentEvent;
  assert.equal((await api('get',t+'/comments')).body.data[0].authorUser.name,'Member');
  await api('patch',t+'/comments/'+comment._id).send({body:'Not mine'}).expect(403);
  await api('patch',t+'/comments/'+comment._id,member).send({body:'Updated'}).expect(200);
  const notes = (await api('get','/notifications',member)).body.data;
  await api('patch','/notifications/'+notes[0]._id+'/read',outsider).expect(404);
  await api('patch','/notifications/'+notes[0]._id+'/read',member).expect(200);
  assert.ok((await api('get','/notifications?unread=true',member)).body.data.every(n=>!n.readAt));
  // Offline changes are recovered by HTTP after reconnect, not an assumed event replay.
  sm.disconnect(); await api('patch',t).send({status:'completed'}).expect(200);
  const back = event(sm,'connect'); sm.connect(); await back; await join(sm,project._id);
  assert.equal((await api('get',t,member)).body.data.status,'completed');
  assert.ok((await api('get','/notifications',member)).body.total >= 2);
  const other = (await api('post','/projects').send({name:'Private'})).body.data;
  await api('get','/projects/'+other._id+'/tasks/'+task._id).expect(404);
  await api('get','/projects/invalid').expect(400);
  await api('delete',p+'/members/'+owner.user._id).expect(400);
  const removed = event(sm,'project:removed');
  await api('delete',p+'/members/'+member.user._id).expect(204); await removed;
  assert.equal((await join(sm,project._id)).success,false);
  assert.equal((await api('get',t)).body.data.assignee,null);
  await api('get',t,member).expect(404);
  let removedEvents = 0; sm.on('task:updated',()=>removedEvents++);
  await api('patch',t).send({title:'Private revision'}).expect(200);
  await new Promise(resolve=>setTimeout(resolve,80));
  assert.equal(outsiderEvents,0); assert.equal(removedEvents,0);
  // Logout invalidates HTTP tokens and disconnects all sockets for that user.
  const disconnected = event(so,'disconnect'); await api('post','/auth/logout').expect(204); await disconnected;
  await api('get','/auth/me').expect(401);
  const relogin = (await request(url).post('/api/auth/login').send({email:'owner@example.com',password:'Password123!'}).expect(200)).body;
  owner.token = relogin.token;
  await api('delete',t+'/comments/'+comment._id).expect(204);
  await api('delete',t).expect(204); await api('get',t).expect(404);
  await api('delete',p).expect(204); await api('get',p).expect(404);
});
