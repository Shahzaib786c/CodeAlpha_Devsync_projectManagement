import { randomUUID } from 'node:crypto';
export function publish(ctx, project, event, actorId, data = {}) {
  const payload = { eventId: randomUUID(), projectId: project._id, actorId, at: new Date().toISOString(), ...data };
  // Project subscribers receive the event. Every current member also gets a light invalidation.
  ctx.io?.to(`project:${project._id}`).emit(event, payload);
  for (const userId of project.members) ctx.io?.to(`user:${userId}`).emit('workspace:changed', { projectId: project._id });
  return payload;
}
export async function notify(ctx, project, actorId, kind, message, task = null, recipients = project.members) {
  for (const recipient of [...new Set(recipients)].filter(id => id !== actorId && project.members.includes(id))) {
    const notification = await ctx.store.create('notification', { recipient, project: project._id, task, kind, message });
    ctx.io?.to(`user:${recipient}`).emit('notification:new', notification);
  }
}
export function evict(ctx, userId, projectId) {
  ctx.io?.in(`user:${userId}`).socketsLeave(`project:${projectId}`);
  ctx.io?.to(`user:${userId}`).emit('project:removed', { projectId });
}
