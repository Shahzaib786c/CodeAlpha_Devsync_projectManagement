import ApiError from '../utils/ApiError.js';
export async function currentUser(ctx, req) {
  const user = await ctx.store.get('user', req.userId);
  if (!user || user.tokenVersion !== req.user.tokenVersion) throw new ApiError(401, 'Session expired. Please log in again');
  return user;
}
export function expireSessions(ctx, userId) {
  ctx.io?.to(`user:${userId}`).emit('session:expired');
  ctx.io?.in(`user:${userId}`).disconnectSockets(true);
}
export async function publishProfile(ctx, user) {
  ctx.io?.to(`user:${user._id}`).emit('user:updated', { user: { _id: user._id, name: user.name, avatarUrl: user.avatar?.url || null } });
  const projects = await ctx.store.list('project', { members: user._id, deletedAt: null });
  for (const project of projects) {
    await ctx.lock(project._id, async () => {
      const latest = await ctx.store.get('project', project._id);
      if (!latest || latest.deletedAt || !latest.members.includes(user._id)) return;
      for (const member of latest.members.filter(id => id !== user._id)) {
        ctx.io?.to(`user:${member}`).emit('user:updated', { user: { _id: user._id, name: user.name, avatarUrl: user.avatar?.url || null } });
      }
    });
  }
}
