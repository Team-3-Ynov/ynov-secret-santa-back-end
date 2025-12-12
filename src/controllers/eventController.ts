import { Request, Response } from 'express';
import { createEvent } from '../services/eventService';
import { validateEventInput } from '../models/event';

export const createEventHandler = async (req: Request, res: Response) => {
  const { data, errors } = validateEventInput(req.body);

  if (errors) {
    return res.status(400).json({ errors });
  }

  try {
    const event = await createEvent(data);
    return res.status(201).json(event);
  } catch (error) {
    console.error('Erreur lors de la création de l\'évènement:', error);
    return res.status(500).json({ message: 'Impossible de créer l\'évènement.' });
  }
};

