import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';
export const publicUser = ({ _id, name, email, createdAt, avatar }) => ({ _id, name, email, createdAt, avatarUrl: avatar?.url || null });
export function issueToken(user, secret) {
  return jwt.sign({ version: user.tokenVersion }, secret, { algorithm: 'HS256', subject: user._id, expiresIn: '1h' });
}
export async function authenticate(store, secret, token) {
  let payload;
  try { payload = jwt.verify(token, secret, { algorithms: ['HS256'] }); }
  catch { throw new ApiError(401, 'Invalid or expired token'); }
  if (typeof payload.sub !== 'string' || !/^[a-f\d]{24}$/i.test(payload.sub)) throw new ApiError(401, 'Invalid token');
  const user = await store.get('user', payload.sub);
  if (!user || user.tokenVersion !== payload.version) throw new ApiError(401, 'Session expired. Please log in again');
  return { user, expiresAt: payload.exp * 1000 };
}
