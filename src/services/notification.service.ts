import { pool } from "../config/database";
import type { CreateNotificationDTO, NotificationRecord } from "../models/notification.model";

/**
 * Crée une notification en base de données
 */
export const createNotification = async (
  dto: CreateNotificationDTO,
  clientPool: typeof pool = pool
): Promise<NotificationRecord> => {
  const result = await clientPool.query<NotificationRecord>(
    `INSERT INTO notifications (user_id, type, title, message, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      dto.userId,
      dto.type,
      dto.title,
      dto.message,
      dto.metadata ? JSON.stringify(dto.metadata) : null,
    ]
  );
  return result.rows[0];
};

/**
 * Récupère toutes les notifications d'un utilisateur (non lues en premier)
 */
export const getNotificationsByUserId = async (
  userId: number,
  clientPool: typeof pool = pool
): Promise<NotificationRecord[]> => {
  const result = await clientPool.query<NotificationRecord>(
    `SELECT * FROM notifications
     WHERE user_id = $1
     ORDER BY is_read ASC, created_at DESC`,
    [userId]
  );
  return result.rows;
};

/**
 * Compte les notifications non lues d'un utilisateur
 */
export const countUnreadNotifications = async (
  userId: number,
  clientPool: typeof pool = pool
): Promise<number> => {
  const result = await clientPool.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
};

/**
 * Marque une notification comme lue
 */
export const markNotificationAsRead = async (
  notificationId: string,
  userId: number,
  clientPool: typeof pool = pool
): Promise<NotificationRecord | null> => {
  const result = await clientPool.query<NotificationRecord>(
    `UPDATE notifications
     SET is_read = true
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [notificationId, userId]
  );
  return result.rows[0] || null;
};

/**
 * Marque toutes les notifications d'un utilisateur comme lues
 */
export const markAllNotificationsAsRead = async (
  userId: number,
  clientPool: typeof pool = pool
): Promise<number> => {
  const result = await clientPool.query(
    `UPDATE notifications
     SET is_read = true
     WHERE user_id = $1 AND is_read = false`,
    [userId]
  );
  return result.rowCount ?? 0;
};

/**
 * Marque en lue une notification d'invitation ciblée via son invitationId en metadata
 */
export const markInvitationNotificationAsRead = async (
  invitationId: string,
  userId: number,
  clientPool: typeof pool = pool
): Promise<number> => {
  const result = await clientPool.query(
    `UPDATE notifications
     SET is_read = true
     WHERE user_id = $1
       AND type = 'invitation'
       AND is_read = false
       AND metadata IS NOT NULL
       AND metadata->>'invitationId' = $2`,
    [userId, invitationId]
  );

  return result.rowCount ?? 0;
};

export type InvitationNotificationStatus = 'pending' | 'accepted' | 'declined';

/**
 * Met a jour le statut metier dans metadata pour la notification d'invitation
 */
export const updateInvitationNotificationStatus = async (
  invitationId: string,
  userId: number,
  status: InvitationNotificationStatus,
  clientPool: typeof pool = pool
): Promise<number> => {
  const respondedAt = status === 'pending' ? null : new Date().toISOString();

  const result = await clientPool.query(
    `UPDATE notifications
     SET metadata = jsonb_set(
        jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{invitationStatus}',
          to_jsonb($3::text),
          true
        ),
        '{respondedAt}',
        CASE WHEN $4::text IS NULL THEN 'null'::jsonb ELSE to_jsonb($4::text) END,
        true
      )
     WHERE user_id = $1
       AND type = 'invitation'
       AND metadata IS NOT NULL
       AND metadata->>'invitationId' = $2`,
    [userId, invitationId, status, respondedAt]
  );

  return result.rowCount ?? 0;
};

