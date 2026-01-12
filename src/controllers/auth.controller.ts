import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { generateToken } from '../utils/jwt.utils';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';

export const AuthController = {
  /**
   * Inscription d'un nouvel utilisateur
   * POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, username }: RegisterInput = req.body;

      // Vérifier si l'email existe déjà
      const emailExists = await UserModel.emailExists(email);
      if (emailExists) {
        res.status(409).json({
          success: false,
          message: 'Cet email est déjà utilisé',
        });
        return;
      }

      // Vérifier si le username existe déjà
      const usernameExists = await UserModel.usernameExists(username);
      if (usernameExists) {
        res.status(409).json({
          success: false,
          message: 'Ce nom d\'utilisateur est déjà pris',
        });
        return;
      }

      // Créer l'utilisateur (le hash du password est géré dans le modèle)
      const user = await UserModel.create({
        email,
        password,
        username,
      });

      // Générer le token JWT
      const token = generateToken(user);

      res.status(201).json({
        success: true,
        message: 'Compte créé avec succès',
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de l\'inscription',
      });
    }
  },

  /**
   * Connexion d'un utilisateur
   * POST /api/auth/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginInput = req.body;

      // Vérifier les identifiants (le password reste dans le modèle)
      const user = await UserModel.verifyCredentials(email, password);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect',
        });
        return;
      }

      // Générer le token JWT
      const token = generateToken(user);

      res.status(200).json({
        success: true,
        message: 'Connexion réussie',
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la connexion',
      });
    }
  },

  /**
   * Récupérer le profil de l'utilisateur connecté
   * GET /api/auth/me
   */
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      // L'userId sera ajouté par le middleware d'authentification
      const userId = (req as any).userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Non authentifié',
        });
        return;
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur serveur lors de la récupération du profil',
      });
    }
  },
};

