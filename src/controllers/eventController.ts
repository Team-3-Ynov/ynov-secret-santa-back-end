import { Request, Response } from 'express';
import { createEvent, createInvitation } from '../services/eventService';
import { validateEventInput } from '../models/event';
import { invitationSchema } from '../models/invitation.model';
import { sendInvitationEmail } from '../services/emailService';

export const createEventHandler = async (req: Request, res: Response) => {
  // Utiliser l'email de l'utilisateur authentifié si disponible (ajoutée par le middleware d'authentification)
  const userEmail = (req as any).userEmail ?? req.body.ownerEmail;

  // Injecter ownerEmail dans la validation pour ne pas demander à l'utilisateur de la fournir
  const { data, errors } = validateEventInput({ ...req.body, ownerEmail: userEmail });

  if (errors) {
    return res.status(400).json({ success: false, errors });
  }

  try {
    const event = await createEvent(data);
    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    console.error('Erreur lors de la création de l\'évènement:', error);
    return res.status(500).json({ success: false, message: 'Impossible de créer l\'évènement.' });
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
