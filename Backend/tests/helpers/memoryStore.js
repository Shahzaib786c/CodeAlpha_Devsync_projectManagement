import models from '../../models/index.js';
// Explicitly nonpersistent: used only by automated tests.
const clone = value => JSON.parse(JSON.stringify(value));
function matches(row, filter) {
  return Object.entries(filter).every(([key, value]) => {
    if (key === '$or') return value.some(f => matches(row, f));
    const field = row[key];
    if (value && typeof value === 'object') {
      if ('$in' in value) return value.$in.some(v => Array.isArray(field) ? field.includes(v) : field === v);
      if ('$ne' in value) return field !== value.$ne;
      if ('$regex' in value) return new RegExp(value.$regex, value.$options || '').test(field || '');
    }
    return Array.isArray(field) ? field.includes(value) : field === value;
  });
}
export function memoryStore() {
  const tables = Object.fromEntries(Object.keys(models).map(k => [k, new Map()]));
  return {
    mode: 'memory-demo',
    async get(type, id) { return clone(tables[type].get(id) || null); },
    async list(type, filter = {}, options = {}) {
      let rows = [...tables[type].values()].filter(row => matches(row, filter));
      const sorts = Object.entries(options.sort || { createdAt: -1, _id: -1 });
      rows.sort((a,b) => { for (const [k,dir] of sorts) { if (a[k] !== b[k]) return (a[k] > b[k] ? 1 : -1) * dir; } return 0; });
      return clone(rows.slice(options.skip || 0, options.limit ? (options.skip || 0) + options.limit : undefined));
    },
    async count(type, filter) { return (await this.list(type, filter)).length; },
    async create(type, data) {
      if (type === 'user' && [...tables.user.values()].some(u => u.email === data.email)) { const e = new Error('Duplicate'); e.code = 11000; throw e; }
      const doc = new models[type](data); await doc.validate();
      const row = clone(doc); row.createdAt = row.updatedAt = new Date().toISOString();
      tables[type].set(row._id, row); return clone(row);
    },
    async patch(type, id, fields) {
      const old = tables[type].get(id); if (!old) return null;
      const doc = new models[type]({ ...old, ...fields, updatedAt: new Date().toISOString() }); await doc.validate();
      const row = clone(doc); tables[type].set(id, row); return clone(row);
    },
    async remove(type, id) { tables[type].delete(id); },
    async deleteMany(type, filter) { for (const row of await this.list(type, filter)) tables[type].delete(row._id); }
  };
}
