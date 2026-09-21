import bcrypt from 'bcryptjs';
import { issueToken, publicUser } from '../services/authService.js';
import ApiError from '../utils/ApiError.js';
const reply = (user, secret) => ({ success: true, token: issueToken(user, secret), expiresIn: 3600, user: publicUser(user) });
export async function register(req, res) {
  const { store, secret, lock } = req.app.locals.context;
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 12);
  const user = await lock(`email:${email}`, () => store.create('user', { name, email, password: hash }));
  res.status(201).json(reply(user, secret));
}
export async function login(req, res) {
  const { store, secret } = req.app.locals.context;
  const [user] = await store.list('user', { email: req.body.email });
  if (!user || !await bcrypt.compare(req.body.password, user.password)) throw new ApiError(401, 'Invalid email or password');
  res.json(reply(user, secret));
}
export async function me(req, res) { res.json({ success: true, data: publicUser(req.user) }); }
export async function logout(req, res) {
  const ctx = req.app.locals.context;
  await ctx.lock(`user:${req.userId}`, async () => {
    const user = await ctx.store.get('user', req.userId);
    await ctx.store.patch('user', user._id, { tokenVersion: user.tokenVersion + 1 });
    ctx.io?.to(`user:${user._id}`).emit('session:expired');
    ctx.io?.in(`user:${user._id}`).disconnectSockets(true);
  });
  res.status(204).end();
}
