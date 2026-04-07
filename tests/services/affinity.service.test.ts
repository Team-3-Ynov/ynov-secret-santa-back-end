import { type Mock, vi } from "vitest";
import { getAffinities, setAffinity } from "../../src/services/event.service";

describe("Affinity Service", () => {
  let mockPool: any;
  let mockPoolQuery: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPoolQuery = vi.fn();
    mockPool = {
      query: mockPoolQuery,
      connect: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── setAffinity ──────────────────────────────────────────────────────────

  describe("setAffinity", () => {
    it("should throw immediately when giver and target are the same user", async () => {
      await expect(setAffinity("event-1", 1, 1, "neutral", mockPool)).rejects.toThrow(
        "Vous ne pouvez pas définir une affinité envers vous-même."
      );
      expect(mockPoolQuery).not.toHaveBeenCalled();
    });

    it("should throw when the draw has already been performed", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ id: "assignment-1" }], rowCount: 1 });

      await expect(setAffinity("event-1", 1, 2, "neutral", mockPool)).rejects.toThrow(
        "Le tirage a déjà été effectué. Les affinités ne peuvent plus être modifiées."
      );
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
    });

    it("should check draw status before anything else", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ id: "a1" }], rowCount: 1 });

      await expect(setAffinity("event-1", 1, 2, "avoid", mockPool)).rejects.toThrow(
        "Le tirage a déjà été effectué"
      );
      expect(mockPoolQuery).toHaveBeenCalledTimes(1);
      expect(mockPoolQuery).toHaveBeenCalledWith(
        "SELECT id FROM assignments WHERE event_id = $1 LIMIT 1",
        ["event-1"]
      );
    });

    it("should throw when giver is not an accepted participant", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // drawCheck
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ user_id: 2 }] }); // only target found

      await expect(setAffinity("event-1", 1, 2, "neutral", mockPool)).rejects.toThrow(
        "Vous n'êtes pas un participant accepté de cet événement."
      );
    });

    it("should throw when target is not an accepted participant", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // drawCheck
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ user_id: 1 }] }); // only giver found

      await expect(setAffinity("event-1", 1, 2, "neutral", mockPool)).rejects.toThrow(
        "Ce participant n'est pas un participant accepté de cet événement."
      );
    });

    it("should throw when neither user is a participant", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // drawCheck
      mockPoolQuery.mockResolvedValueOnce({ rows: [] }); // nobody found

      await expect(setAffinity("event-1", 99, 100, "avoid", mockPool)).rejects.toThrow(
        "Vous n'êtes pas un participant accepté de cet événement."
      );
    });

    it("should create a new 'avoid' affinity", async () => {
      const mockAffinity = {
        id: 1,
        event_id: "event-1",
        giver_id: 1,
        target_id: 2,
        affinity: "avoid",
      };
      mockPoolQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // drawCheck
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ user_id: 1 }, { user_id: 2 }] }); // participants
      mockPoolQuery.mockResolvedValueOnce({ rows: [mockAffinity] }); // upsert

      const result = await setAffinity("event-1", 1, 2, "avoid", mockPool);

      expect(result).toEqual(mockAffinity);
      expect(mockPoolQuery).toHaveBeenCalledTimes(3);
      expect(mockPoolQuery).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining("INSERT INTO event_affinities"),
        ["event-1", 1, 2, "avoid"]
      );
    });

    it("should create a 'favorable' affinity", async () => {
      const mockAffinity = {
        id: 2,
        event_id: "event-1",
        giver_id: 1,
        target_id: 2,
        affinity: "favorable",
      };
      mockPoolQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ user_id: 1 }, { user_id: 2 }] });
      mockPoolQuery.mockResolvedValueOnce({ rows: [mockAffinity] });

      const result = await setAffinity("event-1", 1, 2, "favorable", mockPool);

      expect(result.affinity).toBe("favorable");
    });

    it("should upsert using ON CONFLICT so existing records are updated", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ user_id: 1 }, { user_id: 2 }] });
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ id: 5, affinity: "neutral" }] });

      const result = await setAffinity("event-1", 1, 2, "neutral", mockPool);

      expect(result.affinity).toBe("neutral");
      expect(mockPoolQuery).toHaveBeenNthCalledWith(
        3,
        expect.stringContaining("ON CONFLICT"),
        expect.any(Array)
      );
    });

    it("should pass correct parameters to all queries", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ user_id: 5 }, { user_id: 10 }] });
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ id: 1, affinity: "avoid" }] });

      await setAffinity("event-abc", 5, 10, "avoid", mockPool);

      expect(mockPoolQuery).toHaveBeenNthCalledWith(
        1,
        "SELECT id FROM assignments WHERE event_id = $1 LIMIT 1",
        ["event-abc"]
      );
      expect(mockPoolQuery).toHaveBeenNthCalledWith(
        2,
        "SELECT user_id FROM invitations WHERE event_id = $1 AND user_id IN ($2, $3) AND status = 'accepted'",
        ["event-abc", 5, 10]
      );
    });
  });

  // ─── getAffinities ────────────────────────────────────────────────────────

  describe("getAffinities", () => {
    it("should return empty array when no affinities are set", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });

      const result = await getAffinities("event-1", 1, mockPool);

      expect(result).toEqual([]);
    });

    it("should return all affinities for a giver in an event", async () => {
      const mockAffinities = [
        { id: 1, event_id: "event-1", giver_id: 1, target_id: 2, affinity: "avoid" },
        { id: 2, event_id: "event-1", giver_id: 1, target_id: 3, affinity: "favorable" },
        { id: 3, event_id: "event-1", giver_id: 1, target_id: 4, affinity: "neutral" },
      ];
      mockPoolQuery.mockResolvedValueOnce({ rows: mockAffinities });

      const result = await getAffinities("event-1", 1, mockPool);

      expect(result).toHaveLength(3);
      expect(result[0].affinity).toBe("avoid");
      expect(result[1].affinity).toBe("favorable");
      expect(result[2].affinity).toBe("neutral");
    });

    it("should query with the correct event_id and giver_id", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [] });

      await getAffinities("event-xyz", 42, mockPool);

      expect(mockPoolQuery).toHaveBeenCalledWith(
        "SELECT * FROM event_affinities WHERE event_id = $1 AND giver_id = $2",
        ["event-xyz", 42]
      );
    });

    it("should not return affinities belonging to a different giver", async () => {
      mockPoolQuery.mockResolvedValueOnce({ rows: [{ id: 1, giver_id: 1, affinity: "avoid" }] });

      const result = await getAffinities("event-1", 1, mockPool);

      // The DB filtering is done by query params, so if the mock returns only giver=1
      // the result should only contain that
      expect(result.every((r) => r.giver_id === 1)).toBe(true);
    });

    it("should return a single affinity when only one is set", async () => {
      mockPoolQuery.mockResolvedValueOnce({
        rows: [{ id: 7, event_id: "event-1", giver_id: 2, target_id: 5, affinity: "favorable" }],
      });

      const result = await getAffinities("event-1", 2, mockPool);

      expect(result).toHaveLength(1);
      expect(result[0].target_id).toBe(5);
      expect(result[0].affinity).toBe("favorable");
    });
  });
});
