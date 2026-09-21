import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { createApplication } from '../app.js';
import { memoryStore } from './helpers/memoryStore.js';

test('78 automated Postman requests execute in order; 4 manual avatar requests are covered by profile tests', async () => {
  const system = createApplication({ store: memoryStore(), secret: 'postman-test-secret-longer-than-32-characters' });
  await new Promise(resolve => system.server.listen(0, '127.0.0.1', resolve));
  try {
    const collection = JSON.parse(await readFile(new URL('../postman/DevSync.postman_collection.json', import.meta.url)));
    const variables = Object.fromEntries(collection.variable.map(v => [v.key,v.value]));
    variables.baseUrl = `http://127.0.0.1:${system.server.address().port}/api`;
    const replace = text => text.replace(/\{\{([^}]+)\}\}/g, (_, key) => { assert.ok(key in variables, key); return variables[key]; });
    let count=0;
    for (const folder of collection.item) {
      if (folder.name.startsWith('09 ')) continue;
      for (const item of folder.item) {
        const r = item.request;
        const pm = {
          test(name, callback) { try { callback(); } catch(e) { throw new Error(item.name+': '+name+': '+e.message); } },
          expect(value) { return {to:{eql:other=>assert.deepEqual(value,other),be:{a:type=>assert.equal(typeof value,type)}}}; },
          collectionVariables:{set:(key,value)=>variables[key]=value,get:key=>variables[key]}
        };
        const run = listen => { for (const entry of item.event || []) if(entry.listen===listen) vm.runInNewContext(entry.script.exec.join('\n'), {pm}, {timeout:1000}); };
        run('prerequest');
        const headers = Object.fromEntries(r.header.map(h=>[h.key,h.value]));
        if (r.auth.type === 'bearer') headers.Authorization = 'Bearer '+replace(r.auth.bearer[0].value);
        const response = await fetch(replace(r.url), { method:r.method, headers, ...(r.body?{body:replace(r.body.raw)}:{}) });
        const body = await response.text();
        pm.response={code:response.status,json:()=>JSON.parse(body),to:{have:{status:expected=>assert.equal(response.status,expected,body)}}};
        run('test'); count++;
      }
    }
    assert.equal(count,78);
  } finally { await new Promise(resolve => system.io.close(resolve)); }
});
