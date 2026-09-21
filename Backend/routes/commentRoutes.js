import { Router } from 'express';
import * as c from '../controllers/commentController.js';
import { validate as v, validateIds } from '../middleware/validate.js';
import { comment } from '../validators/schemas.js';
const router = Router({ mergeParams: true });
router.route('/').get(c.getComments).post(v(comment), c.createComment);
router.route('/:commentId').patch(validateIds, v(comment), c.updateComment).delete(validateIds, c.deleteComment);
export default router;
