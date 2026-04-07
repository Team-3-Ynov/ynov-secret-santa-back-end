import type { Request, Response } from "express";
import { type Mock, vi } from "vitest";
import type { AuthenticatedRequest } from "../../src/middlewares/auth.middleware";
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
} from "../../src/controllers/event.controller";
import * as emailService from "../../src/services/email.service";
import * as eventService from "../../src/services/event.service";
import { UserModel } from "../../src/models/user.model";
import * as notificationService from "../../src/services/notification.service";

vi.mock("../../src/services/event.service");
vi.mock("../../src/services/email.service");
vi.mock("../../src/services/notification.service");
vi.mock("../../src/models/user.model", () => ({
  UserModel: {
    findByEmail: vi.fn(),
  },
}));

describe("event.controller full coverage", () => {
  let req: Partial<AuthenticatedRequest>;
  let res: Partial<Response>;
  let jsonMock: Mock;
  let statusMock: Mock;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });
    req = {
      params: { id: "evt-1", invitationId: "inv-1" },
      body: {},
      user: { id: 1, email: "owner@example.com" },
    } as Partial<AuthenticatedRequest>;
    res = { status: statusMock, json: jsonMock } as unknown as Response;
    vi.clearAllMocks();
    (UserModel.findByEmail as Mock).mockResolvedValue(null);
  });

  describe("getEventHandler", () => {
    it("returns 401 when unauthenticated", async () => {
      req.user = undefined;

      await getEventHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it("returns 404 when event does not exist", async () => {
      (eventService.findEventById as Mock).mockResolvedValue(null);

      await getEventHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("returns 200 with event data", async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: "evt-1" });

      await getEventHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: { id: "evt-1" } });
    });

    it("returns 500 on unexpected error", async () => {
      (eventService.findEventById as Mock).mockRejectedValue(new Error("db"));

      await getEventHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("createEventHandler", () => {
    it("returns 500 when createEvent throws", async () => {
      req.body = {
        title: "Noel",
        eventDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      };
      (eventService.createEvent as Mock).mockRejectedValue(new Error("db"));

      await createEventHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("updateEventHandler", () => {
    it("returns 400 when payload is invalid", async () => {
      req.body = { budget: -10 };

      await updateEventHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("returns 404 when event not found", async () => {
      req.body = { title: "Updated" };
      (eventService.findEventById as Mock).mockResolvedValue(null);

      await updateEventHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("returns 403 when requester is not owner", async () => {
      req.body = { title: "Updated" };
      (eventService.findEventById as Mock).mockResolvedValue({ id: "evt-1", ownerId: 99 });

      await updateEventHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it("returns 200 when update succeeds", async () => {
      req.body = { title: "Updated" };
      (eventService.findEventById as Mock).mockResolvedValue({ id: "evt-1", ownerId: 1 });
      (eventService.updateEvent as Mock).mockResolvedValue({ id: "evt-1", title: "Updated" });

      await updateEventHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("returns 500 on service error", async () => {
      req.body = { title: "Updated" };
      (eventService.findEventById as Mock).mockRejectedValue(new Error("boom"));

      await updateEventHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("deleteEventHandler", () => {
    it("returns 401 when unauthenticated", async () => {
      req.user = undefined;

      await deleteEventHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it("returns 404 when event not found", async () => {
      (eventService.findEventById as Mock).mockResolvedValue(null);

      await deleteEventHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("returns 403 when requester is not owner", async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: "evt-1", ownerId: 2 });

      await deleteEventHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it("returns 200 when delete succeeds", async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: "evt-1", ownerId: 1 });
      (eventService.deleteEvent as Mock).mockResolvedValue(true);

      await deleteEventHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("returns 500 on unexpected error", async () => {
      (eventService.findEventById as Mock).mockRejectedValue(new Error("db"));

      await deleteEventHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("inviteUserHandler", () => {
    it("returns 400 for invalid email", async () => {
      req.body = { email: "bad-email" };

      await inviteUserHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("returns 201 and sends invitation", async () => {
      req.body = { email: "test@example.com" };
      (eventService.createInvitation as Mock).mockResolvedValue({ id: "inv-1" });
      (emailService.sendInvitationEmail as Mock).mockResolvedValue(undefined);

      await inviteUserHandler(req as Request, res as Response);

      expect(eventService.createInvitation).toHaveBeenCalledWith("evt-1", "test@example.com");
      expect(emailService.sendInvitationEmail).toHaveBeenCalledWith(
        "test@example.com",
        "Secret Santa Event",
        expect.stringContaining("/events/evt-1/join?token=inv-1")
      );
      expect(statusMock).toHaveBeenCalledWith(201);
    });

    it("returns 500 when invitation creation fails", async () => {
      req.body = { email: "test@example.com" };
      (eventService.createInvitation as Mock).mockRejectedValue(new Error("db"));

      await inviteUserHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("joinEventHandler", () => {
    it("returns 400 when service reports failure", async () => {
      (eventService.joinEvent as Mock).mockResolvedValue({ success: false, message: "invalid" });

      await joinEventHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("returns 200 on successful join", async () => {
      (eventService.joinEvent as Mock).mockResolvedValue({ success: true });

      await joinEventHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("returns 500 on unexpected error", async () => {
      (eventService.joinEvent as Mock).mockRejectedValue(new Error("db"));

      await joinEventHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });

    it("passes invitation token to service when provided", async () => {
      req.body = { token: "inv-token-1" };
      (eventService.joinEvent as Mock).mockResolvedValue({ success: true });

      await joinEventHandler(req as Request, res as Response);

      expect(eventService.joinEvent).toHaveBeenCalledWith("evt-1", 1, "inv-token-1");
    });
  });

  describe("drawEventHandler", () => {
    it("returns 404 when event does not exist", async () => {
      (eventService.findEventById as Mock).mockResolvedValue(null);

      await drawEventHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("returns 403 when requester is not owner", async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: "evt-1", ownerId: 2 });

      await drawEventHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it("returns 200 when draw and notifications succeed", async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: "evt-1", ownerId: 1 });
      (eventService.performDraw as Mock).mockResolvedValue({
        assignments: [{ giver_id: 1, receiver_id: 2 }],
        notifications: [
          {
            giverId: 1,
            giverEmail: "giver@example.com",
            giverUsername: "giver",
            receiverUsername: "receiver",
            eventTitle: "Noel",
          },
        ],
      });
      (notificationService.createNotification as Mock).mockResolvedValue({ id: "n1" });
      (emailService.sendDrawResultEmail as Mock).mockResolvedValue(undefined);

      await drawEventHandler(req as Request, res as Response);

      expect(notificationService.createNotification).toHaveBeenCalled();
      expect(emailService.sendDrawResultEmail).toHaveBeenCalled();
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("returns 400 when draw throws", async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: "evt-1", ownerId: 1 });
      (eventService.performDraw as Mock).mockRejectedValue(new Error("draw failed"));

      await drawEventHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ message: "draw failed" });
    });
  });

  describe("getAssignmentHandler", () => {
    it("returns 404 when assignment does not exist", async () => {
      (eventService.getAssignment as Mock).mockResolvedValue(null);

      await getAssignmentHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("returns 200 with receiver id", async () => {
      (eventService.getAssignment as Mock).mockResolvedValue({ receiver_id: 22 });

      await getAssignmentHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ success: true, receiverId: 22 });
    });

    it("returns 500 on unexpected error", async () => {
      (eventService.getAssignment as Mock).mockRejectedValue(new Error("db"));

      await getAssignmentHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("getUserEventsHandler", () => {
    it("returns 401 when unauthenticated", async () => {
      req.user = undefined;

      await getUserEventsHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it("returns 200 with user events", async () => {
      (eventService.getEventsByUserId as Mock).mockResolvedValue([{ id: "evt-1" }]);

      await getUserEventsHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith([{ id: "evt-1" }]);
    });

    it("returns 500 on unexpected error", async () => {
      (eventService.getEventsByUserId as Mock).mockRejectedValue(new Error("db"));

      await getUserEventsHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("getEventParticipantsHandler", () => {
    it("returns 401 when unauthenticated", async () => {
      req.user = undefined;

      await getEventParticipantsHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it("returns 200 with participants", async () => {
      (eventService.getEventParticipants as Mock).mockResolvedValue([{ id: 1, username: "u1" }]);

      await getEventParticipantsHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({ success: true, data: [{ id: 1, username: "u1" }] });
    });

    it("returns 500 on unexpected error", async () => {
      (eventService.getEventParticipants as Mock).mockRejectedValue(new Error("db"));

      await getEventParticipantsHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("getEventInvitationsHandler", () => {
    it("returns 401 when unauthenticated", async () => {
      req.user = undefined;

      await getEventInvitationsHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it("returns 404 when event does not exist", async () => {
      (eventService.findEventById as Mock).mockResolvedValue(null);

      await getEventInvitationsHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("returns 403 when requester is not owner", async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: "evt-1", ownerId: 2 });

      await getEventInvitationsHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it("returns 200 with invitations", async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: "evt-1", ownerId: 1 });
      (eventService.getEventInvitations as Mock).mockResolvedValue([{ id: "inv-1" }]);

      await getEventInvitationsHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("returns 500 on unexpected error", async () => {
      (eventService.findEventById as Mock).mockRejectedValue(new Error("db"));

      await getEventInvitationsHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("deleteInvitationHandler", () => {
    it("returns 401 when unauthenticated", async () => {
      req.user = undefined;

      await deleteInvitationHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it("returns 404 when event does not exist", async () => {
      (eventService.findEventById as Mock).mockResolvedValue(null);

      await deleteInvitationHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("returns 403 when requester is not owner", async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: "evt-1", ownerId: 2 });

      await deleteInvitationHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it("returns 404 when invitation does not exist", async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: "evt-1", ownerId: 1 });
      (eventService.findInvitationById as Mock).mockResolvedValue(null);

      await deleteInvitationHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("returns 400 when invitation is already accepted", async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: "evt-1", ownerId: 1 });
      (eventService.findInvitationById as Mock).mockResolvedValue({
        id: "inv-1",
        event_id: "evt-1",
        status: "accepted",
      });

      await deleteInvitationHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("returns 200 when invitation is deleted", async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: "evt-1", ownerId: 1 });
      (eventService.findInvitationById as Mock).mockResolvedValue({
        id: "inv-1",
        event_id: "evt-1",
        status: "pending",
      });
      (eventService.deleteInvitation as Mock).mockResolvedValue(true);

      await deleteInvitationHandler(req as Request, res as Response);

      expect(eventService.deleteInvitation).toHaveBeenCalledWith("inv-1");
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it("returns 500 on unexpected error", async () => {
      (eventService.findEventById as Mock).mockRejectedValue(new Error("db"));

      await deleteInvitationHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("addExclusionHandler", () => {
    beforeEach(() => {
      req.body = { giverId: 1, receiverId: 2 };
    });

    it("returns 409 for duplicate conflict codes", async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: "evt-1", ownerId: 1 });
      const conflict = Object.assign(new Error("duplicate"), { code: "23505" });
      (eventService.addExclusion as Mock).mockRejectedValue(conflict);

      await addExclusionHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
    });

    it("returns 400 when service error carries statusCode 400", async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: "evt-1", ownerId: 1 });
      const badRequest = Object.assign(new Error("bad"), { statusCode: 400 });
      (eventService.addExclusion as Mock).mockRejectedValue(badRequest);

      await addExclusionHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
    });

    it("returns 403 when service error carries status 403", async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: "evt-1", ownerId: 1 });
      const forbidden = Object.assign(new Error("forbidden"), { status: 403 });
      (eventService.addExclusion as Mock).mockRejectedValue(forbidden);

      await addExclusionHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ success: false, message: "Accès refusé." });
    });

    it("returns 500 when service error is unknown", async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: "evt-1", ownerId: 1 });
      (eventService.addExclusion as Mock).mockRejectedValue(new Error("boom"));

      await addExclusionHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("getEventExclusionsHandler", () => {
    it("returns 401 when unauthenticated", async () => {
      req.user = undefined;

      await getEventExclusionsHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it("returns 404 when event does not exist", async () => {
      (eventService.findEventById as Mock).mockResolvedValue(null);

      await getEventExclusionsHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("returns 403 when requester is not owner", async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: "evt-1", ownerId: 99 });

      await getEventExclusionsHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it("returns 500 on unexpected error", async () => {
      (eventService.findEventById as Mock).mockRejectedValue(new Error("db"));

      await getEventExclusionsHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });

  describe("deleteExclusionHandler", () => {
    it("returns 401 when unauthenticated", async () => {
      req.user = undefined;

      await deleteExclusionHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
    });

    it("returns 404 when event does not exist", async () => {
      (eventService.findEventById as Mock).mockResolvedValue(null);

      await deleteExclusionHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
    });

    it("returns 403 when requester is not owner", async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: "evt-1", ownerId: 99 });

      await deleteExclusionHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
    });

    it("returns 500 on unexpected error", async () => {
      (eventService.findEventById as Mock).mockResolvedValue({ id: "evt-1", ownerId: 1 });
      (eventService.deleteExclusion as Mock).mockRejectedValue(new Error("db"));

      await deleteExclusionHandler(req as Request, res as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });
});
