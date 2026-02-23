import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { UserModel } from '../models/user.model';
import { 
  getPublicUserProfile, 
  updateUserProfile, 
  updateUserPassword 
} from '../services/user.service';
import { UpdateProfileInput, UpdatePasswordInput } from '../schemas/user.schema';

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
 * Récupérer le profil de l'utilisateur connecté
 * GET /api/users/me
 */
export const getMeHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé.' });
    }

    res.status(200).json({ success: true, data: { user } });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * Mettre à jour le profil de l'utilisateur connecté
 * PUT /api/users/me
 */
export const updateProfileHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const data: UpdateProfileInput = req.body;

    const result = await updateUserProfile(userId, data);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Profil mis à jour avec succès',
      data: { user: result.user } 
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * Mettre à jour le mot de passe de l'utilisateur connecté
 * PUT /api/users/me/password
 */
export const updatePasswordHandler = async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user.id;
    const { currentPassword, newPassword }: UpdatePasswordInput = req.body;

    const result = await updateUserPassword(userId, currentPassword, newPassword);

    if (!result.success) {
      return res.status(400).json({ success: false, message: result.error });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Mot de passe mis à jour avec succès' 
    });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
