import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { RefreshTokenModel } from "../models/refresh_token.model";
import { UserModel } from "../models/user.model";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema";
import { getUserStats } from "../services/user.service";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.utils";

export const AuthController = {
  /**
   * Inscription d'un nouvel utilisateur
   * POST /api/auth/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, username, first_name, last_name }: RegisterInput = req.body;

      // Vérifications existantes...
      const emailExists = await UserModel.emailExists(email);
      if (emailExists) {
        res.status(409).json({ success: false, message: "Cet email est déjà utilisé" });
        return;
      }

      const usernameExists = await UserModel.usernameExists(username);
      if (usernameExists) {
        res.status(409).json({
          success: false,
          message: "Ce nom d'utilisateur est déjà pris",
        });
        return;
      }

      // Le mot de passe sera hashé par le modèle
      const user = await UserModel.create({
        email,
        password,
        username,
        first_name,
        last_name,
      });

      // Génération des tokens
      const accessToken = signAccessToken(user);
      const refreshToken = signRefreshToken(user.id);

      // Stockage du refresh token en base
      // On calcule la date d'expiration (7 jours)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await RefreshTokenModel.create(user.id, refreshToken, expiresAt);

      res.status(201).json({
        success: true,
        message: "Compte créé avec succès",
        data: {
          user,
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de l'inscription",
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

      const user = await UserModel.verifyCredentials(email, password);

      if (!user) {
        res.status(401).json({ success: false, message: "Email ou mot de passe incorrect" });
        return;
      }

      const userWithoutPassword = {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        created_at: user.created_at,
        updated_at: user.updated_at,
      };

      // Génération des tokens
      const accessToken = signAccessToken(userWithoutPassword);
      const refreshToken = signRefreshToken(user.id);

      // Stockage du refresh token en base
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await RefreshTokenModel.create(user.id, refreshToken, expiresAt);

      res.status(200).json({
        success: true,
        message: "Connexion réussie",
        data: {
          user: userWithoutPassword,
          accessToken,
          refreshToken,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la connexion",
      });
    }
  },

  /**
   * Rafraîchissement du token d'accès
   * POST /api/auth/refresh
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ success: false, message: "Refresh token manquant" });
        return;
      }

      // 1. Vérifier la signature du token
      const payload = verifyRefreshToken(refreshToken);
      if (!payload) {
        res.status(401).json({ success: false, message: "Refresh token invalide" });
        return;
      }

      if (payload.type !== "refresh") {
        res.status(401).json({ success: false, message: "Type de token invalide" });
        return;
      }

      // 2. Vérifier si le token existe en base et n'est pas révoqué
      const storedToken = await RefreshTokenModel.findByToken(refreshToken);
      if (!storedToken || storedToken.revoked) {
        // Détection de vol potentiel de refresh token !
        // Si on tente d'utiliser un token révoqué, on invalide tout pour cet utilisateur par sécurité
        if (storedToken?.revoked) {
          console.warn(
            `Tentative de réutilisation d'un token révoqué pour userId ${payload.userId}`
          );
          await RefreshTokenModel.revokeAllForUser(payload.userId);
        }
        res.status(401).json({
          success: false,
          message: "Refresh token invalide ou révoqué",
        });
        return;
      }

      if (storedToken.user_id !== payload.userId) {
        res.status(401).json({ success: false, message: "Refresh token invalide" });
        return;
      }

      // 3. Vérifier l'expiration (base de données)
      if (new Date() > storedToken.expires_at) {
        res.status(401).json({ success: false, message: "Refresh token expiré" });
        return;
      }

      // 4. Générer de nouveaux tokens (Rotation)
      const user = await UserModel.findById(payload.userId);
      if (!user) {
        res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
        return;
      }

      const newAccessToken = signAccessToken(user);
      const newRefreshToken = signRefreshToken(user.id);

      // 5. Invalider l'ancien token et sauver le nouveau
      await RefreshTokenModel.revoke(refreshToken);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await RefreshTokenModel.create(user.id, newRefreshToken, expiresAt);

      res.status(200).json({
        success: true,
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
      });
    } catch (error) {
      console.error("Erreur refresh token:", error);
      res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  },

  /**
   * Déconnexion (Révocation du refresh token)
   * POST /api/auth/logout
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await RefreshTokenModel.revoke(refreshToken);
      }

      res.status(200).json({
        success: true,
        message: "Déconnexion réussie",
      });
    } catch (error) {
      console.error("Erreur logout:", error);
      res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  },

  /**
   * Récupérer le profil de l'utilisateur connecté
   * GET /api/auth/me
   */
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      // req.user est garanti par le middleware authenticate
      const userId = (req as AuthenticatedRequest).user.id;

      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({ success: false, message: "Utilisateur non trouvé" });
        return;
      }

      // Récupérer les statistiques de l'utilisateur
      const stats = await getUserStats(userId);

      res.status(200).json({
        success: true,
        data: { user: { ...user, stats } },
      });
    } catch (error) {
      console.error("Erreur lors de la récupération du profil:", error);
      res.status(500).json({ success: false, message: "Erreur serveur" });
    }
  },
};
