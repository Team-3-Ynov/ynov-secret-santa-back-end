import { Request, Response } from 'express';
import { addExclusion, createEvent, findEventById, updateEvent, deleteEvent, createInvitation, joinEvent, declineInvitation, performDraw, getAssignment, getEventsByUserId, getEventParticipants, getEventInvitations, findInvitationById, deleteInvitation, getEventExclusions, deleteExclusion } from '../services/event.service';
import { validateEventInput, updateEventSchema } from '../models/event.model';
import { invitationSchema } from '../models/invitation.model';
import { sendInvitationEmail, sendDrawResultEmail } from '../services/email.service';
import { createNotification, markInvitationNotificationAsRead, updateInvitationNotificationStatus } from '../services/notification.service';
import { UserModel } from '../models/user.model';
import { signInvitationToken, verifyInvitationToken } from '../utils/jwt.utils';

const joinEventForUser = (
  eventId: string,
  userId: string,
  email: string,
  invitationId?: string
) => {
  // Preserve existing behavior: pass `undefined` for the 4th argument (e.g. clientPool)
  // and forward `invitationId` as the 5th argument.
  return joinEvent(eventId, userId, email, undefined, invitationId);
};
=======
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { updateEventSchema, validateEventInput } from "../models/event.model";
import { invitationSchema } from "../models/invitation.model";
import { sendDrawResultEmail, sendInvitationEmail } from "../services/email.service";
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
} from "../services/event.service";
import { createNotification } from "../services/notification.service";
>>>>>>> main

export const createEventHandler = async (req: Request, res: Response) => {
  // L'utilisateur est authentifié, on récupère son ID
  const userId = (req as AuthenticatedRequest).user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const { data: normalizedData, errors } = validateEventInput(req.body);

  if (errors) {
    return res.status(400).json({ success: false, errors });
  }

  // Combiner les données validées avec l'ownerId
  const eventData = {
    ...normalizedData,
    ownerId: userId,
  };

  try {
    const event = await createEvent(eventData);
    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error("Erreur lors de la création de l'évènement:", error);
    return res.status(500).json({ success: false, message: "Impossible de créer l'évènement." });
  }
};

export const getEventHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as AuthenticatedRequest).user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const eventId = Array.isArray(id) ? id[0] : id;
    const event = await findEventById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Événement non trouvé." });
    }

    return res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'événement:", id, error);
    return res.status(500).json({
      success: false,
      message: "Impossible de récupérer l'événement.",
    });
  }
};

export const updateEventHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as AuthenticatedRequest).user.id;

  const parsed = updateEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.issues });
  }

  try {
    const eventId = Array.isArray(id) ? id[0] : id;
    const event = await findEventById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Événement non trouvé." });
    }

    if (event.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à modifier cet événement.",
      });
    }

    const updatedEvent = await updateEvent(eventId, parsed.data);
    return res.status(200).json({ success: true, data: updatedEvent });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'événement:", id, error);
    return res.status(500).json({
      success: false,
      message: "Impossible de mettre à jour l'événement.",
    });
  }
};

export const deleteEventHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as AuthenticatedRequest).user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const eventId = Array.isArray(id) ? id[0] : id;
    const event = await findEventById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Événement non trouvé." });
    }

    if (event.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à supprimer cet événement.",
      });
    }

    await deleteEvent(eventId);
    return res.status(200).json({ success: true, message: "Événement supprimé avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'événement:", id, error);
    return res.status(500).json({
      success: false,
      message: "Impossible de supprimer l'événement.",
    });
  }
};

