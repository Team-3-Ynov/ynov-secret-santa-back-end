import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  countUnreadNotifications,
  getNotificationsByUserId,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notification.service";

/**
 * GET /api/notifications
 * Retourne toutes les notifications de l'utilisateur connecté
 */
export const getNotificationsHandler = async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      getNotificationsByUserId(userId),
      countUnreadNotifications(userId),
    ]);

    return res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

/**
 * GET /api/notifications/unread-count
 * Retourne uniquement le nombre de notifications non lues (pour la cloche)
 */
export const getUnreadCountHandler = async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const count = await countUnreadNotifications(userId);
    return res.status(200).json({ success: true, unreadCount: count });
  } catch (error) {
    console.error("Erreur lors du comptage des notifications:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

/**
 * PATCH /api/notifications/:id/read
 * Marque une notification comme lue
 */
export const markAsReadHandler = async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.id;
  const { id } = req.params;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const notification = await markNotificationAsRead(id, userId);

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification non trouvée." });
    }

    return res.status(200).json({ success: true, data: notification });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la notification:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

/**
 * PATCH /api/notifications/read-all
 * Marque toutes les notifications de l'utilisateur comme lues
 */
export const markAllAsReadHandler = async (req: Request, res: Response) => {
  const userId = (req as AuthenticatedRequest).user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const updatedCount = await markAllNotificationsAsRead(userId);
    return res.status(200).json({
      success: true,
      message: `${updatedCount} notification(s) marquée(s) comme lue(s).`,
      updatedCount,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des notifications:", error);
    return res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
