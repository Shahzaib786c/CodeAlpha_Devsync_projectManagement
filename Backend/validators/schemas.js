import { z } from 'zod';
export const id = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId');
const text = max => z.string().trim().min(1).max(max);
const email = z.string().trim().email().max(254).transform(v => v.toLowerCase());
export const register = z.object({ name: text(80), email, password: z.string().min(8).refine(v => Buffer.byteLength(v) <= 72, 'Password must be at most 72 UTF-8 bytes') }).strict();
export const login = z.object({ email, password: z.string().min(1).max(200) }).strict();
export const profile = z.object({ name: text(80) }).strict();
export const project = z.object({ name: text(120), description: z.string().trim().max(2000).optional() }).strict();
export const member = z.object({ email }).strict();
export const status = z.enum(['pending','in-progress','completed']);
export const priority = z.enum(['low','medium','high']);
export const task = z.object({ title: text(160), description: z.string().trim().max(5000).optional(), assignee: id.nullable().optional(), status: status.optional(), priority: priority.optional(), dueDate: z.iso.datetime({ offset: true }).nullable().optional() }).strict();
export const comment = z.object({ body: text(3000) }).strict();
export const patch = schema => schema.partial().refine(v => Object.keys(v).length, 'Provide at least one field');
export const taskStatus = z.object({ status }).strict();
export const page = z.object({ page: z.coerce.number().int().min(1).max(10000).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) });
export const filters = z.object({ status: status.optional(), priority: priority.optional(), assignee: id.optional(), search: z.string().trim().max(80).optional() });
export const readFilter = z.object({ unread: z.enum(['true','false']).optional() });

export const changePassword = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).refine(v => Buffer.byteLength(v) <= 72, 'Password must be at most 72 UTF-8 bytes'),
  confirmPassword: z.string().min(1).max(200)
}).strict().refine(v => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });
