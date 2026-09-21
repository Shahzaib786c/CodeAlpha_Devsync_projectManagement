import { authenticate } from '../services/authService.js';
import ApiError from '../utils/ApiError.js';
export default async function verifyToken(req, res, next) {
  const auth = req.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) throw new ApiError(401, 'Bearer token required');
  const { store, secret } = req.app.locals.context;
  const session = await authenticate(store, secret, auth.slice(7));
  req.user = session.user; req.userId = session.user._id;
  next();
}
