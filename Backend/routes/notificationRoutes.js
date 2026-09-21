import { Router } from 'express';
import { getNotifications, markRead } from '../controllers/notificationController.js';
import { validateIds } from '../middleware/validate.js';
const router = Router();
router.get('/', getNotifications);
router.patch('/:notificationId/read', validateIds, markRead);
export default router;
