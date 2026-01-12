import { Request, Response } from 'express';
import { createEvent } from '../services/eventService';
import { validateEventInput } from '../models/event';

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
