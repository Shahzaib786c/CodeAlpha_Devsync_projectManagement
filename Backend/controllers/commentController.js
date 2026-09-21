import { requireProject, requireTask, listPage } from '../services/projectService.js';
import { publish, notify } from '../services/eventService.js';
import { publicUser } from '../services/authService.js';
import ApiError from '../utils/ApiError.js';
export async function getComments(req, res) {
  const ctx = req.app.locals.context;
  await requireProject(ctx, req.userId, req.params.projectId);
  await requireTask(ctx, req.params.projectId, req.params.taskId);
  const result = await listPage(ctx.store, 'comment', { task: req.params.taskId }, req.query, { createdAt: 1, _id: 1 });
  result.data = await Promise.all(result.data.map(async comment => ({ ...comment, authorUser: publicUser(await ctx.store.get('user', comment.author)) })));
  res.json(result);
}
export async function createComment(req, res) {
  const ctx = req.app.locals.context;
  await ctx.lock(req.params.projectId, async () => {
    const project = await requireProject(ctx, req.userId, req.params.projectId);
    const task = await requireTask(ctx, project._id, req.params.taskId);
    const data = await ctx.store.create('comment', { ...req.body, task: task._id, project: project._id, author: req.userId });
    publish(ctx, project, 'comment:created', req.userId, { taskId: task._id, commentId: data._id });
    await notify(ctx, project, req.userId, 'comment', `${req.user.name} commented on ${task.title}`, task._id);
    res.status(201).json({ success: true, data });
  });
}
async function modify(req, res, deleting) {
  const ctx = req.app.locals.context;
  await ctx.lock(req.params.projectId, async () => {
    const project = await requireProject(ctx, req.userId, req.params.projectId);
    const task = await requireTask(ctx, project._id, req.params.taskId);
    const comment = await ctx.store.get('comment', req.params.commentId);
    if (!comment || comment.task !== task._id) throw new ApiError(404, 'Comment not found');
    if (comment.author !== req.userId && !(deleting && project.owner === req.userId)) throw new ApiError(403, 'You cannot change this comment');
    const data = deleting ? await ctx.store.remove('comment', comment._id) : await ctx.store.patch('comment', comment._id, req.body);
    publish(ctx, project, deleting ? 'comment:deleted' : 'comment:updated', req.userId, { taskId: task._id, commentId: comment._id });
    if (deleting) res.status(204).end(); else res.json({ success: true, data });
  });
}
export const updateComment = (req,res) => modify(req,res,false);
export const deleteComment = (req,res) => modify(req,res,true);
