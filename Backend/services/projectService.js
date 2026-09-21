import ApiError from '../utils/ApiError.js';
import { page, filters } from '../validators/schemas.js';
export async function requireProject(ctx, userId, projectId, owner = false) {
  const project = await ctx.store.get('project', projectId);
  if (!project || project.deletedAt || !project.members.includes(userId)) throw new ApiError(404, 'Project not found or not accessible');
  if (owner && project.owner !== userId) throw new ApiError(403, 'Only the project owner can do this');
  return project;
}
export async function requireTask(ctx, projectId, taskId) {
  const task = await ctx.store.get('task', taskId);
  if (!task || task.project !== projectId || task.deletedAt) throw new ApiError(404, 'Task not found');
  return task;
}
export function validateAssignee(project, body) {
  if (body.assignee && !project.members.includes(body.assignee)) throw new ApiError(400, 'Assignee must be a project member');
}
export async function listPage(store, type, filter, query, sort) {
  const paging = page.parse(query);
  const [data, total] = await Promise.all([store.list(type, filter, { skip: (paging.page - 1) * paging.limit, limit: paging.limit, sort }), store.count(type, filter)]);
  return { success: true, ...paging, total, data };
}
export function taskFilter(query) {
  const { search, ...filter } = filters.parse(query);
  if (search) filter.title = { $regex: search.split('').map(char => '\\^$.*+?()[]{}|'.includes(char) ? '\\' + char : char).join(''), $options: 'i' };
  return filter;
}
export async function enrichTasks(store, tasks) {
  return Promise.all(tasks.map(async task => ({ ...task, assigneeUser: task.assignee ? (({ _id, name, avatar }) => ({ _id, name, avatarUrl: avatar?.url || null }))(await store.get('user', task.assignee)) : null })));
}
