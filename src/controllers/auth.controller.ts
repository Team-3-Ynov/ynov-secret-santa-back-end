import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { UserModel } from '../models/user.model';
import { generateToken } from '../utils/jwt.utils';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';

const SALT_ROUNDS = 10;

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

      // Hasher le mot de passe
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Créer l'utilisateur
      const user = await UserModel.create({
        email,
        password: hashedPassword,
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

      // Trouver l'utilisateur par email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect',
        });
        return;
      }

      // Vérifier le mot de passe
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Email ou mot de passe incorrect',
        });
        return;
      }

      // Créer un objet utilisateur sans le mot de passe
      const userWithoutPassword = {
        id: user.id,
        email: user.email,
        username: user.username,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };

      // Générer le token JWT
      const token = generateToken(userWithoutPassword);

      res.status(200).json({
        success: true,
        message: 'Connexion réussie',
        data: {
          user: userWithoutPassword,
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
        message: 'Erreur serveur',
      });
    }
  },
};

