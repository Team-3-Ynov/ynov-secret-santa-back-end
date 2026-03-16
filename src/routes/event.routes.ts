import { Router } from "express";
import {
  addExclusionHandler,
  createEventHandler,
  deleteEventHandler,
  deleteExclusionHandler,
  deleteInvitationHandler,
  drawEventHandler,
  getAssignmentHandler,
  getEventExclusionsHandler,
  getEventHandler,
  getEventInvitationsHandler,
  getEventParticipantsHandler,
  getUserEventsHandler,
  inviteUserHandler,
  joinEventHandler,
  updateEventHandler,
} from "../controllers/event.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router: Router = Router();

router.use(authenticate);

router.post("/", createEventHandler);
router.get("/", getUserEventsHandler);
router.get("/:id", getEventHandler);
router.get("/:id/participants", getEventParticipantsHandler);
router.get("/:id/invitations", getEventInvitationsHandler);
router.put("/:id", updateEventHandler);
router.delete("/:id", deleteEventHandler);
router.post("/:id/invite", inviteUserHandler);
router.delete("/:id/invitations/:invitationId", deleteInvitationHandler);
router.post("/:id/join", joinEventHandler);
router.post("/:id/draw", drawEventHandler);
router.patch("/:id/exclusions", addExclusionHandler);
router.get("/:id/exclusions", getEventExclusionsHandler);
router.delete("/:id/exclusions/:exclusionId", deleteExclusionHandler);
router.get("/:id/my-assignment", getAssignmentHandler);

export default router;
