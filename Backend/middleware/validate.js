import { id } from '../validators/schemas.js';
export const validate = schema => (req, res, next) => { req.body = schema.parse(req.body); next(); };
export function validateIds(req, res, next) {
  for (const [key, value] of Object.entries(req.params)) if (key.endsWith('Id')) id.parse(value);
  next();
}
