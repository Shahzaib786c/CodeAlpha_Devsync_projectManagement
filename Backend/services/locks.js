// Single API process only. This serializes membership changes, task writes and room joins.
// For multiple API replicas, replace this with distributed coordination/transactions.
export function createLocks() {
  const pending = new Map();
  return async (key, work) => {
    const previous = pending.get(key) || Promise.resolve();
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    const tail = previous.then(() => gate);
    pending.set(key, tail);
    await previous;
    try { return await work(); }
    finally { release(); if (pending.get(key) === tail) pending.delete(key); }
  };
}
