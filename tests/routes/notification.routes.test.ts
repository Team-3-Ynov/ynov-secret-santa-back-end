import { vi, type Mock } from 'vitest';
import request from 'supertest';
import app from '../../src/app';
import * as notificationService from '../../src/services/notification.service';

vi.mock('../../src/middlewares/auth.middleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 1, email: 'test@example.com' };
    next();
  },
}));

vi.mock('../../src/services/notification.service', () => ({
  getNotificationsByUserId: vi.fn(),
  countUnreadNotifications: vi.fn(),
  markNotificationAsRead: vi.fn(),
  markAllNotificationsAsRead: vi.fn(),
}));

const mockNotification = {
  id: 'notif-uuid-1',
  user_id: 1,
  type: 'draw_result',
  title: '🎅 Résultat du tirage - Test Event',
  message: 'Vous avez été désigné(e) pour offrir un cadeau à user2 !',
  is_read: false,
  metadata: { eventId: 'event-uuid-123', receiverUsername: 'user2' },
  created_at: new Date(),
  updated_at: new Date(),
};

describe('GET /api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return notifications with unread count', async () => {
    (notificationService.getNotificationsByUserId as Mock).mockResolvedValue([mockNotification]);
    (notificationService.countUnreadNotifications as Mock).mockResolvedValue(1);

    const res = await request(app).get('/api/notifications');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.unreadCount).toBe(1);
    expect(notificationService.getNotificationsByUserId).toHaveBeenCalledWith(1);
  });

  it('should return empty list when no notifications', async () => {
    (notificationService.getNotificationsByUserId as Mock).mockResolvedValue([]);
    (notificationService.countUnreadNotifications as Mock).mockResolvedValue(0);

    const res = await request(app).get('/api/notifications');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.unreadCount).toBe(0);
  });
});

describe('GET /api/notifications/unread-count', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return the unread count', async () => {
    (notificationService.countUnreadNotifications as Mock).mockResolvedValue(3);

    const res = await request(app).get('/api/notifications/unread-count');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.unreadCount).toBe(3);
  });
});

describe('PATCH /api/notifications/:id/read', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mark a notification as read', async () => {
    const readNotification = { ...mockNotification, is_read: true };
    (notificationService.markNotificationAsRead as Mock).mockResolvedValue(readNotification);

    const res = await request(app).patch(`/api/notifications/${mockNotification.id}/read`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.is_read).toBe(true);
    expect(notificationService.markNotificationAsRead).toHaveBeenCalledWith(mockNotification.id, 1);
  });

  it('should return 404 if notification not found', async () => {
    (notificationService.markNotificationAsRead as Mock).mockResolvedValue(null);

    const res = await request(app).patch('/api/notifications/non-existent/read');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Notification non trouvée.');
  });
});

describe('PATCH /api/notifications/read-all', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mark all notifications as read', async () => {
    (notificationService.markAllNotificationsAsRead as Mock).mockResolvedValue(5);

    const res = await request(app).patch('/api/notifications/read-all');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.updatedCount).toBe(5);
    expect(notificationService.markAllNotificationsAsRead).toHaveBeenCalledWith(1);
  });
});

