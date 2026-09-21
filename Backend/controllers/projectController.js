import { requireProject, listPage, enrichTasks } from '../services/projectService.js';
import { publish, notify, evict } from '../services/eventService.js';
import { publicUser } from '../services/authService.js';
import ApiError from '../utils/ApiError.js';
export async function createProject(req, res) {
  const ctx = req.app.locals.context;
  const data = await ctx.store.create('project', { ...req.body, owner: req.userId, members: [req.userId] });
  publish(ctx, data, 'project:created', req.userId);
  res.status(201).json({ success: true, data });
}
export async function getProjects(req, res) {
  res.json(await listPage(req.app.locals.context.store, 'project', { members: req.userId, deletedAt: null }, req.query));
}
export async function getProject(req, res) {
  const ctx = req.app.locals.context;
  const data = await requireProject(ctx, req.userId, req.params.projectId);
  data.memberUsers = await Promise.all(data.members.map(async id => publicUser(await ctx.store.get('user', id))));
  res.json({ success: true, data });
}
export async function updateProject(req, res) {
  const ctx = req.app.locals.context;
  await ctx.lock(req.params.projectId, async () => {
    await requireProject(ctx, req.userId, req.params.projectId, true);
    const data = await ctx.store.patch('project', req.params.projectId, req.body);
    publish(ctx, data, 'project:updated', req.userId);
    res.json({ success: true, data });
  });
}
export async function deleteProject(req, res) {
  const ctx = req.app.locals.context;
  await ctx.lock(req.params.projectId, async () => {
    const project = await requireProject(ctx, req.userId, req.params.projectId, true);
    await ctx.store.patch('project', project._id, { deletedAt: new Date().toISOString() });
    await ctx.store.deleteMany('notification', { project: project._id });
    publish(ctx, project, 'project:deleted', req.userId);
    ctx.io?.in(`project:${project._id}`).socketsLeave(`project:${project._id}`);
    res.status(204).end();
  });
}
export async function addMember(req, res) {
  const ctx = req.app.locals.context;
  await ctx.lock(req.params.projectId, async () => {
    const project = await requireProject(ctx, req.userId, req.params.projectId, true);
    const [user] = await ctx.store.list('user', { email: req.body.email });
    if (!user) throw new ApiError(404, 'This person must register before you can add them');
    if (!project.members.includes(user._id)) {
      if (project.members.length >= 100) throw new ApiError(400, 'Maximum 100 project members');
      project.members.push(user._id);
      await ctx.store.patch('project', project._id, { members: project.members });
      publish(ctx, project, 'member:added', req.userId, { userId: user._id });
      await notify(ctx, project, req.userId, 'membership', `${req.user.name} added you to ${project.name}`, null, [user._id]);
    }
    res.json({ success: true, data: project });
  });
}
export async function removeMember(req, res) {
  const ctx = req.app.locals.context;
  await ctx.lock(req.params.projectId, async () => {
    const project = await requireProject(ctx, req.userId, req.params.projectId, true);
    const userId = req.params.userId;
    if (project.owner === userId) throw new ApiError(400, 'Cannot remove the owner');
    project.members = project.members.filter(id => id !== userId);
    await ctx.store.patch('project', project._id, { members: project.members });
    evict(ctx, userId, project._id);
    for (const task of await ctx.store.list('task', { project: project._id, assignee: userId })) await ctx.store.patch('task', task._id, { assignee: null });
    await ctx.store.deleteMany('notification', { project: project._id, recipient: userId });
    publish(ctx, project, 'member:removed', req.userId, { userId });
    res.status(204).end();
  });
}
export async function board(req, res) {
  const ctx = req.app.locals.context;
  await requireProject(ctx, req.userId, req.params.projectId);
  const data = {};
  for (const status of ['pending','in-progress','completed']) {
    const result = await listPage(ctx.store, 'task', { project: req.params.projectId, status, deletedAt: null }, req.query);
    data[status] = { total: result.total, tasks: await enrichTasks(ctx.store, result.data) };
  }
  res.json({ success: true, data });
}
