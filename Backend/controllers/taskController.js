import { requireProject, requireTask, validateAssignee, listPage, taskFilter, enrichTasks } from '../services/projectService.js';
import { publish, notify } from '../services/eventService.js';
import ApiError from '../utils/ApiError.js';
export async function createTask(req, res) {
  const ctx = req.app.locals.context;
  await ctx.lock(req.params.projectId, async () => {
    const project = await requireProject(ctx, req.userId, req.params.projectId);
    validateAssignee(project, req.body);
    const data = await ctx.store.create('task', { ...req.body, project: project._id, createdBy: req.userId });
    publish(ctx, project, 'task:created', req.userId, { taskId: data._id });
    if (data.assignee) await notify(ctx, project, req.userId, 'assignment', `${req.user.name} assigned you: ${data.title}`, data._id, [data.assignee]);
    res.status(201).json({ success: true, data });
  });
}
export async function getTasks(req, res) {
  const ctx = req.app.locals.context;
  await requireProject(ctx, req.userId, req.params.projectId);
  const result = await listPage(ctx.store, 'task', { ...taskFilter(req.query), project: req.params.projectId, deletedAt: null }, req.query);
  result.data = await enrichTasks(ctx.store, result.data); res.json(result);
}
export async function getTask(req, res) {
  const ctx = req.app.locals.context;
  await requireProject(ctx, req.userId, req.params.projectId);
  const task = await requireTask(ctx, req.params.projectId, req.params.taskId);
  res.json({ success: true, data: (await enrichTasks(ctx.store, [task]))[0] });
}
export async function updateTask(req, res) {
  const ctx = req.app.locals.context;
  await ctx.lock(req.params.projectId, async () => {
    const project = await requireProject(ctx, req.userId, req.params.projectId);
    const old = await requireTask(ctx, project._id, req.params.taskId);
    validateAssignee(project, req.body);
    const data = await ctx.store.patch('task', old._id, req.body);
    publish(ctx, project, 'task:updated', req.userId, { taskId: data._id });
    if (data.assignee && old.assignee !== data.assignee) await notify(ctx, project, req.userId, 'assignment', `${req.user.name} assigned you: ${data.title}`, data._id, [data.assignee]);
    if (old.status !== data.status) await notify(ctx, project, req.userId, 'status', `${req.user.name} moved ${data.title} to ${data.status}`, data._id);
    res.json({ success: true, data });
  });
}
export async function deleteTask(req, res) {
  const ctx = req.app.locals.context;
  await ctx.lock(req.params.projectId, async () => {
    const project = await requireProject(ctx, req.userId, req.params.projectId);
    const task = await requireTask(ctx, project._id, req.params.taskId);
    if (task.createdBy !== req.userId && project.owner !== req.userId) throw new ApiError(403, 'Only creator or project owner can delete a task');
    await ctx.store.patch('task', task._id, { deletedAt: new Date().toISOString() });
    await ctx.store.deleteMany('notification', { task: task._id });
    publish(ctx, project, 'task:deleted', req.userId, { taskId: task._id });
    res.status(204).end();
  });
}
export async function myTasks(req, res) {
  const ctx = req.app.locals.context;
  const projects = await ctx.store.list('project', { members: req.userId, deletedAt: null });
  const result = await listPage(ctx.store, 'task', { ...taskFilter(req.query), assignee: req.userId, project: { $in: projects.map(p => p._id) }, deletedAt: null }, req.query);
  result.data = await enrichTasks(ctx.store, result.data); res.json(result);
}
export async function overview(req, res) {
  const { store } = req.app.locals.context;
  const projects = await store.list('project', { members: req.userId, deletedAt: null });
  const filter = { project: { $in: projects.map(p => p._id) }, deletedAt: null };
  const [pending, inProgress, completed, assignedToMe] = await Promise.all(['pending','in-progress','completed',null].map(status => store.count('task', { ...filter, ...(status ? { status } : { assignee: req.userId }) })));
  res.json({ success: true, data: { projects: projects.length, pending, inProgress, completed, assignedToMe } });
}
