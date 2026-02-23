import { Request, Response } from 'express';
import { getPublicUserProfile } from '../services/user.service';
import { UserModel } from '../models/user.model';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { UpdateUserDTO } from '../types/user.types';

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

/**
 * Mettre à jour le profil d'un utilisateur
 * PUT /api/users/:id
 */
export const updateProfileHandler = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'ID utilisateur invalide.' });
    }

    // Vérifier que l'utilisateur modifie son propre profil
    const authenticatedUserId = (req as AuthenticatedRequest).user.id;
    if (authenticatedUserId !== userId) {
      return res.status(403).json({ success: false, message: 'Vous ne pouvez modifier que votre propre profil.' });
    }

    const { username, first_name, last_name }: UpdateUserDTO = req.body;

    // Vérifier si le nouveau username est déjà pris par un autre utilisateur
    if (username) {
      const currentUser = await UserModel.findById(userId);
      if (currentUser && currentUser.username !== username) {
        const usernameExists = await UserModel.usernameExists(username);
        if (usernameExists) {
          return res.status(409).json({ success: false, message: 'Ce nom d\'utilisateur est déjà pris.' });
        }
      }
    }

    const updatedUser = await UserModel.updateProfile(userId, { username, first_name, last_name });

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

