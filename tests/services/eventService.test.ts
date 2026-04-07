import { type Mock, vi } from "vitest";
import {
  addExclusion,
  createEvent,
  createInvitation,
  deleteEvent,
  deleteExclusion,
  deleteInvitation,
  findEventById,
  findInvitationById,
  getAssignment,
  getEventExclusions,
  getEventInvitations,
  getEventParticipants,
  getEventsByUserId,
  joinEvent,
  performDraw,
  updateEvent,
} from "../../src/services/event.service";

describe("EventService - Unified Dependency Injection Tests", () => {
  let mockPool: any;
  let mockClientQuery: Mock;
  let mockClientRelease: Mock;
  let mockPoolQuery: Mock;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClientQuery = vi.fn();
    mockClientRelease = vi.fn();
    mockPoolQuery = vi.fn();

    mockPool = {
      query: mockPoolQuery,
      connect: vi.fn(() =>
        Promise.resolve({
          query: mockClientQuery,
          release: mockClientRelease,
        })
      ),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createEvent", () => {
    it("should create an event successfully", async () => {
      const mockEvent = { id: "uuid", title: "Test" };
      mockPoolQuery.mockResolvedValueOnce({ rows: [mockEvent] });

      const result = await createEvent(
        { title: "Test", eventDate: new Date(), ownerId: 1 } as any,
        mockPool
      );

      expect(result).toEqual(mockEvent);
      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO events"),
        expect.any(Array)
      );
    });
  });

  describe("createInvitation", () => {
    it("should return existing invitation when already present", async () => {
      const existingInvitation = { id: "inv-existing", email: "test@test.com" };
      mockPoolQuery.mockResolvedValueOnce({ rows: [existingInvitation], rowCount: 1 });

      const result = await createInvitation("event-1", "test@test.com", mockPool);

      expect(result).toEqual(existingInvitation);
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });

    it("should create a new invitation", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // Existing check
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ id: "inv-1" }] }); // Insertion

      const result = await createInvitation("event-1", "test@test.com", mockPool);

      expect(result.id).toBe("inv-1");
      expect(mockPoolQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe("joinEvent", () => {
    it("should fail when no invitation exists", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });

      const result = await joinEvent("event-1", 1, mockPool);

      expect(result.success).toBe(false);
      expect(result.message).toContain("Aucune invitation");
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });

    it("should return already joined when invitation is accepted by same user", async () => {
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ id: "inv-1", status: "accepted", user_id: 1 }],
      });

      const result = await joinEvent("event-1", 1, mockPool);

      expect(result.success).toBe(true);
      expect(result.message).toContain("déjà rejoint");
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });

    it("should fail when invitation is already used by another user", async () => {
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ id: "inv-1", status: "accepted", user_id: 2 }],
      });

      const result = await joinEvent("event-1", 1, "inv-1", mockPool);

      expect(result.success).toBe(false);
      expect(result.message).toContain("déjà été utilisée");
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });

    it("should successfully join an event with token", async () => {
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ id: "inv-1", status: "pending" }],
      }); // Find invitation
      mockPoolQuery.mockResolvedValueOnce({ rowCount: 1 }); // Update invitation

      const result = await joinEvent("event-1", 1, "inv-1", mockPool);

      expect(result.success).toBe(true);
      expect(mockPoolQuery).toHaveBeenCalledTimes(2);
    });

    it("should fail when invitation token is already used by another user", async () => {
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ id: "inv-token-1", status: "accepted", user_id: 7 }],
      });

      const result = await joinEvent("event-1", 1, "inv-token-1", mockPool);

      expect(result.success).toBe(false);
      expect(result.message).toContain("déjà été utilisée");
      expect(mockPoolQuery).toHaveBeenNthCalledWith(
        1,
        "SELECT * FROM invitations WHERE id = $1 AND event_id = $2",
        ["inv-token-1", "event-1"]
      );
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });

    it("should join using invitation token", async () => {
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ id: "inv-token-1", status: "pending" }],
      });
      mockPoolQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await joinEvent("event-1", 1, "inv-token-1", mockPool);

      expect(result.success).toBe(true);
      expect(mockPoolQuery).toHaveBeenCalledTimes(2);
    });
  });

  describe("findEventById", () => {
    it("should return an event by id", async () => {
      const mockEvent = { id: "event-1" };
      mockPoolQuery.mockResolvedValueOnce({ rows: [mockEvent] });

      const result = await findEventById("event-1", mockPool);

      expect(result).toEqual(mockEvent);
    });
  });

  describe("deleteEvent", () => {
    it("should delete an event and its related data", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ command: "BEGIN" })
        .mockResolvedValueOnce({}) // Delete assignments
        .mockResolvedValueOnce({}) // Delete invitations
        .mockResolvedValueOnce({ rowCount: 1 }) // Delete event
        .mockResolvedValueOnce({ command: "COMMIT" });

      const result = await deleteEvent("event-1", mockPool);

      expect(result).toBe(true);
      expect(mockClientQuery).toHaveBeenCalledWith("COMMIT");
    });

    it("should rollback and rethrow when deletion fails", async () => {
      const dbError = new Error("DB failure");
      mockClientQuery
        .mockResolvedValueOnce({ command: "BEGIN" })
        .mockRejectedValueOnce(dbError)
        .mockResolvedValueOnce({ command: "ROLLBACK" });

      await expect(deleteEvent("event-1", mockPool)).rejects.toThrow("DB failure");
      expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
      expect(mockClientRelease).toHaveBeenCalled();
    });
  });

  describe("updateEvent", () => {
    it("should return existing event when payload is empty", async () => {
      const existingEvent = { id: "event-1", title: "Current Title" };
      mockPoolQuery.mockResolvedValueOnce({ rows: [existingEvent] });

      const result = await updateEvent("event-1", {}, mockPool);

      expect(result).toEqual(existingEvent);
      expect(mockPoolQuery).toHaveBeenCalledWith(
        expect.stringContaining("FROM events WHERE id = $1"),
        ["event-1"]
      );
    });

    it("should update an event", async () => {
      const updatedEvent = { id: "event-1", title: "New Title" };
      mockPoolQuery.mockResolvedValueOnce({ rows: [updatedEvent] });

      const result = await updateEvent("event-1", { title: "New Title" }, mockPool);

      expect(result).toEqual(updatedEvent);
    });
  });

  describe("performDraw", () => {
    it("should rollback when there are not enough participants", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ command: "BEGIN" })
        .mockResolvedValueOnce({ rows: [{ title: "Test Event" }] })
        .mockResolvedValueOnce({
          rows: [{ user_id: 1, email: "user1@example.com", username: "user1" }],
          rowCount: 1,
        })
        .mockResolvedValueOnce({ command: "ROLLBACK" });

      await expect(performDraw("event-1", mockPool)).rejects.toThrow(
        "Il faut au moins 2 participants"
      );
      expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
    });

    it("should rollback when a draw already exists", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ command: "BEGIN" })
        .mockResolvedValueOnce({ rows: [{ title: "Test Event" }] })
        .mockResolvedValueOnce({
          rows: [
            { user_id: 1, email: "user1@example.com", username: "user1" },
            { user_id: 2, email: "user2@example.com", username: "user2" },
          ],
          rowCount: 2,
        })
        .mockResolvedValueOnce({ rows: [{ id: "a-existing" }], rowCount: 1 })
        .mockResolvedValueOnce({ command: "ROLLBACK" });

      await expect(performDraw("event-1", mockPool)).rejects.toThrow(
        "Un tirage a déjà été effectué"
      );
      expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
    });

    it("should perform a draw successfully", async () => {
      mockClientQuery
        .mockResolvedValueOnce({ command: "BEGIN" })
        .mockResolvedValueOnce({ rows: [{ title: "Test Event" }] }) // event title
        .mockResolvedValueOnce({
          rows: [
            { user_id: 1, email: "user1@example.com", username: "user1" },
            { user_id: 2, email: "user2@example.com", username: "user2" },
          ],
          rowCount: 2,
        }) // participants with user info
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // existing draw
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // exclusions
        .mockResolvedValueOnce({
          rows: [{ id: "a1", giver_id: 1, receiver_id: 2 }],
          rowCount: 1,
        }) // insert 1
        .mockResolvedValueOnce({
          rows: [{ id: "a2", giver_id: 2, receiver_id: 1 }],
          rowCount: 1,
        }) // insert 2
        .mockResolvedValueOnce({ command: "COMMIT" });

      const result = await performDraw("event-1", mockPool);

      expect(result.assignments).toHaveLength(2);
      expect(result.notifications).toHaveLength(2);
      expect(result.notifications[0]).toMatchObject({
        giverId: expect.any(Number),
        giverEmail: expect.any(String),
        giverUsername: expect.any(String),
        receiverUsername: expect.any(String),
        eventTitle: "Test Event",
      });
      expect(mockClientQuery).toHaveBeenCalledWith("COMMIT");
    });

    it("should perform a draw while respecting exclusions", async () => {
      // Participants: 1, 2, 3
      // Exclusion: giver 1 cannot draw receiver 2
      mockClientQuery
        .mockResolvedValueOnce({ command: "BEGIN" })
        .mockResolvedValueOnce({ rows: [{ title: "Test Event" }] }) // event title
        .mockResolvedValueOnce({
          rows: [
            { user_id: 1, email: "user1@example.com", username: "user1" },
            { user_id: 2, email: "user2@example.com", username: "user2" },
            { user_id: 3, email: "user3@example.com", username: "user3" },
          ],
          rowCount: 3,
        }) // participants with user info
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // existing draw
        .mockResolvedValueOnce({
          rows: [{ giver_id: 1, receiver_id: 2 }],
          rowCount: 1,
        }) // exclusions
        .mockResolvedValueOnce({
          rows: [{ id: "a1", giver_id: 1, receiver_id: 3 }],
          rowCount: 1,
        }) // insert 1
        .mockResolvedValueOnce({
          rows: [{ id: "a2", giver_id: 2, receiver_id: 1 }],
          rowCount: 1,
        }) // insert 2
        .mockResolvedValueOnce({
          rows: [{ id: "a3", giver_id: 3, receiver_id: 2 }],
          rowCount: 1,
        }) // insert 3
        .mockResolvedValueOnce({ command: "COMMIT" });

      const result = await performDraw("event-1", mockPool);

      expect(result.assignments).toHaveLength(3);
      // Ensure no assignment matches the excluded pair (1 -> 2)
      const hasExcludedPair = result.assignments.some(
        (assignment: { giver_id: number; receiver_id: number }) =>
          assignment.giver_id === 1 && assignment.receiver_id === 2
      );
      expect(hasExcludedPair).toBe(false);
      expect(mockClientQuery).toHaveBeenCalledWith("COMMIT");
    });

    it("should fail when exclusions make a valid draw impossible", async () => {
      // Participants: 1, 2
      // Exclusions: 1 -> 2 and 2 -> 1 (no valid assignments possible)
      mockClientQuery
        .mockResolvedValueOnce({ command: "BEGIN" })
        .mockResolvedValueOnce({ rows: [{ title: "Test Event" }] }) // event title
        .mockResolvedValueOnce({
          rows: [
            { user_id: 1, email: "user1@example.com", username: "user1" },
            { user_id: 2, email: "user2@example.com", username: "user2" },
          ],
          rowCount: 2,
        }) // participants with user info
        .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // existing draw
        .mockResolvedValueOnce({
          rows: [
            { giver_id: 1, receiver_id: 2 },
            { giver_id: 2, receiver_id: 1 },
          ],
          rowCount: 2,
        }) // exclusions - impossible to satisfy
        .mockResolvedValueOnce({ command: "ROLLBACK" });

      await expect(performDraw("event-1", mockPool)).rejects.toThrow(
        "Impossible de trouver une assignation valide avec les exclusions actuelles. Trop de contraintes."
      );
      expect(mockClientQuery).toHaveBeenCalledWith("ROLLBACK");
    });
  });

  describe("getAssignment", () => {
    it("should return an assignment", async () => {
      const mockAssignment = { giver_id: 1, receiver_id: 2 };
      mockPoolQuery.mockResolvedValueOnce({ rows: [mockAssignment] });

      const result = await getAssignment("event-1", 1, mockPool);

      expect(result).toEqual(mockAssignment);
    });
  });

  describe("getEventsByUserId", () => {
    it("should return events for a user", async () => {
      const mockEvents = [{ id: "event-1" }];
      mockPoolQuery.mockResolvedValueOnce({ rows: mockEvents });

      const result = await getEventsByUserId(1, mockPool);

      expect(result).toEqual(mockEvents);
    });
  });

  describe("getEventParticipants", () => {
    it("should return participants for an event", async () => {
      const mockParticipants = [{ id: 1, username: "user1" }];
      mockPoolQuery.mockResolvedValueOnce({ rows: mockParticipants });

      const result = await getEventParticipants("event-1", mockPool);

      expect(result).toEqual(mockParticipants);
    });
  });

  describe("getEventInvitations", () => {
    it("should return invitations for an event", async () => {
      const mockInvitations = [{ id: "inv-1", email: "test@test.com" }];
      mockPoolQuery.mockResolvedValueOnce({ rows: mockInvitations });

      const result = await getEventInvitations("event-1", mockPool);

      expect(result).toEqual(mockInvitations);
    });
  });

  describe("findInvitationById", () => {
    it("should return an invitation by id", async () => {
      const mockInvitation = { id: "inv-1" };
      mockPoolQuery.mockResolvedValueOnce({ rows: [mockInvitation] });

      const result = await findInvitationById("inv-1", mockPool);

      expect(result).toEqual(mockInvitation);
    });
  });

  describe("deleteInvitation", () => {
    it("should delete an invitation", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await deleteInvitation("inv-1", mockPool);

      expect(result).toBe(true);
    });
  });

  describe("addExclusion", () => {
    it("should throw when giver and receiver are the same user", async () => {
      await expect(addExclusion("event-1", 1, 1, mockPool)).rejects.toThrow("s'exclure lui-même");
    });

    it("should throw when giver is not an accepted participant", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ user_id: 2 }], rowCount: 1 });

      await expect(addExclusion("event-1", 1, 2, mockPool)).rejects.toThrow(
        "Le donneur n'est pas un participant accepté"
      );
    });

    it("should throw when receiver is not an accepted participant", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ user_id: 1 }], rowCount: 1 });

      await expect(addExclusion("event-1", 1, 2, mockPool)).rejects.toThrow(
        "Le receveur n'est pas un participant accepté"
      );
    });

    it("should add an exclusion", async () => {
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ user_id: 1 }, { user_id: 2 }],
        rowCount: 2,
      }); // participants check
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ id: 1, event_id: "event-1", giver_id: 1, receiver_id: 2 }],
      }); // insertion

      const result = await addExclusion("event-1", 1, 2, mockPool);

      expect(result.giver_id).toBe(1);
      expect(mockPoolQuery).toHaveBeenCalledTimes(2);
    });

    it("should throw conflict message on duplicate exclusion", async () => {
      const conflictError = Object.assign(new Error("duplicate"), { code: "23505" });
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ user_id: 1 }, { user_id: 2 }],
        rowCount: 2,
      });
      mockPoolQuery.mockRejectedValueOnce(conflictError);

      await expect(addExclusion("event-1", 1, 2, mockPool)).rejects.toThrow(
        "Cette exclusion existe déjà pour cet événement"
      );
    });

    it("should rethrow non-conflict insertion errors", async () => {
      const otherError = new Error("insert failed");
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ user_id: 1 }, { user_id: 2 }],
        rowCount: 2,
      });
      mockPoolQuery.mockRejectedValueOnce(otherError);

      await expect(addExclusion("event-1", 1, 2, mockPool)).rejects.toThrow("insert failed");
    });
  });

  describe("getEventExclusions", () => {
    it("should return exclusions for an event", async () => {
      const mockExclusions = [{ id: 1, giver_id: 1, receiver_id: 2 }];
      mockPoolQuery.mockResolvedValueOnce({ rows: mockExclusions });

      const result = await getEventExclusions("event-1", mockPool);

      expect(result).toEqual(mockExclusions);
    });
  });

  describe("deleteExclusion", () => {
    it("should delete an exclusion", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rowCount: 1 });

      const result = await deleteExclusion("event-1", 1, mockPool);

      expect(result).toBe(true);
    });
  });
});
