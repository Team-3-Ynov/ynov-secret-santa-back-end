import type { Request, Response } from "express";
import { type Mock, vi } from "vitest";
import {
  getNotificationsHandler,
  getUnreadCountHandler,
  markAllAsReadHandler,
  markAsReadHandler,
} from "../../src/controllers/notification.controller";
import * as notificationService from "../../src/services/notification.service";

vi.mock("../../src/services/notification.service");

describe("notification.controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let jsonMock: Mock;
  let statusMock: Mock;

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    req = {
      params: { id: "notif-1" },
      user: { id: 10, email: "user@example.com" },
    } as unknown as Request;
    res = { status: statusMock, json: jsonMock } as unknown as Response;

    vi.clearAllMocks();
  });

  it("getNotificationsHandler should return 401 when user is missing", async () => {
    req = { ...req, user: undefined } as unknown as Request;

    await getNotificationsHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
  });

  it("getNotificationsHandler should return notifications and unreadCount", async () => {
    (notificationService.getNotificationsByUserId as Mock).mockResolvedValue([{ id: "n-1" }]);
    (notificationService.countUnreadNotifications as Mock).mockResolvedValue(2);

    await getNotificationsHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: [{ id: "n-1" }],
      unreadCount: 2,
    });
  });

  it("getUnreadCountHandler should return count", async () => {
    (notificationService.countUnreadNotifications as Mock).mockResolvedValue(5);

    await getUnreadCountHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ success: true, unreadCount: 5 });
  });

  it("getUnreadCountHandler should return 401 when user is missing", async () => {
    req = { ...req, user: undefined } as unknown as Request;

    await getUnreadCountHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
  });

  it("markAsReadHandler should return 404 when notification does not exist", async () => {
    (notificationService.markNotificationAsRead as Mock).mockResolvedValue(null);

    await markAsReadHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
  });

  it("markAsReadHandler should return updated notification", async () => {
    const updated = { id: "notif-1", is_read: true };
    (notificationService.markNotificationAsRead as Mock).mockResolvedValue(updated);

    await markAsReadHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({ success: true, data: updated });
  });

  it("markAsReadHandler should return 401 when user is missing", async () => {
    req = { ...req, user: undefined } as unknown as Request;

    await markAsReadHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
  });

  it("markAsReadHandler should return 500 when service throws", async () => {
    (notificationService.markNotificationAsRead as Mock).mockRejectedValue(new Error("boom"));

    await markAsReadHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
  });

  it("markAllAsReadHandler should return updated count", async () => {
    (notificationService.markAllNotificationsAsRead as Mock).mockResolvedValue(4);

    await markAllAsReadHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: "4 notification(s) marquée(s) comme lue(s).",
      updatedCount: 4,
    });
  });

  it("markAllAsReadHandler should return 401 when user is missing", async () => {
    req = { ...req, user: undefined } as unknown as Request;

    await markAllAsReadHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
  });

  it("markAllAsReadHandler should return 500 when service throws", async () => {
    (notificationService.markAllNotificationsAsRead as Mock).mockRejectedValue(new Error("boom"));

    await markAllAsReadHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
  });

  it("getNotificationsHandler should return 500 when service throws", async () => {
    (notificationService.getNotificationsByUserId as Mock).mockRejectedValue(new Error("boom"));

    await getNotificationsHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
  });

  it("should return 500 when service throws", async () => {
    (notificationService.countUnreadNotifications as Mock).mockRejectedValue(new Error("boom"));

    await getUnreadCountHandler(req as Request, res as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ success: false, message: "Erreur serveur" });
  });
});
