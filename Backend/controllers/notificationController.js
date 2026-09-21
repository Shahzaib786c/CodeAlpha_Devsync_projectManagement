import { listPage, requireProject } from '../services/projectService.js';
import { readFilter } from '../validators/schemas.js';
import ApiError from '../utils/ApiError.js';
export async function getNotifications(req, res) {
  const { store } = req.app.locals.context;
  const projects = await store.list('project', { members: req.userId, deletedAt: null });
  const filter = { recipient: req.userId, project: { $in: projects.map(p => p._id) } };
  if (readFilter.parse(req.query).unread === 'true') filter.readAt = null;
  const result = await listPage(store, 'notification', filter, req.query);
  result.unread = await store.count('notification', { ...filter, readAt: null });
  res.json(result);
}
export async function markRead(req, res) {
  const ctx = req.app.locals.context;
  const notification = await ctx.store.get('notification', req.params.notificationId);
  if (!notification || notification.recipient !== req.userId) throw new ApiError(404, 'Notification not found');
  await requireProject(ctx, req.userId, notification.project);
  const data = await ctx.store.patch('notification', notification._id, { readAt: notification.readAt || new Date().toISOString() });
  ctx.io?.to(`user:${req.userId}`).emit('notification:read', { notificationId: data._id });
  res.json({ success: true, data });
}
