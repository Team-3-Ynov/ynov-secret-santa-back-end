import { Router } from "express";
import {
  getNotificationsHandler,
  getUnreadCountHandler,
  markAllAsReadHandler,
  markAsReadHandler,
} from "../controllers/notification.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router: Router = Router();

router.use(authenticate);

router.get("/", getNotificationsHandler);
router.get("/unread-count", getUnreadCountHandler);
router.patch("/read-all", markAllAsReadHandler);
router.patch("/:id/read", markAsReadHandler);

export default router;
