import { Request, Response } from 'express';
import { createEvent, findEventById, updateEvent, deleteEvent, createInvitation, joinEvent, performDraw, getAssignment, getEventsByUserId, getEventParticipants, getEventInvitations, findInvitationById, deleteInvitation } from '../services/event.service';
import { validateEventInput, updateEventSchema } from '../models/event.model';
import { invitationSchema } from '../models/invitation.model';
import { sendInvitationEmail } from '../services/email.service';

export const createEventHandler = async (req: Request, res: Response) => {
  // L'utilisateur est authentifié, on récupère son ID
  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const { data: normalizedData, errors } = validateEventInput(req.body);

  if (errors) {
    return res.status(400).json({ success: false, errors });
  }

  // Combiner les données validées avec l'ownerId
  const eventData = {
    ...normalizedData,
    ownerId: userId
  };

  try {
    const event = await createEvent(eventData);
    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error('Erreur lors de la création de l\'évènement:', error);
    return res.status(500).json({ success: false, message: 'Impossible de créer l\'évènement.' });
  }
};

export const getEventHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const event = await findEventById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Événement non trouvé.' });
    }

    return res.status(200).json({ success: true, data: event });
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'événement ${id}:`, error);
    return res.status(500).json({ success: false, message: 'Impossible de récupérer l\'événement.' });
  }
};

export const updateEventHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;

  const parsed = updateEventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, errors: parsed.error.issues });
  }

  try {
    const event = await findEventById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Événement non trouvé.' });
    }

    if (event.ownerId !== userId) {
      return res.status(403).json({ success: false, message: 'Vous n\'êtes pas autorisé à modifier cet événement.' });
    }

    const updatedEvent = await updateEvent(id, parsed.data);
    return res.status(200).json({ success: true, data: updatedEvent });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'événement ${id}:`, error);
    return res.status(500).json({ success: false, message: 'Impossible de mettre à jour l\'événement.' });
  }
};

export const deleteEventHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  try {
    const event = await findEventById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Événement non trouvé.' });
    }

    if (event.ownerId !== userId) {
      return res.status(403).json({ success: false, message: 'Vous n\'êtes pas autorisé à supprimer cet événement.' });
    }

    await deleteEvent(id);
    return res.status(200).json({ success: true, message: 'Événement supprimé avec succès.' });
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'événement ${id}:`, error);
    return res.status(500).json({ success: false, message: 'Impossible de supprimer l\'événement.' });
  }
};

export const inviteUserHandler = async (req: Request, res: Response) => {
  try {
    const { id: eventId } = req.params;
    const { email } = req.body;

    const parsed = invitationSchema.safeParse({ email });

    if (!parsed.success) {
      res.status(400).json({
        message: 'Email invalide',
        errors: parsed.error.issues
      });
      return;
    }

    const invitation = await createInvitation(eventId, parsed.data.email);

    // Envoyer l'email
    // TODO: Générer un vrai lien (ex: token JWT unique pour rejoindre)
    const joinLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/events/${eventId}/join`;
    await sendInvitationEmail(parsed.data.email, 'Secret Santa Event', joinLink);

    res.status(201).json(invitation);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'invitation.' });
  }
};

export const joinEventHandler = async (req: Request, res: Response) => {
  try {
    const { id: eventId } = req.params;
    const userId = (req as any).user.id;
    const email = (req as any).user.email;

    const result = await joinEvent(eventId, userId, email);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors de la tentative de rejoindre l\'événement.' });
  }
};

export const drawEventHandler = async (req: Request, res: Response) => {
  try {
    const { id: eventId } = req.params;
    const userId = (req as any).user.id;

    // Vérifier que c'est l'owner
    const event = await findEventById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Événement non trouvé.' });
    }

    if (event.ownerId !== userId) {
      return res.status(403).json({ message: 'Seul l\'organisateur peut lancer le tirage au sort.' });
    }

    const assignments = await performDraw(eventId);
    res.status(200).json({ success: true, message: 'Tirage effectué avec succès !', count: assignments.length });

  } catch (error: any) {
    console.error(error);
    res.status(400).json({ message: error.message || 'Erreur lors du tirage au sort.' });
  }
};

export const getAssignmentHandler = async (req: Request, res: Response) => {
  try {
    const { id: eventId } = req.params;
    const userId = (req as any).user.id;

    const assignment = await getAssignment(eventId, userId);

    if (!assignment) {
      return res.status(404).json({ message: 'Pas d\'assignation trouvée (le tirage a-t-il été fait ?)' });
    }

    // Pour l'instant on retourne juste l'ID du receiver, idéalement on retournerait ses infos (nom, avatar)
    // TODO: Enrichir avec les infos du receiver (Service user.service nécessaire)
    res.status(200).json({ success: true, receiverId: assignment.receiver_id });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'assignation.' });
  }
};

export const getUserEventsHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const events = await getEventsByUserId(userId);
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getEventParticipantsHandler = async (req: Request, res: Response) => {
  try {
    const { id: eventId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const participants = await getEventParticipants(eventId);
    res.status(200).json({ success: true, data: participants });
  } catch (error) {
    console.error('Error fetching participants:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getEventInvitationsHandler = async (req: Request, res: Response) => {
  try {
    const { id: eventId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Vérifier que l'événement existe
    const event = await findEventById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Événement non trouvé.' });
    }

    // Seul le propriétaire peut voir la liste des invitations
    if (event.ownerId !== userId) {
      return res.status(403).json({ success: false, message: 'Vous n\'êtes pas autorisé à voir les invitations de cet événement.' });
    }

    const invitations = await getEventInvitations(eventId);
    res.status(200).json({ success: true, data: invitations });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

export const deleteInvitationHandler = async (req: Request, res: Response) => {
  try {
    const { id: eventId, invitationId } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Vérifier que l'événement existe
    const event = await findEventById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Événement non trouvé.' });
    }

    // Seul le propriétaire peut annuler une invitation
    if (event.ownerId !== userId) {
      return res.status(403).json({ success: false, message: 'Vous n\'êtes pas autorisé à annuler cette invitation.' });
    }

    // Vérifier que l'invitation existe et appartient à cet événement
    const invitation = await findInvitationById(invitationId);
    if (!invitation || invitation.event_id !== eventId) {
      return res.status(404).json({ success: false, message: 'Invitation non trouvée.' });
    }

    // Ne pas permettre d'annuler une invitation déjà acceptée
    if (invitation.status === 'accepted') {
      return res.status(400).json({ success: false, message: 'Impossible d\'annuler une invitation déjà acceptée.' });
    }

    await deleteInvitation(invitationId);
    res.status(200).json({ success: true, message: 'Invitation annulée avec succès.' });
  } catch (error) {
    console.error('Error deleting invitation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

