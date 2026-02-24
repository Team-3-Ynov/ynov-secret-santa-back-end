import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import {
  getNotificationsHandler,
  getUnreadCountHandler,
  markAsReadHandler,
  markAllAsReadHandler,
} from '../controllers/notification.controller';

const router: Router = Router();

router.use(authenticate);

router.get('/', getNotificationsHandler);
router.get('/unread-count', getUnreadCountHandler);
router.patch('/read-all', markAllAsReadHandler);
router.patch('/:id/read', markAsReadHandler);

export default router;