export const inviteUserHandler = async (req: Request, res: Response) => {
  try {
    const { id: eventId } = req.params;
    const { email } = req.body;
    const inviter = (req as any).user;

    const parsed = invitationSchema.safeParse({ email });

    if (!parsed.success) {
      res.status(400).json({
        message: "Email invalide",
        errors: parsed.error.issues,
      });
      return;
    }

<<<<<<< feature/notifications
    const invitation = await createInvitation(eventId, parsed.data.email);
    const invitationToken = signInvitationToken({
      invitationId: invitation.id,
      eventId,
      email: parsed.data.email,
    });

    // Créer une notification in-app si l'utilisateur invité existe déjà.
    const invitedUser = await UserModel.findByEmail(parsed.data.email);
    if (invitedUser && invitedUser.id !== inviter?.id) {
      const event = await findEventById(eventId);
      await createNotification({
        userId: invitedUser.id,
        type: 'invitation',
        title: `Invitation - ${event?.title || 'Secret Santa'}`,
        message: `${inviter?.username || inviter?.email || 'Un organisateur'} vous a invité(e) à rejoindre un Secret Santa.`,
        metadata: {
          eventId,
          invitationId: invitation.id,
          invitationToken,
          invitationStatus: 'pending',
          invitedEmail: parsed.data.email,
        },
      });
    }

    // Envoyer l'email
    // TODO: Générer un vrai lien (ex: token JWT unique pour rejoindre, transmis côté frontend via fragment)
    const joinLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/events/${eventId}/join#token=${encodeURIComponent(invitationToken)}`;
    await sendInvitationEmail(parsed.data.email, 'Secret Santa Event', joinLink);
=======
    const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;
    const invitation = await createInvitation(eventIdStr, parsed.data.email);

    // Envoyer l'email
    // TODO: Générer un vrai lien (ex: token JWT unique pour rejoindre)
    const joinLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/events/${eventId}/join`;
    await sendInvitationEmail(parsed.data.email, "Secret Santa Event", joinLink);
>>>>>>> main

    res.status(201).json(invitation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de l'envoi de l'invitation." });
  }
};

export const joinEventHandler = async (req: Request, res: Response) => {
  try {
    const { id: eventId } = req.params;
    const userId = (req as any).user.id;
    const email = (req as any).user.email;
    const tokenFromBody = typeof req.body?.token === 'string' ? req.body.token : null;
    const tokenFromQuery = typeof req.query?.token === 'string' ? req.query.token : null;
    const rawToken = tokenFromBody || tokenFromQuery;
    const invitationToken = rawToken?.trim() || null;

    let invitationId: string | undefined;
    let effectiveEmail = email;

    if (invitationToken && invitationToken !== 'undefined' && invitationToken !== 'null') {
      const tokenPayload = verifyInvitationToken(invitationToken);

      if (!tokenPayload) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(invitationToken);
        if (isUuid) {
          invitationId = invitationToken;
        } else {
          return res.status(400).json({ success: false, message: 'Token d\'invitation invalide ou expiré.' });
        }
      } else {
        if (tokenPayload.eventId !== eventId) {
          return res.status(400).json({ success: false, message: 'Token d\'invitation invalide pour cet événement.' });
        }

        if (tokenPayload.email.toLowerCase() !== String(email).toLowerCase()) {
          return res.status(403).json({ success: false, message: 'Ce token d\'invitation ne correspond pas à votre compte.' });
        }

        invitationId = tokenPayload.invitationId;
        effectiveEmail = tokenPayload.email;
      }
    }

    const result = await joinEventForUser(eventId, userId, effectiveEmail, invitationId);

    const { statusCode, ...responseBody } = result as any;
    if (!result.success) {
      return res.status(statusCode ?? 400).json(responseBody);
    }

    if (result.invitationId) {
      await updateInvitationNotificationStatus(result.invitationId, userId, 'accepted');
      await markInvitationNotificationAsRead(result.invitationId, userId);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur serveur lors de la tentative de rejoindre l'événement.",
    });
  }
};

export const declineInvitationHandler = async (req: Request, res: Response) => {
  try {
    const { id: eventId, invitationId } = req.params;
    const userId = (req as any).user.id;
    const email = (req as any).user.email;

    const result = await declineInvitation(eventId, invitationId, email);

    if (!result.success) {
      const { statusCode, ...responseBody } = result;
      return res.status(statusCode ?? 400).json(responseBody);
    }

    if (result.invitationId) {
      await updateInvitationNotificationStatus(result.invitationId, userId, 'declined');
      await markInvitationNotificationAsRead(result.invitationId, userId);
    }

    const { statusCode, ...responseBody } = result;
    res.status(200).json(responseBody);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors de la tentative de refus de l\'invitation.' });
  }
};

export const drawEventHandler = async (req: Request, res: Response) => {
  try {
    const { id: eventId } = req.params;
    const userId = (req as AuthenticatedRequest).user.id;

    // Vérifier que c'est l'owner
    const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;
    const event = await findEventById(eventIdStr);
    if (!event) {
      return res.status(404).json({ message: "Événement non trouvé." });
    }

    if (event.ownerId !== userId) {
      return res.status(403).json({
        message: "Seul l'organisateur peut lancer le tirage au sort.",
      });
    }

    const { assignments, notifications } = await performDraw(eventIdStr);

    // Envoyer les notifications en BDD ET les emails en parallèle
    await Promise.allSettled(
      notifications.flatMap(
        ({ giverId, giverEmail, giverUsername, receiverUsername, eventTitle }) => [
          // Notification en base (cloche)
          createNotification({
            userId: giverId,
            type: "draw_result",
            title: `🎅 Résultat du tirage - ${eventTitle}`,
            message: `Vous avez été désigné(e) pour offrir un cadeau à ${receiverUsername} !`,
            metadata: { eventId, receiverUsername },
          }),
          // Email de notification
          sendDrawResultEmail(giverEmail, giverUsername, receiverUsername, eventTitle),
        ]
      )
    );

    res.status(200).json({
      success: true,
      message: "Tirage effectué avec succès !",
      count: assignments.length,
    });
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Erreur lors du tirage au sort.";
    res.status(400).json({ message });
  }
};

export const getAssignmentHandler = async (req: Request, res: Response) => {
  try {
    const { id: eventId } = req.params;
    const userId = (req as AuthenticatedRequest).user.id;

    const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;
    const assignment = await getAssignment(eventIdStr, userId);

    if (!assignment) {
      return res.status(404).json({
        message: "Pas d'assignation trouvée (le tirage a-t-il été fait ?)",
      });
    }

    // Pour l'instant on retourne juste l'ID du receiver, idéalement on retournerait ses infos (nom, avatar)
    // TODO: Enrichir avec les infos du receiver (Service user.service nécessaire)
    res.status(200).json({ success: true, receiverId: assignment.receiver_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur lors de la récupération de l'assignation." });
  }
};

export const getUserEventsHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const events = await getEventsByUserId(userId);
    res.status(200).json(events);
  } catch (error) {
    console.error("Error fetching user events:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getEventParticipantsHandler = async (req: Request, res: Response) => {
  try {
    const { id: eventId } = req.params;
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;
    const participants = await getEventParticipants(eventIdStr);
    res.status(200).json({ success: true, data: participants });
  } catch (error) {
    console.error("Error fetching participants:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getEventInvitationsHandler = async (req: Request, res: Response) => {
  try {
    const { id: eventId } = req.params;
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Vérifier que l'événement existe
    const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;
    const event = await findEventById(eventIdStr);
    if (!event) {
      return res.status(404).json({ success: false, message: "Événement non trouvé." });
    }

    // Seul le propriétaire peut voir la liste des invitations
    if (event.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à voir les invitations de cet événement.",
      });
    }

    const invitations = await getEventInvitations(eventIdStr);
    res.status(200).json({ success: true, data: invitations });
  } catch (error) {
    console.error("Error fetching invitations:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const deleteInvitationHandler = async (req: Request, res: Response) => {
  try {
    const { id: eventId, invitationId } = req.params;
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Vérifier que l'événement existe
    const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;
    const event = await findEventById(eventIdStr);
    if (!event) {
      return res.status(404).json({ success: false, message: "Événement non trouvé." });
    }

    // Seul le propriétaire peut annuler une invitation
    if (event.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à annuler cette invitation.",
      });
    }

    // Vérifier que l'invitation existe et appartient à cet événement
    const invitationIdStr = Array.isArray(invitationId) ? invitationId[0] : invitationId;
    const invitation = await findInvitationById(invitationIdStr);
    if (!invitation || invitation.event_id !== eventId) {
      return res.status(404).json({ success: false, message: "Invitation non trouvée." });
    }

    // Ne pas permettre d'annuler une invitation déjà acceptée
    if (invitation.status === "accepted") {
      return res.status(400).json({
        success: false,
        message: "Impossible d'annuler une invitation déjà acceptée.",
      });
    }

    await deleteInvitation(invitationIdStr);
    res.status(200).json({ success: true, message: "Invitation annulée avec succès." });
  } catch (error) {
    console.error("Error deleting invitation:", error);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

export const addExclusionHandler = async (req: Request, res: Response) => {
  const { id: eventId } = req.params;
  const userId = (req as AuthenticatedRequest).user?.id;
  const { giverId, receiverId } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;
    const event = await findEventById(eventIdStr);
    if (!event) {
      return res.status(404).json({ success: false, message: "Événement non trouvé." });
    }

    if (event.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à ajouter une exclusion à cet événement.",
      });
    }

    await addExclusion(eventIdStr, giverId, receiverId);
    const allExclusions = await getEventExclusions(eventIdStr);
    return res.status(201).json({ success: true, data: allExclusions });
  } catch (error: unknown) {
    console.error("Erreur lors de l'ajout de l'exclusion:", error);
    const err = error as Record<string, unknown>;
    const errorStatus =
      typeof err.statusCode === "number"
        ? err.statusCode
        : typeof err.status === "number"
          ? err.status
          : err.code === "P2002" || err.code === "23505"
            ? 409
            : 500;

    let clientMessage: string;
    switch (errorStatus) {
      case 400:
        clientMessage = "Requête invalide.";
        break;
      case 403:
        clientMessage = "Accès refusé.";
        break;
      case 409:
        clientMessage = "Conflit lors de l'ajout de l'exclusion.";
        break;
      default:
        clientMessage = "Impossible d'ajouter l'exclusion.";
        break;
    }

    return res.status(errorStatus).json({ success: false, message: clientMessage });
  }
};

export const getEventExclusionsHandler = async (req: Request, res: Response) => {
  const { id: eventId } = req.params;
  const userId = (req as AuthenticatedRequest).user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;
    const event = await findEventById(eventIdStr);
    if (!event) {
      return res.status(404).json({ success: false, message: "Événement non trouvé." });
    }

    if (event.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à voir les exclusions de cet événement.",
      });
    }

    const exclusions = await getEventExclusions(eventIdStr);
    return res.status(200).json({ success: true, data: exclusions });
  } catch (error) {
    console.error("Erreur lors de la récupération des exclusions:", error);
    return res.status(500).json({
      success: false,
      message: "Impossible de récupérer les exclusions.",
    });
  }
};

export const deleteExclusionHandler = async (req: Request, res: Response) => {
  const { id: eventId, exclusionId } = req.params;
  const userId = (req as AuthenticatedRequest).user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const eventIdStr = Array.isArray(eventId) ? eventId[0] : eventId;
    const event = await findEventById(eventIdStr);
    if (!event) {
      return res.status(404).json({ success: false, message: "Événement non trouvé." });
    }

    if (event.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Vous n'êtes pas autorisé à supprimer une exclusion de cet événement.",
      });
    }

    const exclusionIdStr = Array.isArray(exclusionId) ? exclusionId[0] : exclusionId;
    const success = await deleteExclusion(eventIdStr, parseInt(exclusionIdStr, 10));
    if (!success) {
      return res.status(404).json({ success: false, message: "Exclusion non trouvée." });
    }

    return res.status(200).json({ success: true, message: "Exclusion supprimée avec succès." });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'exclusion:", error);
    return res.status(500).json({
      success: false,
      message: "Impossible de supprimer l'exclusion.",
    });
  }
};
