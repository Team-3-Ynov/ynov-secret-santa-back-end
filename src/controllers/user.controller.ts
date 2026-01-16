import { Request, Response } from 'express';
import { getPublicUserProfile } from '../services/user.service';

/**
 * Récupérer le profil public d'un utilisateur
 * GET /api/users/:id
 */
export const getPublicProfileHandler = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'ID utilisateur invalide.' });
    }

    const profile = await getPublicUserProfile(userId);

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
