import { type Mock, vi } from "vitest";
import { pool } from "../../src/config/database";
import {
  countUnreadNotifications,
  createNotification,
  getNotificationsByUserId,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../src/services/notification.service";

vi.mock("../../src/config/database", () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe("notification.service", () => {
  const mockPool = pool as unknown as { query: Mock };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("createNotification should insert and return created notification", async () => {
    const created = {
      id: "n-1",
      user_id: 1,
      type: "invitation",
      title: "Invitation",
      message: "Vous etes invite",
      is_read: false,
      metadata: null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    mockPool.query.mockResolvedValueOnce({ rows: [created] });

    const result = await createNotification({
      userId: 1,
      type: "invitation",
      title: "Invitation",
      message: "Vous etes invite",
      metadata: { eventId: "evt-1" },
    });

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO notifications"),
      [1, "invitation", "Invitation", "Vous etes invite", JSON.stringify({ eventId: "evt-1" })]
    );
    expect(result).toEqual(created);
  });

  it("getNotificationsByUserId should return ordered notifications", async () => {
    const rows = [{ id: "n-1" }, { id: "n-2" }];
    mockPool.query.mockResolvedValueOnce({ rows });

    const result = await getNotificationsByUserId(12);

    expect(mockPool.query).toHaveBeenCalledWith(
      expect.stringContaining("ORDER BY is_read ASC, created_at DESC"),
      [12]
    );
    expect(result).toEqual(rows);
  });

  it("countUnreadNotifications should return parsed integer", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ count: "4" }] });

    const result = await countUnreadNotifications(7);

    expect(result).toBe(4);
  });

  it("markNotificationAsRead should return null if no row updated", async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });

    const result = await markNotificationAsRead("notif-1", 8);

    expect(mockPool.query).toHaveBeenCalledWith(expect.stringContaining("UPDATE notifications"), [
      "notif-1",
      8,
    ]);
    expect(result).toBeNull();
  });

  it("markAllNotificationsAsRead should return updated row count", async () => {
    mockPool.query.mockResolvedValueOnce({ rowCount: 3 });

    const result = await markAllNotificationsAsRead(3);

    expect(result).toBe(3);
  });
});
