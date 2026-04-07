import { Router } from "express";
import {
  addExclusionHandler,
  createEventHandler,
  declineInvitationHandler,
  deleteEventHandler,
  deleteExclusionHandler,
  deleteInvitationHandler,
  drawEventHandler,
  getAffinitiesHandler,
  getAssignmentHandler,
  getEventExclusionsHandler,
  getEventHandler,
  getEventInvitationsHandler,
  getEventParticipantsHandler,
  getUserEventsHandler,
  inviteUserHandler,
  joinEventHandler,
  setAffinityHandler,
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
router.patch("/:id/invitations/:invitationId/decline", declineInvitationHandler);
router.post("/:id/draw", drawEventHandler);
router.patch("/:id/exclusions", addExclusionHandler);
router.get("/:id/exclusions", getEventExclusionsHandler);
router.delete("/:id/exclusions/:exclusionId", deleteExclusionHandler);
router.get("/:id/my-assignment", getAssignmentHandler);
router.get("/:id/affinities", getAffinitiesHandler);
router.put("/:id/affinities/:targetId", setAffinityHandler);

export default router;
