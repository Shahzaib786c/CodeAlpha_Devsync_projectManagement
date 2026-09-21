import bcrypt from 'bcryptjs';
import ApiError from '../utils/ApiError.js';
import { publicUser } from '../services/authService.js';
import { currentUser, expireSessions, publishProfile } from '../services/profileService.js';
import { cleanupAvatar } from '../services/mediaService.js';
export async function updateProfile(req, res) {
  const ctx = req.app.locals.context;
  await ctx.lock(`user:${req.userId}`, async () => {
    await currentUser(ctx, req);
    const user = await ctx.store.patch('user', req.userId, { name: req.body.name });
    await publishProfile(ctx, user);
    res.json({ success: true, data: publicUser(user) });
  });
}
export async function uploadAvatar(req, res) {
  const ctx = req.app.locals.context;
  await ctx.lock(`user:${req.userId}`, async () => {
    const previous = await currentUser(ctx, req);
    const avatar = await ctx.media.upload(req.avatarBuffer, req.userId);
    let user;
    try { user = await ctx.store.patch('user', req.userId, { avatar }); }
    catch (error) { await cleanupAvatar(ctx.media, avatar.publicId); throw error; }
    const cleanupPending = await cleanupAvatar(ctx.media, previous.avatar?.publicId);
    await publishProfile(ctx, user);
    res.json({ success: true, data: publicUser(user), cleanupPending });
  });
}
export async function removeAvatar(req, res) {
  const ctx = req.app.locals.context;
  await ctx.lock(`user:${req.userId}`, async () => {
    const previous = await currentUser(ctx, req);
    const user = await ctx.store.patch('user', req.userId, { avatar: null });
    const cleanupPending = await cleanupAvatar(ctx.media, previous.avatar?.publicId);
    await publishProfile(ctx, user);
    res.json({ success: true, data: publicUser(user), cleanupPending });
  });
}
export async function changePassword(req, res) {
  const ctx = req.app.locals.context;
  await ctx.lock(`user:${req.userId}`, async () => {
    const user = await currentUser(ctx, req);
    if (!await bcrypt.compare(req.body.currentPassword, user.password)) throw new ApiError(400, 'Current password is incorrect');
    if (await bcrypt.compare(req.body.newPassword, user.password)) throw new ApiError(400, 'Choose a different new password');
    const password = await bcrypt.hash(req.body.newPassword, 12);
    await ctx.store.patch('user', user._id, { password, tokenVersion: user.tokenVersion + 1 });
    expireSessions(ctx, user._id);
    res.json({ success: true, requiresLogin: true, message: 'Password changed. Please log in again' });
  });
}
